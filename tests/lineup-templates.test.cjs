const {test}=require('node:test'),assert=require('node:assert/strict'),Database=require('better-sqlite3');
const templates=require('../src/services/lineupTemplates');
test('suggestion selects eleven distinct current players and both pitcher roles',()=>{
 const positions=['C','1B','2B','3B','SS','OF','OF','OF','DH','P','P','P'];
 const pool=positions.map((posicion,i)=>({id:i+1,mlb_id:i+1,posicion}));
 const stats=new Map([[12,{gamesStarted:20}],[11,{gamesPitched:60}]]);
 const rows=templates.suggest(pool,stats);
 assert.equal(rows.length,11);assert.equal(new Set(rows.map(r=>r.playerId)).size,11);
 assert.equal(rows.find(r=>r.position==='SP').playerId,12);assert.equal(rows.find(r=>r.position==='RP').playerId,11);
});
test('editable template validates count, duplicates and team, and persists order',()=>{
 const db=new Database(':memory:');
 db.exec('CREATE TABLE equipos(id INTEGER PRIMARY KEY); INSERT INTO equipos VALUES(1),(2); CREATE TABLE jugadores(id INTEGER PRIMARY KEY,equipo_id INTEGER,nombre TEXT);');
 for(let i=1;i<=12;i++)db.prepare('INSERT INTO jugadores VALUES(?,?,?)').run(i,i===12?2:1,'Jugador '+i);
 templates.init(db);const rows=Array.from({length:11},(_,i)=>({playerId:i+1,position:'OF'}));
 templates.save(db,1,rows);assert.equal(templates.get(db,1).players.length,11);
 assert.throws(()=>templates.save(db,1,rows.slice(0,9)),/11/);
 assert.throws(()=>templates.save(db,1,rows.map(()=>rows[0])),/repitas/);
 assert.throws(()=>templates.save(db,1,[...rows.slice(0,10),{playerId:12,position:'P'}]),/pertenecer/);
 templates.save(db,1,[...rows].reverse());assert.equal(templates.get(db,1).players[0].id,11);db.close();
});
