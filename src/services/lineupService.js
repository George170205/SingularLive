// A stored batting order is independent of the team's full player catalog.
module.exports = function getLineup(db, teamId, matchId) {
  const template=require('./lineupTemplates').get(db,teamId);
  if(template)return template;
  const source=db.prepare(`SELECT partido_id FROM lineups WHERE equipo_id=?
    ORDER BY CASE WHEN partido_id=? THEN 0 ELSE 1 END, partido_id DESC LIMIT 1`).get(teamId,matchId);
  if(!source) return {players:[],sourceMatchId:null,reused:false};
  const hasSources=db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='lineup_sources'").get();
  const official=hasSources?db.prepare('SELECT game_pk,game_date FROM lineup_sources WHERE partido_id=? AND equipo_id=?').get(source.partido_id,teamId):null;
  return {
    official:official||null,
    players:db.prepare(`SELECT j.*,l.orden_bateo FROM lineups l JOIN jugadores j ON j.id=l.jugador_id
      WHERE l.equipo_id=? AND l.partido_id=? ORDER BY l.orden_bateo`).all(teamId,source.partido_id),
    sourceMatchId:source.partido_id,reused:source.partido_id!==matchId
  };
};
