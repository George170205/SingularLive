const {test}=require('node:test');
const assert=require('node:assert/strict');
process.env.DATABASE_FILE=':memory:';
const db=require('../src/db/database');
const manager={activeMatchId:null,state:null,persistStateToDb(){}};
const service=require('../src/services/calendarService')(db,manager);
const game=()=>db.prepare("SELECT * FROM calendario_partidos WHERE estado='programado' ORDER BY fecha_hora LIMIT 1").get();
test('verified migration and repeat startup preserve results',()=>{
 assert.equal(db.prepare('SELECT count(*) n FROM playoff_bracket').get().n,13);
 assert.equal(db.prepare('SELECT count(*) n FROM calendario_partidos').get().n,7);
 require('../src/db/calendarMigration')(db);
 assert.equal(db.prepare("SELECT score_2 FROM playoff_bracket WHERE id='FINAL'").get().score_2,1);
 assert.ok(db.prepare("SELECT id FROM equipos WHERE siglas='LEO'").get());
});
test('reject invalid teams, dates, and series',()=>{
 const c=game();
 assert.throws(()=>service.save({...c,equipo_visitante_id:c.equipo_local_id}));
 assert.throws(()=>service.save({...c,fecha_hora:'bad'}));
 assert.throws(()=>service.save({...c,bracket_id:'N_R1_1'}));
});
test('activation is idempotent; finish rejects ties, stale scores; duplicate finish counts once',()=>{
 const c=game(), active=service.activate(c.id);
 manager.activeMatchId=active.partido_id; manager.state={runs_local:0,runs_visitante:0};
 assert.equal(service.activate(c.id).partido_id,active.partido_id);
 assert.throws(()=>service.activate(c.id+1));
 assert.throws(()=>service.finish(c.id,manager.state));
 manager.state={runs_local:3,runs_visitante:2};
 assert.throws(()=>service.finish(c.id,{runs_local:2,runs_visitante:1}));
 service.finish(c.id,manager.state); service.finish(c.id,manager.state);
 assert.equal(db.prepare("SELECT score_1 FROM playoff_bracket WHERE id='FINAL'").get().score_1,1);
 assert.throws(()=>service.activate(c.id));
 assert.throws(()=>service.save(c,c.id));
 const next=service.activate(game().id);
 assert.notEqual(next.partido_id,active.partido_id);
 assert.equal(db.prepare('SELECT runs_local FROM estado_partido WHERE partido_id=?').get(next.partido_id).runs_local,0);
});
test('away wins count for correct team; championship cancels remaining games',()=>{
 let c=db.prepare('SELECT * FROM calendario_partidos WHERE activo=1').get();
 for(let i=0;i<3;i++){
   if(i) c=service.activate(game().id);
   manager.activeMatchId=c.partido_id;
   const localIsToros=c.equipo_local_id===db.prepare("SELECT id FROM equipos WHERE siglas='TIJ'").get().id;
   manager.state={runs_local:localIsToros?5:1,runs_visitante:localIsToros?1:5};
   service.finish(c.id,manager.state);
 }
 const s=db.prepare("SELECT * FROM playoff_bracket WHERE id='FINAL'").get();
 assert.equal(s.score_1,4); assert.equal(s.ganador_id,s.equipo_1_id);
 assert.equal(db.prepare("SELECT count(*) n FROM calendario_partidos WHERE estado='programado'").get().n,0);
});
