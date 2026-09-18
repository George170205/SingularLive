// Verified snapshot, 2026-09-09. Never reseed on subsequent starts.
module.exports = function migrate(db) {
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY)');
  if (db.prepare('SELECT 1 FROM schema_migrations WHERE id=?').get('calendar-v1')) return;
  db.transaction(() => {
    for (const [name, type] of Object.entries({estado:"TEXT DEFAULT 'programado'", partido_id:'INTEGER REFERENCES partidos(id)', bracket_id:'TEXT REFERENCES playoff_bracket(id)', runs_local:'INTEGER', runs_visitante:'INTEGER', fuente:'TEXT', condicional:'INTEGER DEFAULT 0'})) {
      db.exec(`ALTER TABLE calendario_partidos ADD COLUMN ${name} ${type}`);
    }
    db.exec("ALTER TABLE playoff_bracket ADD COLUMN fuente TEXT; ALTER TABLE playoff_bracket ADD COLUMN victorias_necesarias INTEGER DEFAULT 4");
    // Preserve a reviewable copy of the old examples before replacing them.
    db.exec('CREATE TABLE calendario_legacy_backup AS SELECT * FROM calendario_partidos; CREATE TABLE bracket_legacy_backup AS SELECT * FROM playoff_bracket');
    for (const [name,date] of [['Serie del Rey — Juego 1','2026-09-10 19:35'],['Serie del Rey — Juego 2','2026-09-11 19:35'],['Serie del Rey — Juego 3','2026-09-13 19:00'],['Duelo de Gigantes LMB','2026-09-18 19:35']]) {
      db.prepare('DELETE FROM calendario_partidos WHERE serie_nombre=? AND fecha_hora=?').run(name,date);
    }
    const source='https://www.clarosports.com/beisbol/mexicano/playoffs-lmb-2026-equipos-cruces-calendario-y-resultados/';
    const official='https://torosdetijuana.com/index.php/toros-y-olmecas-disputaran-la-serie-del-rey-2026/2026/09/';
    const tid=s=>db.prepare('SELECT id FROM equipos WHERE siglas=?').get(s).id;
    db.exec('DELETE FROM playoff_bracket');
    const rows=[['N_R1_1','norte','cuartos','TIJ','LAG',4,1],['N_R1_2','norte','cuartos','DUR','MVA',4,1],['N_R1_3','norte','cuartos','MTY','JAL',4,1],['N_R2_1','norte','semis','TIJ','JAL',4,1],['N_R2_2','norte','semis','DUR','MTY',1,4],['N_R3_1','norte','final_zona','TIJ','MTY',4,1],['S_R1_1','sur','cuartos','MEX','OAX',4,3],['S_R1_2','sur','cuartos','TAB','LEO',4,2],['S_R1_3','sur','cuartos','CAM','PUE',1,4],['S_R2_1','sur','semis','MEX','PUE',2,4],['S_R2_2','sur','semis','TAB','OAX',4,3],['S_R3_1','sur','final_zona','TAB','PUE',4,1],['FINAL','final','serie_del_rey','TIJ','TAB',0,1]];
    for (const [id,zona,ronda,a,b,x,y] of rows) db.prepare('INSERT INTO playoff_bracket (id,zona,ronda,pos_index,equipo_1_id,equipo_2_id,score_1,score_2,ganador_id,estado,fecha_desc,fuente) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(id,zona,ronda,Number(id.slice(-1))||0,tid(a),tid(b),x,y,x===4?tid(a):y===4?tid(b):null,Math.max(x,y)===4?'finalizado':'en_curso',ronda,source);
    const dates=['08 19:35','09 19:35','11 18:30','12 18:00','13 17:00','15 19:35','16 19:35'];
    dates.forEach((date,i)=>{
      const home=i<2||i>4;
      db.prepare('INSERT INTO calendario_partidos (equipo_local_id,equipo_visitante_id,serie_nombre,sede,fecha_hora,notas,bracket_id,estado,runs_local,runs_visitante,fuente,condicional) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(tid(home?'TIJ':'TAB'),tid(home?'TAB':'TIJ'),`Serie del Rey — Juego ${i+1}`,home?'Toros Mobil Park':'Estadio Centenario 27 de Febrero',`2026-09-${date}`,'Horario de Tijuana','FINAL',i===0?'finalizado':'programado',i===0?1:null,i===0?7:null,official,i>=4?1:0);
    });
    db.prepare('INSERT INTO schema_migrations VALUES (?)').run('calendar-v1');
  })();
};
