const TEAM_ALIASES = {
  // LMP (sportId=17, leagueId=132)
  673: { standing: 'Águilas', short: 'MEXICALI', full: 'Águilas de Mexicali' },
  674: { standing: 'Charros', short: 'JALISCO', full: 'Charros de Jalisco' },
  6483: { standing: 'Jaguares', short: 'NAYARIT', full: 'Jaguares de Nayarit' },
  675: { standing: 'Cañeros', short: 'LOS MOCHIS', full: 'Cañeros de Los Mochis' },
  676: { standing: 'Navojoa', short: 'NAVOJOA', full: 'Mayos de Navojoa' },
  677: { standing: 'Naranjeros', short: 'HERMOSILLO', full: 'Naranjeros de Hermosillo' },
  678: { standing: 'Tomateros', short: 'CULIACÁN', full: 'Tomateros de Culiacán' },
  679: { standing: 'Venados', short: 'MAZATLÁN', full: 'Venados de Mazatlán' },
  680: { standing: 'Yaquis', short: 'OBREGÓN', full: 'Yaquis de Obregón' },
  5482: { standing: 'Algodoneros', short: 'GUASAVE', full: 'Algodoneros de Guasave' },
  // LVBP (sportId=17, leagueId=135)
  692: { standing: 'ZULIA', short: 'ZULIA', full: 'Águilas del Zulia' },
  693: { standing: 'LARA', short: 'LARA', full: 'Cardenales de Lara' },
  694: { standing: 'CARIBES', short: 'ANZOÁTEGUI', full: 'Caribes de Anzoátegui' },
  695: { standing: 'CARACAS', short: 'CARACAS', full: 'Leones del Caracas' },
  696: { standing: 'MAGALLANES', short: 'MAGALLANES', full: 'Navegantes del Magallanes' },
  697: { standing: 'MARGARITA', short: 'MARGARITA', full: 'Bravos de Margarita' },
  698: { standing: 'LA GUAIRA', short: 'LA GUAIRA', full: 'Tiburones de La Guaira' },
  699: { standing: 'ARAGUA', short: 'ARAGUA', full: 'Tigres de Aragua' },
  // LMB (sportId=23, leagueId=125)
  5010: { standing: 'TIJUANA', short: 'TIJUANA', full: 'Toros de Tijuana' },
  562: { standing: 'MONTERREY', short: 'MONTERREY', full: 'Sultanes de Monterrey' },
  532: { standing: 'MÉXICO', short: 'MÉXICO', full: 'Diablos Rojos del México' },
  496: { standing: 'YUCATÁN', short: 'YUCATÁN', full: 'Leones de Yucatán' },
  560: { standing: 'MONCLOVA', short: 'MONCLOVA', full: 'Acereros de Monclova' },
  502: { standing: 'SALTILLO', short: 'SALTILLO', full: 'Saraperos de Saltillo' },
  447: { standing: 'LAGUNA', short: 'LAGUNA', full: 'Algodoneros Unión Laguna' },
  536: { standing: 'DOS LAREDOS', short: 'DOS LAREDOS', full: 'Tecos de los Dos Laredos' },
  6304: { standing: 'JALISCO', short: 'JALISCO', full: 'Charros de Jalisco' },
  528: { standing: 'AGUASCALIENTES', short: 'AGUASCALIENTES', full: 'Rieleros de Aguascalientes' },
  520: { standing: 'PUEBLA', short: 'PUEBLA', full: 'Pericos de Puebla' },
  523: { standing: 'CAMPECHE', short: 'CAMPECHE', full: 'Piratas de Campeche' },
  6303: { standing: 'QUERÉTARO', short: 'QUERÉTARO', full: 'Conspiradores de Querétaro' },
  434: { standing: 'LEÓN', short: 'LEÓN', full: 'Bravos de León' },
  569: { standing: 'QUINTANA ROO', short: 'QUINTANA ROO', full: 'Tigres de Quintana Roo' },
  442: { standing: 'TABASCO', short: 'TABASCO', full: 'Olmecas de Tabasco' },
  5567: { standing: 'VERACRUZ', short: 'VERACRUZ', full: 'El Águila de Veracruz' },
  575: { standing: 'CHIHUAHUA', short: 'CHIHUAHUA', full: 'Dorados de Chihuahua' },
  579: { standing: 'OAXACA', short: 'OAXACA', full: 'Guerreros de Oaxaca' },
  4444: { standing: 'DURANGO', short: 'DURANGO', full: 'Caliente de Durango' },
  // Traducciones comunes MLB
  108: { standing: 'ANGELINOS', short: 'ANGELINOS', full: 'Angelinos de Los Ángeles', abbr: 'LAA' },
  109: { standing: 'D-BACKS', short: 'ARIZONA', full: 'Diamondbacks de Arizona', abbr: 'AZ' },
  110: { standing: 'ORIOLES', short: 'BALTIMORE', full: 'Orioles de Baltimore', abbr: 'BAL' },
  111: { standing: 'MEDIAS ROJAS', short: 'MEDIAS ROJAS', full: 'Medias Rojas de Boston', abbr: 'BOS' },
  112: { standing: 'CACHORROS', short: 'CHICAGO', full: 'Cachorros de Chicago', abbr: 'CHC' },
  113: { standing: 'ROJOS', short: 'CINCINNATI', full: 'Rojos de Cincinnati', abbr: 'CIN' },
  114: { standing: 'GUARDIANES', short: 'CLEVELAND', full: 'Guardianes de Cleveland', abbr: 'CLE' },
  115: { standing: 'ROCKIES', short: 'COLORADO', full: 'Rockies de Colorado', abbr: 'COL' },
  116: { standing: 'TIGRES', short: 'DETROIT', full: 'Tigres de Detroit', abbr: 'DET' },
  117: { standing: 'ASTROS', short: 'HOUSTON', full: 'Astros de Houston', abbr: 'HOU' },
  118: { standing: 'REALES', short: 'KANSAS CITY', full: 'Reales de Kansas City', abbr: 'KC' },
  119: { standing: 'DODGERS', short: 'DODGERS', full: 'Dodgers de Los Ángeles', abbr: 'LAD' },
  120: { standing: 'NACIONALES', short: 'WASHINGTON', full: 'Nacionales de Washington', abbr: 'WSH' },
  121: { standing: 'METS', short: 'METS', full: 'Mets de Nueva York', abbr: 'NYM' },
  133: { standing: 'ATLÉTICOS', short: 'ATLÉTICOS', full: 'Atléticos', abbr: 'ATH' },
  134: { standing: 'PIRATAS', short: 'PITTSBURGH', full: 'Piratas de Pittsburgh', abbr: 'PIT' },
  135: { standing: 'PADRES', short: 'PADRES', full: 'Padres de San Diego', abbr: 'SD' },
  136: { standing: 'MARINEROS', short: 'SEATTLE', full: 'Marineros de Seattle', abbr: 'SEA' },
  137: { standing: 'GIGANTES', short: 'SAN FRANCISCO', full: 'Gigantes de San Francisco', abbr: 'SF' },
  138: { standing: 'CARDENALES', short: 'CARDENALES', full: 'Cardenales de San Luis', abbr: 'STL' },
  139: { standing: 'RAYS', short: 'RAYS', full: 'Rays de Tampa Bay', abbr: 'TB' },
  140: { standing: 'RANGERS', short: 'TEXAS', full: 'Rangers de Texas', abbr: 'TEX' },
  141: { standing: 'AZULEJOS', short: 'TORONTO', full: 'Azulejos de Toronto', abbr: 'TOR' },
  142: { standing: 'MELLIZOS', short: 'MINNESOTA', full: 'Mellizos de Minnesota', abbr: 'MIN' },
  143: { standing: 'FILIS', short: 'FILADELFIA', full: 'Filis de Filadelfia', abbr: 'PHI' },
  144: { standing: 'BRAVOS', short: 'ATLANTA', full: 'Bravos de Atlanta', abbr: 'ATL' },
  145: { standing: 'MEDIAS BLANCAS', short: 'MEDIAS BLANCAS', full: 'Medias Blancas de Chicago', abbr: 'CWS' },
  146: { standing: 'MARLINS', short: 'MIAMI', full: 'Marlins de Miami', abbr: 'MIA' },
  147: { standing: 'YANKEES', short: 'YANKEES', full: 'Yankees de Nueva York', abbr: 'NYY' },
  158: { standing: 'CERVECEROS', short: 'MILWAUKEE', full: 'Cerveceros de Milwaukee', abbr: 'MIL' }
};

const LMP_VUELTA_POINTS = ['10.0', '9.0', '8.0', '7.0', '6.0', '5.5', '5.0', '4.5', '4.0', '3.5'];

const SPANISH_WEEKDAYS = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
const SPANISH_MONTHS = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
];

const POSITION_ES_MAP = {
  RF: 'JD',
  LF: 'JI',
  CF: 'JC',
  OF: 'J',
  DH: 'BD',
  '1B': '1B',
  '2B': '2B',
  '3B': '3B',
  SS: 'SS',
  C: 'C',
  P: 'P',
  SP: 'PA',
  RP: 'PR',
  UT: 'UT',
  IF: 'CI'
};

function buildTitleHtml(leftText, rightText, fontSize = '70%') {
  return `<html><span style="font-size:${fontSize}">${leftText}<span style="color:#E10600; margin:0 40px">|</span>${rightText}</span></html>`;
}

function getTeamName(teamObj = {}, style = 'short') {
  const id = Number(teamObj.id);
  const alias = TEAM_ALIASES[id];
  if (alias && alias[style]) return alias[style];
  if (style === 'full') return teamObj.name || teamObj.teamName || `Equipo ${id || ''}`.trim();
  const fallback = teamObj.locationName || teamObj.teamName || teamObj.name || '';
  return style === 'standing' ? fallback : String(fallback).toUpperCase();
}

function resolveTeamLogo(teamId, assetsMap = {}) {
  if (teamId && assetsMap[`team_${teamId}`]) {
    return assetsMap[`team_${teamId}`];
  }
  if (teamId) {
    return `https://www.mlbstatic.com/team-logos/${teamId}.svg`;
  }
  return assetsMap.league_LMP || '';
}

function formatClockInZone(dateObj, timeZone) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(dateObj);
}

function formatGameTime(isoUtc, tzMode = 'BOTH') {
  if (!isoUtc) return '--:--';
  const d = new Date(isoUtc);
  if (Number.isNaN(d.getTime())) return '--:--';
  if (tzMode === 'America/Tijuana') {
    return formatClockInZone(d, 'America/Tijuana');
  }
  if (tzMode === 'America/Mexico_City') {
    return formatClockInZone(d, 'America/Mexico_City');
  }
  const tij = formatClockInZone(d, 'America/Tijuana');
  const cdmx = formatClockInZone(d, 'America/Mexico_City');
  return tij === cdmx ? `${tij} TIJ/CDMX` : `${tij} TIJ / ${cdmx} CDMX`;
}

function formatSpanishDateUpper(yyyyMmDd) {
  if (!yyyyMmDd) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(yyyyMmDd));
  if (!m) return String(yyyyMmDd).toUpperCase();
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const da = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo, da, 12, 0, 0));
  const wd = SPANISH_WEEKDAYS[dt.getUTCDay()];
  const mon = SPANISH_MONTHS[dt.getUTCMonth()];
  return `${wd} ${da} DE ${mon}`;
}

function formatDurationMinutes(mins) {
  const n = Number(mins);
  if (!Number.isFinite(n) || n <= 0) return '--';
  const h = Math.floor(n / 60);
  const rem = Math.round(n % 60);
  return `${h}:${String(rem).padStart(2, '0')}`;
}

function formatIntWithCommas(val) {
  const n = Number(val);
  if (!Number.isFinite(n)) return String(val || '0');
  return n.toLocaleString('en-US');
}

function formatRunDiff(val) {
  const n = Number(val || 0);
  return n > 0 ? `+${n}` : String(n);
}

function translatePositionEs(posAbbr) {
  const key = String(posAbbr || '').trim().toUpperCase();
  return POSITION_ES_MAP[key] || key || 'J';
}

function normalizeAvgLeadingZero(val) {
  if (val === undefined || val === null || val === '') return '0.000';
  const s = String(val).trim();
  if (s.startsWith('.')) return `0${s}`;
  return s;
}

function normalizeAvgDot(val) {
  if (val === undefined || val === null || val === '') return '.000';
  const s = String(val).trim();
  if (s.startsWith('0.')) return s.slice(1);
  return s;
}

// 1. mainComposition (-P4ykk26D5g-4HCNPfBb)
function buildMainPlayerPayload({
  player = {},
  stat = {},
  leagueName = 'LIGA MEXICANA DE BEISBOL',
  teamName,
  group = 'pitching',
  note = '',
  imageUrl,
  videoClip = '',
  bodymovinLoop = '',
  assetsMap = {}
} = {}) {
  const resolvedTeam = String(
    teamName || getTeamName(player.currentTeam || {}, 'full') || 'TOROS DE TIJUANA'
  ).toUpperCase();
  const isHitting = group === 'hitting';

  if (isHitting) {
    return {
      Title: player.fullName || player.name || 'Jugador',
      Name_League: leagueName,
      'Team Name': resolvedTeam,
      Relevos: 'JUEGOS:',
      Num_Relevos: String(stat.gamesPlayed ?? 0),
      Entradas: 'BATEO:',
      Num_Entradas: normalizeAvgLeadingZero(stat.avg),
      PCLAWHIP: 'OBP/OPS:',
      Num_PCLAWHIP: `${normalizeAvgDot(stat.obp)}/${normalizeAvgDot(stat.ops)}`,
      'Bateo Contra': 'JONRONES:',
      'Num_Bateo Contra': String(stat.homeRuns ?? 0),
      KBB: 'CP/CA:',
      Num_KBB: `${stat.rbi ?? 0}/${stat.runs ?? 0}`,
      HOLDS: 'BASES ROB:',
      Num_HOLDS: String(stat.stolenBases ?? 0),
      '*Juego con Cardenales de': note || '',
      Img_Roel_Ramirez: imageUrl || assetsMap.default_player_img || '',
      'Video Clip': videoClip,
      'Bodymovin Loop': bodymovinLoop
    };
  }

  return {
    Title: player.fullName || player.name || 'Roel Ramírez',
    Name_League: leagueName,
    'Team Name': resolvedTeam,
    Relevos: 'RELEVOS: ',
    Num_Relevos: String(stat.gamesPitched ?? stat.gamesPlayed ?? 0),
    Entradas: 'ENTRADAS:',
    Num_Entradas: String(stat.inningsPitched ?? '0.0'),
    PCLAWHIP: 'PCLA/WHIP:',
    Num_PCLAWHIP: `${stat.era ?? '0.00'}/${stat.whip ?? '0.00'}`,
    'Bateo Contra': 'BATEO CONTRA:',
    'Num_Bateo Contra': normalizeAvgLeadingZero(stat.avg),
    KBB: 'K/BB:',
    Num_KBB: `${stat.strikeOuts ?? 0}/${stat.baseOnBalls ?? 0}`,
    HOLDS: 'HOLDS:',
    Num_HOLDS: String(stat.holds ?? 0),
    '*Juego con Cardenales de': note || '',
    Img_Roel_Ramirez: imageUrl || assetsMap.default_player_img || '',
    'Video Clip': videoClip,
    'Bodymovin Loop': bodymovinLoop
  };
}

// 2. Overlay 1 (4813e7dc-fa3e-459b-ad65-34e477d63f76)
function buildOverlay1PlayerPayload({
  player = {},
  stat = {},
  leagueName = 'LIGA MEXICANA DE BEISBOL',
  teamName,
  group = 'pitching',
  note = '',
  imageUrl,
  assetsMap = {}
} = {}) {
  const playerName = player.fullName || player.name || 'Jugador';
  const resolvedTeam = teamName || getTeamName(player.currentTeam || {}, 'full') || 'Toros de Tijuana';
  const isHitting = group === 'hitting';

  const labels = isHitting
    ? 'Juegos\nAVG\nOBP / OPS\nJonrones\nCP / CA\nBases Robadas'
    : 'Relevos\nEntradas\nPCLA/WHIP\n Bateo contra\n K/BB\nHolds';

  const values = isHitting
    ? [
        stat.gamesPlayed ?? 0,
        normalizeAvgLeadingZero(stat.avg),
        `${normalizeAvgDot(stat.obp)}/${normalizeAvgDot(stat.ops)}`,
        stat.homeRuns ?? 0,
        `${stat.rbi ?? 0}/${stat.runs ?? 0}`,
        stat.stolenBases ?? 0
      ].join('\n')
    : [
        stat.gamesPitched ?? stat.gamesPlayed ?? 0,
        stat.inningsPitched ?? '0.0',
        `${stat.era ?? '0.00'}/${stat.whip ?? '0.00'}`,
        normalizeAvgLeadingZero(stat.avg),
        `${stat.strikeOuts ?? 0}/${stat.baseOnBalls ?? 0}`,
        stat.holds ?? 0
      ].join('\n');

  return {
    Titulo: buildTitleHtml(playerName, leagueName, '70%'),
    Equipo: resolvedTeam,
    Information_Right_Multiline: labels,
    Valores_Multilinea: values,
    'Line Inferior': note || '',
    Img_Roel_Ramirez: imageUrl || assetsMap.league_LMB || assetsMap.default_player_img || '',
    'Video Clip': assetsMap.video_clip_2 || ''
  };
}

// 3. Overlay 2 (03dbba3a-b283-47d6-acaf-db26975335e6) - Standing 10 equipos
function buildOverlay2Standing10Payload({
  standingsData = {},
  leagueCode = 'LMP',
  leagueName = 'LIGA MEXICANA DEL PACÍFICO',
  useHtmlTitle = true,
  divisionIndex = 0,
  assetsMap = {}
} = {}) {
  const records = Array.isArray(standingsData.records) ? standingsData.records : [];
  const chosen = records[divisionIndex] || records[0] || { teamRecords: [] };
  const teams = (chosen.teamRecords || []).slice(0, 10);

  const names = [];
  const wins = [];
  const losses = [];
  const pcts = [];
  const jvs = [];
  const pts = [];

  teams.forEach((tr, idx) => {
    names.push(getTeamName(tr.team, 'standing'));
    wins.push(String(tr.wins ?? 0));
    losses.push(String(tr.losses ?? 0));
    pcts.push(String(tr.winningPercentage || '.000'));
    const gb = tr.gamesBack === '-' || tr.gamesBack === '0' || !tr.gamesBack ? '--' : String(tr.gamesBack);
    jvs.push(gb);
    pts.push(LMP_VUELTA_POINTS[idx] || String(Math.max(1, 10 - idx)));
  });

  return {
    Titulo: useHtmlTitle
      ? buildTitleHtml(leagueName, 'STANDING', '70%')
      : `STANDING ${leagueName}`,
    Information_Right_Multiline: names.join('\n'),
    G: wins.join('\n'),
    P: losses.join('\n'),
    PCT: pcts.join('\n'),
    JV: jvs.join('\n'),
    PTS: pts.join('\n'),
    Img_Roel_Ramirez: assetsMap[`league_${leagueCode}`] || assetsMap.league_LMP || '',
    Image: assetsMap.bg_frame || '',
    'Video Clip': assetsMap.video_clip_1 || ''
  };
}

// 4. Overlay 3 (91dd5782-5e48-4472-8e1b-30fde02783d9) - Comparativa 2 columnas
function buildOverlay3Compare2ColsPayload({
  titleLeft = 'LMP Y LMB',
  titleRight = 'HITS CONECTADOS',
  leftRows = [],
  rightRows = [],
  imageUrl,
  assetsMap = {}
} = {}) {
  const l = leftRows.slice(0, 8);
  const r = rightRows.slice(0, 8);
  return {
    Titulo: buildTitleHtml(titleLeft, titleRight, '70%'),
    'Jugadores 1': l.map(x => String(x.name || '').toUpperCase()).join('\n'),
    'Hits 1': l.map(x => formatIntWithCommas(x.value ?? 0)).join('\n'),
    'Jugadores 2': r.map(x => String(x.name || '').toUpperCase()).join('\n'),
    'Hits 2': r.map(x => formatIntWithCommas(x.value ?? 0)).join('\n'),
    Img_Roel_Ramirez: imageUrl || assetsMap.league_LMB || '',
    Image: assetsMap.bg_frame || '',
    'Video Clip': assetsMap.video_clip_1 || ''
  };
}

// 5. Overlay 4 (c2622f06-b0d0-4816-ba9e-93e4ecfe95f3) - 4 Destacados Lomita u Ofensiva
function buildOverlay4StandoutsPayload({
  leagueCode = 'LMP',
  leagueName = 'LIGA MEXICANA DEL PACÍFICO',
  mode = 'pitching',
  players = [],
  assetsMap = {}
} = {}) {
  const isPitching = mode === 'pitching';
  const subtitle = isPitching ? 'DESTACADOS EN LA LOMITA' : 'DESTACADOS EN LA OFENSIVA';
  const payload = {
    Titulo: buildTitleHtml(leagueName, subtitle, '70%'),
    Img_Roel_Ramirez: assetsMap[`league_${leagueCode}`] || assetsMap.league_LMP || '',
    'Video Clip': assetsMap.video_clip_2 || ''
  };

  for (let i = 1; i <= 4; i++) {
    const item = players[i - 1];
    if (!item) {
      payload[`Jugador ${i}`] = '';
      payload[`Informacion ${i}`] = '';
      continue;
    }
    const stat = item.stat || {};
    const teamLabel = item.teamLabel || getTeamName(item.team || {}, 'short');
    const nameLabel = (item.player && item.player.fullName) || item.name || '';
    payload[`Jugador ${i}`] = teamLabel ? `${nameLabel} / ${teamLabel}` : nameLabel;

    if (item.infoOverride) {
      payload[`Informacion ${i}`] = item.infoOverride;
    } else if (isPitching) {
      const w = stat.wins ?? 0;
      const l = stat.losses ?? 0;
      const ip = stat.inningsPitched ?? '0.0';
      const er = stat.earnedRuns ?? 0;
      const h = stat.hits ?? 0;
      const bb = stat.baseOnBalls ?? 0;
      const so = stat.strikeOuts ?? 0;
      const era = stat.era ?? '0.00';
      payload[`Informacion ${i}`] = `JG (${w}-${l}); ${ip} INN; ${er} CL; ${h} H; ${bb} BB; ${so} K\nEFECTIVIDAD EN ${era}`;
    } else {
      const h = stat.hits ?? 0;
      const triples = stat.triples ?? 0;
      const doubles = stat.doubles ?? 0;
      const hr = stat.homeRuns ?? 0;
      const rbi = stat.rbi ?? 0;
      const runs = stat.runs ?? 0;
      const bb = stat.baseOnBalls ?? 0;
      const sb = stat.stolenBases ?? 0;
      const parts = [`${h} H`];
      if (hr) parts.push(`${hr} HR`);
      if (triples) parts.push(`${triples} 3B`);
      if (doubles) parts.push(`${doubles} DB`);
      parts.push(`${rbi} CP`, `${runs} CA`, `${bb} BB`);
      if (sb) parts.push(`${sb} BR`);
      const slash = `${normalizeAvgDot(stat.avg)}/${normalizeAvgDot(stat.obp)}/${normalizeAvgDot(stat.ops)}`;
      payload[`Informacion ${i}`] = `${parts.join('; ')}\n${slash}`;
    }
  }

  return payload;
}

// 6. Overlay 5 (83150026-00db-490d-b5f3-6cfdf7dd7452) - Playoffs 8 equipos Norte/Sur LMB
function buildOverlay5Playoffs8Payload({
  standingsData = {},
  leagueName = 'LIGA MEXICANA DE BEISBOL',
  subtitle = 'PLAYOFFS CON OCHO EQUIPOS',
  ranks = [7, 8],
  assetsMap = {}
} = {}) {
  const records = Array.isArray(standingsData.records) ? standingsData.records : [];
  const norteRec =
    records.find(r => r.division && (r.division.id === 222 || /Norte/i.test(r.division.name || ''))) ||
    records[0] ||
    { teamRecords: [] };
  const surRec =
    records.find(r => r.division && (r.division.id === 223 || /Sur/i.test(r.division.name || ''))) ||
    records[1] ||
    { teamRecords: [] };

  const pickByRanks = rec => {
    const trs = rec.teamRecords || [];
    return ranks.map(rankNum => {
      const found = trs.find(t => Number(t.divisionRank) === rankNum) || trs[rankNum - 1] || null;
      return { rankNum, rec: found };
    });
  };

  const nRows = pickByRanks(norteRec);
  const sRows = pickByRanks(surRec);
  const slots = [nRows[0], nRows[1], sRows[0], sRows[1]];

  const payload = {
    Titulo: buildTitleHtml(leagueName, subtitle, '70%'),
    'IMG VS': assetsMap.zona_norte || '',
    'IMG VS2': assetsMap.zona_sur || '',
    central: assetsMap.league_LMB || '',
    Image: assetsMap.bg_frame || '',
    'Video Clip': assetsMap.video_clip_1 || ''
  };

  slots.forEach((slot, idx) => {
    const num = idx + 1;
    if (!slot || !slot.rec) {
      payload[`Equipo ${num}`] = `${ranks[idx % 2] || num} --`;
      payload[`stats ${num}`] = '0-0  0.0  0';
      return;
    }
    const tr = slot.rec;
    const rank = tr.divisionRank || slot.rankNum;
    const shortName = getTeamName(tr.team, 'short');
    const gb = tr.divisionGamesBack && tr.divisionGamesBack !== '-' ? tr.divisionGamesBack : '0.0';
    const diff = formatRunDiff(tr.runDifferential);
    payload[`Equipo ${num}`] = `${rank} ${shortName}`;
    payload[`stats ${num}`] = `${tr.wins ?? 0}-${tr.losses ?? 0}  ${gb}  ${diff}`;
  });

  return payload;
}

// 7. Overlay 6 (14cffa3b-61f8-4592-9e3a-6ff1952133b1) - Standing 8 equipos con logos (LVBP)
function buildOverlay6Standing8LogosPayload({
  standingsData = {},
  leagueCode = 'LVBP',
  leagueName = 'LIGA VENEZOLANA DE BEISBOL PROFESIONAL',
  divisionIndex = 0,
  assetsMap = {}
} = {}) {
  const records = Array.isArray(standingsData.records) ? standingsData.records : [];
  const chosen = records[divisionIndex] || records[0] || { teamRecords: [] };
  const teams = (chosen.teamRecords || []).slice(0, 8);

  const payload = {
    Titulo: buildTitleHtml(leagueName, 'STANDING', '70%'),
    Equipos: teams.map(tr => getTeamName(tr.team, 'standing')).join('\n'),
    G: teams.map(tr => String(tr.wins ?? 0)).join('\n'),
    P: teams.map(tr => String(tr.losses ?? 0)).join('\n'),
    PCT: teams.map(tr => String(tr.winningPercentage || '.000')).join('\n'),
    JV: teams.map(tr => (tr.gamesBack === '-' || !tr.gamesBack ? '-' : String(tr.gamesBack))).join('\n'),
    Img_Central: assetsMap[`league_${leagueCode}`] || assetsMap.league_LVBP || '',
    Image: assetsMap.bg_frame || '',
    'Video Clip': assetsMap.video_clip_1 || ''
  };

  for (let i = 1; i <= 8; i++) {
    const tr = teams[i - 1];
    const logo = tr && tr.team ? resolveTeamLogo(tr.team.id, assetsMap) : '';
    // ¡CRÍTICO EN SINGULAR!: Img 1 con mayúscula, img 2..img 8 con minúscula
    if (i === 1) {
      payload['Img 1'] = logo;
    } else {
      payload[`img ${i}`] = logo;
    }
  }

  return payload;
}

// 8. Overlay 7 (4893753a-8655-49fb-9bf0-21a7e4858413) - Resultados de Ayer (4 juegos)
function isRainOrPostponed(game = {}) {
  const st = game.status || {};
  const detailed = String(st.detailedState || '');
  const reason = String(st.reason || '');
  return /Postponed|Suspended|Cancelled/i.test(detailed) || /Rain|Inclement/i.test(reason);
}

function buildOverlay7YesterdaySummaryPayload({
  games = [],
  leagueCode = 'LVBP',
  leagueName = 'LIGA VENEZOLANA DE BEISBOL PROFESIONAL',
  assetsMap = {}
} = {}) {
  const list = games.slice(0, 4);
  const payload = {
    Titulo: buildTitleHtml(leagueName, 'RESULTADOS DE AYER', '70%'),
    Img_Central: assetsMap[`league_${leagueCode}`] || assetsMap.league_LVBP || '',
    'Video Clip': assetsMap.video_clip_2 || ''
  };

  for (let i = 1; i <= 4; i++) {
    const g = list[i - 1];
    const vsKey = i === 1 ? 'VS1' : `VS ${i}`; // ¡CRÍTICO!: VS1 sin espacio, VS 2..4 con espacio
    const eAwayKey = `E${2 * i - 1}`;
    const eHomeKey = `E${2 * i}`;
    const mAwayKey = `M${2 * i - 1}`;
    const mHomeKey = `M${2 * i}`;
    const imgAwayKey = `img${2 * i - 1}`;
    const imgHomeKey = `img${2 * i}`;

    if (!g) {
      payload[eAwayKey] = '';
      payload[eHomeKey] = '';
      payload[mAwayKey] = '';
      payload[mHomeKey] = '';
      payload[vsKey] = '';
      payload[imgAwayKey] = '';
      payload[imgHomeKey] = '';
      continue;
    }

    const awayTeam = (g.teams && g.teams.away && g.teams.away.team) || {};
    const homeTeam = (g.teams && g.teams.home && g.teams.home.team) || {};
    payload[eAwayKey] = getTeamName(awayTeam, 'short');
    payload[eHomeKey] = getTeamName(homeTeam, 'short');
    payload[imgAwayKey] = resolveTeamLogo(awayTeam.id, assetsMap);
    payload[imgHomeKey] = resolveTeamLogo(homeTeam.id, assetsMap);

    if (isRainOrPostponed(g)) {
      payload[vsKey] = 'LLUVIA';
      payload[mAwayKey] = '';
      payload[mHomeKey] = '';
    } else {
      const awayScore = g.teams?.away?.score ?? g.linescore?.teams?.away?.runs ?? 0;
      const homeScore = g.teams?.home?.score ?? g.linescore?.teams?.home?.runs ?? 0;
      payload[vsKey] = 'VS';
      payload[mAwayKey] = String(awayScore);
      payload[mHomeKey] = String(homeScore);
    }
  }

  return payload;
}

// 9. Overlay 8 (860c9efd-c125-4ad7-b9e8-94a88981467d) - Resultado de Ayer Detallado (1 partido)
function extractTopBatters(sideBox = {}, grandSlamBatterIds = new Set(), maxPlayers = 3) {
  const playersMap = sideBox.players || {};
  const list = Object.values(playersMap)
    .map(p => {
      const bat = p.stats && p.stats.batting ? p.stats.batting : null;
      if (!bat) return null;
      const ab = Number(bat.atBats || 0);
      const h = Number(bat.hits || 0);
      const rbi = Number(bat.rbi || 0);
      const hr = Number(bat.homeRuns || 0);
      const r = Number(bat.runs || 0);
      const doubles = Number(bat.doubles || 0);
      const triples = Number(bat.triples || 0);
      const bb = Number(bat.baseOnBalls || 0);
      if (ab === 0 && h === 0 && bb === 0 && r === 0 && rbi === 0) return null;
      const isGs = grandSlamBatterIds.has(Number(p.person && p.person.id));
      const score = rbi * 4 + hr * 5 + triples * 3 + doubles * 2 + h * 2 + r + bb * 0.5 + (isGs ? 10 : 0);
      return { p, bat, ab, h, rbi, hr, r, doubles, triples, bb, isGs, score };
    })
    .filter(Boolean)
    .filter(x => x.h > 0 || x.rbi > 0 || x.r > 0 || x.bb > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxPlayers);

  return list
    .map(x => {
      const name = String((x.p.person && x.p.person.fullName) || '').toUpperCase();
      const parts = [`${x.ab}-${x.h}`]; // Notación mexicana: TB-H
      if (x.isGs) {
        parts.push('GRAND SLAM');
      } else {
        if (x.hr) parts.push(`${x.hr} HR`);
        if (x.triples) parts.push(`${x.triples} 3B`);
        if (x.doubles) parts.push(`${x.doubles} DB`);
      }
      if (x.r) parts.push(`${x.r} CA`);
      if (x.rbi) parts.push(`${x.rbi} ${x.rbi > 1 ? 'CPS' : 'CP'}`);
      if (x.bb && !x.rbi && !x.hr) parts.push(`${x.bb} BB`);
      return `${name}\n(${parts.join(', ')})`;
    })
    .join('\n');
}

function formatPitcherDecisionLine(personObj, boxTeams = {}, mode = 'wl') {
  if (!personObj || !personObj.id) return null;
  const key = `ID${personObj.id}`;
  const pData = (boxTeams.away && boxTeams.away.players && boxTeams.away.players[key]) ||
                (boxTeams.home && boxTeams.home.players && boxTeams.home.players[key]) || {};
  const pitch = pData.seasonStats?.pitching || pData.stats?.pitching || {};
  const parts = String(personObj.fullName || '').trim().split(/\s+/);
  const shortName = parts.length > 1
    ? `${parts[0][0]}. ${parts.slice(1).join(' ')}`.toUpperCase()
    : String(personObj.fullName || '').toUpperCase();
  if (mode === 'sv') {
    const sv = pitch.saves ?? 1;
    return `- ${shortName} (${sv})`;
  }
  return `- ${shortName} (${pitch.wins ?? 0}-${pitch.losses ?? 0})`;
}

function buildOverlay8GameDetailPayload({
  feed = {},
  leagueCode = 'LMP',
  leagueName = 'LIGA MEXICANA DEL PACÍFICO',
  photoUrl,
  assetsMap = {}
} = {}) {
  const gameData = feed.gameData || {};
  const liveData = feed.liveData || {};
  const linescore = liveData.linescore || feed.linescore || {};
  const boxscore = liveData.boxscore || feed.boxscore || {};
  const decisions = liveData.decisions || feed.decisions || {};
  const plays = (liveData.plays && liveData.plays.allPlays) || (feed.playByPlay && feed.playByPlay.allPlays) || [];

  const grandSlamBatters = new Set();
  for (const pl of plays) {
    const res = pl.result || {};
    if ((res.eventType === 'home_run' || res.event === 'Home Run') && Number(res.rbi) === 4) {
      const bId = pl.matchup && pl.matchup.batter && pl.matchup.batter.id;
      if (bId) grandSlamBatters.add(Number(bId));
    }
  }

  const awayTeam = gameData.teams?.away || boxscore.teams?.away?.team || {};
  const homeTeam = gameData.teams?.home || boxscore.teams?.home?.team || {};

  const labels = ['PG', 'PD'];
  const decLines = [
    formatPitcherDecisionLine(decisions.winner, boxscore.teams, 'wl') || '- --',
    formatPitcherDecisionLine(decisions.loser, boxscore.teams, 'wl') || '- --'
  ];
  if (decisions.save && decisions.save.id) {
    labels.push('SV');
    decLines.push(formatPitcherDecisionLine(decisions.save, boxscore.teams, 'sv'));
  }

  let venueName = (gameData.venue && gameData.venue.name) || 'Estadio';
  let attendance = gameData.gameInfo?.attendance;
  let durationMins = gameData.gameInfo?.gameDurationMinutes;

  // Fallback desde boxscore.info si gameInfo vino vacío
  if ((!attendance || !durationMins) && Array.isArray(boxscore.info)) {
    for (const item of boxscore.info) {
      if (!attendance && /^Att$/i.test(item.label)) attendance = String(item.value || '').replace(/[^\d]/g, '');
      if (!durationMins && /^T$/i.test(item.label)) durationMins = item.value;
    }
  }

  const attStr = attendance ? formatIntWithCommas(Number(attendance)) : '--';
  const durStr = typeof durationMins === 'string' && durationMins.includes(':')
    ? durationMins
    : formatDurationMinutes(durationMins);

  return {
    Titulo: buildTitleHtml(leagueName, 'RESULTADO DE AYER', '70%'),
    'Equipo 1': getTeamName(awayTeam, 'short'),
    'Equipo 2': getTeamName(homeTeam, 'short'),
    'ImgEquipo 1': resolveTeamLogo(awayTeam.id, assetsMap),
    'ImgEquipo 2': resolveTeamLogo(homeTeam.id, assetsMap),
    Marcador1: String(linescore.teams?.away?.runs ?? boxscore.teams?.away?.teamStats?.batting?.runs ?? 0),
    Marcador2: String(linescore.teams?.home?.runs ?? boxscore.teams?.home?.teamStats?.batting?.runs ?? 0),
    'PG-PD': labels.join('\n'),
    jugadores: decLines.join('\n'),
    // ¡TYPOS REALES DE SINGULAR!: Description izquierda (EN/ES) y Descipcion derecha (sin r)
    'Description izquierda': extractTopBatters(boxscore.teams?.away, grandSlamBatters, 3),
    'Descipcion derecha': extractTopBatters(boxscore.teams?.home, grandSlamBatters, 3),
    estadio: `ESTADIO- ${String(venueName).toUpperCase()}  A- ${attStr}  D- ${durStr}`,
    Img_Central: photoUrl || assetsMap[`league_${leagueCode}`] || assetsMap.default_player_img || '',
    Image: assetsMap.bg_frame || '',
    'Video Clip': assetsMap.video_clip_1 || ''
  };
}

// 10. Overlay 9 (e4bf7b3e-6d7f-46f8-bf6a-da3b02d7c297) - Juegos Para Hoy (5 juegos)
function buildOverlay9GamesTodayPayload({
  games = [],
  dateStr = '',
  leagueCode = 'LMP',
  leagueName = 'LIGA MEXICANA DEL PACÍFICO',
  tzMode = 'BOTH',
  assetsMap = {}
} = {}) {
  const list = games.slice(0, 5);
  const payload = {
    Titulo: buildTitleHtml(leagueName, 'JUEGOS PARA HOY', '70%'),
    Fecha: formatSpanishDateUpper(dateStr || list[0]?.officialDate || new Date().toISOString().slice(0, 10)),
    Img_Roel_Ramirez: assetsMap[`league_${leagueCode}`] || assetsMap.league_LMP || '',
    'Video Clip': assetsMap.video_clip_2 || ''
  };

  for (let i = 1; i <= 5; i++) {
    const g = list[i - 1];
    const imgAwayKey = `img${2 * i - 1}`;
    const imgHomeKey = `img${2 * i}`;
    if (!g) {
      payload[`Enfrentamiento${i}`] = '';
      payload[`Hora${i}`] = '';
      payload[imgAwayKey] = '';
      payload[imgHomeKey] = '';
      continue;
    }
    const away = g.teams?.away?.team || {};
    const home = g.teams?.home?.team || {};
    payload[`Enfrentamiento${i}`] = `${getTeamName(away, 'short')} EN ${getTeamName(home, 'short')}`;
    payload[`Hora${i}`] = formatGameTime(g.gameDate, tzMode);
    payload[imgAwayKey] = resolveTeamLogo(away.id, assetsMap);
    payload[imgHomeKey] = resolveTeamLogo(home.id, assetsMap);
  }

  return payload;
}

// 11. Overlay 10 (9454e7b4-3f34-465f-a80b-331b47a0e75b) - 3 Nominados / Premios
function buildOverlay10Awards3CardsPayload({
  leagueName = 'GRANDES LIGAS',
  awardTitle = 'MANEJADOR DEL AÑO LIGA AMERICANA',
  cards = [],
  assetsMap = {}
} = {}) {
  const c1 = cards[0] || {};
  const c2 = cards[1] || {};
  const c3 = cards[2] || {};

  const formatCardTitle = c => {
    if (c.titleLine) return c.titleLine;
    const n = String(c.name || '').toUpperCase();
    const t = String(c.teamRecord || '').toUpperCase();
    return t ? `${n}\n${t}` : n;
  };

  return {
    Titulo: buildTitleHtml(leagueName, awardTitle, '70%'),
    'Nombre 1': formatCardTitle(c1),
    'Nombre 2': formatCardTitle(c2),
    'Nombre 3': formatCardTitle(c3),
    'Descripcion 1': c1.notes || '',
    'Descripcion 2': c2.notes || '',
    // ¡TYPO REAL DE SINGULAR!: Description 3 en inglés
    'Description 3': c3.notes || '',
    // ¡ASIMETRÍA REAL DE SINGULAR!: Image 1, Imagen2, Imagen 3
    'Image 1': c1.imageUrl || assetsMap.default_player_img || '',
    Imagen2: c2.imageUrl || assetsMap.default_player_img || '',
    'Imagen 3': c3.imageUrl || assetsMap.default_player_img || '',
    Cuadro_Background: assetsMap.bg_frame || '',
    'Video Clip': assetsMap.video_clip_1 || ''
  };
}

// 12. Overlay 11 (-P3dvERXV-J_I-B_Rb8Z) - Lista 2 columnas
function buildOverlay11List2ColsPayload({
  titleLeft = 'BEISBOL SIN FRONTERAS',
  titleRight = 'CUMPLEAÑOS DE HOY',
  rows = [],
  imageUrl,
  assetsMap = {}
} = {}) {
  return {
    Titulo: buildTitleHtml(titleLeft, titleRight, '90%'),
    Nombres: rows.map(r => String(r.name || '')).join('\n'),
    Valores: rows.map(r => String(r.value ?? '')).join('\n'),
    Img: imageUrl || assetsMap.league_LMB || '',
    'Video Clip': assetsMap.video_clip_2 || ''
  };
}

// 13. Overlay 12 (d763377f-0d18-4341-bbeb-85623843adb3) - Lista 2 cols encabezados editables
function buildOverlay12List2ColsHeadersPayload({
  titleLeft = 'BEISBOL SIN FRONTERAS',
  titleRight = 'CUMPLEAÑOS DE HOY',
  col1Header = 'Nombre',
  col2Header = 'Año',
  rows = [],
  imageUrl,
  assetsMap = {}
} = {}) {
  return {
    Titulo: buildTitleHtml(titleLeft, titleRight, '90%'),
    Nombre: col1Header,
    'Año': col2Header,
    Nombres: rows.map(r => String(r.name || '')).join('\n'),
    Valores: rows.map(r => String(r.value ?? '')).join('\n'),
    Img_Roel_Ramirez: imageUrl || assetsMap.league_LMB || '',
    'Video Clip': assetsMap.video_clip_2 || ''
  };
}

function abbreviateLongName(name, maxLen = 16) {
  const trimmed = String(name || '').trim();
  if (!trimmed || trimmed.length <= maxLen) return trimmed;
  const parts = trimmed.split(/\s+/);
  if (parts.length < 2) return trimmed;
  const shortened = `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
  return shortened.length <= trimmed.length ? shortened : trimmed;
}

// 14 & 16. Overlay 13 (3cb5a265-3ae3-4f54-94a8-ce449221a307) & Overlay 15 (3737a449-6392-4a24-900e-04ed694e7e95)
function buildOverlay13Or15VeteransPayload({
  leagueCode = 'LMP',
  leagueName = 'Liga Mexicana del Pacífico',
  subtitle = 'Los más veteranos',
  rows = [],
  abbreviateLongNames = true,
  imageUrl,
  assetsMap = {}
} = {}) {
  const list = rows.slice(0, 10);
  return {
    Titulo: buildTitleHtml(leagueName, subtitle, '70%'),
    'Jugadores 1': list.map(r => abbreviateLongNames ? abbreviateLongName(r.name) : String(r.name || '')).join('\n'),
    Equipos: list.map(r => String(r.team || '')).join('\n'),
    Edad: list.map(r => String(r.age ?? '')).join('\n'),
    Img_Roel_Ramirez: imageUrl || assetsMap[`league_${leagueCode}`] || assetsMap.league_LMB || '',
    Image: assetsMap.bg_frame || '',
    'Video Clip': assetsMap.video_clip_1 || ''
  };
}

// 15. Overlay 14 (3d2e3237-34d8-416a-a31f-fe9bd01eb8d2) - Tabla 4 cols Premios históricos
function buildOverlay14AwardsTable4ColsPayload({
  titleLeft = 'GRANDES LIGAS',
  titleRight = 'GANADORES GUANTE DE ORO',
  rows = [],
  imageUrl,
  assetsMap = {}
} = {}) {
  const list = rows.slice(0, 11);
  return {
    Titulo: buildTitleHtml(titleLeft, titleRight, '70%'),
    'Año': list.map(r => String(r.season || '')).join('\n'),
    'Jugadores 1': list.map(r => String(r.player || '').toUpperCase()).join('\n'),
    Posiciones: list.map(r => translatePositionEs(r.position)).join('\n'),
    Equipo: list.map(r => String(r.team || '').toUpperCase()).join('\n'),
    Img_Roel_Ramirez: imageUrl || assetsMap.league_MLB || '',
    Image: assetsMap.bg_frame || '',
    'Video Clip': assetsMap.video_clip_2 || ''
  };
}

// 17. Overlay 16 (17ada1c3-d5ba-434e-84a5-79178a4f03ea) - Tabla 4 cols flexible
function buildOverlay16Table4ColsPayload({
  leagueCode = 'LMP',
  leagueName = 'Liga Mexicana del Pacífico',
  subtitle = 'Los más veteranos',
  rows = [],
  abbreviateLongNames = true,
  imageUrl,
  assetsMap = {}
} = {}) {
  const list = rows.slice(0, 10);
  return {
    Titulo: buildTitleHtml(leagueName, subtitle, '70%'),
    'DATOS 1': list.map(r => abbreviateLongNames ? abbreviateLongName(r.col1) : String(r.col1 || '')).join('\n'),
    'DATOS 2': list.map(r => String(r.col2 || '')).join('\n'),
    Equipos: list.map(r => String(r.team || '')).join('\n'),
    Edad: list.map(r => String(r.age ?? '')).join('\n'),
    Img_Roel_Ramirez: imageUrl || assetsMap[`league_${leagueCode}`] || assetsMap.league_LMB || '',
    Image: assetsMap.bg_frame || '',
    'Video Clip': assetsMap.video_clip_1 || ''
  };
}

// 18. LOWER_THIRD (a8a5b908-3129-4e5a-889f-b027282797b0)
// Omitir Video Clip porque en Singular es tipo "button"
function buildLowerThirdPayload({ line1 = '', line2 = '' } = {}) {
  return {
    '1_LINE': String(line1),
    '2_LINE': String(line2)
  };
}

// 19. LOWER_THIRD MEDIO (0bf6655e-660b-40ba-a529-f171b300df8f)
// Omitir Video Clip porque en Singular es tipo "button"
function buildLowerThirdMedioPayload({ nameIzq = '', cargoIzq = '', nameDer = '', cargoDer = '' } = {}) {
  return {
    'NAME IZQ': String(nameIzq),
    'CARGO IZQ': String(cargoIzq),
    'NAME DER': String(nameDer),
    'CARGO DER': String(cargoDer)
  };
}

module.exports = {
  TEAM_ALIASES,
  LMP_VUELTA_POINTS,
  buildTitleHtml,
  getTeamName,
  resolveTeamLogo,
  formatGameTime,
  formatSpanishDateUpper,
  formatDurationMinutes,
  formatIntWithCommas,
  translatePositionEs,
  isRainOrPostponed,
  abbreviateLongName,
  buildMainPlayerPayload,
  buildOverlay1PlayerPayload,
  buildOverlay2Standing10Payload,
  buildOverlay3Compare2ColsPayload,
  buildOverlay4StandoutsPayload,
  buildOverlay5Playoffs8Payload,
  buildOverlay6Standing8LogosPayload,
  buildOverlay7YesterdaySummaryPayload,
  buildOverlay8GameDetailPayload,
  buildOverlay9GamesTodayPayload,
  buildOverlay10Awards3CardsPayload,
  buildOverlay11List2ColsPayload,
  buildOverlay12List2ColsHeadersPayload,
  buildOverlay13Or15VeteransPayload,
  buildOverlay14AwardsTable4ColsPayload,
  buildOverlay16Table4ColsPayload,
  buildLowerThirdPayload,
  buildLowerThirdMedioPayload
};
