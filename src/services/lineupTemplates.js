function init(db){db.exec(`CREATE TABLE IF NOT EXISTS lineup_templates(equipo_id INTEGER PRIMARY KEY REFERENCES equipos(id) ON DELETE CASCADE,rows_json TEXT NOT NULL,source TEXT NOT NULL,updated_at TEXT NOT NULL);`);}
function get(db,teamId){
 if(!db.prepare("SELECT 1 FROM sqlite_master WHERE name='lineup_templates'").get())return null;
 const row=db.prepare('SELECT * FROM lineup_templates WHERE equipo_id=?').get(teamId);if(!row)return null;
 const entries=JSON.parse(row.rows_json);
 const players=entries.map((entry,i)=>{const player=db.prepare('SELECT * FROM jugadores WHERE id=? AND equipo_id=?').get(entry.playerId,teamId);return player?{...player,posicion:entry.position,orden_bateo:i+1}:null;}).filter(Boolean);
 return {players,template:true,source:row.source,updatedAt:row.updated_at,sourceMatchId:null,reused:false};
}
function save(db,teamId,rows,source='Editada por el operador'){
 if(!db.prepare('SELECT 1 FROM equipos WHERE id=?').get(teamId))throw Error('Equipo no encontrado.');
 if(!Array.isArray(rows)||rows.length!==11)throw Error('Selecciona exactamente 11 jugadores.');
 if(new Set(rows.map(r=>Number(r.playerId))).size!==11)throw Error('No repitas jugadores.');
 const allowed=['C','1B','2B','3B','SS','LF','CF','RF','OF','DH','P','SP','RP','IF'];
 const valid=rows.map(r=>{
  const playerId=Number(r.playerId),position=String(r.position||'').toUpperCase();
  if(!Number.isInteger(playerId)||!db.prepare('SELECT 1 FROM jugadores WHERE id=? AND equipo_id=?').get(playerId,teamId))throw Error('Todos los jugadores deben pertenecer al equipo seleccionado.');
  if(!allowed.includes(position))throw Error('Posición inválida.');
  return {playerId,position};
 });
 db.prepare('INSERT OR REPLACE INTO lineup_templates VALUES(?,?,?,?)').run(teamId,JSON.stringify(valid),source,new Date().toISOString());
 return get(db,teamId);
}
function suggest(players,stats){
 const used=new Set(),rows=[];
 const metric=(p,key)=>Number(stats.get(p.mlb_id)?.[key]||0);
 const hitters=players.filter(p=>!['P','SP','RP'].includes(p.posicion)).sort((a,b)=>metric(b,'plateAppearances')-metric(a,'plateAppearances')||metric(b,'gamesPlayed')-metric(a,'gamesPlayed')||a.id-b.id);
 const pitchers=players.filter(p=>['P','SP','RP'].includes(p.posicion));
 function pick(pool,position){const p=pool.find(p=>!used.has(p.id));if(!p)return false;used.add(p.id);rows.push({playerId:p.id,position});return true;}
 for(const position of ['C','1B','2B','3B','SS'])pick(hitters.filter(p=>p.posicion===position),position);
 for(const position of ['LF','CF','RF'])pick(hitters.filter(p=>['LF','CF','RF','OF'].includes(p.posicion)),position);
 while(rows.length<9&&pick(hitters,rows.length===8?'DH':'IF')){}
 pick([...pitchers].sort((a,b)=>metric(b,'gamesStarted')-metric(a,'gamesStarted')||metric(b,'outs')-metric(a,'outs')||a.id-b.id),'SP');
 pick([...pitchers].sort((a,b)=>metric(b,'gamesPitched')-metric(a,'gamesPitched')||metric(b,'gamesPlayed')-metric(a,'gamesPlayed')||a.id-b.id),'RP');
 for(const p of players)if(rows.length<11)pick([p],p.posicion||'OF');
 return rows;
}
module.exports={init,get,save,suggest};
