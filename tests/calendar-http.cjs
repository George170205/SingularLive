// Run against `node tests/preview.cjs` only: all fixtures stay in memory.
const assert=require('node:assert/strict');
const base='http://localhost:3001';
async function request(path,method='GET',body){
 const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
 return {status:r.status,data:await r.json()};
}
(async()=>{
 const {data:teams}=await request('/api/equipos');
 const local=teams.find(t=>t.siglas==='TIJ').id, visitor=teams.find(t=>t.siglas==='TAB').id;
 const {data:series}=await request('/api/bracket','POST',{equipo_local_id:local,equipo_visitante_id:visitor,zona:'final',ronda:'serie_del_rey',nombre:'Prueba aislada'});
 assert.ok(series.id);
 const payload={equipo_local_id:local,equipo_visitante_id:visitor,fecha_hora:'2026-10-01 19:00',bracket_id:series.id,serie_nombre:'Prueba aislada'};
 const {data:created}=await request('/api/calendario','POST',payload); assert.ok(created.item.id);
 const id=created.item.id;
 assert.equal((await request('/api/calendario/'+id,'PUT',{...payload,sede:'Sede editada'})).data.item.sede,'Sede editada');
 assert.equal((await request('/api/calendario/'+id,'DELETE')).status,200);
 assert.equal((await request('/api/calendario/'+id,'DELETE')).status,404);
 assert.equal((await request('/api/calendario','POST',{...payload,equipo_visitante_id:local})).status,400);
 console.log('HTTP: creación de serie, alta/edición/baja de juego y validaciones correctas.');
})().catch(e=>{console.error(e);process.exitCode=1;});
