const fs=require('fs'),Database=require('better-sqlite3');
const templates=require('../src/services/lineupTemplates'),roster=require('../src/services/rosterStore');
const input=JSON.parse(fs.readFileSync('lineup-stats-2025.json','utf8'));
const stats=new Map();
for(const group of Object.values(input.groups))for(const entry of group.data.stats[0].splits){
 if(entry.league?.id!==125||entry.season!=='2025')continue;
 const current=stats.get(entry.player.id)||{};
 for(const key of ['plateAppearances','gamesPlayed','gamesStarted','gamesPitched','outs'])current[key]=Math.max(Number(current[key]||0),Number(entry.stat[key]||0));
 stats.set(entry.player.id,current);
}
(async()=>{
 const apply=process.argv.includes('--apply'),original=new Database('database.sqlite');
 if(apply)await original.backup('database.before-lineup-templates-'+Date.now()+'.sqlite');
 const db=apply?original:new Database(original.serialize());templates.init(db);
 const report=db.transaction(()=>db.prepare('SELECT id,nombre FROM equipos ORDER BY id').all().map(team=>{
  if(templates.get(db,team.id))return {team:team.nombre,preserved:true};
  const pool=roster.list(db,team.id),rows=templates.suggest(pool,stats);
  const withoutStats=rows.filter(r=>!stats.has(pool.find(p=>p.id===r.playerId).mlb_id)).length;
  const source=`Sugerida con participación en LMB 2025; ${withoutStats} de 11 sin registro en esa temporada, completados del roster local`;
  const saved=templates.save(db,team.id,rows,source);
  return {team:team.nombre,withoutStats,players:saved.players.map(p=>({name:p.nombre,position:p.posicion}))};
 }))();
 fs.writeFileSync(apply?'lineup-templates-report.json':'lineup-templates-preview.json',JSON.stringify(report,null,2));
 console.log(report.map(r=>({team:r.team,count:r.players?.length,withoutStats:r.withoutStats,preserved:r.preserved})));
 db.close();if(!apply)original.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
