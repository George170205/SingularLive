// Stage public official data without modifying the operational database.
const fs=require('fs');
const db=new(require('better-sqlite3'))('database.sqlite',{readonly:true});
const api='https://statsapi.mlb.com/api/v1';
const date=process.argv[2]||new Intl.DateTimeFormat('en-CA',{timeZone:'America/Tijuana'}).format(new Date());
const season=Number(date.slice(0,4));
async function read(path){const r=await fetch(api+path,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(`HTTP ${r.status}: ${path}`);return r.json();}
(async()=>{
 const output={date,season,checkedAt:new Date().toISOString(),teams:[],errors:[]};
 const catalog=await read(`/teams?sportId=23&leagueIds=125&season=${season}`);
 output.officialTeams=catalog.teams;
 for(const team of db.prepare('SELECT id,nombre,siglas,mlb_id FROM equipos ORDER BY id').all()){
   if(!catalog.teams.some(t=>t.id===team.mlb_id)){output.errors.push({team:team.siglas,error:'ID local ausente en catálogo oficial'});continue;}
   try{const data=await read(`/teams/${team.mlb_id}/roster?rosterType=active&season=${season}&date=${date}`);
     output.teams.push({...team,roster:data.roster}); console.log(`${team.siglas}: ${data.roster?.length||0} activos`);
   }catch(e){output.errors.push({team:team.siglas,error:e.message});}
 }
 output.schedule=await read(`/schedule?sportId=23&leagueId=125&season=${season}`);
 const postseason=await read(`/schedule?sportId=23&startDate=${season}-08-01&endDate=${season}-12-31`);
 const ids=new Set(catalog.teams.map(t=>t.id));
 postseason.dates=postseason.dates.map(d=>({...d,games:d.games.filter(g=>ids.has(g.teams.home.team.id)&&ids.has(g.teams.away.team.id))}));
 const latest=[...output.schedule.dates,...postseason.dates].flatMap(d=>d.games).filter(g=>g.status.abstractGameState==='Final'&&g.officialDate<=date&&[g.teams.home.team.id,g.teams.away.team.id].includes(5010)).sort((a,b)=>b.gameDate.localeCompare(a.gameDate))[0];
 const lineup=latest?{game:latest,boxscore:await read(`/game/${latest.gamePk}/boxscore`)}:null;
 if(output.errors.length)throw Error('Descarga incompleta: no se reemplazaron los archivos de sincronización.');
 fs.writeFileSync('official-postseason-staging.json',JSON.stringify(postseason,null,2));
 fs.writeFileSync('official-lineup-staging.json',JSON.stringify(lineup,null,2));
 const active=db.prepare('SELECT c.id,c.equipo_local_id,c.equipo_visitante_id,c.fecha_hora,l.mlb_id home,v.mlb_id away FROM calendario_partidos c JOIN equipos l ON l.id=c.equipo_local_id JOIN equipos v ON v.id=c.equipo_visitante_id WHERE c.activo=1').get();
 if(active){
   const g=output.schedule.dates.flatMap(d=>d.games).find(g=>g.teams.home.team.id===active.home&&g.teams.away.team.id===active.away&&g.officialDate===active.fecha_hora.slice(0,10));
   if(g){output.activeGame={calendarId:active.id,gamePk:g.gamePk,boxscore:await read(`/game/${g.gamePk}/boxscore`)};}
 }
 fs.writeFileSync('official-sync-staging.json',JSON.stringify(output,null,2));
 console.log(JSON.stringify({date,teams:output.teams.length,errors:output.errors,games:output.schedule.dates.reduce((n,d)=>n+d.games.length,0),activeGame:output.activeGame?.gamePk}));
 db.close();
})().catch(e=>{console.error(e.message);process.exitCode=1;});
