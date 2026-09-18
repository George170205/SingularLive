module.exports = function calendarService(db, manager) {
  const get = id => db.prepare('SELECT * FROM calendario_partidos WHERE id=?').get(id);
  function validate(data) {
    const a=Number(data.equipo_local_id), b=Number(data.equipo_visitante_id);
    if (!Number.isInteger(a)||!Number.isInteger(b)||a===b||!db.prepare('SELECT id FROM equipos WHERE id=?').get(a)||!db.prepare('SELECT id FROM equipos WHERE id=?').get(b)) throw Error('Selecciona dos equipos distintos válidos.');
    if (!/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}$/.test(data.fecha_hora)||!Number.isFinite(Date.parse(data.fecha_hora.replace(' ','T')))) throw Error('Fecha y hora inválidas.');
    if (data.bracket_id) {
      const s=db.prepare('SELECT * FROM playoff_bracket WHERE id=?').get(data.bracket_id);
      if (!s || s.ganador_id || ![a,b].includes(s.equipo_1_id)||![a,b].includes(s.equipo_2_id)) throw Error('La serie debe estar abierta y corresponder a ambos equipos.');
    }
  }
  function save(data,id) {
    const old=id?get(id):null;
    if(id&&!old) throw Error('Partido no encontrado.');
    if(old&&(old.activo||old.estado!=='programado'||old.partido_id)) throw Error('Solo se pueden editar partidos pendientes sin cargar.');
    const item={...old,...data}; validate(item);
    const values=[Number(item.equipo_local_id),Number(item.equipo_visitante_id),item.serie_nombre||'Temporada Regular',item.sede||'',item.fecha_hora.replace('T',' '),item.notas||'',item.bracket_id||null,item.condicional?1:0];
    if(id) db.prepare('UPDATE calendario_partidos SET equipo_local_id=?,equipo_visitante_id=?,serie_nombre=?,sede=?,fecha_hora=?,notas=?,bracket_id=?,condicional=?,fuente=NULL WHERE id=?').run(...values,id);
    else id=db.prepare('INSERT INTO calendario_partidos (equipo_local_id,equipo_visitante_id,serie_nombre,sede,fecha_hora,notas,bracket_id,condicional) VALUES (?,?,?,?,?,?,?,?)').run(...values).lastInsertRowid;
    return get(id);
  }
  function activate(id) {
    return db.transaction(()=>{
      const item=get(id); if(!item) throw Error('Partido no encontrado.');
      if(!['programado','en_vivo'].includes(item.estado)) throw Error('Este partido ya no se puede cargar.');
      const active=db.prepare('SELECT id FROM calendario_partidos WHERE activo=1 AND id<>?').get(id);
      if(active) throw Error('Finaliza el partido activo antes de cargar otro.');
      if(item.bracket_id&&db.prepare('SELECT ganador_id FROM playoff_bracket WHERE id=?').get(item.bracket_id)?.ganador_id) throw Error('La serie ya terminó.');
      let matchId=item.partido_id;
      if(!matchId) {
        matchId=db.prepare("INSERT INTO partidos (equipo_local_id,equipo_visitante_id,estado) VALUES (?,?,'en_vivo')").run(item.equipo_local_id,item.equipo_visitante_id).lastInsertRowid;
        db.prepare('INSERT INTO estado_partido (partido_id) VALUES (?)').run(matchId);
      }
      db.prepare("UPDATE calendario_partidos SET activo=1,estado='en_vivo',partido_id=? WHERE id=?").run(matchId,id);
      return get(id);
    })();
  }
  function finish(id, expected) {
    return db.transaction(()=>{
      const c=get(id); if(!c) throw Error('Partido no encontrado.');
      if(c.estado==='finalizado') return c;
      if(!c.activo||c.partido_id!==manager.activeMatchId) throw Error('Solo se puede finalizar el partido activo.');
      const {runs_local:a,runs_visitante:b}=manager.state;
      if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0||a===b) throw Error('El resultado final debe tener un ganador.');
      if(expected.runs_local!==a||expected.runs_visitante!==b) throw Error('El marcador cambió. Revisa el resultado antes de finalizar.');
      if(c.bracket_id) {
        const s=db.prepare('SELECT * FROM playoff_bracket WHERE id=?').get(c.bracket_id);
        if(!s||s.ganador_id) throw Error('Serie no disponible.');
        const winner=a>b?c.equipo_local_id:c.equipo_visitante_id;
        if(![s.equipo_1_id,s.equipo_2_id].includes(winner)) throw Error('El ganador no corresponde a esta serie.');
        const x=s.score_1+(winner===s.equipo_1_id?1:0), y=s.score_2+(winner===s.equipo_2_id?1:0);
        const done=Math.max(x,y)>=s.victorias_necesarias;
        db.prepare('UPDATE playoff_bracket SET score_1=?,score_2=?,ganador_id=?,estado=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(x,y,done?winner:null,done?'finalizado':'en_curso',s.id);
        if(done) db.prepare("UPDATE calendario_partidos SET estado='cancelado' WHERE bracket_id=? AND estado='programado'").run(s.id);
      }
      manager.persistStateToDb();
      db.prepare("UPDATE partidos SET estado='finalizado' WHERE id=?").run(c.partido_id);
      db.prepare("UPDATE calendario_partidos SET estado='finalizado',activo=0,runs_local=?,runs_visitante=?,notas=COALESCE(notas,'') || ' · Resultado registrado por el operador' WHERE id=?").run(a,b,id);
      return get(id);
    })();
  }
  return {get,save,activate,finish};
};
