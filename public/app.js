// =========================================================
// TOROS DE TIJUANA — SISTEMA DE CONTROL DE EMISIÓN
// MOTOR DE TIEMPO REAL & CLIENTE SINGULAR.LIVE (3 COLUMNAS & CRUD)
// =========================================================

let socket = null;
let currentGameState = null;
let teamsCatalog = [];
let localTeamRoster = [];
let visitorTeamRoster = [];
let torosRoster = []; // Alias de compatibilidad
let savedLineups = {};
let rivalRoster = []; // Alias de compatibilidad
let lastLoadedLocalId = null;
let lastLoadedVisitorId = null;
let activeLineupTeamRole = 'local';
let activeBioTeamRole = 'local';
let activeQuickBioTeamRole = 'local';
let activeRosterManagerTeamId = 1;
let currentTeamBeingEditedId = null;
let currentPlayerBeingEditedId = null;
let currentNextMlbGame = null;

const activeOverlaysMap = { score_bug: true };
let currentOverlayCategoryFilter = 'all';

const OVERLAYS_METADATA = [
  // Marcador y Partido
  {
    key: 'score_bug',
    name: 'Score Bug — Baseball',
    id: '3dd9a73e-3752-444d-beb7-a70e7b3184ba',
    category: 'partido',
    categoryLabel: 'Marcador Principal',
    outState: 'Out1',
    desc: 'Marcador principal en pantalla con carreras, outs, bolas/strikes, bases e inning.',
    fields: []
  },
  {
    key: 'lower_matchup',
    name: 'Lower — Matchup',
    id: 'f12eafa1-ab55-4816-922c-7496f388fd03',
    category: 'partido',
    categoryLabel: 'Previa de Equipos',
    outState: 'Out1',
    desc: 'Banda inferior con presentación de equipos, siglas y colores oficiales.',
    fields: [
      { key: 'dropline', label: 'Dropline / Subtexto', type: 'text', default: 'LIGA MEXICANA DE BÉISBOL' }
    ]
  },
  {
    key: 'fullscreen_matchup',
    name: 'Fullscreen — Matchup',
    id: '44b94f2a-23b0-4f08-a95a-cec1aea89e81',
    category: 'partido',
    categoryLabel: 'Pantalla Completa',
    outState: 'Out1',
    desc: 'Gráfico de pantalla completa para previa o arranque de transmisión.',
    fields: [
      { key: 'subtitle', label: 'Subtítulo', type: 'text', default: 'TEMPORADA REGULAR 2026' },
      { key: 'dropline', label: 'Dropline / Hashtag', type: 'text', default: '#ToroPower' }
    ]
  },
  {
    key: 'team_lineups',
    name: 'Panel — Team Lineups',
    id: '9a020313-2243-4d2a-98f9-c374e05cb9d2',
    category: 'partido',
    categoryLabel: 'Alineación',
    outState: 'Out1',
    desc: 'Alineación de bateo de 11 jugadores del equipo.',
    fields: [
      { key: 'subtitle', label: 'Subtítulo Lineup', type: 'text', default: 'Lineup Titular' }
    ]
  },
  {
    key: 'player_bio',
    name: 'Lower — Player Bio',
    id: '355a74fd-62eb-434b-b83a-d41ab28666bb',
    category: 'partido',
    categoryLabel: 'Ficha Jugador',
    outState: 'Out2',
    desc: 'Ficha biográfica de jugador destacado con foto y texto de 2 líneas.',
    fields: []
  },
  {
    key: 'comparison_stats',
    name: 'Fullscreen — Comparison Stats',
    id: 'b84f7f1b-f5e2-4b4b-a2e8-3b0ec0c39785',
    category: 'partido',
    categoryLabel: 'Comparativa',
    outState: 'Out2',
    desc: 'Comparativa de estadísticas de temporada o juego entre ambos equipos.',
    fields: [
      { key: 'subtitle', label: 'Subtítulo', type: 'text', default: 'Comparativa de Temporada' },
      { key: 'dropline', label: 'Dropline', type: 'text', default: 'Estadísticas Oficiales LMB' }
    ]
  },

  // Cintillos & Banners Inferiores
  {
    key: 'lower_1_line',
    name: 'Lower — 1 Line',
    id: '5bae6f0b-5b7e-4990-bf5c-c6296719c99b',
    category: 'banners',
    categoryLabel: 'Cintillo Inferior',
    outState: 'Out2',
    desc: 'Cintillo inferior de 1 línea de texto para anuncios rápidos, nombres o titulares.',
    fields: [
      { key: 'text', label: 'Texto del Cintillo', type: 'text', default: 'TOROS DE TIJUANA' }
    ]
  },
  {
    key: 'lower_2_line',
    name: 'Lower — 2 Line',
    id: '7d5591b9-a03c-405a-86d9-2e56e52e9430',
    category: 'banners',
    categoryLabel: 'Cintillo Inferior',
    outState: 'Out2',
    desc: 'Banda inferior de dos líneas para titulares y subtítulos informativos.',
    fields: [
      { key: 'line1', label: 'Línea 1 (Título)', type: 'text', default: 'TOROS DE TIJUANA' },
      { key: 'line2', label: 'Línea 2 (Subtítulo)', type: 'text', default: 'LIGA MEXICANA DE BÉISBOL' }
    ]
  },
  {
    key: 'baseline_static',
    name: 'Baseline — Static',
    id: 'e2840a63-771b-41a5-91e2-38fa823ed325',
    category: 'banners',
    categoryLabel: 'Ticker Base',
    outState: 'Out1',
    desc: 'Cintillo estático en la base inferior de la pantalla para información continua.',
    fields: [
      { key: 'text', label: 'Texto de la Línea Base', type: 'text', default: 'TOROS DE TIJUANA · TEMPORADA 2026 · ESTADIO CHEVRON' }
    ]
  },

  // Esquina Superior & Redes
  {
    key: 'upper_right_1_line',
    name: 'Upper Right — 1 Line',
    id: '2606b2b5-082e-4406-80b4-8b11da3af36f',
    category: 'upper_right',
    categoryLabel: 'Bug Superior',
    outState: 'Out2',
    desc: 'Mensaje compacto de 1 línea en la esquina superior derecha (hashtag o indicativo).',
    fields: [
      { key: 'text', label: 'Texto Superior', type: 'text', default: '#ToroPower' }
    ]
  },
  {
    key: 'upper_right_2_line',
    name: 'Upper Right — 2 Line',
    id: '8663f3fa-f6e6-4d65-a9dc-f68df1184762',
    category: 'upper_right',
    categoryLabel: 'Bug Superior',
    outState: 'Out2',
    desc: 'Gráfico de dos líneas en la esquina superior derecha para partido y estado en vivo.',
    fields: [
      { key: 'line1', label: 'Línea 1', type: 'text', default: '#ToroPower' },
      { key: 'line2', label: 'Línea 2', type: 'text', default: 'EN VIVO' }
    ]
  },
  {
    key: 'upper_right_social',
    name: 'Upper Right — Social Media',
    id: '3b53f332-f127-4dbf-accb-9977111ea9c5',
    category: 'upper_right',
    categoryLabel: 'Redes Sociales',
    outState: 'Out1',
    desc: 'Identificador de redes sociales con icono y nombre de usuario en esquina superior.',
    fields: [
      { key: 'text', label: 'Usuario / URL', type: 'text', default: '@TorosDeTijuana' },
      {
        key: 'socialMediaLogo',
        label: 'Plataforma / Logo',
        type: 'select',
        options: [
          { label: 'Singular Oficial (SVG)', value: '//assets.singular.live/12086e0462c894187cf486fc291e0d58/svgs/1NazNq05b11URTioABHB46_w512h512.svg' },
          { label: 'Logo Toros (Local)', value: '/assets/logos/tij.svg' }
        ],
        default: '//assets.singular.live/12086e0462c894187cf486fc291e0d58/svgs/1NazNq05b11URTioABHB46_w512h512.svg'
      }
    ]
  },

  // Fondos y Elementos Libres
  {
    key: 'background_image',
    name: 'Background Image',
    id: '2675716d-451c-4e76-b52d-6bc1f1e023b3',
    category: 'freeform',
    categoryLabel: 'Fondo Pantalla',
    outState: 'Out1',
    desc: 'Fondo gráfico completo para cortinillas, transiciones o fondos de entrevista.',
    fields: [
      { key: 'imageUrl', label: 'URL / Ruta Imagen', type: 'text', default: '//image.singular.live/12086e0462c894187cf486fc291e0d58/images/0SSYwHSIkboAVnXJw0ImEF.png' }
    ]
  },
  {
    key: 'freeform_image',
    name: 'Freeform Image',
    id: '73bd8f0e-726d-47f5-ae54-a40660b40569',
    category: 'freeform',
    categoryLabel: 'Imagen Libre',
    outState: 'Out1',
    desc: 'Imagen flotante con posición (X, Y), escala y transparencia personalizables.',
    fields: [
      { key: 'image', label: 'URL / Ruta Imagen', type: 'text', default: 'https://assets.singular.live/12086e0462c894187cf486fc291e0d58/svgs/4bIqkCNSZAoudT1myq6Sii_w327h32.svg' },
      { key: 'positionX', label: 'Posición X (%)', type: 'number', default: '40' },
      { key: 'positionY', label: 'Posición Y (%)', type: 'number', default: '40' },
      { key: 'size', label: 'Escala (%)', type: 'number', default: '15' },
      { key: 'transparency', label: 'Opacidad (%)', type: 'number', default: '100' }
    ]
  },
  {
    key: 'freeform_text',
    name: 'Freeform Text',
    id: '8dd3dad4-620a-4f88-b3f3-49e0a8bb34a9',
    category: 'freeform',
    categoryLabel: 'Texto Libre',
    outState: 'Out1',
    desc: 'Texto flotante en pantalla con posición, tamaño y opacidad ajustables (Aviso: tipografía original blanca #FFF; se visualiza sobre cámara o fondo).',
    fields: [
      { key: 'text', label: 'Texto', type: 'text', default: 'Toros de Tijuana' },
      { key: 'positionX', label: 'Posición X (%)', type: 'number', default: '40' },
      { key: 'positionY', label: 'Posición Y (%)', type: 'number', default: '35' },
      { key: 'size', label: 'Tamaño Fuente', type: 'number', default: '40' },
      { key: 'transparency', label: 'Opacidad (%)', type: 'number', default: '100' }
    ]
  }
];

document.addEventListener('DOMContentLoaded', () => {
  initSocket();
  loadInitialData();
  renderOverlaysCatalog();
});

// =========================================================
// CONEXIÓN SOCKET.IO Y TELEMETRÍA
// =========================================================

function initSocket() {
  socket = io();

  socket.on('connect', () => {
    updateSyncBadge('online', 'Sincronizado', '0 ms');
  });

  socket.on('calendario:actualizado', () => { loadCalendario(); loadBracket(); });
  socket.on('disconnect', () => {
    updateSyncBadge('offline', 'Desconectado', '--');
  });

  socket.on('estado:actualizado', (fullState) => {
    renderGameState(fullState);
  });

  socket.on('singular:status', (statusData) => {
    if (statusData.status === 'in_sync') {
      updateSyncBadge('online', 'Sincronizado', `${statusData.latencyMs} ms`);
      const latEl = document.getElementById('telemetry-latency');
      const qEl = document.getElementById('telemetry-queue-status');
      if (latEl) latEl.textContent = `● ${statusData.latencyMs} ms`;
      if (qEl) qEl.textContent = '● Activa';
    } else if (statusData.status === 'error') {
      updateSyncBadge('error', 'Error API', '--');
      const qEl = document.getElementById('telemetry-queue-status');
      if (qEl) qEl.textContent = `● Error: ${statusData.error || 'Fallo'}`;
    }
  });
}

function updateSyncBadge(status, text, latency) {
  const txt = document.getElementById('sync-text');
  const lat = document.getElementById('sync-latency');
  const dot = document.querySelector('.status-dot');

  if (txt) txt.textContent = text;
  if (lat) lat.textContent = latency;

  if (status === 'online') {
    if (txt) txt.style.color = 'var(--neon-green)';
    if (dot) dot.style.backgroundColor = 'var(--neon-green)';
  } else if (status === 'offline') {
    if (txt) txt.style.color = 'var(--neon-orange)';
    if (dot) dot.style.backgroundColor = 'var(--neon-orange)';
  } else {
    if (txt) txt.style.color = 'var(--t-red)';
    if (dot) dot.style.backgroundColor = 'var(--t-red)';
  }
}

// =========================================================
// RENDER DEL ESTADO EN VIVO (PANEL B)
// =========================================================

function renderGameState(fullState) {
  if (!fullState || !fullState.state) return;
  currentGameState = fullState;
  const s = fullState.state;
  const m = fullState.match;
  renderTeamLogo('local', m.local);
  renderTeamLogo('visitor', m.visitor);
  const finished = m.estado === 'finalizado';
  document.querySelectorAll('#panel-b-view button[onclick]').forEach(button => {
    if (/^(modifyRun|addBall|addStrike|resetCount|modifyOut|toggleBase|clearBases|toggleHalfInning|setHalf|stepInning|confirmInningChange|executeUndo)\(/.test(button.getAttribute('onclick'))) button.disabled = finished;
  });
  document.querySelector('.hero-air-status').textContent = finished ? 'Partido finalizado · Resultado guardado' : 'Control del partido · Singular.Live';

  // Equipos en Hero Scoreboard
  const nameLocEl = document.getElementById('mirror-name-local');
  const badgeLocEl = document.getElementById('hero-badge-local');
  if (nameLocEl) nameLocEl.textContent = m.local.nombre;
  if (badgeLocEl) badgeLocEl.textContent = m.local.siglas;

  const codeCtrlLoc = document.getElementById('ctrl-local-code');
  const subnameCtrlLoc = document.getElementById('ctrl-local-subname');
  if (codeCtrlLoc) codeCtrlLoc.textContent = m.local.siglas;
  if (subnameCtrlLoc) subnameCtrlLoc.textContent = m.local.nombre;

  const nameVisEl = document.getElementById('mirror-name-visitor');
  const badgeVisEl = document.getElementById('hero-badge-visitor');
  if (nameVisEl) nameVisEl.textContent = m.visitor.nombre;
  if (badgeVisEl) badgeVisEl.textContent = m.visitor.siglas;

  const codeCtrlVis = document.getElementById('ctrl-visitor-code');
  const subnameCtrlVis = document.getElementById('ctrl-visitor-subname');
  if (codeCtrlVis) codeCtrlVis.textContent = m.visitor.siglas;
  if (subnameCtrlVis) subnameCtrlVis.textContent = m.visitor.nombre;

  // Actualizar etiquetas de botones de Lineup y Bio con las siglas activas
  const btnQuickLoc = document.getElementById('btn-quick-bio-local');
  const btnQuickVis = document.getElementById('btn-quick-bio-visitor');
  if (btnQuickLoc) btnQuickLoc.textContent = `Local (${m.local.siglas})`;
  if (btnQuickVis) btnQuickVis.textContent = `Visitante (${m.visitor.siglas})`;

  const btnLineupLoc = document.getElementById('btn-lineup-team-local');
  const btnLineupVis = document.getElementById('btn-lineup-team-visitor');
  if (btnLineupLoc) btnLineupLoc.textContent = `Local (${m.local.siglas})`;
  if (btnLineupVis) btnLineupVis.textContent = `Visitante (${m.visitor.siglas})`;

  const btnBioLoc = document.getElementById('btn-bio-team-local');
  const btnBioVis = document.getElementById('btn-bio-team-visitor');
  if (btnBioLoc) btnBioLoc.textContent = `Local (${m.local.siglas})`;
  if (btnBioVis) btnBioVis.textContent = `Visitante (${m.visitor.siglas})`;

  // Carreras
  document.getElementById('mirror-runs-local').textContent = s.runs_local;
  document.getElementById('mirror-runs-visitor').textContent = s.runs_visitante;

  // Inning
  const isAlta = (s.mitad || 'alta').toLowerCase() === 'alta';
  document.getElementById('mirror-inning-arrow').textContent = isAlta ? '↑' : '↓';
  document.getElementById('mirror-inning-text').textContent = `${s.inning}ra ${isAlta ? 'Alta' : 'Baja'}`;
  document.getElementById('stepper-inning-val').textContent = s.inning;
  
  document.getElementById('btn-half-alta').classList.toggle('active', isAlta);
  document.getElementById('btn-half-baja').classList.toggle('active', !isAlta);

  // Digital LED Pips
  renderLedPips('leds-balls', s.bolas);
  renderLedPips('leds-strikes', s.strikes);
  renderLedPips('leds-outs', s.outs);

  // Contadores Numéricos
  document.getElementById('big-balls-num').textContent = s.bolas;
  document.getElementById('big-strikes-num').textContent = s.strikes;
  document.getElementById('big-outs-num').textContent = s.outs;
  document.getElementById('big-outs-text').textContent = s.outs === 1 ? 'Out' : 'Outs';

  // Diamante Táctico de Bases
  document.getElementById('base-plate-1').classList.toggle('occupied', Boolean(s.base_1));
  document.getElementById('base-plate-2').classList.toggle('occupied', Boolean(s.base_2));
  document.getElementById('base-plate-3').classList.toggle('occupied', Boolean(s.base_3));

  // Alerta de 3 Outs
  const banner = document.getElementById('inning-change-banner');
  if (s.outs >= 3) {
    banner.style.display = 'flex';
    const nextHalf = isAlta ? '[A BAJA]' : `[A ALTA DEL ${s.inning + 1}]`;
    document.getElementById('banner-next-inning-text').textContent = nextHalf;
  } else {
    banner.style.display = 'none';
  }

  // Botón de Deshacer
  const btnUndo = document.getElementById('btn-undo');
  btnUndo.disabled = finished || !fullState.canUndo;
  document.getElementById('undo-last-action-desc').textContent = s.lastActionDescription || 'Sistema listo para operar';
}

function renderLedPips(containerId, count) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const pips = container.querySelectorAll('.led-pip');
  pips.forEach((pip, idx) => {
    if (idx < count) {
      pip.classList.add('active');
    } else {
      pip.classList.remove('active');
    }
  });
}

function renderTeamLogo(role, team) {
  const img=document.getElementById(`hero-logo-${role}`);
  if(!img) return;
  const url=team.logo_url || '';
  if(img.dataset.source===url) return;
  img.dataset.source=url;
  img.alt=`Logo de ${team.nombre}`;
  img.hidden=!url;
  img.onload=()=>{img.hidden=false;};
  img.onerror=()=>{img.hidden=true;};
  if(url) img.src=url;
}

// =========================================================
// ACCIONES DE OPERADOR (PANEL B)
// =========================================================

function modifyRun(team, delta) {
  if (socket) socket.emit('run:add', { team, delta });
}

function addBall() {
  if (socket) socket.emit('ball:add');
}

function addStrike() {
  if (socket) socket.emit('strike:add');
}

function resetCount() {
  if (socket) socket.emit('count:reset');
}

function modifyOut(delta) {
  if (socket) socket.emit('out:add', { delta });
}

function toggleBase(base) {
  if (socket) socket.emit('base:toggle', { base });
}

function clearBases() {
  if (socket) socket.emit('bases:clear');
}

function toggleHalfInning() {
  if (!currentGameState) return;
  const nextMitad = currentGameState.state.mitad === 'alta' ? 'baja' : 'alta';
  if (socket) socket.emit('inning:set', { numero: currentGameState.state.inning, mitad: nextMitad });
}

function setHalf(mitad) {
  if (!currentGameState) return;
  if (socket) socket.emit('inning:set', { numero: currentGameState.state.inning, mitad });
}

function stepInning(delta) {
  if (!currentGameState) return;
  const nextInning = Math.max(1, currentGameState.state.inning + delta);
  if (socket) socket.emit('inning:set', { numero: nextInning, mitad: currentGameState.state.mitad });
}

function confirmInningChange() {
  if (socket) socket.emit('inning:confirmChange');
}

function executeUndo() {
  if (socket) socket.emit('undo');
}

// Actualizar indicador visual de un overlay tanto en switches como en catálogo
function updateOverlayUIStatus(overlayKey, isChecked) {
  activeOverlaysMap[overlayKey] = isChecked;

  // 1. Slider switch en Panel B
  const slide = document.getElementById(`slide-${overlayKey}`);
  if (slide) slide.checked = isChecked;

  const tagEl = document.getElementById(`slide-tag-${overlayKey}`);
  if (tagEl) {
    tagEl.textContent = isChecked ? 'ON' : 'OFF';
    tagEl.classList.toggle('off', !isChecked);
  }

  // 2. Badge de estado en tarjeta del catálogo
  const catalogBadge = document.getElementById(`cat-badge-${overlayKey}`);
  if (catalogBadge) {
    catalogBadge.textContent = isChecked ? '● EN AIRE' : '● OFF';
    catalogBadge.className = `cat-status-tag ${isChecked ? 'active' : 'inactive'}`;
  }

  // 3. Botones IN y OUT en tarjeta del catálogo
  const btnIn = document.getElementById(`btn-in-${overlayKey}`);
  if (btnIn) {
    btnIn.classList.toggle('is-active', isChecked);
    const inTxt = btnIn.querySelector('.ov-btn-text');
    if (inTxt) inTxt.textContent = isChecked ? 'EN EL AIRE' : 'IN [AIRE]';
  }
  const btnOut = document.getElementById(`btn-out-${overlayKey}`);
  if (btnOut) {
    btnOut.classList.toggle('is-active', !isChecked);
    const outTxt = btnOut.querySelector('.ov-btn-text');
    if (outTxt) outTxt.textContent = !isChecked ? 'FUERA [OFF]' : 'OUT [OFF]';
  }

  // 4. Borde activo y resplandor en la tarjeta
  const card = document.getElementById(`ov-card-${overlayKey}`);
  if (card) {
    card.classList.toggle('is-on-air', isChecked);
  }

  // 5. Indicador en tarjeta rápida de Panel B (si existe)
  const quickCard = document.getElementById(`quick-card-${overlayKey}`);
  if (quickCard) {
    quickCard.classList.toggle('is-on-air', isChecked);
  }
}

function navigateToOverlaysCategory(categoryKey = 'banners') {
  switchPanel('overlays');
  filterOverlaysCatalog(categoryKey);
  const catalogEl = document.getElementById('overlays-view');
  if (catalogEl) {
    catalogEl.scrollIntoView({ behavior: 'smooth' });
  }
}

// Manejador del Slider Toggle de Overlays
function onOverlaySlideChange(overlayKey, isChecked) {
  updateOverlayUIStatus(overlayKey, isChecked);

  if (overlayKey === 'player_bio') {
    triggerPanelBBio(isChecked ? 'In' : 'Out2');
    return;
  }

  const meta = OVERLAYS_METADATA.find(o => o.key === overlayKey);
  const outTarget = (meta && meta.outState) || 'Out1';
  toggleOverlayState(overlayKey, isChecked ? 'In' : outTarget);
}

async function toggleOverlayState(overlayKey, state, customData = {}) {
  try {
    const meta = OVERLAYS_METADATA.find(o => o.key === overlayKey);
    const outTarget = (meta && meta.outState) || 'Out1';
    const targetState = state === 'Out' ? outTarget : state;

    const payload = {
      overlayKey,
      state: targetState,
      teamId: activeLineupTeamRole === 'local' ? getMatchupTeams().local.id : getMatchupTeams().visitor.id,
      ...customData
    };

    const res = await fetch('/api/overlay/toggle-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      console.log(`[Overlay] ${overlayKey} cambiado a ${targetState}`);
      updateOverlayUIStatus(overlayKey, targetState === 'In');
    } else {
      updateOverlayUIStatus(overlayKey, false);
      alert(data.error || 'No se pudo activar el overlay.');
    }
  } catch (err) {
    console.error('Error al conmutar overlay:', err);
  }
}

// =========================================================
// PANEL A: SETUP PRE-PARTIDO Y GESTIÓN CRUD
// =========================================================

async function loadInitialData() {
  try {
    // 1. Obtener estado activo del partido desde el servidor
    const resState = await fetch('/api/partidos/activo');
    if (resState.ok) {
      currentGameState = await resState.json();
      renderGameState(currentGameState);
    }

    await reloadTeamsCatalog();

    const localId = (currentGameState && currentGameState.match && currentGameState.match.local && currentGameState.match.local.id) || 1;
    const visitorId = (currentGameState && currentGameState.match && currentGameState.match.visitor && currentGameState.match.visitor.id) || 15;

    const selLocal = document.getElementById('select-team-local');
    const selVisitor = document.getElementById('select-team-visitor');
    if (selLocal) selLocal.value = localId;
    if (selVisitor) selVisitor.value = visitorId;

    previewMatchupSelection();
    await loadMatchupRosters(localId, visitorId);

    // Inicializar subpestaña de Roster
    loadRosterManager(localId);

    // Cargar programador de calendario local
    loadCalendario();

  } catch (err) {
    console.error('Error al inicializar catálogos:', err);
  }
}

async function reloadTeamsCatalog() {
  const resEquipos = await fetch('/api/equipos');
  teamsCatalog = await resEquipos.json();

  const selLocal = document.getElementById('select-team-local');
  const selVisitor = document.getElementById('select-team-visitor');
  const selRosterTeam = document.getElementById('select-roster-manager-team');

  if (selLocal && selVisitor) {
    const prevLocVal = selLocal.value;
    const prevVisVal = selVisitor.value;

    selLocal.innerHTML = '';
    selVisitor.innerHTML = '';

    teamsCatalog.forEach(t => {
      const opt1 = document.createElement('option');
      opt1.value = t.id;
      opt1.textContent = `${t.nombre} (${t.siglas})`;
      selLocal.appendChild(opt1);

      const opt2 = document.createElement('option');
      opt2.value = t.id;
      opt2.textContent = `${t.nombre} (${t.siglas})`;
      selVisitor.appendChild(opt2);
    });

    const activeLocId = prevLocVal || (currentGameState && currentGameState.match && currentGameState.match.local && currentGameState.match.local.id) || 1;
    const activeVisId = prevVisVal || (currentGameState && currentGameState.match && currentGameState.match.visitor && currentGameState.match.visitor.id) || 15;

    selLocal.value = activeLocId;
    selVisitor.value = activeVisId;

    previewMatchupSelection();
  }

  if (selRosterTeam) {
    const prevVal = selRosterTeam.value;
    selRosterTeam.innerHTML = '';
    teamsCatalog.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = `${t.nombre} (${t.siglas})`;
      selRosterTeam.appendChild(opt);
    });
    if (prevVal) selRosterTeam.value = prevVal;
  }

  renderTeamsManager();
}

// Subpestañas del Panel A
function switchPanelASubTab(subTabKey) {
  document.querySelectorAll('.subtab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.panel-a-nav-tab').forEach(el => el.classList.remove('active'));

  if (subTabKey === 'calendar') {
    document.getElementById('subtab-calendar-view').classList.add('active');
    document.getElementById('btn-subnav-calendar').classList.add('active');
    loadCalendario(); loadBracket();
  } else if (subTabKey === 'matchup') {
    const el = document.getElementById('subtab-matchup-view');
    if (el) el.classList.add('active');
    const btn = document.getElementById('btn-subnav-matchup');
    if (btn) btn.classList.add('active');

  } else if (subTabKey === 'teams') {
    const el = document.getElementById('subtab-teams-view');
    if (el) el.classList.add('active');
    const btn = document.getElementById('btn-subnav-teams');
    if (btn) btn.classList.add('active');
    renderTeamsManager();
  } else if (subTabKey === 'roster') {
    const el = document.getElementById('subtab-roster-view');
    if (el) el.classList.add('active');
    const btn = document.getElementById('btn-subnav-roster');
    if (btn) btn.classList.add('active');
    const sel = document.getElementById('select-roster-manager-team');
    loadRosterManager(sel ? sel.value : 1);
  }
}

// Obtiene objetos del equipo local y visitante según selectores o estado
function getMatchupTeams() {
  const selLoc = document.getElementById('select-team-local');
  const selVis = document.getElementById('select-team-visitor');

  let localId = selLoc ? parseInt(selLoc.value, 10) : null;
  let visitorId = selVis ? parseInt(selVis.value, 10) : null;

  if (!localId && currentGameState && currentGameState.match && currentGameState.match.local) {
    localId = currentGameState.match.local.id;
  }
  if (!visitorId && currentGameState && currentGameState.match && currentGameState.match.visitor) {
    visitorId = currentGameState.match.visitor.id;
  }

  const local = teamsCatalog.find(t => t.id === localId) || (currentGameState && currentGameState.match && currentGameState.match.local) || { id: 1, nombre: 'Toros de Tijuana', siglas: 'TIJ' };
  const visitor = teamsCatalog.find(t => t.id === visitorId) || (currentGameState && currentGameState.match && currentGameState.match.visitor) || { id: 15, nombre: 'Olmecas de Tabasco', siglas: 'TAB' };

  return { local, visitor };
}

// Carga dinámica de rosters para Local y Visitante
let rosterLoadVersion=0;
async function loadMatchupRosters(localId, visitorId) {
  if(!localId||!visitorId)return;
  const version=++rosterLoadVersion;
  localTeamRoster=[];visitorTeamRoster=[];savedLineups={};
  refreshMatchupRosterUI();
  async function read(url) {
    const response=await fetch(url,{signal:AbortSignal.timeout(12000)});
    if(!response.ok)throw Error(response.status===404?'Reinicia el servidor para cargar las rutas actualizadas.':'No se pudo cargar la información ('+response.status+').');
    return response.json();
  }
  // An unavailable lineup must not hide a successfully loaded roster.
  const results=await Promise.allSettled([
    read('/api/equipos/'+localId+'/roster'),read('/api/equipos/'+visitorId+'/roster'),
    read('/api/lineups/'+localId),read('/api/lineups/'+visitorId)
  ]);
  if(version!==rosterLoadVersion)return;
  const players=r=>r.status==='fulfilled'&&Array.isArray(r.value)?r.value:[];
  localTeamRoster=players(results[0]);visitorTeamRoster=players(results[1]);
  torosRoster=localTeamRoster;rivalRoster=visitorTeamRoster;
  [localId,visitorId].forEach((id,i)=>{
    const result=results[i+2];
    savedLineups[id]=result.status==='fulfilled'&&Array.isArray(result.value.players)?result.value:{players:[],error:result.reason?.message||'Respuesta de alineación inválida.'};
    if(results[i].status==='rejected')savedLineups[id].error='No se pudo cargar el roster. '+results[i].reason.message;
  });
  lastLoadedLocalId=localId;lastLoadedVisitorId=visitorId;
  refreshMatchupRosterUI();
}

// Actualiza toda la interfaz que depende de rosters (Lineup, Bios)
function refreshMatchupRosterUI() {
  const { local, visitor } = getMatchupTeams();

  // Actualizar botones en Panel A
  const btnLineupLoc = document.getElementById('btn-lineup-team-local');
  const btnLineupVis = document.getElementById('btn-lineup-team-visitor');
  if (btnLineupLoc) btnLineupLoc.textContent = `Local (${local.siglas})`;
  if (btnLineupVis) btnLineupVis.textContent = `Visitante (${visitor.siglas})`;

  const btnBioLoc = document.getElementById('btn-bio-team-local');
  const btnBioVis = document.getElementById('btn-bio-team-visitor');
  if (btnBioLoc) btnBioLoc.textContent = `Local (${local.siglas})`;
  if (btnBioVis) btnBioVis.textContent = `Visitante (${visitor.siglas})`;

  // Actualizar botones en Panel B (Quick Bio)
  const btnQuickLoc = document.getElementById('btn-quick-bio-local');
  const btnQuickVis = document.getElementById('btn-quick-bio-visitor');
  if (btnQuickLoc) btnQuickLoc.textContent = `Local (${local.siglas})`;
  if (btnQuickVis) btnQuickVis.textContent = `Visitante (${visitor.siglas})`;

  // Renderizar Lineup
  const currentLineupList = activeLineupTeamRole === 'local' ? localTeamRoster : visitorTeamRoster;
  renderSavedLineup(activeLineupTeamRole === 'local' ? local.id : visitor.id);

  const currentLineupTeam = activeLineupTeamRole === 'local' ? local : visitor;
  const btnPush = document.getElementById('btn-push-lineup');
  if (btnPush) btnPush.textContent = `Transmitir Lineup de ${currentLineupTeam.nombre} a Singular.Live`;
  const subInput = document.getElementById('lineup-subtitle-input');
  if (subInput) subInput.value = `Lineup Titular - ${currentLineupTeam.nombre}`;

  // Renderizar Selector de Bio en Panel A
  const currentBioList = activeBioTeamRole === 'local' ? localTeamRoster : visitorTeamRoster;
  populateBioPlayerSelect(currentBioList);

  // Renderizar Selector de Bio Rápida en Panel B
  const currentQuickBioList = activeQuickBioTeamRole === 'local' ? localTeamRoster : visitorTeamRoster;
  populatePanelBQuickBio(currentQuickBioList);
}

// Invertir condición Local / Visitante (Swap)
async function swapLocalVisitorTeams() {
  const selLoc = document.getElementById('select-team-local');
  const selVis = document.getElementById('select-team-visitor');
  if (!selLoc || !selVis) return;
  const temp = selLoc.value;
  selLoc.value = selVis.value;
  selVis.value = temp;

  previewMatchupSelection();
  await loadMatchupRosters(parseInt(selLoc.value, 10), parseInt(selVis.value, 10));
}

// Selección rápida de rival
async function quickSelectMatchup(locSiglas, visSiglas) {
  const selLoc = document.getElementById('select-team-local');
  const selVis = document.getElementById('select-team-visitor');
  if (!selLoc || !selVis) return;

  const locTeam = teamsCatalog.find(t => t.siglas.toUpperCase() === locSiglas.toUpperCase());
  const visTeam = teamsCatalog.find(t => t.siglas.toUpperCase() === visSiglas.toUpperCase());

  if (locTeam) selLoc.value = locTeam.id;
  if (visTeam) selVis.value = visTeam.id;

  previewMatchupSelection();
  await loadMatchupRosters(parseInt(selLoc.value, 10), parseInt(selVis.value, 10));
}

// Matchup Setup Preview
function previewMatchupSelection() {
  const selLoc = document.getElementById('select-team-local');
  const selVis = document.getElementById('select-team-visitor');
  if (!selLoc || !selVis) return;

  const localId = parseInt(selLoc.value, 10);
  const visitorId = parseInt(selVis.value, 10);

  const local = teamsCatalog.find(t => t.id === localId) || teamsCatalog[0];
  const visitor = teamsCatalog.find(t => t.id === visitorId) || teamsCatalog[1];

  if (local) {
    const nameEl = document.getElementById('prev-name-local');
    const codeEl = document.getElementById('prev-siglas-local');
    const logoEl = document.getElementById('prev-logo-local');
    const c1 = document.getElementById('prev-col-local-1');
    const c2 = document.getElementById('prev-col-local-2');
    if (nameEl) nameEl.textContent = local.nombre;
    if (codeEl) codeEl.textContent = local.siglas;
    if (logoEl) logoEl.src = local.logo_url || '/assets/logos/tij.svg';
    if (c1) c1.style.background = local.color_primario;
    if (c2) c2.style.background = local.color_secundario || '#000';
  }

  if (visitor) {
    const nameEl = document.getElementById('prev-name-visitor');
    const codeEl = document.getElementById('prev-siglas-visitor');
    const logoEl = document.getElementById('prev-logo-visitor');
    const c1 = document.getElementById('prev-col-visitor-1');
    const c2 = document.getElementById('prev-col-visitor-2');
    if (nameEl) nameEl.textContent = visitor.nombre;
    if (codeEl) codeEl.textContent = visitor.siglas;
    if (logoEl) logoEl.src = visitor.logo_url || '/assets/logos/mty.svg';
    if (c1) c1.style.background = visitor.color_primario;
    if (c2) c2.style.background = visitor.color_secundario || '#000';
  }

  if (localId && visitorId && (localId !== lastLoadedLocalId || visitorId !== lastLoadedVisitorId)) {
    loadMatchupRosters(localId, visitorId);
  }
}

async function submitMatchupSetup() {
  const localId = parseInt(document.getElementById('select-team-local').value, 10);
  const visitorId = parseInt(document.getElementById('select-team-visitor').value, 10);

  try {
    const res = await fetch('/api/matchup/set', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ localId, visitorId })
    });
    const data = await res.json();
    if (data.success) {
      alert(`Enfrentamiento sincronizado en Singular.Live:\n${data.state.match.local.siglas} vs ${data.state.match.visitor.siglas}`);
      await loadMatchupRosters(localId, visitorId);
      switchPanel('b');
    } else { alert(data.error || 'No se pudo cargar el enfrentamiento.'); }
  } catch (err) {
    alert(`Error de sincronización: ${err.message}`);
  }
}

// =========================================================
// LINEUP TITULAR (LOCAL O RIVAL)
// =========================================================

function selectLineupTeam(role) {
  activeLineupTeamRole = role;
  const btnLoc = document.getElementById('btn-lineup-team-local');
  const btnVis = document.getElementById('btn-lineup-team-visitor');
  if (btnLoc) btnLoc.classList.toggle('active', role === 'local');
  if (btnVis) btnVis.classList.toggle('active', role === 'visitor');

  const { local, visitor } = getMatchupTeams();
  const currentTeam = role === 'local' ? local : visitor;
  const currentPlayers = role === 'local' ? localTeamRoster : visitorTeamRoster;

  renderSavedLineup(currentTeam.id);

  const btnPush = document.getElementById('btn-push-lineup');
  if (btnPush) btnPush.textContent = `Transmitir Lineup de ${currentTeam.nombre} a Singular.Live`;

  const subInput = document.getElementById('lineup-subtitle-input');
  if (subInput) subInput.value = `Lineup Titular - ${currentTeam.nombre}`;
}

function renderLineupTable(players, rosterOnly = false) {
  const tbody = document.getElementById('lineup-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  const list = (players && players.length > 0) ? players : [];
  (rosterOnly ? list : list.slice(0, 11)).forEach((p, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-family: var(--font-mono); font-weight: 800; color: var(--t-gray-500);">${rosterOnly ? '—' : idx + 1}</td>
      <td style="font-family: var(--font-mono); font-weight: 800;">#${p.numero}</td>
      <td><strong>${escapeHtml(p.nombre)}</strong></td>
      <td style="color: var(--t-gray-400);">${p.posicion || 'OF'}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderSavedLineup(teamId) {
  const lineup=savedLineups[teamId] || {players:[]};
  const {local}=getMatchupTeams();
  const roster=Number(teamId)===Number(local.id)?localTeamRoster:visitorTeamRoster;
  const rosterOnly=!lineup.players.length;
  renderLineupTable(rosterOnly?roster:lineup.players,rosterOnly);
  const title=document.getElementById('lineup-table-title');
  if(title) title.textContent=rosterOnly?`Roster disponible — ${roster.length} jugadores`:'Alineación Titular (Lineup — hasta 11 posiciones)';
  const note=document.getElementById('lineup-source-note');
  note.textContent=rosterOnly?'Estos son los jugadores disponibles del equipo. Todavía no hay una alineación guardada para transmitir; la lista no representa el orden de bateo.':lineup.reused?`Última alineación guardada (partido ${lineup.sourceMatchId}). Revisa que corresponda al juego actual antes de transmitir.`:'Alineación guardada para este partido.';
  document.getElementById('btn-push-lineup').disabled=!lineup.players.length;
  if(lineup.error) note.textContent+=' '+lineup.error;
  if(lineup.official) note.textContent=`Alineación oficial del ${lineup.official.game_date}. Confirma la alineación del próximo juego antes de transmitir.`;
  document.getElementById('btn-save-lineup').disabled=!lineup.template;
  if(lineup.template){
    title.textContent='Plantilla editable — 11 jugadores';
    note.textContent=lineup.source+'. Referencia editable, no alineación oficial del partido.';
    renderLineupEditor(lineup.players,roster);
  }
}

function renderLineupEditor(players,roster){
  const positions=['C','1B','2B','3B','SS','LF','CF','RF','OF','DH','P','SP','RP','IF'];
  const pool=[...new Map([...roster,...players].map(p=>[p.id,p])).values()];
  document.getElementById('lineup-table-body').innerHTML=players.map((p,i)=>`<tr>
    <td>${i+1}<button class="btn-small-action" ${i===0?'disabled':''} onclick="moveLineupRow(${i},-1)">↑</button><button class="btn-small-action" ${i===10?'disabled':''} onclick="moveLineupRow(${i},1)">↓</button></td>
    <td>#${p.numero}</td><td><select class="b-select lineup-player" onchange="markLineupDirty()">${pool.map(x=>`<option value="${x.id}" ${x.id===p.id?'selected':''}>#${x.numero} ${escapeHtml(x.nombre)}</option>`).join('')}</select></td>
    <td><select class="b-select lineup-position" onchange="markLineupDirty()">${positions.map(x=>`<option ${x===p.posicion?'selected':''}>${x}</option>`).join('')}</select></td></tr>`).join('');
}
function markLineupDirty(){document.getElementById('btn-push-lineup').disabled=true;document.getElementById('lineup-source-note').textContent='Cambios sin guardar. Guarda la plantilla antes de transmitir.';}
function moveLineupRow(index,direction){
 const tbody=document.getElementById('lineup-table-body'),rows=[...tbody.children],target=index+direction;
 if(target<0||target>=rows.length)return;
 if(direction<0)tbody.insertBefore(rows[index],rows[target]);else tbody.insertBefore(rows[target],rows[index]);
 [...tbody.children].forEach((row,i)=>{row.cells[0].innerHTML=`${i+1}<button class="btn-small-action" ${i===0?'disabled':''} onclick="moveLineupRow(${i},-1)">↑</button><button class="btn-small-action" ${i===10?'disabled':''} onclick="moveLineupRow(${i},1)">↓</button>`;});markLineupDirty();
}
async function saveLineupTemplate(){
 const {local,visitor}=getMatchupTeams(),team=activeLineupTeamRole==='local'?local:visitor;
 const rows=[...document.querySelectorAll('#lineup-table-body tr')].map(row=>({playerId:Number(row.querySelector('.lineup-player').value),position:row.querySelector('.lineup-position').value}));
 try{
  const r=await fetch('/api/lineups/'+team.id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({rows})});
  const data=await r.json();if(!r.ok)throw Error(data.error);
  savedLineups[team.id]=data;
  const selected=activeLineupTeamRole==='local'?getMatchupTeams().local:getMatchupTeams().visitor;
  if(selected.id===team.id)renderSavedLineup(team.id);
 }catch(e){alert(e.message);}
}

async function pushCurrentLineupToSingular() {
  try {
    const { local, visitor } = getMatchupTeams();
    const targetTeam = activeLineupTeamRole === 'local' ? local : visitor;
    const targetTeamId = targetTeam.id;

    const subInput = document.getElementById('lineup-subtitle-input');
    const subtitle = subInput ? subInput.value : `Lineup Titular - ${targetTeam.nombre}`;

    const res = await fetch('/api/lineups/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId: targetTeamId, subtitle })
    });
    const data = await res.json();
    if (data.success) {
      alert(`Lineup titular de ${data.teamName || 'equipo'} transmitido a Singular.Live con éxito.`);
      const slide = document.getElementById('slide-team_lineups');
      const tag = document.getElementById('slide-tag-team_lineups');
      if (slide) slide.checked = true;
      if (tag) { tag.textContent = 'ON'; tag.classList.remove('off'); }
    } else { alert(data.error || 'No se pudo enviar la alineación.'); }
  } catch (err) {
    alert(`Fallo al enviar lineup: ${err.message}`);
  }
}

// =========================================================
// FICHA BIOGRÁFICA (PANEL A)
// =========================================================

function selectBioTeam(role) {
  activeBioTeamRole = role;
  const btnLoc = document.getElementById('btn-bio-team-local');
  const btnVis = document.getElementById('btn-bio-team-visitor');
  if (btnLoc) btnLoc.classList.toggle('active', role === 'local');
  if (btnVis) btnVis.classList.toggle('active', role === 'visitor');

  const players = role === 'local' ? localTeamRoster : visitorTeamRoster;
  populateBioPlayerSelect(players);
}

function populateBioPlayerSelect(players) {
  const sel = document.getElementById('select-bio-player');
  if (!sel) return;
  sel.innerHTML = '';

  const list = (players && players.length > 0) ? players : [];
  list.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `#${p.numero} ${p.nombre} (${p.posicion || 'OF'})`;
    sel.appendChild(opt);
  });

  onBioPlayerSelect();
}

function onBioPlayerSelect() {
  const sel = document.getElementById('select-bio-player');
  if (!sel) return;
  const playerId = parseInt(sel.value, 10);
  const currentPool = activeBioTeamRole === 'local' ? localTeamRoster : visitorTeamRoster;
  const player = currentPool.find(p => p.id === playerId) || currentPool[0];
  if (!player) return;

  const nameEl = document.getElementById('bio-player-name');
  const numEl = document.getElementById('bio-player-num');
  const titleInput = document.getElementById('bio-custom-title');
  const textEl = document.getElementById('bio-custom-text');
  const avatarEl = document.getElementById('bio-avatar-img');

  const { local, visitor } = getMatchupTeams();
  const activeTeam = activeBioTeamRole === 'local' ? local : visitor;
  const teamName = activeTeam.nombre;

  if (nameEl) nameEl.textContent = player.nombre.toUpperCase();
  if (numEl) numEl.textContent = `#${player.numero} — ${player.posicion || 'JUGADOR'}`;
  if (titleInput) titleInput.value = `${player.nombre.toUpperCase()} — #${player.numero}`;
  if (textEl) textEl.value = player.bio_texto || `${player.posicion || 'Jugador'}\n${teamName}`;
  if (avatarEl) { avatarEl.src = activeTeam.logo_url || ''; avatarEl.alt = `Logo de ${teamName}`; avatarEl.style.objectFit='contain'; }
}

async function pushBioToSingular(state = 'In') {
  const sel = document.getElementById('select-bio-player');
  if (!sel || !sel.value) {
    alert('Por favor selecciona un jugador primero.');
    return;
  }
  const playerId = parseInt(sel.value, 10);
  const customText = document.getElementById('bio-custom-text').value;
  const customTitle = document.getElementById('bio-custom-title') ? document.getElementById('bio-custom-title').value : null;

  try {
    const res = await fetch('/api/bio/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, customText, customTitle, state })
    });
    const data = await res.json();
    if (data.success) {
      alert(`Ficha biográfica de ${data.playerName || 'jugador'} transmitida a Singular.Live [${state}].`);
      const slide = document.getElementById('slide-player_bio');
      const tag = document.getElementById('slide-tag-player_bio');
      if (slide) slide.checked = (state === 'In');
      if (tag) {
        tag.textContent = (state === 'In' ? 'ON' : 'OFF');
        tag.classList.toggle('off', state !== 'In');
      }
    }
  } catch (err) {
    alert(`Fallo al transmitir biografía: ${err.message}`);
  }
}

// =========================================================
// LANZADOR RÁPIDO DE BIO EN VIVO (PANEL B)
// =========================================================

function setQuickBioTeam(role) {
  activeQuickBioTeamRole = role;
  const btnLoc = document.getElementById('btn-quick-bio-local');
  const btnVis = document.getElementById('btn-quick-bio-visitor');
  if (btnLoc) btnLoc.classList.toggle('active', role === 'local');
  if (btnVis) btnVis.classList.toggle('active', role === 'visitor');

  const players = role === 'local' ? localTeamRoster : visitorTeamRoster;
  populatePanelBQuickBio(players);
}

function populatePanelBQuickBio(players) {
  const sel = document.getElementById('panel-b-bio-player-select');
  if (!sel) return;
  sel.innerHTML = '';

  const list = (players && players.length > 0) ? players : [];
  list.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `#${p.numero} ${p.nombre} (${p.posicion || 'OF'})`;
    sel.appendChild(opt);
  });

  onPanelBPlayerSelect();
}

function onPanelBPlayerSelect() {
  const sel = document.getElementById('panel-b-bio-player-select');
  if (!sel) return;
  const playerId = parseInt(sel.value, 10);
  const currentPool = activeQuickBioTeamRole === 'local' ? localTeamRoster : visitorTeamRoster;
  const player = currentPool.find(p => p.id === playerId) || currentPool[0];
  if (!player) return;

  const { local, visitor } = getMatchupTeams();
  const activeTeam = activeQuickBioTeamRole === 'local' ? local : visitor;
  const teamName = activeTeam.nombre;

  const subDesc = document.getElementById('panel-b-bio-active-label');
  if (subDesc) subDesc.textContent = `#${player.numero} ${player.nombre}`;

  const textEl = document.getElementById('panel-b-bio-custom-text');
  if (textEl) {
    textEl.value = player.bio_texto || `${player.posicion || 'Jugador'}\n${teamName}`;
  }
}

async function triggerPanelBBio(state = 'In') {
  const sel = document.getElementById('panel-b-bio-player-select');
  if (!sel || !sel.value) return;
  const playerId = parseInt(sel.value, 10);
  const currentPool = activeQuickBioTeamRole === 'local' ? localTeamRoster : visitorTeamRoster;
  const player = currentPool.find(p => p.id === playerId) || currentPool[0];
  if (!player) return;

  const customText = document.getElementById('panel-b-bio-custom-text') ? document.getElementById('panel-b-bio-custom-text').value : null;
  const customTitle = `${player.nombre.toUpperCase()} — #${player.numero}`;

  try {
    const res = await fetch('/api/bio/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, customText, customTitle, state })
    });
    const data = await res.json();
    if (data.success) {
      console.log(`[Player Bio] Transmitido ${player.nombre} [${state}]`);
      const slide = document.getElementById('slide-player_bio');
      const tag = document.getElementById('slide-tag-player_bio');
      if (slide) slide.checked = (state === 'In');
      if (tag) {
        tag.textContent = (state === 'In' ? 'ON' : 'OFF');
        tag.classList.toggle('off', state !== 'In');
      }
    }
  } catch (err) {
    console.error('Error al lanzar bio en Panel B:', err);
  }
}

// =========================================================
// CRUD: GESTOR DE EQUIPOS
// =========================================================

function renderTeamsManager() {
  const container = document.getElementById('teams-manager-grid');
  if (!container) return;
  container.innerHTML = '';

  teamsCatalog.forEach(t => {
    const card = document.createElement('div');
    card.className = 'team-manager-card';
    card.innerHTML = `
      <div class="tmc-info">
        <img src="${t.logo_url || '/assets/logos/tij.svg'}" class="tmc-logo">
        <div class="tmc-texts">
          <span class="tmc-name">${t.nombre}</span>
          <span class="tmc-siglas">${t.siglas} · ${t.color_primario}</span>
        </div>
      </div>
      <div class="tmc-actions">
        <button class="btn-small-action" onclick="openEditTeamModal(${t.id})">Editar</button>
        ${t.id !== 1 ? `<button class="btn-small-action delete" onclick="deleteTeam(${t.id})">Eliminar</button>` : ''}
      </div>
    `;
    container.appendChild(card);
  });
}

function openNewTeamModal() {
  currentTeamBeingEditedId = null;
  document.getElementById('team-form-title').textContent = 'Añadir Nuevo Equipo a la Liga';
  document.getElementById('team-form-id').value = '';
  document.getElementById('team-form-name').value = '';
  document.getElementById('team-form-siglas').value = '';
  document.getElementById('team-form-color1').value = '#C4122F';
  document.getElementById('team-form-color1-hex').value = '#C4122F';
  document.getElementById('team-form-color2').value = '#000000';
  document.getElementById('team-form-color2-hex').value = '#000000';
  document.getElementById('team-form-logo-url').value = '/assets/logos/tij.svg';
  document.getElementById('team-form-logo-preview').src = '/assets/logos/tij.svg';
  document.getElementById('team-edit-box').style.display = 'block';
  document.getElementById('team-edit-box').scrollIntoView({ behavior: 'smooth' });
}

function openEditTeamModal(id) {
  const team = teamsCatalog.find(t => t.id === id);
  if (!team) return;

  currentTeamBeingEditedId = id;
  document.getElementById('team-form-title').textContent = `Editar Equipo: ${team.nombre}`;
  document.getElementById('team-form-id').value = team.id;
  document.getElementById('team-form-name').value = team.nombre;
  document.getElementById('team-form-siglas').value = team.siglas;
  document.getElementById('team-form-color1').value = team.color_primario;
  document.getElementById('team-form-color1-hex').value = team.color_primario;
  document.getElementById('team-form-color2').value = team.color_secundario || '#000000';
  document.getElementById('team-form-color2-hex').value = team.color_secundario || '#000000';
  document.getElementById('team-form-logo-url').value = team.logo_url || '/assets/logos/tij.svg';
  document.getElementById('team-form-logo-preview').src = team.logo_url || '/assets/logos/tij.svg';
  document.getElementById('team-edit-box').style.display = 'block';
  document.getElementById('team-edit-box').scrollIntoView({ behavior: 'smooth' });
}

function closeTeamEditBox() {
  document.getElementById('team-edit-box').style.display = 'none';
}

// Carga de archivo de Logo
async function onTeamLogoFileSelected(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    const dataUrl = e.target.result;
    document.getElementById('team-form-logo-preview').src = dataUrl;

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataUrl,
          folder: 'logos',
          filename: file.name
        })
      });
      const data = await res.json();
      if (data.success) {
        document.getElementById('team-form-logo-url').value = data.url;
      }
    } catch (err) {
      alert(`Error al subir logo: ${err.message}`);
    }
  };
  reader.readAsDataURL(file);
}

// Guardar Equipo (POST o PUT)
async function saveTeam(event) {
  event.preventDefault();
  const id = document.getElementById('team-form-id').value;
  const nombre = document.getElementById('team-form-name').value;
  const siglas = document.getElementById('team-form-siglas').value;
  const color_primario = document.getElementById('team-form-color1-hex').value;
  const color_secundario = document.getElementById('team-form-color2-hex').value;
  const logo_url = document.getElementById('team-form-logo-url').value;

  const payload = { nombre, siglas, color_primario, color_secundario, logo_url };

  try {
    let res;
    if (id) {
      res = await fetch(`/api/equipos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch('/api/equipos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    const data = await res.json();
    if (data.success) {
      alert(`Equipo ${nombre} guardado con éxito.`);
      closeTeamEditBox();
      await reloadTeamsCatalog();
    }
  } catch (err) {
    alert(`Error al guardar equipo: ${err.message}`);
  }
}

async function deleteTeam(id) {
  if (!confirm('¿Seguro que deseas eliminar este equipo?')) return;
  try {
    const res = await fetch(`/api/equipos/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      alert('Equipo eliminado correctamente.');
      await reloadTeamsCatalog();
    } else {
      alert(`Error: ${data.error}`);
    }
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
}

// =========================================================
// CRUD: GESTOR DE JUGADORES (ROSTER)
// =========================================================

async function loadRosterManager(teamId) {
  activeRosterManagerTeamId = parseInt(teamId, 10) || 1;
  try {
    const res = await fetch(`/api/equipos/${activeRosterManagerTeamId}/roster?includeInactive=${document.getElementById('show-inactive-roster').checked?'1':'0'}`);
    const players = await res.json();

    const tbody = document.getElementById('roster-manager-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    players.forEach(p => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-family: var(--font-mono); font-weight: 800;">#${p.numero}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <img src="${escapeHtml(teamsCatalog.find(t=>t.id===activeRosterManagerTeamId)?.logo_url || '')}" alt="Logo del equipo" style="width: 24px; height: 24px; object-fit: contain;">
            <strong>${escapeHtml(p.nombre)}</strong>${p.roster_activo===0?'<small>Historial'+(p.duplicate_of?' · duplicado':' · fuera del roster activo')+'</small>':''}
          </div>
        </td>
        <td style="color: var(--t-gray-400);">${p.posicion || 'OF'}</td>
        <td style="font-size: 11px; color: var(--t-gray-500); max-width: 250px;">${p.bio_texto || '-'}</td>
        <td>
          <button class="btn-small-action" onclick="openEditPlayerModal(${p.id})">Editar</button>
          <button class="btn-small-action delete" onclick="deletePlayer(${p.id})">Eliminar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error al cargar roster manager:', err);
  }
}

function openNewPlayerModal() {
  currentPlayerBeingEditedId = null;
  document.getElementById('player-form-title').textContent = 'Añadir Nuevo Jugador';
  document.getElementById('player-form-id').value = '';
  document.getElementById('player-form-team-id').value = activeRosterManagerTeamId;
  document.getElementById('player-form-num').value = '';
  document.getElementById('player-form-name').value = '';
  document.getElementById('player-form-pos').value = 'OF';
  document.getElementById('player-form-photo-url').value = '';
  document.getElementById('player-form-photo-preview').src = '/assets/players/lake.svg';
  document.getElementById('player-form-bio').value = '';
  document.getElementById('player-edit-box').style.display = 'block';
  document.getElementById('player-edit-box').scrollIntoView({ behavior: 'smooth' });
}

async function openEditPlayerModal(id) {
  try {
    const res = await fetch(`/api/equipos/${activeRosterManagerTeamId}/roster?includeInactive=1`);
    const players = await res.json();
    const player = players.find(p => p.id === id);
    if (!player) return;

    currentPlayerBeingEditedId = id;
    document.getElementById('player-form-title').textContent = `Editar Jugador: ${player.nombre}`;
    document.getElementById('player-form-id').value = player.id;
    document.getElementById('player-form-team-id').value = player.equipo_id;
    document.getElementById('player-form-num').value = player.numero;
    document.getElementById('player-form-name').value = player.nombre;
    document.getElementById('player-form-pos').value = player.posicion || 'OF';
    document.getElementById('player-form-photo-url').value = player.foto_url || '';
    document.getElementById('player-form-photo-preview').src = player.foto_url || '/assets/players/lake.svg';
    document.getElementById('player-form-bio').value = player.bio_texto || '';
    document.getElementById('player-edit-box').style.display = 'block';
    document.getElementById('player-edit-box').scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
}

function closePlayerEditBox() {
  document.getElementById('player-edit-box').style.display = 'none';
}

// Carga de archivo de Foto de Jugador
async function onPlayerPhotoFileSelected(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    const dataUrl = e.target.result;
    document.getElementById('player-form-photo-preview').src = dataUrl;

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataUrl,
          folder: 'players',
          filename: file.name
        })
      });
      const data = await res.json();
      if (data.success) {
        document.getElementById('player-form-photo-url').value = data.url;
      }
    } catch (err) {
      alert(`Error al subir foto: ${err.message}`);
    }
  };
  reader.readAsDataURL(file);
}

// Guardar Jugador (POST o PUT)
async function savePlayer(event) {
  event.preventDefault();
  const id = document.getElementById('player-form-id').value;
  const equipo_id = document.getElementById('player-form-team-id').value || activeRosterManagerTeamId;
  const numero = document.getElementById('player-form-num').value;
  const nombre = document.getElementById('player-form-name').value;
  const posicion = document.getElementById('player-form-pos').value;
  const foto_url = document.getElementById('player-form-photo-url').value;
  const bio_texto = document.getElementById('player-form-bio').value;

  const payload = { equipo_id, numero, nombre, posicion, foto_url, bio_texto };

  try {
    let res;
    if (id) {
      res = await fetch(`/api/jugadores/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch('/api/jugadores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    const data = await res.json();
    if (data.success) {
      alert(`Jugador ${nombre} guardado con éxito.`);
      closePlayerEditBox();
      loadRosterManager(activeRosterManagerTeamId);

      const { local, visitor } = getMatchupTeams();
      const editedTeamId = parseInt(equipo_id, 10);
      if (editedTeamId === local.id || editedTeamId === visitor.id) {
        await loadMatchupRosters(local.id, visitor.id);
      }
    }
  } catch (err) {
    alert(`Error al guardar jugador: ${err.message}`);
  }
}

async function deletePlayer(id) {
  if (!confirm('¿Seguro que deseas eliminar a este jugador?')) return;
  try {
    const res = await fetch(`/api/jugadores/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      alert('Jugador eliminado.');
      loadRosterManager(activeRosterManagerTeamId);
    }
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
}

// =========================================================
// OVERLAYS: CATÁLOGO TÉCNICO
// =========================================================

function filterOverlaysCatalog(cat) {
  currentOverlayCategoryFilter = cat;
  document.querySelectorAll('.btn-ov-filter').forEach(btn => {
    btn.classList.toggle('active', btn.id === `btn-filter-${cat}`);
  });
  renderOverlaysCatalog();
}

function triggerOverlayFromCard(overlayKey) {
  const meta = OVERLAYS_METADATA.find(o => o.key === overlayKey);
  if (!meta) return;

  const data = {};
  if (meta.fields && meta.fields.length > 0) {
    meta.fields.forEach(f => {
      const inputEl = document.getElementById(`ov-field-${overlayKey}-${f.key}`);
      if (inputEl) {
        data[f.key] = inputEl.value;
      }
    });
  }

  toggleOverlayState(overlayKey, 'In', data);
}

function renderOverlaysCatalog() {
  const container = document.getElementById('overlays-catalog-grid');
  if (!container) return;
  container.innerHTML = '';

  const list = currentOverlayCategoryFilter === 'all'
    ? OVERLAYS_METADATA
    : OVERLAYS_METADATA.filter(o => o.category === currentOverlayCategoryFilter);

  list.forEach(ov => {
    const card = document.createElement('div');
    card.className = 'b-card ov-catalog-card';
    card.id = `ov-card-${ov.key}`;

    const isActive = Boolean(activeOverlaysMap[ov.key]);

    let fieldsHtml = '';
    if (ov.fields && ov.fields.length > 0) {
      fieldsHtml = `<div class="ov-card-fields">` + ov.fields.map(f => {
        if (f.type === 'select') {
          const opts = f.options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('');
          return `
            <div class="ov-field-row">
              <label class="ov-field-label">${f.label}</label>
              <select id="ov-field-${ov.key}-${f.key}" class="b-select ov-input">${opts}</select>
            </div>
          `;
        }
        return `
          <div class="ov-field-row">
            <label class="ov-field-label">${f.label}</label>
            <input type="${f.type || 'text'}" id="ov-field-${ov.key}-${f.key}" class="b-input ov-input" value="${f.default || ''}" placeholder="${f.label}...">
          </div>
        `;
      }).join('') + `</div>`;
    }

    card.innerHTML = `
      <div class="b-card-header">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="b-card-title">${ov.name}</span>
          <span class="ov-category-pill cat-${ov.category}">${ov.categoryLabel || ov.category}</span>
        </div>
        <span class="cat-status-tag ${isActive ? 'active' : 'inactive'}" id="cat-badge-${ov.key}">
          ${isActive ? '● EN AIRE' : '● OFF'}
        </span>
      </div>
      <div style="font-size: 11px; color: var(--t-gray-400); line-height: 1.4;">${ov.desc}</div>
      <div style="font-size: 9px; font-family: var(--font-mono); color: var(--t-gray-500);">ID: ${ov.id}</div>
      ${fieldsHtml}
      <div class="ov-actions-row">
        <button type="button" id="btn-in-${ov.key}" class="btn-ov-action btn-ov-in ${isActive ? 'is-active' : ''}" onclick="triggerOverlayFromCard('${ov.key}')">
          <span class="ov-btn-dot"></span>
          <span class="ov-btn-text">${isActive ? 'EN EL AIRE' : 'IN [AIRE]'}</span>
        </button>
        <button type="button" id="btn-out-${ov.key}" class="btn-ov-action btn-ov-out ${!isActive ? 'is-active' : ''}" onclick="toggleOverlayState('${ov.key}', '${ov.outState || 'Out1'}')">
          <span class="ov-btn-dot"></span>
          <span class="ov-btn-text">${!isActive ? 'FUERA [OFF]' : 'OUT [OFF]'}</span>
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

// Conmutador de Pestañas
function switchPanel(panelKey) {
  document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.console-tab').forEach(t => t.classList.remove('active'));

  if (panelKey === 'b') {
    document.getElementById('panel-b-view').classList.add('active');
    document.getElementById('tab-btn-panel-b').classList.add('active');
  } else if (panelKey === 'a') {
    document.getElementById('panel-a-view').classList.add('active');
    document.getElementById('tab-btn-panel-a').classList.add('active');
    switchPanelASubTab('matchup');
  } else if (panelKey === 'teams') {
    document.getElementById('panel-a-view').classList.add('active');
    const tabTeams = document.getElementById('tab-btn-teams');
    if (tabTeams) tabTeams.classList.add('active');
    switchPanelASubTab('teams');
  } else if (panelKey === 'roster') {
    document.getElementById('panel-a-view').classList.add('active');
    const tabRoster = document.getElementById('tab-btn-roster');
    if (tabRoster) tabRoster.classList.add('active');
    switchPanelASubTab('roster');
  } else if (panelKey === 'overlays') {
    document.getElementById('overlays-view').classList.add('active');
    document.getElementById('tab-btn-overlays').classList.add('active');
    renderOverlaysCatalog();
  }
}



// =========================================================
// PROGRAMADOR DE CALENDARIO DE PARTIDOS & CUADRO DE PLAYOFFS
// =========================================================

let calendarioItems = [];
let bracketNodes = [];
let currentCalViewMode = 'list';
let isCalDrawerCollapsed = false;

// Alternar despliegue (acordeón) de la sección de calendario
function toggleCalendarioDrawer() {
  const body = document.getElementById('cal-collapsible-body');
  const header = document.querySelector('.cal-collapsible-header');
  const btn = document.getElementById('btn-cal-toggle-button');
  const arrow = document.getElementById('cal-toggle-arrow');
  if (!body) return;

  isCalDrawerCollapsed = !isCalDrawerCollapsed;
  body.classList.toggle('is-collapsed', isCalDrawerCollapsed);
  if (header) header.classList.toggle('is-collapsed', isCalDrawerCollapsed);
  if (btn) btn.textContent = isCalDrawerCollapsed ? 'Mostrar ▼' : 'Ocultar ▲';
  if (arrow) arrow.textContent = isCalDrawerCollapsed ? '' : '▼';

  try {
    localStorage.setItem('toros_cal_collapsed', isCalDrawerCollapsed ? 'true' : 'false');
  } catch (e) {}
}

// Conmutar entre Vista Lista y Vista Cuadro (Bracket)
function setCalendarioViewMode(mode) {
  currentCalViewMode = mode;
  const btnList = document.getElementById('btn-cal-view-list');
  const btnBracket = document.getElementById('btn-cal-view-bracket');
  const containerList = document.getElementById('cal-view-list-container');
  const containerBracket = document.getElementById('cal-view-bracket-container');

  if (btnList) btnList.classList.toggle('active', mode === 'list');
  if (btnBracket) btnBracket.classList.toggle('active', mode === 'bracket');

  if (mode === 'list') {
    if (containerList) containerList.style.display = 'block';
    if (containerBracket) containerBracket.style.display = 'none';
  } else {
    if (containerList) containerList.style.display = 'none';
    if (containerBracket) containerBracket.style.display = 'block';
    loadBracket();
  }

  // Si estaba colapsado, desplegarlo automáticamente al interactuar
  if (isCalDrawerCollapsed) {
    toggleCalendarioDrawer();
  }
}

async function loadCalendario() {
  const container = document.getElementById('calendario-cards-container');
  if (!container) return;

  try {
    const res = await fetch('/api/calendario');
    calendarioItems = await res.json();
    renderCalendario(calendarioItems);
    renderScheduledMatch();

    // Actualizar badge de resumen en el header
    const summaryBadge = document.getElementById('cal-summary-badge');
    if (summaryBadge) {
      const activeMatch = calendarioItems.find(x => x.activo);
      const activeDesc = activeMatch ? `Al Aire: ${activeMatch.local_siglas} vs ${activeMatch.visitor_siglas}` : 'Sin juego al aire';
      summaryBadge.textContent = `${calendarioItems.filter(c=>c.estado==='programado').length} pendientes · ${calendarioItems.filter(c=>c.estado==='finalizado').length} finalizados · ${activeDesc}`;
    }

  } catch (err) {
    console.error('Error al cargar calendario local:', err);
    container.innerHTML = `<div style="color: var(--t-red); font-size: 11px;">Error al cargar partidos del calendario: ${err.message}</div>`;
  }
}

function renderCalendario(items) {
  const container = document.getElementById('calendario-cards-container');
  if (!container) return;
  container.innerHTML = '';

  if (!items || items.length === 0) {
    container.innerHTML = `
      <div style="padding: 16px; text-align: center; color: var(--t-gray-400); font-size: 12px; background: rgba(0,0,0,0.2); border-radius: 6px;">
        No hay partidos programados en el calendario. Haz clic en <strong>"+ Programar Partido"</strong> para registrar uno.
      </div>
    `;
    return;
  }

  items.forEach(c => {
    const card = document.createElement('div');
    card.className = `cal-card ${c.activo ? 'active-broadcast' : ''}`;
    card.innerHTML = `
      <div class="cal-card-left">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap;">
          <span class="cal-serie-tag">${escapeHtml(c.serie_nombre || 'Temporada Regular')}</span>
          <span class="cal-date-tag">${escapeHtml(c.fecha_hora)} · Tijuana ${c.condicional ? '· Si es necesario' : ''}</span>
          ${c.activo ? '<span class="cal-live-tag">● AL AIRE EN SINGULAR</span>' : ''}
        </div>
        <div class="cal-teams-line">
          <div class="cal-team-item">
            <img src="${c.local_logo || '/assets/logos/tij.svg'}" class="cal-team-logo">
            <span class="cal-team-name"><strong>${escapeHtml(c.local_nombre)}</strong> (${escapeHtml(c.local_siglas)})</span>
            <span class="cal-role-pill">LOCAL</span>
          </div>
          <span class="cal-vs-span">VS</span>
          <div class="cal-team-item">
            <img src="${c.visitor_logo || '/assets/logos/mty.svg'}" class="cal-team-logo">
            <span class="cal-team-name"><strong>${escapeHtml(c.visitor_nombre)}</strong> (${escapeHtml(c.visitor_siglas)})</span>
            <span class="cal-role-pill vis">VISITANTE</span>
          </div>
        </div>
        <div style="font-size: 11px; color: var(--t-gray-400); margin-top: 4px;">
          <strong>Sede:</strong> ${escapeHtml(c.sede)} ${c.notas ? ` &nbsp;|&nbsp; <em>${escapeHtml(c.notas)}</em>` : ''} ${c.fuente ? `<a href="${escapeHtml(c.fuente)}" target="_blank" rel="noopener">Fuente</a>` : ''}
        </div>
      </div>
      <div class="cal-card-actions">
        ${c.estado === 'finalizado' ? `<span>Final: ${c.runs_local} – ${c.runs_visitante}</span>` : c.estado === 'cancelado' ? '<span>Cancelado: serie concluida</span>' : c.activo 
          ? '<span class="cal-active-btn-badge">ACTIVO EN TRANSMISIÓN</span>'
          : `<button type="button" class="btn-action-primary" style="padding: 7px 14px; font-size: 11px;" onclick="activarPartidoCalendario(${c.id})">Cargar y Transmitir al Aire</button>`
        }
        <div style="display: flex; gap: 6px; margin-top: 4px;">
          ${c.estado === 'programado' && !c.partido_id ? `<button type="button" class="btn-small-action" onclick="openEditCalendarioModal(${c.id})">Editar</button>
          <button type="button" class="btn-small-action delete" onclick="eliminarPartidoCalendario(${c.id})">Eliminar</button>` : ''}
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

async function activarPartidoCalendario(id) {
  try {
    const res = await fetch(`/api/calendario/${id}/activar`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      const item = data.item;
      if (data.state) {
        currentGameState = data.state;
        renderGameState(data.state);
      }

      const selLoc = document.getElementById('select-team-local');
      const selVis = document.getElementById('select-team-visitor');
      if (selLoc) selLoc.value = item.equipo_local_id;
      if (selVis) selVis.value = item.equipo_visitante_id;

      previewMatchupSelection();
      await loadMatchupRosters(item.equipo_local_id, item.equipo_visitante_id);
      await loadCalendario();
      if (currentCalViewMode === 'bracket') {
        await loadBracket();
      }

      switchPanelASubTab('matchup');
      if(data.syncError) alert(`Partido cargado. No se pudo sincronizar Singular: ${data.syncError}`);
      else alert(`¡Partido activado con éxito!\nAl aire: ${currentGameState.match.local.nombre} vs ${currentGameState.match.visitor.nombre}\nSingular.Live sincronizado en tiempo real.`);
    } else {
      alert(`Error al activar partido: ${data.error || 'Fallo desconocido'}`);
    }
  } catch (err) {
    alert(`Error de conexión: ${err.message}`);
  }
}

// =========================================================
// CUADRO DE PLAYOFFS / BRACKET LMB (Árbol Visual)
// =========================================================

async function loadBracket() {
  const container = document.getElementById('bracket-layout-tree');
  if (!container) return;

  try {
    container.innerHTML = '<div style="color: var(--t-gray-400); font-size: 12px; padding: 20px; text-align: center;">Cargando cuadro de playoffs LMB...</div>';
    const res = await fetch('/api/bracket');
    bracketNodes = await res.json();
    renderBracket(bracketNodes);
  } catch (err) {
    console.error('Error al cargar bracket:', err);
    container.innerHTML = `<div style="color: var(--t-red); font-size: 11px;">Error al cargar cuadro de playoffs: ${err.message}</div>`;
  }
}

function renderBracket(nodes) {
  bracketNodes=nodes;
  const container=document.getElementById('bracket-layout-tree');
  const row=(n,slot)=>{
    const winner=n.ganador_id===n[`equipo_${slot}_id`];
    return `<div class="brk-team-row ${winner?'winner':''}"><img class="brk-team-logo" src="${escapeHtml(n[`equipo_${slot}_logo`]||'')}" alt=""><span>${escapeHtml(n[`equipo_${slot}_nombre`])}</span><strong>${n[`score_${slot}`]}</strong></div>`;
  };
  container.innerHTML=['cuartos','semis','final_zona','serie_del_rey'].map((round,i)=>
    '<div class="brk-col"><div class="brk-col-title">'+['Primer Playoff','Series de Zona','Campeonatos de Zona','Serie del Rey'][i]+'</div>'+nodes.filter(n=>n.ronda===round).map(n=>
      '<div class="brk-match-card"><small>'+escapeHtml(n.zona.toUpperCase())+'</small>'+row(n,1)+row(n,2)+'<small>'+(n.ganador_id?'Ganador: '+escapeHtml(n.ganador_id===n.equipo_1_id?n.equipo_1_siglas:n.equipo_2_siglas):'Serie abierta')+' · Victorias</small>'+(n.fuente?'<br><a target="_blank" rel="noopener" href="'+escapeHtml(n.fuente)+'">Fuente inicial</a>':'<br><small>Registrada por el operador</small>')+'</div>'
    ).join('')+'</div>').join('');
}

function renderScheduledMatch() {
  const active=calendarioItems.find(c=>c.activo);
  const next=active||calendarioItems.find(c=>c.estado==='programado');
  document.getElementById('btn-finish-live').disabled=!active;
  document.getElementById('scheduled-match-banner').innerHTML=next
    ? '<div><h3>'+(active?'Partido cargado: ':'Partido programado: ')+escapeHtml(next.visitor_nombre)+' vs '+escapeHtml(next.local_nombre)+'</h3><p>'+escapeHtml(next.serie_nombre)+' · '+escapeHtml(next.fecha_hora)+' (Tijuana)</p></div><div class="schedule-actions">'+(active?'<button class="btn-small-action" onclick="activarPartidoCalendario('+next.id+')">Reenviar a Singular</button>':'<span>¿Deseas cargar este juego?</span><button class="btn-small-action" onclick="activarPartidoCalendario('+next.id+')">Cargar juego</button>')+'</div>'
    : `<h3>No hay partidos pendientes</h3><button class="btn-action-primary" onclick="switchPanelASubTab('calendar')">Ir al programador</button>`;
}

let finishingMatch=false;
async function finalizarPartidoActivo() {
  const c=calendarioItems.find(c=>c.activo);
  if(!c||finishingMatch) return;
  const score=currentGameState.state;
  if(!confirm('¿Finalizar '+c.visitor_nombre+' '+score.runs_visitante+' – '+score.runs_local+' '+c.local_nombre+'? Se guardará el resultado y se actualizará la serie.')) return;
  finishingMatch=true;
  try {
    const r=await fetch('/api/calendario/'+c.id+'/finalizar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({runs_local:score.runs_local,runs_visitante:score.runs_visitante})});
    const data=await r.json(); if(!r.ok) throw Error(data.error);
    await loadCalendario(); await loadBracket();
  }catch(e){alert(e.message);}finally{finishingMatch=false;}
}

async function populateSeries(selected='') {
  await loadBracket();
  document.getElementById('cal-form-bracket').innerHTML='<option value="">Temporada regular / sin bracket</option>'+bracketNodes.filter(n=>!n.ganador_id||n.id===selected).map(n=>'<option value="'+n.id+'">'+escapeHtml(n.equipo_1_nombre)+' vs '+escapeHtml(n.equipo_2_nombre)+' — '+escapeHtml(n.fecha_desc||n.ronda)+'</option>').join('');
  document.getElementById('cal-form-bracket').value=selected;
}

async function createCalendarSeries() {
  try {
    const r=await fetch('/api/bracket',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      equipo_local_id:document.getElementById('cal-form-local').value,
      equipo_visitante_id:document.getElementById('cal-form-visitor').value,
      nombre:document.getElementById('cal-form-serie').value,
      zona:document.getElementById('series-zone').value,
      ronda:document.getElementById('series-round').value
    })});
    const data=await r.json(); if(!r.ok) throw Error(data.error);
    await populateSeries(data.id);
  }catch(e){alert(e.message);}
}

function openNewCalendarioModal() {
  populateSeries(); document.getElementById('cal-form-conditional').checked=false;
  document.getElementById('cal-form-title').textContent = 'Programar Nuevo Partido';
  document.getElementById('cal-form-id').value = '';
  document.getElementById('cal-form-serie').value = 'Temporada Regular';
  document.getElementById('cal-form-sede').value = 'Estadio Chevron, Tijuana';
  document.getElementById('cal-form-notas').value = 'Transmisión Oficial';

  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById('cal-form-fecha').value = now.toISOString().slice(0, 16);

  populateCalendarioFormTeams(teamsCatalog.find(t=>t.siglas==='TIJ')?.id, teamsCatalog.find(t=>t.siglas==='TAB')?.id);
  document.getElementById('box-calendario-form').style.display = 'block';
  document.getElementById('box-calendario-form').scrollIntoView({ behavior: 'smooth' });
}

function openEditCalendarioModal(id) {
  const item = calendarioItems.find(x => x.id === id);
  if (!item) return;

  document.getElementById('cal-form-title').textContent = `Editar Partido: ${item.serie_nombre}`;
  document.getElementById('cal-form-id').value = item.id;
  document.getElementById('cal-form-serie').value = item.serie_nombre || 'Temporada Regular';
  document.getElementById('cal-form-sede').value = item.sede || 'Estadio Chevron, Tijuana';
  document.getElementById('cal-form-notas').value = item.notas || '';

  let valFecha = item.fecha_hora;
  if (valFecha && valFecha.includes(' ')) {
    valFecha = valFecha.replace(' ', 'T');
  }
  document.getElementById('cal-form-fecha').value = valFecha || '';

  populateSeries(item.bracket_id||''); document.getElementById('cal-form-conditional').checked=!!item.condicional;
  populateCalendarioFormTeams(item.equipo_local_id, item.equipo_visitante_id);
  document.getElementById('box-calendario-form').style.display = 'block';
  document.getElementById('box-calendario-form').scrollIntoView({ behavior: 'smooth' });
}

function populateCalendarioFormTeams(selectedLocalId, selectedVisitorId) {
  const selLoc = document.getElementById('cal-form-local');
  const selVis = document.getElementById('cal-form-visitor');
  if (!selLoc || !selVis) return;

  selLoc.innerHTML = '';
  selVis.innerHTML = '';

  teamsCatalog.forEach(t => {
    const opt1 = document.createElement('option');
    opt1.value = t.id;
    opt1.textContent = `${t.nombre} (${t.siglas})`;
    if (t.id === selectedLocalId) opt1.selected = true;
    selLoc.appendChild(opt1);

    const opt2 = document.createElement('option');
    opt2.value = t.id;
    opt2.textContent = `${t.nombre} (${t.siglas})`;
    if (t.id === selectedVisitorId) opt2.selected = true;
    selVis.appendChild(opt2);
  });
}

function closeCalendarioModal() {
  document.getElementById('box-calendario-form').style.display = 'none';
}

async function saveCalendarioForm() {
  const id = document.getElementById('cal-form-id').value;
  const equipo_local_id = document.getElementById('cal-form-local').value;
  const equipo_visitante_id = document.getElementById('cal-form-visitor').value;
  const serie_nombre = document.getElementById('cal-form-serie').value.trim();
  const fecha_raw = document.getElementById('cal-form-fecha').value;
  const sede = document.getElementById('cal-form-sede').value.trim();
  const notas = document.getElementById('cal-form-notas').value.trim();

  if (!equipo_local_id || !equipo_visitante_id || !fecha_raw) {
    alert('Por favor selecciona equipo local, visitante y fecha/hora.');
    return;
  }

  const fecha_hora = fecha_raw.replace('T', ' ');

  const payload = {
    bracket_id: document.getElementById('cal-form-bracket').value || null,
    condicional: document.getElementById('cal-form-conditional').checked,
    equipo_local_id: parseInt(equipo_local_id, 10),
    equipo_visitante_id: parseInt(equipo_visitante_id, 10),
    serie_nombre: serie_nombre || 'Temporada Regular',
    sede: sede || 'Estadio Chevron, Tijuana',
    fecha_hora,
    notas
  };

  try {
    let res;
    if (id) {
      res = await fetch(`/api/calendario/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch('/api/calendario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    const data = await res.json();
    if (data.success) {
      closeCalendarioModal();
      await loadCalendario();
    } else {
      alert(`Error al guardar partido: ${data.error || 'Fallo desconocido'}`);
    }
  } catch (err) {
    alert(`Error de conexión: ${err.message}`);
  }
}

async function eliminarPartidoCalendario(id) {
  if (!confirm('¿Estás seguro de que deseas eliminar este partido del calendario?')) return;
  try {
    const res = await fetch(`/api/calendario/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      await loadCalendario();
    } else {
      alert(`Error al eliminar: ${data.error || 'Fallo'}`);
    }
  } catch (err) {
    alert(`Error de conexión: ${err.message}`);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// =========================================================
// INTEGRACIÓN MLB STATS API (ROSTERS Y HEADSHOTS)
// =========================================================

async function loadMlbScheduleBanner(force = false) {
  const headline = document.getElementById('mlb-next-game-headline');
  const details = document.getElementById('mlb-next-game-details');
  const btn = document.getElementById('btn-apply-mlb-game');
  if (!headline) return;

  try {
    headline.textContent = 'Consultando calendario oficial LMB en MLB API...';
    const res = await fetch('/api/mlb/schedule/next');
    const data = await res.json();
    if (data.success && data.game) {
      currentNextMlbGame = data.game;
      const g = data.game;
      const homeName = g.homeTeam.name;
      const awayName = g.awayTeam.name;
      const venue = g.venue || 'Estadio LMB';
      const series = g.seriesDescription || 'Temporada Regular';
      const dateStr = new Date(g.gameDate || g.date).toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      headline.textContent = `${awayName} vs ${homeName}`;
      details.innerHTML = `<strong>Fecha:</strong> ${dateStr} &nbsp;|&nbsp; <strong>Sede:</strong> ${venue} &nbsp;|&nbsp; <strong>Serie:</strong> ${series}`;
      if (btn) btn.disabled = false;
    } else {
      headline.textContent = 'No se detectó próximo partido programado';
      details.textContent = 'Verifica la conexión a internet o el calendario de la temporada.';
      if (btn) btn.disabled = true;
    }
  } catch (err) {
    console.error('Error al cargar calendario MLB:', err);
    if (headline) headline.textContent = 'Calendario LMB no disponible temporalmente';
    if (details) details.textContent = err.message;
  }
}

async function applyMlbNextGame() {
  if (!currentNextMlbGame) return;
  const g = currentNextMlbGame;
  const resDb = g.resolvedDb;
  if (!resDb || !resDb.localTeamId || !resDb.visitorTeamId) {
    alert('No se pudieron asociar los equipos del calendario con los registros en la base de datos.');
    return;
  }

  const selLoc = document.getElementById('select-team-local');
  const selVis = document.getElementById('select-team-visitor');
  if (selLoc) selLoc.value = resDb.localTeamId;
  if (selVis) selVis.value = resDb.visitorTeamId;

  previewMatchupSelection();

  // Sincronizar roster del rival automáticamente si aún no tiene jugadores guardados
  try {
    const checkRival = await fetch(`/api/equipos/${resDb.visitorTeamId}/roster`);
    const rivalPlayers = await checkRival.json();
    if (rivalPlayers.length === 0) {
      console.log(`[MLB Sync] Auto-sincronizando roster del rival ${resDb.visitorTeamName}...`);
      await fetch(`/api/mlb/roster/sync/${resDb.visitorTeamId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: false })
      });
      await loadMatchupRosters(resDb.localTeamId, resDb.visitorTeamId);
    }
  } catch (e) {
    console.warn('[Auto-sync rival roster error]:', e);
  }

  alert(`Partido cargado en el formulario:\nLocal: ${resDb.localTeamName}\nVisitante: ${resDb.visitorTeamName}\n\nPresiona "APLICAR Y TRANSMITIR ENFRENTAMIENTO A SINGULAR.LIVE" cuando desees enviarlo al aire.`);
}

async function syncCurrentTeamRosterFromMlb() {
  const sel = document.getElementById('select-roster-manager-team');
  if (!sel) return;
  const teamId = parseInt(sel.value, 10);
  const btn = document.getElementById('btn-sync-mlb-roster');
  const originalText = btn ? btn.textContent : '';

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Sincronizando con MLB...';
  }

  try {
    const res = await fetch(`/api/mlb/roster/sync/${teamId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ force: true })
    });
    const data = await res.json();
    if (data.success) {
      alert(`¡Sincronización exitosa!\nSe actualizaron ${data.count} jugadores de ${data.teamName} con fotografías oficiales.`);
      await loadRosterManager(teamId);

      // Si el equipo sincronizado es parte del enfrentamiento actual, recargar los rosters activos
      const { local, visitor } = getMatchupTeams();
      if (teamId === local.id || teamId === visitor.id) {
        await loadMatchupRosters(local.id, visitor.id);
      }
    } else {
      alert(`Error al sincronizar: ${data.error || 'Fallo desconocido'}`);
    }
  } catch (err) {
    alert(`Error de conexión con MLB Stats API: ${err.message}`);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = originalText || 'Sincronizar Roster Oficial (MLB)';
    }
  }
}
