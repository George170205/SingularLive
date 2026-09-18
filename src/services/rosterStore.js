const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/\s+/g,' ');
function init(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS roster_sync (equipo_id INTEGER PRIMARY KEY REFERENCES equipos(id) ON DELETE CASCADE, checked_at TEXT NOT NULL, roster_date TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS roster_membership (jugador_id INTEGER PRIMARY KEY REFERENCES jugadores(id) ON DELETE CASCADE, activo INTEGER NOT NULL, duplicate_of INTEGER, official_json TEXT, checked_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS official_games (game_pk INTEGER PRIMARY KEY, official_json TEXT NOT NULL, checked_at TEXT NOT NULL);`);
}
function list(db,id,includeInactive=false) {
  return db.prepare(`SELECT j.*,COALESCE(m.activo,1) roster_activo,m.duplicate_of FROM jugadores j LEFT JOIN roster_membership m ON m.jugador_id=j.id WHERE j.equipo_id=? ${includeInactive?'':'AND COALESCE(m.activo,1)=1'} ORDER BY j.numero,j.id`).all(id);
}
function apply(db,teamId,players,date,checkedAt=new Date().toISOString()) {
  if(!Array.isArray(players)||!players.length) throw Error('Roster vacío: se conserva la información local.');
  if(players.some(p=>!Number.isInteger(p.mlb_id)||!p.nombre)||new Set(players.map(p=>p.mlb_id)).size!==players.length) throw Error('Roster oficial inválido o duplicado.');
  return db.transaction(()=>{
    const previous=list(db,teamId,true);
    const stats={inserted:0,updated:0,archived:0,duplicates:0};
    const seen=new Set();
    for(const p of players) {
      const candidates=previous.filter(j=>j.mlb_id===p.mlb_id||(!j.mlb_id&&normalize(j.nombre)===normalize(p.nombre)));
      const existing=candidates.find(j=>j.mlb_id===p.mlb_id)||candidates[0];
      let id=existing?.id;
      if(existing) {
        const meta=db.prepare('SELECT official_json FROM roster_membership WHERE jugador_id=?').get(id);
        const old=meta?.official_json?JSON.parse(meta.official_json):null;
        // After the first synchronization, retain field edits made since the last official snapshot.
        const number=old&&existing.numero!==old.numero?existing.numero:p.numero;
        const position=old&&existing.posicion!==old.posicion?existing.posicion:p.posicion;
        // Uploaded/custom pictures and bios are never replaced by a provider refresh.
        const customPhoto=existing.foto_url&&!/https:\/\/(midfield|img)\.mlbstatic\.com\//.test(existing.foto_url);
        const photo=customPhoto?existing.foto_url:p.foto_url||existing.foto_url;
        db.prepare('UPDATE jugadores SET mlb_id=?,numero=?,posicion=?,foto_url=? WHERE id=?').run(p.mlb_id,number,position,photo,id);
        stats.updated++;
      } else {
        id=db.prepare('INSERT INTO jugadores(equipo_id,mlb_id,numero,nombre,posicion,foto_url,bio_texto) VALUES(?,?,?,?,?,?,?)').run(teamId,p.mlb_id,p.numero,p.nombre,p.posicion,p.foto_url,p.bio_texto||'').lastInsertRowid;
        stats.inserted++;
      }
      seen.add(id);
      db.prepare('INSERT OR REPLACE INTO roster_membership VALUES(?,1,NULL,?,?)').run(id,JSON.stringify(p),checkedAt);
      for(const duplicate of candidates.filter(j=>j.id!==id)) {
        db.prepare('INSERT OR REPLACE INTO roster_membership VALUES(?,0,?,NULL,?)').run(duplicate.id,id,checkedAt);
        stats.duplicates++;
      }
    }
    for(const j of previous.filter(j=>!seen.has(j.id))) {
      db.prepare(`INSERT INTO roster_membership(jugador_id,activo,checked_at) VALUES(?,0,?) ON CONFLICT(jugador_id) DO UPDATE SET activo=0,checked_at=excluded.checked_at`).run(j.id,checkedAt);
      stats.archived++;
    }
    db.prepare('INSERT OR REPLACE INTO roster_sync VALUES(?,?,?)').run(teamId,checkedAt,date);
    return {...stats,active:seen.size};
  })();
}
function fromApi(roster) {
  return roster.map(p=>({mlb_id:p.person.id,nombre:p.person.fullName,numero:Number.parseInt(p.jerseyNumber,10)||0,posicion:p.position?.abbreviation||'',foto_url:`https://midfield.mlbstatic.com/v1/people/${p.person.id}/spots/120`,bio_texto:`${p.position?.name||'Jugador'} | Liga Mexicana de Béisbol`}));
}
module.exports={init,list,apply,fromApi,normalize};
