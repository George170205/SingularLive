const roster=require('./rosterStore');
const rounds={F:'cuartos',D:'semis',L:'final_zona',W:'serie_del_rey'};
function localTime(value) {
  const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Tijuana',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(value)).map(x=>[x.type,x.value]));
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}
function apply(db,input,postseason,lineup) {
  const report={teams:[],calendar:[],bracket:[],lineups:[],skipped:[]};
  const games=[...new Map([...input.schedule.dates,...postseason.dates].flatMap(d=>d.games).map(g=>[g.gamePk,g])).values()];
  return db.transaction(()=>{
    db.exec(`CREATE TABLE IF NOT EXISTS calendar_official_links(calendar_id INTEGER PRIMARY KEY REFERENCES calendario_partidos(id) ON DELETE CASCADE,game_pk INTEGER UNIQUE);
      CREATE TABLE IF NOT EXISTS lineup_sources(partido_id INTEGER,equipo_id INTEGER,game_pk INTEGER,game_date TEXT,PRIMARY KEY(partido_id,equipo_id));`);
    for(const team of input.teams) {
      report.teams.push({team:team.siglas,...roster.apply(db,team.id,roster.fromApi(team.roster),input.date,input.checkedAt)});
      db.prepare("UPDATE equipos SET logo_url=? WHERE id=? AND (logo_url IS NULL OR TRIM(logo_url)='')").run(`https://www.mlbstatic.com/team-logos/${team.mlb_id}.svg`,team.id);
    }
    const ids=new Map(db.prepare('SELECT id,mlb_id FROM equipos').all().map(t=>[t.mlb_id,t.id]));
    const nodes=db.prepare('SELECT * FROM playoff_bracket').all();
    for(const g of games) {
      const home=ids.get(g.teams.home.team.id),away=ids.get(g.teams.away.team.id);
      if(!home||!away)continue;
      db.prepare('INSERT OR REPLACE INTO official_games VALUES(?,?,?)').run(g.gamePk,JSON.stringify(g),input.checkedAt);
      const linked=db.prepare('SELECT c.* FROM calendario_partidos c JOIN calendar_official_links l ON l.calendar_id=c.id WHERE l.game_pk=?').get(g.gamePk);
      const candidates=db.prepare('SELECT * FROM calendario_partidos WHERE equipo_local_id=? AND equipo_visitante_id=? AND substr(fecha_hora,1,10)=?').all(home,away,g.officialDate);
      const c=linked||(candidates.length===1?candidates[0]:null);
      const node=nodes.find(n=>n.ronda===rounds[g.gameType]&&[home,away].includes(n.equipo_1_id)&&[home,away].includes(n.equipo_2_id));
      const final=g.status.abstractGameState==='Final';
      const cancelled=/cancelled/i.test(g.status.detailedState);
      const pending=g.status.abstractGameState==='Preview'&&!/postponed|suspended/i.test(g.status.detailedState);
      if(!c&&(!pending||g.officialDate<input.date))continue;
      if(c?.activo){report.skipped.push({calendarId:c.id,reason:'Partido activo: sin cambios'});continue;}
      // Explicitly edited schedules have no source URL; retain those edits.
      if(c&&!c.fuente){report.skipped.push({calendarId:c.id,reason:'Calendario manual: sin cambios'});continue;}
      if(!final&&!cancelled&&!pending)continue;
      const source=`https://statsapi.mlb.com/api/v1/schedule?gamePk=${g.gamePk}`;
      const status=final?'finalizado':cancelled?'cancelado':'programado';
      const values=[localTime(g.gameDate),g.venue?.name||'',status,final?g.teams.home.score:null,final?g.teams.away.score:null,g.ifNecessary==='Y'?1:0,source];
      let calendarId=c?.id;
      if(c){
        if(final&&c.estado==='finalizado'&&(c.runs_local!==g.teams.home.score||c.runs_visitante!==g.teams.away.score))report.calendar.push({id:c.id,oldScore:[c.runs_local,c.runs_visitante],officialScore:[g.teams.home.score,g.teams.away.score]});
        db.prepare("UPDATE calendario_partidos SET fecha_hora=?,sede=?,estado=?,runs_local=?,runs_visitante=?,condicional=?,fuente=?,notas='Horario de Tijuana · Datos oficiales sincronizados',bracket_id=COALESCE(bracket_id,?) WHERE id=?").run(...values,node?.id||null,c.id);
        if(final&&c.partido_id){db.prepare('UPDATE estado_partido SET runs_local=?,runs_visitante=? WHERE partido_id=?').run(g.teams.home.score,g.teams.away.score,c.partido_id);db.prepare("UPDATE partidos SET estado='finalizado' WHERE id=?").run(c.partido_id);}
      } else {
        calendarId=db.prepare('INSERT INTO calendario_partidos(equipo_local_id,equipo_visitante_id,serie_nombre,fecha_hora,sede,estado,runs_local,runs_visitante,condicional,fuente,bracket_id,notas) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(home,away,`${g.seriesDescription||'Temporada'} — Juego ${g.seriesGameNumber||g.gameNumber}`,...values,node?.id||null,'Horario de Tijuana · Datos oficiales sincronizados').lastInsertRowid;
      }
      db.prepare('INSERT OR IGNORE INTO calendar_official_links VALUES(?,?)').run(calendarId,g.gamePk);
    }
    for(const n of nodes) {
      if(db.prepare('SELECT 1 FROM calendario_partidos WHERE activo=1 AND bracket_id=?').get(n.id))continue;
      const relevant=games.filter(g=>rounds[g.gameType]===n.ronda&&[ids.get(g.teams.home.team.id),ids.get(g.teams.away.team.id)].includes(n.equipo_1_id)&&[ids.get(g.teams.home.team.id),ids.get(g.teams.away.team.id)].includes(n.equipo_2_id));
      const completed=relevant.filter(g=>g.status.abstractGameState==='Final'&&Number.isInteger(g.teams.home.score)&&Number.isInteger(g.teams.away.score)&&g.teams.home.score!==g.teams.away.score);
      if(!completed.length)continue;
      const wins=completed.map(g=>ids.get(g.teams.home.score>g.teams.away.score?g.teams.home.team.id:g.teams.away.team.id));
      const a=wins.filter(x=>x===n.equipo_1_id).length,b=wins.filter(x=>x===n.equipo_2_id).length;
      const target=n.victorias_necesarias||4;
      const winner=a>=target?n.equipo_1_id:b>=target?n.equipo_2_id:null;
      db.prepare('UPDATE playoff_bracket SET score_1=?,score_2=?,ganador_id=?,estado=?,fuente=?,updated_at=? WHERE id=?').run(a,b,winner,winner?'finalizado':'en_curso','https://statsapi.mlb.com/api/v1/schedule?sportId=23&startDate=2026-08-08&endDate=2026-09-30',input.checkedAt,n.id);
      report.bracket.push({id:n.id,score:[a,b]});
    }
    if(lineup) {
      const c=db.prepare('SELECT c.* FROM calendario_partidos c JOIN calendar_official_links l ON l.calendar_id=c.id WHERE l.game_pk=?').get(lineup.game.gamePk);
      if(c?.partido_id&&!c.activo) {
        for(const side of ['home','away']) {
          const t=lineup.boxscore.teams[side],teamId=ids.get(t.team.id);
          const starters=Object.values(t.players).filter(p=>Number(p.battingOrder)>0&&Number(p.battingOrder)%100===0).sort((a,b)=>Number(a.battingOrder)-Number(b.battingOrder));
          if(starters.length!==9){report.skipped.push({team:teamId,reason:'Sin nueve titulares confirmados'});continue;}
          // Keep any operator-saved lineup. Populate a missing game-specific lineup only.
          if(db.prepare('SELECT 1 FROM lineups WHERE partido_id=? AND equipo_id=?').get(c.partido_id,teamId))continue;
          const matched=starters.map(p=>db.prepare('SELECT id FROM jugadores WHERE equipo_id=? AND mlb_id=?').get(teamId,p.person.id));
          if(matched.some(p=>!p)){report.skipped.push({team:teamId,reason:'Titular no encontrado en catálogo'});continue;}
          matched.forEach((p,i)=>db.prepare('INSERT INTO lineups(partido_id,equipo_id,jugador_id,orden_bateo) VALUES(?,?,?,?)').run(c.partido_id,teamId,p.id,i+1));
          db.prepare('INSERT OR REPLACE INTO lineup_sources VALUES(?,?,?,?)').run(c.partido_id,teamId,lineup.game.gamePk,lineup.game.officialDate);
          report.lineups.push({team:teamId,gameDate:lineup.game.officialDate,count:matched.length});
        }
      }
    }
    report.cachedGames=games.length;
    return report;
  })();
}
module.exports={apply,localTime};
