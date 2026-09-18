const path = require('path');
const fs = require('fs');
const config = require('../config');

// Helper para convertir rutas locales de assets (/assets/...) a Data URLs (base64)
// Esto permite que Singular.Live (en la nube) renderice imágenes subidas localmente sin requerir hosting público
function resolveAssetToDataUrl(assetUrl) {
  if (!assetUrl) return '';
  const trimmed = String(assetUrl).trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  try {
    const cleanPath = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
    const localFilePath = path.resolve(__dirname, '../../public', cleanPath);
    if (fs.existsSync(localFilePath)) {
      const ext = path.extname(localFilePath).toLowerCase();
      let mimeType = 'image/png';
      if (ext === '.webp') mimeType = 'image/webp';
      else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
      else if (ext === '.svg') mimeType = 'image/svg+xml';
      else if (ext === '.gif') mimeType = 'image/gif';

      const buf = fs.readFileSync(localFilePath);
      return `data:${mimeType};base64,${buf.toString('base64')}`;
    } else {
      console.warn('[resolveAssetToDataUrl] Archivo local no encontrado en disco:', localFilePath);
    }
  } catch (err) {
    console.error('[resolveAssetToDataUrl] Error al leer archivo local:', err.message);
  }
  return assetUrl;
}

// Helper para convertir HEX a RGBA
function hexToRgba(hex) {
  let clean = (hex || '#C4122F').replace('#', '');
  if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
    a: 1
  };
}

// Genera la estructura completa requerida por Singular.Live para colores sólidos
function hexToSingularColor(hex) {
  const rgba = hexToRgba(hex);
  const cleanHex = hex.startsWith('#') ? hex : '#' + hex;
  return {
    type: "solid",
    solidColor: rgba,
    angle: 0,
    centerX: 50,
    centerY: 50,
    focalAngle: 0,
    focalDistance: 0,
    keepAspect: false,
    offset: 0,
    radius: 50,
    scale: 100,
    spreadMethod: "pad",
    stops: [
      { color: cleanHex, offset: 0, opacity: 1 },
      { color: cleanHex, offset: 0.5, opacity: 1 },
      { color: cleanHex, offset: 1, opacity: 1 }
    ]
  };
}

// Formato exacto de Outs con pluralización requerida por el template
function formatOuts(n) {
  const count = Math.max(0, Math.min(3, parseInt(n, 10) || 0));
  return `${count} OUT${count === 1 ? '' : 'S'}`;
}

// Formato combinado de bolas y strikes: "B-S"
function formatCount(balls, strikes) {
  const b = Math.max(0, Math.min(4, parseInt(balls, 10) || 0));
  const s = Math.max(0, Math.min(3, parseInt(strikes, 10) || 0));
  return `${b}-${s}`;
}

// Sincronización estricta de mitad de inning mutuamente excluyente
function formatInningHalf(mitad) {
  const isTop = (mitad || 'alta').toLowerCase() === 'alta' || (mitad || '').toLowerCase() === 'top';
  return {
    topInning: isTop,
    bottomInning: !isTop
  };
}

// Cola de ejecución asíncrona en serie (FIFO) para peticiones hacia Singular.Live
class SingularQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.lastLatencyMs = 0;
    this.lastStatus = 'idle'; // 'idle' | 'in_sync' | 'error'
    this.lastError = null;
  }

  enqueue(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.processNext();
    });
  }

  async processNext() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;
    const { task, resolve, reject } = this.queue.shift();

    const start = Date.now();
    try {
      const result = await task();
      this.lastLatencyMs = Date.now() - start;
      this.lastStatus = 'in_sync';
      this.lastError = null;
      resolve(result);
    } catch (err) {
      this.lastLatencyMs = Date.now() - start;
      this.lastStatus = 'error';
      this.lastError = err.message;
      console.error('[Singular Queue Error]:', err.message);
      reject(err);
    } finally {
      this.isProcessing = false;
      this.processNext();
    }
  }
}

const queue = new SingularQueue();

// Cliente REST hacia la API de Singular.Live
async function patchSingular(appToken, subCompositionId, payload, state = null) {
  const token = appToken || config.SINGULAR_APP_TOKEN;
  const url = `${config.SINGULAR_API_BASE}/${token}/control`;

  const item = {
    subCompositionId,
    payload
  };
  if (state) {
    item.state = state;
  }

  const body = JSON.stringify([item]);

  return queue.enqueue(async () => {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Singular API error (${response.status}): ${text}`);
    }

    return await response.json().catch(() => ({ ok: true }));
  });
}

// =========================================================
// BUILDERS CON LOS NOMBRES EXACTOS DE PARÁMETRO DE SINGULAR
// =========================================================

// 1. Score Bug - Baseball
function buildScoreBugPayload(gameState, localTeam, visitorTeam) {
  const half = formatInningHalf(gameState.mitad);
  return {
    "team1Name": localTeam.siglas || 'TIJ',
    "team1Color": hexToSingularColor(localTeam.color_primario || '#C4122F'),
    "team1Runs": String(gameState.runs_local || 0),
    "team2Name": visitorTeam.siglas || 'VIS',
    "team2Color": hexToSingularColor(visitorTeam.color_primario || '#0C2340'),
    "team2Runs": String(gameState.runs_visitante || 0),
    "inning": String(gameState.inning || 1),
    "topInning": half.topInning,
    "bottomInning": half.bottomInning,
    "1stBase": Boolean(gameState.base_1),
    "2ndBase": Boolean(gameState.base_2),
    "3rdBase": Boolean(gameState.base_3),
    "strikes": formatCount(gameState.bolas, gameState.strikes),
    "outs": formatOuts(gameState.outs)
  };
}

// 2. Fullscreen - Matchup
function buildFullscreenMatchupPayload(localTeam, visitorTeam, subtitle = 'TEMPORADA REGULAR', dropline = '#ToroPower') {
  return {
    "title": "PRÓXIMO PARTIDO",
    "subtitle": subtitle,
    "dropline": dropline,
    "logo1": resolveAssetToDataUrl(localTeam.logo_url),
    "logo1Size": "100",
    "team1Color": hexToSingularColor(localTeam.color_primario || '#C4122F'),
    "team1Name": localTeam.nombre || 'TOROS DE TIJUANA',
    "logo2": resolveAssetToDataUrl(visitorTeam.logo_url),
    "logo2Size": "100",
    "team2Color": hexToSingularColor(visitorTeam.color_primario || '#0C2340'),
    "team2Name": visitorTeam.nombre || 'EQUIPO RIVAL'
  };
}

// 3. Lower - Matchup
function buildLowerMatchupPayload(localTeam, visitorTeam, dropline = 'LIGA MEXICANA DE BÉISBOL') {
  return {
    "logo1": resolveAssetToDataUrl(localTeam.logo_url),
    "team1Color": hexToSingularColor(localTeam.color_primario || '#C4122F'),
    "team1Name": localTeam.nombre || 'TOROS DE TIJUANA',
    "logo2": resolveAssetToDataUrl(visitorTeam.logo_url),
    "team2Color": hexToSingularColor(visitorTeam.color_primario || '#0C2340'),
    "team2Name": visitorTeam.nombre || 'EQUIPO RIVAL',
    "dropline": dropline
  };
}

// 4. Panel - Team Lineups
function buildLineupPayload(team, players, subtitle = 'Lineup Titular') {
  const teamTitle = (team.nombre || 'TOROS DE TIJUANA').toUpperCase();
  const payload = {
    "Title": teamTitle,
    "title": teamTitle,
    "Subtitle": subtitle,
    "subtitle": subtitle,
    "Logo 1": resolveAssetToDataUrl(team.logo_url),
    "logo1": resolveAssetToDataUrl(team.logo_url),
    "Team Color": hexToSingularColor(team.color_primario || '#C4122F'),
    "teamColor": hexToSingularColor(team.color_primario || '#C4122F'),
    "rows": "11"
  };

  for (let i = 1; i <= 11; i++) {
    const p = players[i - 1];
    if (p && p.nombre) {
      const numStr = String(p.numero !== undefined ? p.numero : i).padStart(2, '0');
      payload[`lineupsTable_r${i}`] = `${numStr}, ${p.nombre}`;
    } else {
      payload[`lineupsTable_r${i}`] = "";
    }
  }

  return payload;
}

// 5. Lower - Team or Player Bio
function buildPlayerBioPayload(player, team, customText = null, customTitle = null) {
  const textContent = customText || player.bio_texto || `${player.posicion || 'Jugador'}\n${team.nombre || 'Toros de Tijuana'}`;
  const titleContent = customTitle || `${(player.nombre || 'JUGADOR').toUpperCase()} — #${player.numero !== undefined ? player.numero : 0}`;
  const resolvedHeadshot = '';
  const resolvedTeamLogo = resolveAssetToDataUrl(team.logo_url);
  return {
    "Title": titleContent,
    "title": titleContent,
    "Logo 1": resolvedTeamLogo,
    "logo1": resolvedTeamLogo,
    "Logo 1 Position X": -12,
    "logo1PositionX": -12,
    "Team Color": hexToSingularColor(team.color_primario || '#C4122F'),
    "teamColor": hexToSingularColor(team.color_primario || '#C4122F'),
    "Headshot Active": Boolean(resolvedHeadshot),
    "headshotActive": Boolean(resolvedHeadshot),
    "Player Headshot": resolvedHeadshot,
    "playerHeadshot": resolvedHeadshot,
    "Text": textContent,
    "text": textContent
  };
}

// 6. Fullscreen - Comparison Stats
function buildComparisonStatsPayload(localTeam, visitorTeam, stats = [], subtitle = 'Comparativa de Temporada', options = {}) {
  const numRows = Math.min(5, Math.max(1, stats.length || 3));
  const payload = {
    "Team 1 Name": (localTeam && localTeam.nombre) || 'TOROS DE TIJUANA',
    "Score 1": String((options && options.score1) || (localTeam && localTeam.score) || '00'),
    "Indicator": (options && options.indicator) || "-",
    "Score 2": String((options && options.score2) || (visitorTeam && visitorTeam.score) || '00'),
    "Team 2 Name": (visitorTeam && visitorTeam.nombre) || 'EQUIPO RIVAL',
    "Subtitle": subtitle || 'Comparativa de Temporada',
    "Logo 1": resolveAssetToDataUrl((localTeam && localTeam.logo_url) || ''),
    "Logo 1 Size": "100",
    "Team 1 Color": hexToSingularColor((localTeam && localTeam.color_primario) || '#C4122F'),
    "Logo 2": resolveAssetToDataUrl((visitorTeam && visitorTeam.logo_url) || ''),
    "Logo 2 Size": "100",
    "Team 2 Color": hexToSingularColor((visitorTeam && visitorTeam.color_primario) || '#0C2340'),
    "Number of Rows": String(numRows),
    "Dropline": (options && options.dropline) || "Estadísticas Oficiales LMB"
  };

  for (let i = 1; i <= numRows; i++) {
    const s = stats[i - 1] || { v1: '0', cat: `Métrica ${i}`, v2: '0' };
    payload[`statTable_r${i}`] = `${s.v1}, ${s.cat}, ${s.v2}`;
  }

  return payload;
}

// 7. Background Image
function buildBackgroundImagePayload(imageUrl) {
  return {
    "backgroundImage": resolveAssetToDataUrl(imageUrl || '')
  };
}

// 8. Baseline - Static
function buildBaselineStaticPayload(text = '') {
  return {
    "baselineText": String(text || '')
  };
}

// 9. Freeform Image
function buildFreeformImagePayload(options = {}) {
  const { image = '', positionX = 40, positionY = 40, size = 15, transparency = 100 } = options;
  return {
    "image": resolveAssetToDataUrl(image || ''),
    "positionX": String(positionX),
    "positionY": String(positionY),
    "size": String(size),
    "transparency": String(transparency)
  };
}

// 10. Freeform Text
function buildFreeformTextPayload(options = {}) {
  const { text = '', positionX = 40, positionY = 35, size = 40, transparency = 100 } = options;
  return {
    "text": String(text),
    "positionX": String(positionX),
    "positionY": String(positionY),
    "size": String(size),
    "transparency": String(transparency),
    "tranpsarency": String(transparency) // Plantilla original incluye esta clave con typo
  };
}

// 11. Lower - 1 Line
function buildLower1LinePayload(text = '') {
  return {
    "text": String(text || '')
  };
}

// 12. Lower - 2 Line
function buildLower2LinePayload(line1 = '', line2 = '') {
  return {
    "Line 1 Text": String(line1 || ''),
    "Line 2 Text": String(line2 || ''),
    "line1Text": String(line1 || ''),
    "line2Text": String(line2 || '')
  };
}

// 13. Upper Right - 1 Line
function buildUpperRight1LinePayload(text = '') {
  return {
    "text": String(text || '')
  };
}

// 14. Upper Right - 2 Line
function buildUpperRight2LinePayload(line1 = '', line2 = '') {
  return {
    "Line 1 Text": String(line1 || ''),
    "Line 2 Text": String(line2 || ''),
    "line1Text": String(line1 || ''),
    "line2Text": String(line2 || '')
  };
}

// 15. Upper Right - Social Media
function buildUpperRightSocialPayload(text = '', socialMediaLogo = '') {
  return {
    "text": String(text || ''),
    "socialMediaLogo": resolveAssetToDataUrl(socialMediaLogo || '')
  };
}

module.exports = {
  queue,
  patchSingular,
  resolveAssetToDataUrl,
  hexToSingularColor,
  formatOuts,
  formatCount,
  formatInningHalf,
  buildScoreBugPayload,
  buildFullscreenMatchupPayload,
  buildLowerMatchupPayload,
  buildLineupPayload,
  buildPlayerBioPayload,
  buildComparisonStatsPayload,
  buildBackgroundImagePayload,
  buildBaselineStaticPayload,
  buildFreeformImagePayload,
  buildFreeformTextPayload,
  buildLower1LinePayload,
  buildLower2LinePayload,
  buildUpperRight1LinePayload,
  buildUpperRight2LinePayload,
  buildUpperRightSocialPayload
};
