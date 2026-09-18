const Database = require('better-sqlite3');
const path = require('path');
const config = require('../config');

const dbPath = config.DATABASE_FILE === ':memory:' ? ':memory:' : path.resolve(__dirname, '../../', config.DATABASE_FILE);
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

const LMB_TEAMS_CATALOG = [
  { mlbId: 5010, siglas: 'TIJ', nombre: 'Toros de Tijuana', color_primario: '#C4122F', color_secundario: '#1A1A1A', logo_url: 'https://torosdetijuana.com/wp-content/uploads/2024/02/cropped-cropped-page-bg-logo.png' },
  { mlbId: 562, siglas: 'MTY', nombre: 'Sultanes de Monterrey', color_primario: '#0C2340', color_secundario: '#E31837', logo_url: 'https://www.mlbstatic.com/team-logos/562.svg' },
  { mlbId: 532, siglas: 'MEX', nombre: 'Diablos Rojos del México', color_primario: '#D40028', color_secundario: '#FFFFFF', logo_url: 'https://www.mlbstatic.com/team-logos/532.svg' },
  { mlbId: 496, siglas: 'YUC', nombre: 'Leones de Yucatán', color_primario: '#005A36', color_secundario: '#EAAA00', logo_url: 'https://www.mlbstatic.com/team-logos/496.svg' },
  { mlbId: 560, siglas: 'MVA', nombre: 'Acereros de Monclova', color_primario: '#002B66', color_secundario: '#D12631', logo_url: 'https://www.mlbstatic.com/team-logos/560.svg' },
  { mlbId: 502, siglas: 'SAL', nombre: 'Saraperos de Saltillo', color_primario: '#007A87', color_secundario: '#1B365D', logo_url: 'https://www.mlbstatic.com/team-logos/502.svg' },
  { mlbId: 447, siglas: 'LAG', nombre: 'Algodoneros Unión Laguna', color_primario: '#5C1D24', color_secundario: '#B38F4E', logo_url: 'https://www.mlbstatic.com/team-logos/447.svg' },
  { mlbId: 536, siglas: 'LAR', nombre: 'Tecolotes de los Dos Laredos', color_primario: '#00205B', color_secundario: '#A2AAAD', logo_url: 'https://www.mlbstatic.com/team-logos/536.svg' },
  { mlbId: 6304, siglas: 'JAL', nombre: 'Charros de Jalisco', color_primario: '#002D62', color_secundario: '#FED141', logo_url: 'https://www.mlbstatic.com/team-logos/6304.svg' },
  { mlbId: 528, siglas: 'AGS', nombre: 'Rieleros de Aguascalientes', color_primario: '#00204E', color_secundario: '#FFB81C', logo_url: 'https://www.mlbstatic.com/team-logos/528.svg' },
  { mlbId: 520, siglas: 'PUE', nombre: 'Pericos de Puebla', color_primario: '#003831', color_secundario: '#F2A900', logo_url: 'https://www.mlbstatic.com/team-logos/520.svg' },
  { mlbId: 523, siglas: 'CAM', nombre: 'Piratas de Campeche', color_primario: '#002B49', color_secundario: '#A2AAAD', logo_url: 'https://www.mlbstatic.com/team-logos/523.svg' },
  { mlbId: 6303, siglas: 'QRO', nombre: 'Conspiradores de Querétaro', color_primario: '#4A0D66', color_secundario: '#C5B358', logo_url: 'https://www.mlbstatic.com/team-logos/6303.svg' },
  { mlbId: 434, siglas: 'LEO', nombre: 'Bravos de León', color_primario: '#0C2340', color_secundario: '#C8102E', logo_url: 'https://www.mlbstatic.com/team-logos/434.svg' },
  { mlbId: 569, siglas: 'TIG', nombre: 'Tigres de Quintana Roo', color_primario: '#002B49', color_secundario: '#ED1C24', logo_url: 'https://www.mlbstatic.com/team-logos/569.svg' },
  { mlbId: 442, siglas: 'TAB', nombre: 'Olmecas de Tabasco', color_primario: '#004B23', color_secundario: '#F9A01B', logo_url: 'https://www.mlbstatic.com/team-logos/442.svg' },
  { mlbId: 5567, siglas: 'VER', nombre: 'El Águila de Veracruz', color_primario: '#BE0F34', color_secundario: '#002855', logo_url: 'https://www.mlbstatic.com/team-logos/5567.svg' },
  { mlbId: 575, siglas: 'CHI', nombre: 'Dorados de Chihuahua', color_primario: '#541A25', color_secundario: '#D4AF37', logo_url: 'https://www.mlbstatic.com/team-logos/575.svg' },
  { mlbId: 579, siglas: 'OAX', nombre: 'Guerreros de Oaxaca', color_primario: '#0C2340', color_secundario: '#C4122F', logo_url: 'https://www.mlbstatic.com/team-logos/579.svg' },
  { mlbId: 4444, siglas: 'DUR', nombre: 'Caliente de Durango', color_primario: '#D40028', color_secundario: '#000000', logo_url: 'https://www.mlbstatic.com/team-logos/4444.svg' }
];

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS equipos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mlb_id INTEGER,
      nombre TEXT NOT NULL,
      siglas TEXT NOT NULL,
      logo_url TEXT,
      color_primario TEXT NOT NULL,
      color_secundario TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS jugadores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipo_id INTEGER NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
      mlb_id INTEGER,
      numero INTEGER NOT NULL,
      nombre TEXT NOT NULL,
      posicion TEXT,
      foto_url TEXT,
      bio_texto TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS control_apps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      deporte TEXT NOT NULL DEFAULT 'baseball',
      app_token TEXT NOT NULL,
      activo INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS overlays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      control_app_id INTEGER NOT NULL REFERENCES control_apps(id) ON DELETE CASCADE,
      tipo TEXT NOT NULL,
      subcomposition_id TEXT NOT NULL,
      nombre_descriptivo TEXT,
      UNIQUE(control_app_id, tipo)
    );

    CREATE TABLE IF NOT EXISTS partidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipo_local_id INTEGER NOT NULL REFERENCES equipos(id),
      equipo_visitante_id INTEGER NOT NULL REFERENCES equipos(id),
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
      estado TEXT NOT NULL DEFAULT 'en_vivo',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lineups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      partido_id INTEGER NOT NULL REFERENCES partidos(id) ON DELETE CASCADE,
      equipo_id INTEGER NOT NULL REFERENCES equipos(id),
      jugador_id INTEGER NOT NULL REFERENCES jugadores(id),
      orden_bateo INTEGER NOT NULL,
      UNIQUE(partido_id, equipo_id, orden_bateo)
    );

    CREATE TABLE IF NOT EXISTS estado_partido (
      partido_id INTEGER PRIMARY KEY REFERENCES partidos(id) ON DELETE CASCADE,
      inning INTEGER NOT NULL DEFAULT 1,
      mitad TEXT NOT NULL DEFAULT 'alta',
      outs INTEGER NOT NULL DEFAULT 0,
      bolas INTEGER NOT NULL DEFAULT 0,
      strikes INTEGER NOT NULL DEFAULT 0,
      base_1 INTEGER NOT NULL DEFAULT 0,
      base_2 INTEGER NOT NULL DEFAULT 0,
      base_3 INTEGER NOT NULL DEFAULT 0,
      runs_local INTEGER NOT NULL DEFAULT 0,
      runs_visitante INTEGER NOT NULL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS calendario_partidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipo_local_id INTEGER NOT NULL REFERENCES equipos(id),
      equipo_visitante_id INTEGER NOT NULL REFERENCES equipos(id),
      serie_nombre TEXT NOT NULL DEFAULT 'Temporada Regular',
      sede TEXT NOT NULL DEFAULT 'Estadio Chevron, Tijuana',
      fecha_hora TEXT NOT NULL,
      notas TEXT,
      activo INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS playoff_bracket (
      id TEXT PRIMARY KEY,
      zona TEXT NOT NULL,
      ronda TEXT NOT NULL,
      pos_index INTEGER NOT NULL,
      equipo_1_id INTEGER NOT NULL REFERENCES equipos(id),
      equipo_2_id INTEGER NOT NULL REFERENCES equipos(id),
      score_1 INTEGER DEFAULT 0,
      score_2 INTEGER DEFAULT 0,
      ganador_id INTEGER,
      estado TEXT DEFAULT 'finalizado',
      fecha_desc TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migraciones de columnas adicionales si la BD ya existía
  try {
    const equiposCols = db.prepare("PRAGMA table_info(equipos)").all();
    if (!equiposCols.some(c => c.name === 'mlb_id')) {
      db.exec("ALTER TABLE equipos ADD COLUMN mlb_id INTEGER;");
    }
  } catch (e) {}

  try {
    const jugadoresCols = db.prepare("PRAGMA table_info(jugadores)").all();
    if (!jugadoresCols.some(c => c.name === 'mlb_id')) {
      db.exec("ALTER TABLE jugadores ADD COLUMN mlb_id INTEGER;");
    }
  } catch (e) {}

  seedData();
  require('./calendarMigration')(db);
  require('../services/rosterStore').init(db);
  require('../services/lineupTemplates').init(db);
}

function seedData() {
  // Asegurar que los 20 equipos de LMB existan y tengan su mlb_id asignado
  const checkEquipo = db.prepare('SELECT * FROM equipos WHERE siglas = ? OR mlb_id = ? LIMIT 1');
  const updateMlbId = db.prepare('UPDATE equipos SET mlb_id = ? WHERE id = ?');
  const insertEquipo = db.prepare(`
    INSERT INTO equipos (nombre, siglas, logo_url, color_primario, color_secundario, mlb_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const t of LMB_TEAMS_CATALOG) {
    const existing = checkEquipo.get(t.siglas, t.mlbId);
    if (existing) {
      if (!existing.mlb_id) {
        updateMlbId.run(t.mlbId, existing.id);
      }
    } else {
      insertEquipo.run(t.nombre, t.siglas, t.logo_url, t.color_primario, t.color_secundario, t.mlbId);
    }
  }

  // Asegurar Control App inicial
  let app = db.prepare('SELECT id FROM control_apps ORDER BY id ASC LIMIT 1').get();
  if (!app) {
    const resApp = db.prepare(`
      INSERT INTO control_apps (nombre, deporte, app_token, activo)
      VALUES (?, ?, ?, 1)
    `).run('Stealth - Baseball Broadcast', 'baseball', config.SINGULAR_APP_TOKEN);
    app = { id: resApp.lastInsertRowid };
  }

  const OVERLAY_DEFINITIONS = [
    { tipo: 'score_bug', id: config.OVERLAY_IDS.score_bug, desc: 'Score Bug Principal' },
    { tipo: 'fullscreen_matchup', id: config.OVERLAY_IDS.fullscreen_matchup, desc: 'Matchup Pantalla Completa' },
    { tipo: 'lower_matchup', id: config.OVERLAY_IDS.lower_matchup, desc: 'Matchup Inferior' },
    { tipo: 'team_lineups', id: config.OVERLAY_IDS.team_lineups, desc: 'Alineación de Equipo' },
    { tipo: 'player_bio', id: config.OVERLAY_IDS.player_bio, desc: 'Ficha Biográfica Jugador' },
    { tipo: 'comparison_stats', id: config.OVERLAY_IDS.comparison_stats, desc: 'Comparativa Estadísticas' },
    { tipo: 'background_image', id: config.OVERLAY_IDS.background_image, desc: 'Imagen de Fondo' },
    { tipo: 'baseline_static', id: config.OVERLAY_IDS.baseline_static, desc: 'Cintillo Inferior Estático' },
    { tipo: 'freeform_image', id: config.OVERLAY_IDS.freeform_image, desc: 'Imagen Libre Flotante' },
    { tipo: 'freeform_text', id: config.OVERLAY_IDS.freeform_text, desc: 'Texto Libre Flotante' },
    { tipo: 'lower_1_line', id: config.OVERLAY_IDS.lower_1_line, desc: 'Lower Third - 1 Línea' },
    { tipo: 'lower_2_line', id: config.OVERLAY_IDS.lower_2_line, desc: 'Lower Third - 2 Líneas' },
    { tipo: 'upper_right_1_line', id: config.OVERLAY_IDS.upper_right_1_line, desc: 'Esquina Superior - 1 Línea' },
    { tipo: 'upper_right_2_line', id: config.OVERLAY_IDS.upper_right_2_line, desc: 'Esquina Superior - 2 Líneas' },
    { tipo: 'upper_right_social', id: config.OVERLAY_IDS.upper_right_social, desc: 'Redes Sociales - Esquina Superior' }
  ];

  const upsertOverlay = db.prepare(`
    INSERT INTO overlays (control_app_id, tipo, subcomposition_id, nombre_descriptivo)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(control_app_id, tipo) DO UPDATE SET
      subcomposition_id = excluded.subcomposition_id,
      nombre_descriptivo = excluded.nombre_descriptivo
  `);

  for (const ov of OVERLAY_DEFINITIONS) {
    upsertOverlay.run(app.id, ov.tipo, ov.id, ov.desc);
  }

  // Asegurar partido inicial
  const countPartidos = db.prepare('SELECT COUNT(*) as c FROM partidos').get().c;
  if (countPartidos === 0) {
    const toros = db.prepare("SELECT id FROM equipos WHERE siglas = 'TIJ' LIMIT 1").get();
    const sultanes = db.prepare("SELECT id FROM equipos WHERE siglas = 'MTY' LIMIT 1").get();
    const localId = toros ? toros.id : 1;
    const visitorId = sultanes ? sultanes.id : 2;

    const resPart = db.prepare(`
      INSERT INTO partidos (equipo_local_id, equipo_visitante_id, estado)
      VALUES (?, ?, 'en_vivo')
    `).run(localId, visitorId);

    const partidoId = resPart.lastInsertRowid;
    db.prepare(`
      INSERT INTO estado_partido (partido_id, inning, mitad, outs, bolas, strikes, base_1, base_2, base_3, runs_local, runs_visitante)
      VALUES (?, 1, 'alta', 0, 0, 0, 0, 0, 0, 0, 0)
    `).run(partidoId);
  }

}

initSchema();

module.exports = db;
module.exports.LMB_TEAMS_CATALOG = LMB_TEAMS_CATALOG;
