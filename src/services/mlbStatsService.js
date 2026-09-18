const db=require('../db/database');
const store=require('./rosterStore');
const MLB_API_BASE='https://statsapi.mlb.com/api/v1';
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Tijuana'}).format(new Date());
const inflight=new Map();
async function read(path) {
  const r=await fetch(MLB_API_BASE+path,{signal:AbortSignal.timeout(20000)});
  if(!r.ok) throw Error(`MLB Stats API: HTTP ${r.status}`);
  return r.json();
}
async function fetchTeamRoster(mlbTeamId,date=today()) {
  const data=await read(`/teams/${mlbTeamId}/roster?rosterType=active&season=${date.slice(0,4)}&date=${date}`);
  if(!Array.isArray(data.roster)) throw Error('Respuesta de roster inválida.');
  return store.fromApi(data.roster);
}
async function syncTeamRosterToDatabase(localTeamId,force=false) {
  const team=db.prepare('SELECT * FROM equipos WHERE id=?').get(localTeamId);
  if(!team?.mlb_id) throw Error('El equipo no tiene un ID oficial asignado.');
  const meta=db.prepare('SELECT * FROM roster_sync WHERE equipo_id=?').get(localTeamId);
  const date=today();
  if(!force&&meta?.roster_date===date&&Date.now()-Date.parse(meta.checked_at)<24*3600000) {
    const players=store.list(db,localTeamId);
    return {cached:true,teamName:team.nombre,count:players.length,players,checkedAt:meta.checked_at};
  }
  if(inflight.has(team.id)) return inflight.get(team.id);
  const task=(async()=>{
    const players=await fetchTeamRoster(team.mlb_id,date);
    const changes=store.apply(db,team.id,players,date);
    const saved=store.list(db,team.id);
    return {cached:false,teamName:team.nombre,count:saved.length,players:saved,changes};
  })();
  inflight.set(team.id,task);
  try{return await task;}finally{inflight.delete(team.id);}
}
function mapGame(g) {
  return {gamePk:g.gamePk,date:g.officialDate,gameDate:g.gameDate,status:g.status.detailedState,
    state:g.status.abstractGameState,venue:g.venue?.name||'',seriesDescription:g.seriesDescription,
    homeTeam:{mlbId:g.teams.home.team.id,name:g.teams.home.team.name,score:g.teams.home.score},
    awayTeam:{mlbId:g.teams.away.team.id,name:g.teams.away.team.name,score:g.teams.away.score}};
}
async function fetchSchedule(season=Number(today().slice(0,4)),teamMlbId=5010) {
  // No leagueId filter: it excludes LMB postseason games.
  const data=await read(`/schedule?sportId=23&teamId=${teamMlbId}&startDate=${season}-01-01&endDate=${season}-12-31`);
  if(!Array.isArray(data.dates)) throw Error('Respuesta de calendario inválida.');
  return data.dates.flatMap(d=>d.games.map(mapGame));
}
async function getNextGame(season=Number(today().slice(0,4)),teamMlbId=5010) {
  const games=await fetchSchedule(season,teamMlbId);
  const g=games.filter(g=>g.state!=='Final'&&!/Cancelled|Postponed/i.test(g.status)&&g.date>=today()).sort((a,b)=>a.gameDate.localeCompare(b.gameDate))[0];
  if(!g)return null;
  const home=db.prepare('SELECT id,nombre FROM equipos WHERE mlb_id=?').get(g.homeTeam.mlbId);
  const away=db.prepare('SELECT id,nombre FROM equipos WHERE mlb_id=?').get(g.awayTeam.mlbId);
  return {...g,isHome:g.homeTeam.mlbId===teamMlbId,opponent:g.homeTeam.mlbId===teamMlbId?g.awayTeam:g.homeTeam,
    resolvedDb:{localTeamId:home?.id,visitorTeamId:away?.id,localTeamName:home?.nombre||g.homeTeam.name,visitorTeamName:away?.nombre||g.awayTeam.name}};
}
module.exports={fetchTeamRoster,syncTeamRosterToDatabase,fetchSchedule,getNextGame};
