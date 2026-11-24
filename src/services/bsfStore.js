const DEFAULT_ASSETS = [
  // Fondos y videos base del Control App 0FuwnDA057k7zosJmUACw5
  {
    asset_key: 'bg_frame',
    category: 'fondo',
    label: 'Fondo Marco General Singular',
    url: 'https://image.singular.live/8334844d0fcb01583f6f99ce61ab3be9/images/1phOKe293gfdNG7lKREvEw_w1920h1080.png'
  },
  {
    asset_key: 'video_clip_1',
    category: 'video',
    label: 'Video Loop Principal 1',
    url: '//assets.singular.live/8334844d0fcb01583f6f99ce61ab3be9/videos/1puFJ62W0YR71dvtF40s7m.mp4'
  },
  {
    asset_key: 'video_clip_2',
    category: 'video',
    label: 'Video Loop Alterno 2',
    url: '//assets.singular.live/8334844d0fcb01583f6f99ce61ab3be9/videos/592UZahu8JUT7XKSbEQDfG.mp4'
  },
  {
    asset_key: 'default_player_img',
    category: 'jugador',
    label: 'Foto Jugador por Defecto',
    url: 'https://image.singular.live/81ee6e3c159e11677f20c0c48694d88e/images/7crQthOiXhUCkWlrnLlos1_w1080h1350.jpeg'
  },
  // Logos de ligas y zonas
  {
    asset_key: 'league_LMP',
    category: 'liga',
    label: 'Logo LMP',
    url: 'https://image.singular.live/8334844d0fcb01583f6f99ce61ab3be9/images/5EOILw0wP9QqLrJaG5j4Fs_w723h845.jpg'
  },
  {
    asset_key: 'league_LMB',
    category: 'liga',
    label: 'Logo LMB',
    url: 'https://image.singular.live/8334844d0fcb01583f6f99ce61ab3be9/images/2tf0HICAY34gPmP1cNBswn_w904h844.jpeg'
  },
  {
    asset_key: 'league_LVBP',
    category: 'liga',
    label: 'Logo LVBP',
    url: 'https://image.singular.live/8334844d0fcb01583f6f99ce61ab3be9/images/2tf0HICAY34gPmP1cNBswn_w904h844.jpeg'
  },
  {
    asset_key: 'league_MLB',
    category: 'liga',
    label: 'Logo MLB',
    url: 'https://image.singular.live/8334844d0fcb01583f6f99ce61ab3be9/images/2tf0HICAY34gPmP1cNBswn_w904h844.jpeg'
  },
  {
    asset_key: 'league_LIDOM',
    category: 'liga',
    label: 'Logo LIDOM',
    url: 'https://image.singular.live/8334844d0fcb01583f6f99ce61ab3be9/images/2tf0HICAY34gPmP1cNBswn_w904h844.jpeg'
  },
  {
    asset_key: 'zona_norte',
    category: 'zona',
    label: 'Logo Zona Norte LMB (Overlay 5)',
    url: 'https://image.singular.live/8334844d0fcb01583f6f99ce61ab3be9/images/3844JhgH3sBBaS87agVYVA_w1920h1080.png'
  },
  {
    asset_key: 'zona_sur',
    category: 'zona',
    label: 'Logo Zona Sur LMB (Overlay 5)',
    url: 'https://image.singular.live/8334844d0fcb01583f6f99ce61ab3be9/images/3844JhgH3sBBaS87agVYVA_w1920h1080.png'
  },
  // Equipos LMP (rescatados de Singular 0FuwnDA057k7zosJmUACw5 + MLB static fallback)
  { asset_key: 'team_673', category: 'equipo_LMP', label: 'LMP · Águilas de Mexicali', url: 'https://image.singular.live/8334844d0fcb01583f6f99ce61ab3be9/images/2QHBJT7na6IPkRtmbJnXgP_w156h96.png' },
  { asset_key: 'team_674', category: 'equipo_LMP', label: 'LMP · Charros de Jalisco', url: 'https://image.singular.live/8334844d0fcb01583f6f99ce61ab3be9/images/1iSzRlY62ocyVjccIYTsbH_w156h96.png' },
  { asset_key: 'team_675', category: 'equipo_LMP', label: 'LMP · Cañeros de Los Mochis', url: 'https://www.mlbstatic.com/team-logos/675.svg' },
  { asset_key: 'team_676', category: 'equipo_LMP', label: 'LMP · Mayos de Navojoa', url: 'https://image.singular.live/8334844d0fcb01583f6f99ce61ab3be9/images/5Ti48wtaE2ob2lRUpL0SfF_w156h96.png' },
  { asset_key: 'team_677', category: 'equipo_LMP', label: 'LMP · Naranjeros de Hermosillo', url: 'https://image.singular.live/8334844d0fcb01583f6f99ce61ab3be9/images/1SUyNhYohKwKZCzeoWw7Gw_w156h96.png' },
  { asset_key: 'team_678', category: 'equipo_LMP', label: 'LMP · Tomateros de Culiacán', url: 'https://image.singular.live/8334844d0fcb01583f6f99ce61ab3be9/images/5YXyKoQfYtDe0ozXjy2urZ_w156h96.png' },
  { asset_key: 'team_679', category: 'equipo_LMP', label: 'LMP · Venados de Mazatlán', url: 'https://image.singular.live/8334844d0fcb01583f6f99ce61ab3be9/images/2hFmyfAuMdPrc78pao8cJa_w156h96.png' },
  { asset_key: 'team_680', category: 'equipo_LMP', label: 'LMP · Yaquis de Obregón', url: 'https://image.singular.live/8334844d0fcb01583f6f99ce61ab3be9/images/1H3eQ9zCrMDK9mNqw5T1HN_w156h96.png' },
  { asset_key: 'team_5482', category: 'equipo_LMP', label: 'LMP · Algodoneros de Guasave', url: 'https://www.mlbstatic.com/team-logos/5482.svg' },
  { asset_key: 'team_6483', category: 'equipo_LMP', label: 'LMP · Jaguares de Nayarit', url: 'https://image.singular.live/8334844d0fcb01583f6f99ce61ab3be9/images/6SaSZNHJBkAcHmZt5z0Tgt_w156h96.png' },
  // Equipos LVBP
  { asset_key: 'team_692', category: 'equipo_LVBP', label: 'LVBP · Águilas del Zulia', url: 'https://www.mlbstatic.com/team-logos/692.svg' },
  { asset_key: 'team_693', category: 'equipo_LVBP', label: 'LVBP · Cardenales de Lara', url: 'https://www.mlbstatic.com/team-logos/693.svg' },
  { asset_key: 'team_694', category: 'equipo_LVBP', label: 'LVBP · Caribes de Anzoátegui', url: 'https://www.mlbstatic.com/team-logos/694.svg' },
  { asset_key: 'team_695', category: 'equipo_LVBP', label: 'LVBP · Leones del Caracas', url: 'https://www.mlbstatic.com/team-logos/695.svg' },
  { asset_key: 'team_696', category: 'equipo_LVBP', label: 'LVBP · Navegantes del Magallanes', url: 'https://image.singular.live/8334844d0fcb01583f6f99ce61ab3be9/images/2v54LLHhrXQlowoyJrcw3G_w420h428.png' },
  { asset_key: 'team_697', category: 'equipo_LVBP', label: 'LVBP · Bravos de Margarita', url: 'https://www.mlbstatic.com/team-logos/697.svg' },
  { asset_key: 'team_698', category: 'equipo_LVBP', label: 'LVBP · Tiburones de La Guaira', url: 'https://www.mlbstatic.com/team-logos/698.svg' },
  { asset_key: 'team_699', category: 'equipo_LVBP', label: 'LVBP · Tigres de Aragua', url: 'https://www.mlbstatic.com/team-logos/699.svg' },
  // Equipos LMB
  { asset_key: 'team_5010', category: 'equipo_LMB', label: 'LMB · Toros de Tijuana', url: 'https://torosdetijuana.com/wp-content/uploads/2024/02/cropped-cropped-page-bg-logo.png' },
  { asset_key: 'team_562', category: 'equipo_LMB', label: 'LMB · Sultanes de Monterrey', url: 'https://www.mlbstatic.com/team-logos/562.svg' },
  { asset_key: 'team_532', category: 'equipo_LMB', label: 'LMB · Diablos Rojos del México', url: 'https://www.mlbstatic.com/team-logos/532.svg' },
  { asset_key: 'team_496', category: 'equipo_LMB', label: 'LMB · Leones de Yucatán', url: 'https://www.mlbstatic.com/team-logos/496.svg' },
  { asset_key: 'team_560', category: 'equipo_LMB', label: 'LMB · Acereros de Monclova', url: 'https://www.mlbstatic.com/team-logos/560.svg' },
  { asset_key: 'team_502', category: 'equipo_LMB', label: 'LMB · Saraperos de Saltillo', url: 'https://www.mlbstatic.com/team-logos/502.svg' },
  { asset_key: 'team_447', category: 'equipo_LMB', label: 'LMB · Algodoneros Unión Laguna', url: 'https://www.mlbstatic.com/team-logos/447.svg' },
  { asset_key: 'team_536', category: 'equipo_LMB', label: 'LMB · Tecos de los Dos Laredos', url: 'https://www.mlbstatic.com/team-logos/536.svg' },
  { asset_key: 'team_6304', category: 'equipo_LMB', label: 'LMB · Charros de Jalisco', url: 'https://www.mlbstatic.com/team-logos/6304.svg' },
  { asset_key: 'team_528', category: 'equipo_LMB', label: 'LMB · Rieleros de Aguascalientes', url: 'https://www.mlbstatic.com/team-logos/528.svg' },
  { asset_key: 'team_520', category: 'equipo_LMB', label: 'LMB · Pericos de Puebla', url: 'https://www.mlbstatic.com/team-logos/520.svg' },
  { asset_key: 'team_523', category: 'equipo_LMB', label: 'LMB · Piratas de Campeche', url: 'https://www.mlbstatic.com/team-logos/523.svg' },
  { asset_key: 'team_6303', category: 'equipo_LMB', label: 'LMB · Conspiradores de Querétaro', url: 'https://www.mlbstatic.com/team-logos/6303.svg' },
  { asset_key: 'team_434', category: 'equipo_LMB', label: 'LMB · Bravos de León', url: 'https://www.mlbstatic.com/team-logos/434.svg' },
  { asset_key: 'team_569', category: 'equipo_LMB', label: 'LMB · Tigres de Quintana Roo', url: 'https://www.mlbstatic.com/team-logos/569.svg' },
  { asset_key: 'team_442', category: 'equipo_LMB', label: 'LMB · Olmecas de Tabasco', url: 'https://www.mlbstatic.com/team-logos/442.svg' },
  { asset_key: 'team_5567', category: 'equipo_LMB', label: 'LMB · El Águila de Veracruz', url: 'https://www.mlbstatic.com/team-logos/5567.svg' },
  { asset_key: 'team_575', category: 'equipo_LMB', label: 'LMB · Dorados de Chihuahua', url: 'https://www.mlbstatic.com/team-logos/575.svg' },
  { asset_key: 'team_579', category: 'equipo_LMB', label: 'LMB · Guerreros de Oaxaca', url: 'https://www.mlbstatic.com/team-logos/579.svg' },
  { asset_key: 'team_4444', category: 'equipo_LMB', label: 'LMB · Caliente de Durango', url: 'https://www.mlbstatic.com/team-logos/4444.svg' }
];

const DEFAULT_HISTORICAL = {
  record_key: 'lmp_lmb_hits',
  title: 'LMP Y LMB | HITS CONECTADOS',
  col1_label: 'LMP',
  col2_label: 'LMB',
  left_rows: [
    { name: 'HÉCTOR ESPINO', value: '1,824' },
    { name: 'MATÍAS CARRILLO', value: '1,486' },
    { name: 'FRANCISCO ESTRADA', value: '1,268' },
    { name: 'AURELIO RODRÍGUEZ', value: '1,175' },
    { name: 'JOSÉ M. RODRÍGUEZ', value: '1,174' },
    { name: 'AGUSTÍN MURILLO', value: '1,150' },
    { name: 'JESÚS SOMMERS', value: '1,073' },
    { name: 'ÓSCAR ROBLES', value: '1,063' }
  ],
  right_rows: [
    { name: 'JESÚS SOMMERS', value: '1,824' },
    { name: 'NELSON BARRERA', value: '1,486' },
    { name: 'HÉCTOR ESPINO', value: '1,268' },
    { name: 'DANIEL FERNÁNDEZ', value: '1,175' },
    { name: 'ROBERTO VIZCARRA', value: '1,174' },
    { name: 'ENRIQUE AGUILAR', value: '1,150' },
    { name: 'ALEJANDRO ORTIZ', value: '1,073' },
    { name: 'MATÍAS CARRILLO', value: '1,063' }
  ],
  image_url: 'https://image.singular.live/8334844d0fcb01583f6f99ce61ab3be9/images/2tf0HICAY34gPmP1cNBswn_w904h844.jpeg'
};

const DEFAULT_SETTINGS = {
  tzMode: 'BOTH',
  defaultSeason: '2026',
  defaultLeague: 'LMP',
  scheduler: {
    enabled: false,
    morningTime: '09:00',
    nightTime: '01:30',
    leagues: ['LMP', 'LMB', 'LVBP'],
    dryRunOnly: true
  }
};

function init(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS bsf_assets (
      asset_key TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      label TEXT NOT NULL,
      url TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bsf_cache (
      cache_key TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL,
      fetched_at INTEGER NOT NULL,
      ttl_ms INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bsf_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      overlay_key TEXT NOT NULL,
      subcomposition_id TEXT NOT NULL,
      league TEXT,
      state TEXT,
      payload_json TEXT NOT NULL,
      dry_run INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL,
      error TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bsf_historical_records (
      record_key TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      col1_label TEXT NOT NULL,
      col2_label TEXT NOT NULL,
      left_rows_json TEXT NOT NULL,
      right_rows_json TEXT NOT NULL,
      image_url TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bsf_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const insertAsset = db.prepare(`
    INSERT OR IGNORE INTO bsf_assets (asset_key, category, label, url)
    VALUES (?, ?, ?, ?)
  `);
  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO bsf_settings (key, value)
    VALUES (?, ?)
  `);
  const insertHistorical = db.prepare(`
    INSERT OR IGNORE INTO bsf_historical_records (
      record_key, title, col1_label, col2_label, left_rows_json, right_rows_json, image_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    for (const a of DEFAULT_ASSETS) {
      insertAsset.run(a.asset_key, a.category, a.label, a.url);
    }
    insertSetting.run('tzMode', DEFAULT_SETTINGS.tzMode);
    insertSetting.run('defaultSeason', DEFAULT_SETTINGS.defaultSeason);
    insertSetting.run('defaultLeague', DEFAULT_SETTINGS.defaultLeague);
    insertSetting.run('scheduler', JSON.stringify(DEFAULT_SETTINGS.scheduler));

    insertHistorical.run(
      DEFAULT_HISTORICAL.record_key,
      DEFAULT_HISTORICAL.title,
      DEFAULT_HISTORICAL.col1_label,
      DEFAULT_HISTORICAL.col2_label,
      JSON.stringify(DEFAULT_HISTORICAL.left_rows),
      JSON.stringify(DEFAULT_HISTORICAL.right_rows),
      DEFAULT_HISTORICAL.image_url
    );
  });
  tx();
}

function listAssets(db) {
  return db.prepare('SELECT * FROM bsf_assets ORDER BY category ASC, label ASC').all();
}

function getAssetsMap(db) {
  const rows = db.prepare('SELECT asset_key, url FROM bsf_assets').all();
  const map = {};
  for (const r of rows) {
    map[r.asset_key] = r.url;
  }
  return map;
}

function upsertAsset(db, assetKey, { category = 'custom', label, url }) {
  if (!assetKey || !url) throw new Error('assetKey y url son requeridos.');
  const existing = db.prepare('SELECT * FROM bsf_assets WHERE asset_key = ?').get(assetKey);
  db.prepare(`
    INSERT INTO bsf_assets (asset_key, category, label, url, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(asset_key) DO UPDATE SET
      category = COALESCE(excluded.category, bsf_assets.category),
      label = COALESCE(excluded.label, bsf_assets.label),
      url = excluded.url,
      updated_at = CURRENT_TIMESTAMP
  `).run(assetKey, category || existing?.category || 'custom', label || existing?.label || assetKey, String(url).trim());
  return db.prepare('SELECT * FROM bsf_assets WHERE asset_key = ?').get(assetKey);
}

function getCache(db, cacheKey, allowStale = false) {
  const row = db.prepare('SELECT * FROM bsf_cache WHERE cache_key = ?').get(cacheKey);
  if (!row) return null;
  const expired = Date.now() - row.fetched_at > row.ttl_ms;
  if (expired && !allowStale) return null;
  try {
    return { data: JSON.parse(row.payload_json), fetchedAt: row.fetched_at, stale: expired };
  } catch (e) {
    return null;
  }
}

function setCache(db, cacheKey, data, ttlMs = 300000) {
  db.prepare(`
    INSERT INTO bsf_cache (cache_key, payload_json, fetched_at, ttl_ms)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(cache_key) DO UPDATE SET
      payload_json = excluded.payload_json,
      fetched_at = excluded.fetched_at,
      ttl_ms = excluded.ttl_ms
  `).run(cacheKey, JSON.stringify(data), Date.now(), Number(ttlMs) || 300000);
}

function getSettings(db) {
  const rows = db.prepare('SELECT key, value FROM bsf_settings').all();
  const raw = {};
  for (const r of rows) raw[r.key] = r.value;
  let scheduler = { ...DEFAULT_SETTINGS.scheduler };
  if (raw.scheduler) {
    try {
      scheduler = { ...DEFAULT_SETTINGS.scheduler, ...JSON.parse(raw.scheduler) };
    } catch (e) {}
  }
  return {
    tzMode: raw.tzMode || DEFAULT_SETTINGS.tzMode,
    defaultSeason: raw.defaultSeason || DEFAULT_SETTINGS.defaultSeason,
    defaultLeague: raw.defaultLeague || DEFAULT_SETTINGS.defaultLeague,
    scheduler
  };
}

function saveSettings(db, partial = {}) {
  const current = getSettings(db);
  const upsert = db.prepare(`
    INSERT INTO bsf_settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);
  if (partial.tzMode && ['America/Tijuana', 'America/Mexico_City', 'BOTH'].includes(partial.tzMode)) {
    upsert.run('tzMode', partial.tzMode);
  }
  if (partial.defaultSeason) {
    upsert.run('defaultSeason', String(partial.defaultSeason).trim());
  }
  if (partial.defaultLeague) {
    upsert.run('defaultLeague', String(partial.defaultLeague).trim().toUpperCase());
  }
  if (partial.scheduler && typeof partial.scheduler === 'object') {
    const merged = {
      ...current.scheduler,
      ...partial.scheduler,
      leagues: Array.isArray(partial.scheduler.leagues)
        ? partial.scheduler.leagues.map(x => String(x).toUpperCase())
        : current.scheduler.leagues
    };
    upsert.run('scheduler', JSON.stringify(merged));
  }
  return getSettings(db);
}

function parseHistoricalRow(row) {
  if (!row) return null;
  return {
    record_key: row.record_key,
    title: row.title,
    col1_label: row.col1_label,
    col2_label: row.col2_label,
    left_rows: JSON.parse(row.left_rows_json || '[]'),
    right_rows: JSON.parse(row.right_rows_json || '[]'),
    image_url: row.image_url || '',
    updated_at: row.updated_at
  };
}

function listHistorical(db) {
  return db.prepare('SELECT * FROM bsf_historical_records ORDER BY record_key ASC').all().map(parseHistoricalRow);
}

function getHistorical(db, recordKey) {
  const row = db.prepare('SELECT * FROM bsf_historical_records WHERE record_key = ?').get(recordKey);
  return parseHistoricalRow(row);
}

function saveHistorical(db, recordKey, record) {
  if (!recordKey) throw new Error('recordKey requerido');
  const existing = getHistorical(db, recordKey) || DEFAULT_HISTORICAL;
  const title = record.title || existing.title;
  const col1 = record.col1_label || existing.col1_label;
  const col2 = record.col2_label || existing.col2_label;
  const left = Array.isArray(record.left_rows) ? record.left_rows : existing.left_rows;
  const right = Array.isArray(record.right_rows) ? record.right_rows : existing.right_rows;
  const img = record.image_url !== undefined ? record.image_url : existing.image_url;

  db.prepare(`
    INSERT INTO bsf_historical_records (
      record_key, title, col1_label, col2_label, left_rows_json, right_rows_json, image_url, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(record_key) DO UPDATE SET
      title = excluded.title,
      col1_label = excluded.col1_label,
      col2_label = excluded.col2_label,
      left_rows_json = excluded.left_rows_json,
      right_rows_json = excluded.right_rows_json,
      image_url = excluded.image_url,
      updated_at = CURRENT_TIMESTAMP
  `).run(recordKey, title, col1, col2, JSON.stringify(left), JSON.stringify(right), img);

  return getHistorical(db, recordKey);
}

function logHistory(db, { overlayKey, subCompositionId, league = null, state = null, payload, dryRun = false, status = 'ok', error = null }) {
  const info = db.prepare(`
    INSERT INTO bsf_history (overlay_key, subcomposition_id, league, state, payload_json, dry_run, status, error)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    overlayKey,
    subCompositionId,
    league,
    state,
    JSON.stringify(payload || {}),
    dryRun ? 1 : 0,
    status,
    error
  );
  return info.lastInsertRowid;
}

function listHistory(db, limit = 30) {
  return db
    .prepare('SELECT * FROM bsf_history ORDER BY id DESC LIMIT ?')
    .all(Math.max(1, Math.min(200, Number(limit) || 30)))
    .map(r => ({
      id: r.id,
      overlayKey: r.overlay_key,
      subCompositionId: r.subcomposition_id,
      league: r.league,
      state: r.state,
      payload: JSON.parse(r.payload_json || '{}'),
      dryRun: Boolean(r.dry_run),
      status: r.status,
      error: r.error,
      createdAt: r.created_at
    }));
}

module.exports = {
  DEFAULT_ASSETS,
  DEFAULT_HISTORICAL,
  DEFAULT_SETTINGS,
  init,
  listAssets,
  getAssetsMap,
  upsertAsset,
  getCache,
  setCache,
  getSettings,
  saveSettings,
  listHistorical,
  getHistorical,
  saveHistorical,
  logHistory,
  listHistory
};
