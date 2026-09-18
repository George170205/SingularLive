const {test}=require('node:test');
const assert=require('node:assert/strict');
const Database=require('better-sqlite3');
const getLineup=require('../src/services/lineupService');
test('saved batting order wins over jersey sorting; prior game is explicitly marked',()=>{
 const db=new Database(':memory:');
 db.exec(`CREATE TABLE jugadores(id INTEGER,nombre TEXT,numero INTEGER);
 CREATE TABLE lineups(partido_id INTEGER,equipo_id INTEGER,jugador_id INTEGER,orden_bateo INTEGER);
 INSERT INTO jugadores VALUES(1,'Primero',99),(2,'Segundo',2),(3,'Solo catálogo',0);
 INSERT INTO lineups VALUES(5,1,1,1),(5,1,2,2);`);
 assert.deepEqual(getLineup(db,1,5).players.map(p=>p.nombre),['Primero','Segundo']);
 assert.equal(getLineup(db,1,5).reused,false);
 assert.equal(getLineup(db,1,6).reused,true);
 assert.equal(getLineup(db,1,6).sourceMatchId,5);
 assert.deepEqual(getLineup(db,2,6).players,[]);
 db.close();
});
