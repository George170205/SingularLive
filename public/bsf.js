// =========================================================
// MÓDULO BÉISBOL SIN FRONTERAS — CLIENTE UI (3 FASES)
// Control App Singular: 0FuwnDA057k7zosJmUACw5
// =========================================================

(function () {
  const bsfState = {
    initialized: false,
    status: null,
    subTab: 'phase1',
    league: 'LMP',
    date: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Tijuana' }).format(new Date()),
    yesterday: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Tijuana' }).format(new Date(Date.now() - 86400000)),
    season: '2026',
    tzMode: 'BOTH',
    postseason: false,
    dryRun: true,
    previews: {},
    liveStates: {},
    gamesList: [],
    selectedGamePk: '',
    playerResults: [],
    selectedPersonId: '',
    assets: [],
    historicalRecords: [],
    history: [],
    editingKey: null
  };

  const BSF_CARDS = [
    // FASE 1
    {
      key: 'overlay_9',
      phase: 'phase1',
      name: 'Overlay 9 — Juegos Para Hoy',
      id: 'e4bf7b3e-6d7f-46f8-bf6a-da3b02d7c297',
      tier: 'auto',
      tierLabel: 'AUTO API',
      desc: 'Cartelera del día (hasta 5 partidos, logos y horarios TIJ/CDMX).'
    },
    {
      key: 'overlay_7',
      phase: 'phase1',
      name: 'Overlay 7 — Resultados de Ayer (4 Juegos)',
      id: '4893753a-8655-49fb-9bf0-21a7e4858413',
      tier: 'auto',
      tierLabel: 'AUTO API',
      desc: 'Resumen de 4 resultados con detección automática de LLUVIA.'
    },
    {
      key: 'overlay_2',
      phase: 'phase1',
      name: 'Overlay 2 — Standing 10 Equipos',
      id: '03dbba3a-b283-47d6-acaf-db26975335e6',
      tier: 'auto',
      tierLabel: 'AUTO API',
      desc: 'Tabla de posiciones hasta 10 clubes (G, P, PCT, JV, PTS).'
    },
    {
      key: 'overlay_6',
      phase: 'phase1',
      name: 'Overlay 6 — Standing 8 Equipos c/ Logos',
      id: '14cffa3b-61f8-4592-9e3a-6ff1952133b1',
      tier: 'auto',
      tierLabel: 'AUTO API',
      desc: 'Standing con escudo por equipo (LVBP o ligas de 8 clubes).'
    },
    {
      key: 'overlay_5',
      phase: 'phase1',
      name: 'Overlay 5 — Playoffs LMB (Norte / Sur)',
      id: '83150026-00db-490d-b5f3-6cfdf7dd7452',
      tier: 'auto',
      tierLabel: 'AUTO API',
      desc: 'Posiciones límite de playoffs Zona Norte y Zona Sur con DIF-C.'
    },
    // FASE 2
    {
      key: 'overlay_8',
      phase: 'phase2',
      name: 'Overlay 8 — Resultado Detallado (1 Partido)',
      id: '860c9efd-c125-4ad7-b9e8-94a88981467d',
      tier: 'auto',
      tierLabel: 'AUTO API',
      desc: 'Boxscore + Play-by-Play: PG/PD/SV, bateadores (TB-H), Grand Slam, estadio y asistencia.'
    },
    {
      key: 'overlay_4',
      phase: 'phase2',
      name: 'Overlay 4 — 4 Destacados (Lomita u Ofensiva)',
      id: 'c2622f06-b0d0-4816-ba9e-93e4ecfe95f3',
      tier: 'hybrid',
      tierLabel: 'HÍBRIDO',
      desc: 'Top 4 lanzadores o bateadores por rango de fechas o temporada.'
    },
    {
      key: 'overlay_1',
      phase: 'phase2',
      name: 'Overlay 1 — Ficha de Jugador (Multilínea)',
      id: '4813e7dc-fa3e-459b-ad65-34e477d63f76',
      tier: 'hybrid',
      tierLabel: 'HÍBRIDO',
      desc: 'Ficha estadística dinámica para lanzador o bateador con nota al pie.'
    },
    {
      key: 'main_player',
      phase: 'phase2',
      name: 'mainComposition — Ficha Campos Fijos',
      id: '-P4ykk26D5g-4HCNPfBb',
      tier: 'hybrid',
      tierLabel: 'HÍBRIDO',
      desc: 'Ficha principal individual con casillas separadas y nota histórica.'
    },
    // FASE 3
    {
      key: 'overlay_13',
      phase: 'phase3',
      name: 'Overlay 13 — Los Más Veteranos (Slot 1)',
      id: '3cb5a265-3ae3-4f54-94a8-ce449221a307',
      tier: 'auto',
      tierLabel: 'AUTO API',
      desc: 'Top 10 jugadores de mayor edad de los rosters activos de la liga.'
    },
    {
      key: 'overlay_15',
      phase: 'phase3',
      name: 'Overlay 15 — Los Más Veteranos (Slot 2)',
      id: '3737a449-6392-4a24-900e-04ed694e7e95',
      tier: 'auto',
      tierLabel: 'AUTO API',
      desc: 'Segundo slot de tabla 3 columnas (ej. LMB vs LMP precargados).'
    },
    {
      key: 'overlay_11',
      phase: 'phase3',
      name: 'Overlay 11 — Lista 2 Columnas (Cumpleaños / Líderes)',
      id: '-P3dvERXV-J_I-B_Rb8Z',
      tier: 'hybrid',
      tierLabel: 'HÍBRIDO',
      desc: 'Lista rápida 2 columnas para cumpleaños del día (MM-DD) o ranking.'
    },
    {
      key: 'overlay_12',
      phase: 'phase3',
      name: 'Overlay 12 — Lista 2 Cols Encabezados Editables',
      id: 'd763377f-0d18-4341-bbeb-85623843adb3',
      tier: 'hybrid',
      tierLabel: 'HÍBRIDO',
      desc: 'Igual que Overlay 11 permitiendo personalizar encabezados Nombre/Año.'
    },
    {
      key: 'overlay_3',
      phase: 'phase3',
      name: 'Overlay 3 — Comparativa 2 Cols (Líderes / Históricos)',
      id: '91dd5782-5e48-4472-8e1b-30fde02783d9',
      tier: 'hybrid',
      tierLabel: 'HÍBRIDO',
      desc: 'Líderes de temporada vía API o tabla histórica editable LMP/LMB.'
    },
    {
      key: 'overlay_14',
      phase: 'phase3',
      name: 'Overlay 14 — Tabla 4 Cols Premios Históricos',
      id: '3d2e3237-34d8-416a-a31f-fe9bd01eb8d2',
      tier: 'hybrid',
      tierLabel: 'HÍBRIDO',
      desc: 'Ganadores históricos de premios MLB (Guante de Oro, MVP, Cy Young).'
    },
    {
      key: 'overlay_16',
      phase: 'phase3',
      name: 'Overlay 16 — Tabla 4 Cols Flexible',
      id: '17ada1c3-d5ba-434e-84a5-79178a4f03ea',
      tier: 'hybrid',
      tierLabel: 'HÍBRIDO',
      desc: 'Tabla de 4 columnas (Jugador, Posición, Equipo, Edad).'
    },
    {
      key: 'overlay_10',
      phase: 'phase3',
      name: 'Overlay 10 — 3 Tarjetas Premios / Manejador del Año',
      id: '9454e7b4-3f34-465f-a80b-331b47a0e75b',
      tier: 'hybrid',
      tierLabel: 'HÍBRIDO',
      desc: '3 nominados/ganadores MLB con foto, récord (G-P) y notas editables.'
    },
    {
      key: 'lower_third',
      phase: 'phase3',
      name: 'LOWER_THIRD — Pleca Inferior Editorial',
      id: 'a8a5b908-3129-4e5a-889f-b027282797b0',
      tier: 'manual',
      tierLabel: 'EDITORIAL',
      desc: '2 líneas editoriales de producción (sin alteración del botón Video Clip).'
    },
    {
      key: 'lower_third_medio',
      phase: 'phase3',
      name: 'LOWER_THIRD MEDIO — Pleca Doble Conductores',
      id: '0bf6655e-660b-40ba-a529-f171b300df8f',
      tier: 'manual',
      tierLabel: 'EDITORIAL',
      desc: 'Nombre y cargo Izquierda / Derecha para pantalla dividida.'
    }
  ];

  function esc(str) {
    return String(str === undefined || str === null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async function apiJson(url, opts = {}) {
    const res = await fetch(url, opts);
    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return data;
  }

  function renderLayout() {
    const root = document.getElementById('bsf-view');
    if (!root) return;

    root.innerHTML = `
      <div class="bsf-context-bar">
        <div class="bsf-context-fields">
          <div class="bsf-field">
            <label for="bsf-ctx-league">Liga</label>
            <select id="bsf-ctx-league" class="b-select" style="width:140px;">
              <option value="LMP">LMP (Pacífico)</option>
              <option value="LMB">LMB (Verano)</option>
              <option value="LVBP">LVBP (Venezuela)</option>
              <option value="MLB">MLB (Grandes Ligas)</option>
              <option value="LIDOM">LIDOM (Dominicana)</option>
            </select>
          </div>
          <div class="bsf-field">
            <label for="bsf-ctx-date">Fecha</label>
            <div style="display:flex;gap:4px;align-items:center;">
              <input type="date" id="bsf-ctx-date" class="b-input" style="width:140px;">
              <button type="button" class="bsf-btn" id="bsf-btn-today">Hoy</button>
              <button type="button" class="bsf-btn" id="bsf-btn-yesterday">Ayer</button>
            </div>
          </div>
          <div class="bsf-field">
            <label for="bsf-ctx-season">Temporada</label>
            <input type="text" id="bsf-ctx-season" class="b-input" style="width:76px;" value="${esc(bsfState.season)}">
          </div>
          <div class="bsf-field">
            <label for="bsf-ctx-tz">Zona Horaria</label>
            <select id="bsf-ctx-tz" class="b-select" style="width:185px;">
              <option value="BOTH">Ambos (TIJ + CDMX)</option>
              <option value="America/Tijuana">Tijuana (TIJ)</option>
              <option value="America/Mexico_City">Ciudad de México (CDMX)</option>
            </select>
          </div>
          <div class="bsf-field" style="justify-content:flex-end;">
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;color:var(--t-gray-300);text-transform:none;">
              <input type="checkbox" id="bsf-ctx-postseason"> Postemporada LMB
            </label>
          </div>
        </div>

        <div class="bsf-context-actions">
          <label class="bsf-dryrun-pill" id="bsf-dryrun-pill" title="En modo simulación no se envían cambios reales a Singular">
            <input type="checkbox" id="bsf-ctx-dryrun" checked>
            <span id="bsf-dryrun-label">SIMULACIÓN (DRY-RUN)</span>
          </label>
          <button type="button" class="bsf-btn" id="bsf-btn-refresh-live">Sincronizar Estado Singular</button>
          <a href="https://app.singular.live/controlapps/0FuwnDA057k7zosJmUACw5" target="_blank" rel="noreferrer" class="link-singular-manual">
            Control Manual (0Fuwn...)
          </a>
        </div>
      </div>

      <div class="bsf-subtabs-bar">
        <button type="button" class="bsf-subtab-btn active" data-bsf-tab="phase1">Fase 1 — Diaria (5)</button>
        <button type="button" class="bsf-subtab-btn" data-bsf-tab="phase2">Fase 2 — Partido y Jugadores (4)</button>
        <button type="button" class="bsf-subtab-btn" data-bsf-tab="phase3">Fase 3 — Rankings, Premios y Editoriales (10)</button>
        <button type="button" class="bsf-subtab-btn" data-bsf-tab="ops">Auto-Sync, Logos y Bitácora</button>
      </div>

      <div id="bsf-subpanel-phase1" class="bsf-subpanel active">
        <div class="bsf-cards-grid" id="bsf-grid-phase1"></div>
      </div>

      <div id="bsf-subpanel-phase2" class="bsf-subpanel">
        <div class="b-card" style="margin-bottom:12px;">
          <div class="b-card-header">
            <span class="b-card-title">Asistente de Partido y Jugadores (Fase 2)</span>
            <span class="b-card-tag">Boxscore · PlayByPlay · Stats</span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin-top:8px;">
            <div>
              <label style="font-size:10px;color:var(--t-gray-400);display:block;margin-bottom:4px;">JUEGOS DEL DÍA SELECCIONADO (PARA OVERLAY 8):</label>
              <div style="display:flex;gap:6px;">
                <select id="bsf-game-select" class="b-select" style="flex:1;"></select>
                <button type="button" class="bsf-btn gen" id="bsf-btn-load-games">Cargar Juegos</button>
              </div>
            </div>
            <div>
              <label style="font-size:10px;color:var(--t-gray-400);display:block;margin-bottom:4px;">BUSCADOR DE JUGADORES (PARA OVERLAY 1 / MAIN):</label>
              <div style="display:flex;gap:6px;">
                <input type="text" id="bsf-player-query" class="b-input" placeholder="Ej. Roel Ramirez, Kirk..." style="flex:1;">
                <button type="button" class="bsf-btn gen" id="bsf-btn-search-player">Buscar</button>
              </div>
              <div class="bsf-player-results" id="bsf-player-results"></div>
            </div>
          </div>
        </div>
        <div class="bsf-cards-grid" id="bsf-grid-phase2"></div>
      </div>

      <div id="bsf-subpanel-phase3" class="bsf-subpanel">
        <div class="bsf-cards-grid" id="bsf-grid-phase3"></div>
        <div class="b-card" style="margin-top:12px;border-left:3px solid #EF4444;">
          <div class="b-card-header">
            <span class="b-card-title">ENCUESTA | LMB (Referencia Visual)</span>
            <span class="bsf-pill manual">SIN SUBCOMPOSICIÓN EN TOKEN</span>
          </div>
          <p class="bsf-card-meta">La plantilla visual de Encuesta en «Singular Plantillas» corresponde a votaciones de audiencia y no existe como subcomposición dentro de <code>0FuwnDA057k7zosJmUACw5</code> ni proviene de MLB Stats API.</p>
        </div>
      </div>

      <div id="bsf-subpanel-ops" class="bsf-subpanel">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:14px;">
          <div class="b-card">
            <div class="b-card-header">
              <span class="b-card-title">Automatización Programada (Scheduler)</span>
              <span class="b-card-tag" id="bsf-sched-badge">Inactivo</span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">
              <div class="bsf-field">
                <label>Hora Mañana (TIJ)</label>
                <input type="time" id="bsf-sched-morning" class="b-input" value="09:00">
              </div>
              <div class="bsf-field">
                <label>Hora Cierre Noche (TIJ)</label>
                <input type="time" id="bsf-sched-night" class="b-input" value="01:30">
              </div>
              <div class="bsf-field" style="grid-column:1 / -1;">
                <label>Ligas en Rutina (separadas por coma)</label>
                <input type="text" id="bsf-sched-leagues" class="b-input" value="LMP,LMB,LVBP">
              </div>
              <label style="font-size:11px;display:flex;align-items:center;gap:6px;">
                <input type="checkbox" id="bsf-sched-enabled"> Activar Scheduler automático
              </label>
              <label style="font-size:11px;display:flex;align-items:center;gap:6px;">
                <input type="checkbox" id="bsf-sched-dryrun" checked> Solo Simulación (Dry-Run)
              </label>
            </div>
            <div style="display:flex;gap:8px;margin-top:12px;">
              <button type="button" class="bsf-btn gen" id="bsf-btn-save-sched">Guardar Configuración</button>
              <button type="button" class="bsf-btn preload" id="bsf-btn-run-sched">Ejecutar Rutina Ahora</button>
            </div>
          </div>

          <div class="b-card">
            <div class="b-card-header">
              <span class="b-card-title">Editor de Récord Histórico (Overlay 3)</span>
              <span class="b-card-tag">SQLite Local</span>
            </div>
            <div class="bsf-field" style="margin-top:8px;">
              <label>Título</label>
              <input type="text" id="bsf-hist-title" class="b-input">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">
              <div class="bsf-field">
                <label>Columna Izquierda (Jugador|Cifra)</label>
                <textarea id="bsf-hist-left" class="b-textarea" rows="5"></textarea>
              </div>
              <div class="bsf-field">
                <label>Columna Derecha (Jugador|Cifra)</label>
                <textarea id="bsf-hist-right" class="b-textarea" rows="5"></textarea>
              </div>
            </div>
            <div style="display:flex;gap:8px;margin-top:8px;align-items:flex-end;flex-wrap:wrap;">
              <div class="bsf-field" style="flex:1;min-width:180px;">
                <label>Imagen Derecha URL</label>
                <input type="text" id="bsf-hist-img" class="b-input">
              </div>
              <button type="button" class="bsf-btn gen" id="bsf-btn-save-hist">Guardar Histórico</button>
            </div>
            <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;align-items:center;">
              <button type="button" class="bsf-btn preload" id="bsf-btn-hist-preload">Guardar y Precargar [OUT1]</button>
              <button type="button" class="bsf-btn air" id="bsf-btn-hist-air">Guardar y Al Aire [IN]</button>
              <button type="button" class="bsf-btn off" id="bsf-btn-hist-off">Quitar Overlay 3 [OUT]</button>
              <span id="bsf-hist-status" style="font-size:10.5px;color:var(--t-gray-400);"></span>
            </div>
          </div>
        </div>

        <div class="b-card" style="margin-top:14px;">
          <div class="b-card-header">
            <span class="b-card-title">Catálogo de Logos y Assets (Rescatados + Editables)</span>
            <span class="b-card-tag" id="bsf-assets-count">0 assets</span>
          </div>
          <div class="bsf-assets-grid" id="bsf-assets-grid"></div>
        </div>

        <div class="b-card" style="margin-top:14px;">
          <div class="b-card-header">
            <span class="b-card-title">Bitácora de Envíos y Simulaciones</span>
            <button type="button" class="bsf-btn" id="bsf-btn-refresh-history">Actualizar</button>
          </div>
          <div style="overflow-x:auto;margin-top:8px;">
            <table class="bsf-history-table">
              <thead>
                <tr>
                  <th>Fecha/Hora</th>
                  <th>Overlay</th>
                  <th>Liga</th>
                  <th>Estado</th>
                  <th>Modo</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody id="bsf-history-tbody"></tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="b-card bsf-editor-drawer" id="bsf-editor-drawer" style="display:none;">
        <div class="b-card-header">
          <span class="b-card-title" id="bsf-editor-title">Editor de Payload antes de Emitir</span>
          <div style="display:flex;gap:6px;">
            <button type="button" class="bsf-btn preload" id="bsf-editor-preload">Precargar [OUT1]</button>
            <button type="button" class="bsf-btn air" id="bsf-editor-air">Enviar al Aire [IN]</button>
            <button type="button" class="bsf-btn off" id="bsf-editor-off">Quitar [OUT1]</button>
            <button type="button" class="bsf-btn" id="bsf-editor-close">Cerrar</button>
          </div>
        </div>
        <div class="bsf-editor-grid" id="bsf-editor-fields"></div>
      </div>
    `;

    bindEvents();
    renderAllPhaseGrids();
  }

  function cardExtraControlsHtml(card) {
    if (card.key === 'overlay_2' || card.key === 'overlay_6') {
      return `<div class="bsf-field"><label>División Index</label><input type="number" class="b-input" id="bsf-opt-${card.key}-div" value="0" min="0" max="5"></div>`;
    }
    if (card.key === 'overlay_5') {
      return `<div class="bsf-field"><label>Posiciones (ej. 7,8)</label><input type="text" class="b-input" id="bsf-opt-overlay_5-ranks" value="7,8"></div>`;
    }
    if (card.key === 'overlay_4') {
      return `
        <div class="bsf-field"><label>Modalidad</label>
          <select class="b-select" id="bsf-opt-overlay_4-mode"><option value="pitching">Lomita (Pitching)</option><option value="hitting">Ofensiva (Hitting)</option></select>
        </div>
        <div class="bsf-field"><label>Inicio / Fin</label><input type="text" class="b-input" id="bsf-opt-overlay_4-range" placeholder="YYYY-MM-DD,YYYY-MM-DD"></div>`;
    }
    if (card.key === 'overlay_1' || card.key === 'main_player') {
      return `
        <div class="bsf-field"><label>Person ID MLB</label><input type="text" class="b-input" id="bsf-opt-${card.key}-personId" placeholder="Usa buscador arriba"></div>
        <div class="bsf-field"><label>Grupo Stats</label>
          <select class="b-select" id="bsf-opt-${card.key}-group"><option value="pitching">Pitcheo</option><option value="hitting">Bateo</option></select>
        </div>`;
    }
    if (card.key === 'overlay_3') {
      return `
        <div class="bsf-field"><label>Fuente</label>
          <select class="b-select" id="bsf-opt-overlay_3-source"><option value="season">Líderes Temporada (API)</option><option value="historical">Históricos Guardados (SQLite)</option></select>
        </div>
        <div class="bsf-field"><label>Categoría API</label><input type="text" class="b-input" id="bsf-opt-overlay_3-cat" value="hits"></div>
        <div class="bsf-field" style="justify-content:flex-end;">
          <button type="button" class="bsf-btn" id="bsf-btn-goto-hist">Editar Históricos</button>
        </div>`;
    }
    if (card.key === 'overlay_13' || card.key === 'overlay_15' || card.key === 'overlay_16') {
      return `
        <div class="bsf-field" style="justify-content:center;">
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;color:var(--t-gray-300);text-transform:none;">
            <input type="checkbox" id="bsf-opt-${card.key}-abbrev" checked> Acortar nombres largos (>16 car.)
          </label>
        </div>`;
    }
    if (card.key === 'overlay_11' || card.key === 'overlay_12') {
      return `
        <div class="bsf-field"><label>Modo</label>
          <select class="b-select" id="bsf-opt-${card.key}-mode"><option value="birthdays">Cumpleaños (MM-DD)</option><option value="leaders">Top Líderes</option></select>
        </div>
        <div class="bsf-field"><label>Categoría</label><input type="text" class="b-input" id="bsf-opt-${card.key}-cat" value="homeRuns"></div>`;
    }
    if (card.key === 'overlay_10' || card.key === 'overlay_14') {
      const def = card.key === 'overlay_10' ? 'ALMOY' : 'NLGG';
      return `<div class="bsf-field"><label>Award ID MLB</label>
        <select class="b-select" id="bsf-opt-${card.key}-awardId">
          <option value="ALMOY" ${def === 'ALMOY' ? 'selected' : ''}>ALMOY (Mánager AL)</option>
          <option value="NLMOY">NLMOY (Mánager NL)</option>
          <option value="ALMVP">ALMVP (MVP AL)</option>
          <option value="NLMVP">NLMVP (MVP NL)</option>
          <option value="ALCY">ALCY (Cy Young AL)</option>
          <option value="NLCY">NLCY (Cy Young NL)</option>
          <option value="NLGG" ${def === 'NLGG' ? 'selected' : ''}>NLGG (Guante Oro NL)</option>
          <option value="ALGG">ALGG (Guante Oro AL)</option>
          <option value="MLBNLPGG">MLBNLPGG (Guante Platino NL)</option>
        </select></div>`;
    }
    if (card.key === 'lower_third') {
      return `
        <div class="bsf-field"><label>Línea 1</label><input type="text" class="b-input" id="bsf-opt-lower_third-l1" value="COMPARTE TUS COMENTARIOS POR MENSAJE"></div>
        <div class="bsf-field"><label>Línea 2</label><input type="text" class="b-input" id="bsf-opt-lower_third-l2" value="TU OPINIÓN ES IMPORTANTE"></div>`;
    }
    if (card.key === 'lower_third_medio') {
      return `
        <div class="bsf-field"><label>Nombre Izq / Cargo</label><input type="text" class="b-input" id="bsf-opt-lower_third_medio-izq" value="Conductor 1|Comentarista"></div>
        <div class="bsf-field"><label>Nombre Der / Cargo</label><input type="text" class="b-input" id="bsf-opt-lower_third_medio-der" value="Invitado|Analista"></div>`;
    }
    return '';
  }

  function renderAllPhaseGrids() {
    ['phase1', 'phase2', 'phase3'].forEach(phase => {
      const grid = document.getElementById(`bsf-grid-${phase}`);
      if (!grid) return;
      const cards = BSF_CARDS.filter(c => c.phase === phase);
      grid.innerHTML = cards
        .map(card => {
          const live = bsfState.liveStates[card.key];
          const isIn = live === 'In';
          const preview = bsfState.previews[card.key];
          const summaryText = preview ? summarizePayload(preview.payload) : 'Sin vista previa generada aún.';
          const extra = cardExtraControlsHtml(card);

          return `
            <div class="b-card bsf-card" id="bsf-card-${card.key}">
              <div class="b-card-header">
                <div>
                  <span class="b-card-title">${esc(card.name)}</span>
                  <div class="bsf-card-id">ID: ${esc(card.id)}</div>
                </div>
                <div class="bsf-badge-row">
                  <span class="bsf-pill ${card.tier}">${esc(card.tierLabel)}</span>
                  <span class="bsf-pill ${isIn ? 'state-in' : 'state-out'}" id="bsf-state-pill-${card.key}">${esc(live || 'OUT1')}</span>
                </div>
              </div>
              <div class="bsf-card-meta">${esc(card.desc)}</div>
              ${extra ? `<div class="bsf-card-controls">${extra}</div>` : ''}
              <div class="bsf-preview-summary" id="bsf-preview-${card.key}">${esc(summaryText)}</div>
              <div class="bsf-actions-bar">
                <button type="button" class="bsf-btn gen" data-bsf-action="preview" data-key="${card.key}">Generar</button>
                <button type="button" class="bsf-btn" data-bsf-action="edit" data-key="${card.key}">Editar</button>
                <button type="button" class="bsf-btn preload" data-bsf-action="push" data-state="Out1" data-key="${card.key}">Precargar [OUT1]</button>
                <button type="button" class="bsf-btn air" data-bsf-action="push" data-state="In" data-key="${card.key}">Al Aire [IN]</button>
                <button type="button" class="bsf-btn off" data-bsf-action="push" data-state="Out1" data-only-state="1" data-key="${card.key}">Quitar [OUT]</button>
              </div>
            </div>
          `;
        })
        .join('');
    });
  }

  function summarizePayload(payload = {}) {
    return Object.entries(payload)
      .filter(([, v]) => typeof v === 'string' && !v.startsWith('http') && !v.startsWith('//') && !v.startsWith('data:'))
      .slice(0, 8)
      .map(([k, v]) => `${k}: ${String(v).replace(/<[^>]+>/g, '').replace(/\n/g, ' / ')}`)
      .join('\n');
  }

  function collectParamsForKey(key) {
    const league = document.getElementById('bsf-ctx-league')?.value || bsfState.league;
    const date = document.getElementById('bsf-ctx-date')?.value || bsfState.date;
    const season = document.getElementById('bsf-ctx-season')?.value || bsfState.season;
    const tzMode = document.getElementById('bsf-ctx-tz')?.value || bsfState.tzMode;
    const postseason = Boolean(document.getElementById('bsf-ctx-postseason')?.checked);
    const params = { league, date, season, tzMode, postseason, force: false };

    if (key === 'overlay_2' || key === 'overlay_6') {
      params.divisionIndex = Number(document.getElementById(`bsf-opt-${key}-div`)?.value || 0);
    } else if (key === 'overlay_5') {
      const raw = document.getElementById('bsf-opt-overlay_5-ranks')?.value || '7,8';
      params.ranks = raw.split(',').map(x => parseInt(x.trim(), 10)).filter(Boolean);
    } else if (key === 'overlay_8') {
      const selGame = document.getElementById('bsf-game-select')?.value;
      if (selGame) params.gamePk = Number(selGame);
    } else if (key === 'overlay_4') {
      params.mode = document.getElementById('bsf-opt-overlay_4-mode')?.value || 'pitching';
      const rangeRaw = (document.getElementById('bsf-opt-overlay_4-range')?.value || '').trim();
      if (rangeRaw.includes(',')) {
        const [s, e] = rangeRaw.split(',').map(x => x.trim());
        params.startDate = s;
        params.endDate = e;
      } else {
        params.startDate = date;
        params.endDate = date;
      }
    } else if (key === 'overlay_1' || key === 'main_player') {
      const pid = document.getElementById(`bsf-opt-${key}-personId`)?.value || bsfState.selectedPersonId;
      if (pid) params.personId = Number(pid);
      params.group = document.getElementById(`bsf-opt-${key}-group`)?.value || 'pitching';
    } else if (key === 'overlay_3') {
      params.source = document.getElementById('bsf-opt-overlay_3-source')?.value || 'season';
      params.leaderCategory = document.getElementById('bsf-opt-overlay_3-cat')?.value || 'hits';
    } else if (key === 'overlay_13' || key === 'overlay_15' || key === 'overlay_16') {
      const abbrevChk = document.getElementById(`bsf-opt-${key}-abbrev`);
      params.abbreviateLongNames = abbrevChk ? Boolean(abbrevChk.checked) : true;
    } else if (key === 'overlay_11' || key === 'overlay_12') {
      params.mode = document.getElementById(`bsf-opt-${key}-mode`)?.value || 'birthdays';
      params.leaderCategory = document.getElementById(`bsf-opt-${key}-cat`)?.value || 'homeRuns';
    } else if (key === 'overlay_10' || key === 'overlay_14') {
      params.awardId = document.getElementById(`bsf-opt-${key}-awardId`)?.value || (key === 'overlay_10' ? 'ALMOY' : 'NLGG');
    } else if (key === 'lower_third') {
      params.line1 = document.getElementById('bsf-opt-lower_third-l1')?.value || '';
      params.line2 = document.getElementById('bsf-opt-lower_third-l2')?.value || '';
    } else if (key === 'lower_third_medio') {
      const [ni, ci] = (document.getElementById('bsf-opt-lower_third_medio-izq')?.value || '|').split('|');
      const [nd, cd] = (document.getElementById('bsf-opt-lower_third_medio-der')?.value || '|').split('|');
      params.nameIzq = ni || '';
      params.cargoIzq = ci || '';
      params.nameDer = nd || '';
      params.cargoDer = cd || '';
    }

    return params;
  }

  async function generatePreview(key) {
    const box = document.getElementById(`bsf-preview-${key}`);
    if (box) box.textContent = 'Consultando MLB Stats API...';
    try {
      const params = { ...collectParamsForKey(key), force: true };
      const data = await apiJson(`/api/bsf/preview/${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      bsfState.previews[key] = data;
      if (box) box.textContent = summarizePayload(data.payload);
      return data;
    } catch (err) {
      if (box) box.textContent = `Error: ${err.message}`;
      throw err;
    }
  }

  async function pushOverlay(key, state, { useCurrentEditor = false, onlyState = false } = {}) {
    const dryRun = Boolean(document.getElementById('bsf-ctx-dryrun')?.checked);
    const params = collectParamsForKey(key);
    let payload = null;

    const drawerEl = document.getElementById('bsf-editor-drawer');
    const drawerOpenForKey = Boolean(drawerEl && drawerEl.style.display !== 'none' && bsfState.editingKey === key);

    if (useCurrentEditor || drawerOpenForKey) {
      payload = readPayloadFromEditor();
    } else if (onlyState) {
      payload = bsfState.previews[key]?.payload || {};
    } else {
      const built = bsfState.previews[key] || (await generatePreview(key));
      payload = built.payload;
    }

    const res = await apiJson(`/api/bsf/push/${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload, state, params, dryRun })
    });

    if (!dryRun) {
      bsfState.liveStates[key] = state;
      const pill = document.getElementById(`bsf-state-pill-${key}`);
      if (pill) {
        pill.textContent = state;
        pill.className = `bsf-pill ${state === 'In' ? 'state-in' : 'state-out'}`;
      }
    }
    const box = document.getElementById(`bsf-preview-${key}`);
    if (box) {
      const prefix = res.dryRun ? '[SIMULADO DRY-RUN] ' : `[ENVIADO A SINGULAR: ${state}] `;
      box.textContent = `${prefix}\n${summarizePayload(res.payload)}`;
    }
    await loadHistory();
  }

  async function openPayloadEditor(key) {
    if (!bsfState.previews[key]) {
      try {
        await generatePreview(key);
      } catch (e) {
        return;
      }
    }
    bsfState.editingKey = key;
    const preview = bsfState.previews[key];
    const drawer = document.getElementById('bsf-editor-drawer');
    const title = document.getElementById('bsf-editor-title');
    const grid = document.getElementById('bsf-editor-fields');
    if (!drawer || !grid) return;

    title.textContent = `Editor de Payload — ${key} (${preview.subCompositionId})`;
    grid.innerHTML = Object.entries(preview.payload || {})
      .map(([fieldKey, val]) => {
        const str = String(val === undefined || val === null ? '' : val);
        const isMultiline = str.includes('\n') || str.length > 75;
        return `
          <div class="bsf-editor-field">
            <label>${esc(fieldKey)}</label>
            ${
              isMultiline
                ? `<textarea class="b-textarea bsf-edit-input" data-field="${esc(fieldKey)}" rows="3">${esc(str)}</textarea>`
                : `<input type="text" class="b-input bsf-edit-input" data-field="${esc(fieldKey)}" value="${esc(str)}">`
            }
          </div>
        `;
      })
      .join('');
    drawer.style.display = 'block';
    drawer.scrollIntoView({ behavior: 'smooth' });
  }

  function readPayloadFromEditor() {
    const out = {};
    document.querySelectorAll('#bsf-editor-fields .bsf-edit-input').forEach(el => {
      out[el.getAttribute('data-field')] = el.value;
    });
    if (bsfState.editingKey && bsfState.previews[bsfState.editingKey]) {
      bsfState.previews[bsfState.editingKey].payload = out;
    }
    return out;
  }

  async function loadGamesForSelector() {
    const league = document.getElementById('bsf-ctx-league')?.value || 'LMP';
    const date = document.getElementById('bsf-ctx-date')?.value || bsfState.yesterday;
    const postseason = Boolean(document.getElementById('bsf-ctx-postseason')?.checked);
    const sel = document.getElementById('bsf-game-select');
    if (!sel) return;
    sel.innerHTML = '<option value="">Cargando juegos...</option>';
    try {
      const data = await apiJson(`/api/bsf/games?league=${encodeURIComponent(league)}&date=${encodeURIComponent(date)}&postseason=${postseason ? '1' : '0'}`);
      bsfState.gamesList = data.games || [];
      if (bsfState.gamesList.length === 0) {
        sel.innerHTML = `<option value="">Sin juegos para ${league} el ${date}</option>`;
        return;
      }
      sel.innerHTML = bsfState.gamesList
        .map(g => {
          const score = g.awayTeam.score !== null && g.homeTeam.score !== null ? ` (${g.awayTeam.score}-${g.homeTeam.score})` : ` (${g.timeFormatted})`;
          return `<option value="${g.gamePk}">${esc(g.awayTeam.name)} vs ${esc(g.homeTeam.name)}${esc(score)} — ${esc(g.status)}</option>`;
        })
        .join('');
    } catch (err) {
      sel.innerHTML = `<option value="">Error: ${esc(err.message)}</option>`;
    }
  }

  async function searchPlayersUi() {
    const q = document.getElementById('bsf-player-query')?.value?.trim();
    const box = document.getElementById('bsf-player-results');
    if (!q || !box) return;
    box.innerHTML = '<span style="font-size:10px;color:var(--t-gray-400);">Buscando...</span>';
    try {
      const data = await apiJson(`/api/bsf/players/search?q=${encodeURIComponent(q)}`);
      bsfState.playerResults = data.people || [];
      if (bsfState.playerResults.length === 0) {
        box.innerHTML = '<span style="font-size:10px;color:var(--t-gray-400);">Sin resultados</span>';
        return;
      }
      box.innerHTML = bsfState.playerResults
        .map(p => `<button type="button" class="bsf-player-chip" data-person-id="${p.id}">${esc(p.fullName)} (${esc(p.primaryPosition || '-')}) #${p.id}</button>`)
        .join('');
      box.querySelectorAll('.bsf-player-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          const pid = btn.getAttribute('data-person-id');
          bsfState.selectedPersonId = pid;
          box.querySelectorAll('.bsf-player-chip').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          ['overlay_1', 'main_player'].forEach(k => {
            const inp = document.getElementById(`bsf-opt-${k}-personId`);
            if (inp) inp.value = pid;
          });
        });
      });
    } catch (err) {
      box.innerHTML = `<span style="font-size:10px;color:#F87171;">${esc(err.message)}</span>`;
    }
  }

  async function refreshLiveStates() {
    try {
      const data = await apiJson('/api/bsf/live-control');
      for (const item of data.items || []) {
        if (item.overlayKey) {
          bsfState.liveStates[item.overlayKey] = item.state;
        }
      }
      renderAllPhaseGrids();
    } catch (err) {
      console.warn('[BSF live-control]:', err.message);
    }
  }

  async function loadAssetsAndHistoricalAndHistory() {
    try {
      const [statusData, assetsData, histData, logData] = await Promise.all([
        apiJson('/api/bsf/status'),
        apiJson('/api/bsf/assets'),
        apiJson('/api/bsf/historical'),
        apiJson('/api/bsf/history?limit=25')
      ]);
      bsfState.status = statusData;
      bsfState.assets = assetsData.assets || [];
      bsfState.historicalRecords = histData.records || [];
      bsfState.history = logData.history || [];

      if (statusData.settings) {
        const tzEl = document.getElementById('bsf-ctx-tz');
        if (tzEl) tzEl.value = statusData.settings.tzMode || 'BOTH';
        const s = statusData.settings.scheduler || {};
        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        const setChk = (id, val) => { const el = document.getElementById(id); if (el) el.checked = Boolean(val); };
        setVal('bsf-sched-morning', s.morningTime || '09:00');
        setVal('bsf-sched-night', s.nightTime || '01:30');
        setVal('bsf-sched-leagues', (s.leagues || []).join(','));
        setChk('bsf-sched-enabled', s.enabled);
        setChk('bsf-sched-dryrun', s.dryRunOnly !== false);
        const badge = document.getElementById('bsf-sched-badge');
        if (badge) badge.textContent = s.enabled ? `Activo (${s.morningTime} / ${s.nightTime})` : 'Inactivo';
      }

      renderHistoricalEditor();
      renderAssetsGrid();
      renderHistoryTable();
    } catch (err) {
      console.error('[BSF load ops]:', err);
    }
  }

  async function loadHistory() {
    try {
      const logData = await apiJson('/api/bsf/history?limit=25');
      bsfState.history = logData.history || [];
      renderHistoryTable();
    } catch (e) {}
  }

  function renderHistoricalEditor() {
    const rec = bsfState.historicalRecords[0];
    if (!rec) return;
    const toLines = rows => (rows || []).map(r => `${r.name}|${r.value}`).join('\n');
    const tEl = document.getElementById('bsf-hist-title');
    const lEl = document.getElementById('bsf-hist-left');
    const rEl = document.getElementById('bsf-hist-right');
    const iEl = document.getElementById('bsf-hist-img');
    if (tEl) tEl.value = rec.title || '';
    if (lEl) lEl.value = toLines(rec.left_rows);
    if (rEl) rEl.value = toLines(rec.right_rows);
    if (iEl) iEl.value = rec.image_url || '';
  }

  function renderAssetsGrid() {
    const grid = document.getElementById('bsf-assets-grid');
    const count = document.getElementById('bsf-assets-count');
    if (count) count.textContent = `${bsfState.assets.length} assets`;
    if (!grid) return;

    grid.innerHTML = bsfState.assets
      .map(a => {
        const isImg = !/\.mp4$/i.test(a.url);
        return `
          <div class="bsf-asset-row">
            ${isImg ? `<img class="bsf-asset-thumb" src="${esc(a.url)}" alt="">` : '<div class="bsf-asset-thumb" style="display:flex;align-items:center;justify-content:center;font-size:9px;color:#93C5FD;">MP4</div>'}
            <div style="flex:1;min-width:0;">
              <div style="font-size:10.5px;font-weight:700;color:#FFF;">${esc(a.label)} <span style="font-family:var(--font-mono);color:var(--t-gray-500);">(${esc(a.asset_key)})</span></div>
              <div style="display:flex;gap:4px;margin-top:4px;flex-wrap:wrap;">
                <input type="text" class="b-input" id="bsf-asset-url-${esc(a.asset_key)}" value="${esc(a.url)}" style="font-size:10px;padding:3px 6px;flex:1;min-width:140px;">
                <button type="button" class="bsf-btn gen" data-save-asset="${esc(a.asset_key)}">Guardar</button>
                ${isImg ? `<label class="bsf-btn" style="cursor:pointer;">Subir<input type="file" accept="image/*" style="display:none;" data-upload-asset="${esc(a.asset_key)}"></label>` : ''}
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    grid.querySelectorAll('[data-save-asset]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const key = btn.getAttribute('data-save-asset');
        const url = document.getElementById(`bsf-asset-url-${key}`)?.value?.trim();
        if (!url) return;
        try {
          await apiJson(`/api/bsf/assets/${encodeURIComponent(key)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
          });
          await loadAssetsAndHistoricalAndHistory();
        } catch (err) {
          alert(`Error al guardar asset: ${err.message}`);
        }
      });
    });

    grid.querySelectorAll('[data-upload-asset]').forEach(inp => {
      inp.addEventListener('change', ev => {
        const key = inp.getAttribute('data-upload-asset');
        const file = ev.target.files && ev.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async e => {
          try {
            const up = await apiJson('/api/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ dataUrl: e.target.result, folder: 'logos', filename: file.name })
            });
            await apiJson(`/api/bsf/assets/${encodeURIComponent(key)}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: up.url })
            });
            await loadAssetsAndHistoricalAndHistory();
          } catch (err) {
            alert(`Error al subir logo: ${err.message}`);
          }
        };
        reader.readAsDataURL(file);
      });
    });
  }

  function renderHistoryTable() {
    const tbody = document.getElementById('bsf-history-tbody');
    if (!tbody) return;
    tbody.innerHTML = bsfState.history
      .map(h => `
        <tr>
          <td>${esc(h.createdAt || '')}</td>
          <td style="font-family:var(--font-mono);">${esc(h.overlayKey)}</td>
          <td>${esc(h.league || '-')}</td>
          <td>${esc(h.state || '-')}</td>
          <td>${h.dryRun ? '<span class="bsf-pill hybrid">SIMULADO</span>' : '<span class="bsf-pill auto">REAL</span>'}</td>
          <td>${esc(h.status)}${h.error ? ` — ${esc(h.error)}` : ''}</td>
        </tr>
      `)
      .join('');
  }

  function bindEvents() {
    document.getElementById('bsf-ctx-date').value = bsfState.date;
    document.getElementById('bsf-btn-today')?.addEventListener('click', () => {
      const val = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Tijuana' }).format(new Date());
      document.getElementById('bsf-ctx-date').value = val;
      bsfState.date = val;
    });
    document.getElementById('bsf-btn-yesterday')?.addEventListener('click', () => {
      const val = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Tijuana' }).format(new Date(Date.now() - 86400000));
      document.getElementById('bsf-ctx-date').value = val;
      bsfState.date = val;
    });

    const dryChk = document.getElementById('bsf-ctx-dryrun');
    const updateDryUi = () => {
      const isDry = Boolean(dryChk?.checked);
      bsfState.dryRun = isDry;
      const pill = document.getElementById('bsf-dryrun-pill');
      const lbl = document.getElementById('bsf-dryrun-label');
      if (pill) pill.classList.toggle('live-armed', !isDry);
      if (lbl) lbl.textContent = isDry ? 'SIMULACIÓN (DRY-RUN)' : 'ENVÍO REAL A SINGULAR';
    };
    dryChk?.addEventListener('change', updateDryUi);

    document.getElementById('bsf-ctx-league')?.addEventListener('change', e => {
      bsfState.league = e.target.value;
      if (bsfState.subTab === 'phase2') loadGamesForSelector();
    });
    document.getElementById('bsf-ctx-date')?.addEventListener('change', e => {
      bsfState.date = e.target.value;
      if (bsfState.subTab === 'phase2') loadGamesForSelector();
    });

    document.getElementById('bsf-ctx-tz')?.addEventListener('change', async e => {
      bsfState.tzMode = e.target.value;
      await apiJson('/api/bsf/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tzMode: bsfState.tzMode })
      }).catch(() => {});
    });

    document.querySelectorAll('.bsf-subtab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-bsf-tab');
        bsfState.subTab = target;
        document.querySelectorAll('.bsf-subtab-btn').forEach(b => b.classList.toggle('active', b === btn));
        document.querySelectorAll('.bsf-subpanel').forEach(p => p.classList.toggle('active', p.id === `bsf-subpanel-${target}`));
        if (target === 'phase2' && bsfState.gamesList.length === 0) {
          loadGamesForSelector();
        }
        if (target === 'ops') {
          loadAssetsAndHistoricalAndHistory();
        }
      });
    });

    const bsfRoot = document.getElementById('bsf-view');
    bsfRoot?.addEventListener('click', async ev => {
      const btn = ev.target.closest('[data-bsf-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-bsf-action');
      const key = btn.getAttribute('data-key');
      btn.disabled = true;
      try {
        if (action === 'preview') {
          await generatePreview(key);
        } else if (action === 'edit') {
          await openPayloadEditor(key);
        } else if (action === 'push') {
          const st = btn.getAttribute('data-state') || 'Out1';
          const onlyState = btn.getAttribute('data-only-state') === '1';
          await pushOverlay(key, st, { onlyState });
        }
      } catch (err) {
        alert(`Error en ${key}: ${err.message}`);
      } finally {
        btn.disabled = false;
      }
    });

    document.getElementById('bsf-btn-load-games')?.addEventListener('click', loadGamesForSelector);
    document.getElementById('bsf-btn-search-player')?.addEventListener('click', searchPlayersUi);
    document.getElementById('bsf-btn-refresh-live')?.addEventListener('click', refreshLiveStates);
    document.getElementById('bsf-btn-refresh-history')?.addEventListener('click', loadHistory);

    document.getElementById('bsf-editor-close')?.addEventListener('click', () => {
      document.getElementById('bsf-editor-drawer').style.display = 'none';
    });
    document.getElementById('bsf-editor-preload')?.addEventListener('click', () => bsfState.editingKey && pushOverlay(bsfState.editingKey, 'Out1', { useCurrentEditor: true }).catch(e => alert(e.message)));
    document.getElementById('bsf-editor-air')?.addEventListener('click', () => bsfState.editingKey && pushOverlay(bsfState.editingKey, 'In', { useCurrentEditor: true }).catch(e => alert(e.message)));
    document.getElementById('bsf-editor-off')?.addEventListener('click', () => bsfState.editingKey && pushOverlay(bsfState.editingKey, 'Out1', { useCurrentEditor: true }).catch(e => alert(e.message)));

    document.getElementById('bsf-btn-save-sched')?.addEventListener('click', async () => {
      try {
        const scheduler = {
          enabled: Boolean(document.getElementById('bsf-sched-enabled')?.checked),
          morningTime: document.getElementById('bsf-sched-morning')?.value || '09:00',
          nightTime: document.getElementById('bsf-sched-night')?.value || '01:30',
          leagues: (document.getElementById('bsf-sched-leagues')?.value || 'LMP').split(',').map(x => x.trim().toUpperCase()).filter(Boolean),
          dryRunOnly: Boolean(document.getElementById('bsf-sched-dryrun')?.checked)
        };
        await apiJson('/api/bsf/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scheduler })
        });
        await loadAssetsAndHistoricalAndHistory();
        alert('Configuración del Scheduler guardada.');
      } catch (err) {
        alert(`Error al guardar scheduler: ${err.message}`);
      }
    });

    document.getElementById('bsf-btn-run-sched')?.addEventListener('click', async () => {
      try {
        const dryRun = Boolean(document.getElementById('bsf-sched-dryrun')?.checked);
        const res = await apiJson('/api/bsf/scheduler/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slot: 'manual', dryRun })
        });
        await loadHistory();
        alert(`Rutina ejecutada (${res.run?.results?.length || 0} plantillas procesadas).`);
      } catch (err) {
        alert(`Error en rutina: ${err.message}`);
      }
    });

    const saveHistoricalFromUi = async () => {
      const parseLines = txt => String(txt || '').split('\n').map(l => l.trim()).filter(Boolean).map(l => {
        const [name, val] = l.split('|');
        return { name: (name || '').trim(), value: (val || '0').trim() };
      });
      await apiJson('/api/bsf/historical/lmp_lmb_hits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: document.getElementById('bsf-hist-title')?.value || '',
          left_rows: parseLines(document.getElementById('bsf-hist-left')?.value),
          right_rows: parseLines(document.getElementById('bsf-hist-right')?.value),
          image_url: document.getElementById('bsf-hist-img')?.value || ''
        })
      });
      const srcSel = document.getElementById('bsf-opt-overlay_3-source');
      if (srcSel) srcSel.value = 'historical';
      delete bsfState.previews.overlay_3;
      await loadAssetsAndHistoricalAndHistory();
    };

    const setHistStatus = txt => {
      const el = document.getElementById('bsf-hist-status');
      if (el) el.textContent = txt;
    };

    document.getElementById('bsf-btn-goto-hist')?.addEventListener('click', async () => {
      const opsBtn = document.querySelector('.bsf-subtab-btn[data-bsf-tab="ops"]');
      if (opsBtn) opsBtn.click();
      setTimeout(() => {
        document.getElementById('bsf-hist-title')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    });

    document.getElementById('bsf-btn-save-hist')?.addEventListener('click', async () => {
      try {
        await saveHistoricalFromUi();
        setHistStatus('Tabla histórica guardada en SQLite.');
      } catch (err) {
        alert(`Error al guardar histórico: ${err.message}`);
      }
    });

    const launchHistOverlay3 = async (targetState, onlyState = false) => {
      try {
        if (!onlyState) {
          await saveHistoricalFromUi();
          await generatePreview('overlay_3');
        }
        await pushOverlay('overlay_3', targetState, { onlyState });
        const dry = Boolean(document.getElementById('bsf-ctx-dryrun')?.checked);
        setHistStatus(dry ? `[SIMULADO DRY-RUN] Overlay 3 (${targetState})` : `[ENVIADO A SINGULAR] Overlay 3 (${targetState})`);
      } catch (err) {
        setHistStatus(`Error: ${err.message}`);
        alert(`Error en Overlay 3: ${err.message}`);
      }
    };

    document.getElementById('bsf-btn-hist-preload')?.addEventListener('click', () => launchHistOverlay3('Out1', false));
    document.getElementById('bsf-btn-hist-air')?.addEventListener('click', () => launchHistOverlay3('In', false));
    document.getElementById('bsf-btn-hist-off')?.addEventListener('click', () => launchHistOverlay3('Out1', true));
  }

  window.initBsfModule = async function initBsfModule() {
    if (!bsfState.initialized) {
      bsfState.initialized = true;
      renderLayout();
      await loadAssetsAndHistoricalAndHistory();
      refreshLiveStates();
    }
  };

  window.onBsfSocketUpdate = function onBsfSocketUpdate(evt) {
    if (!bsfState.initialized || !evt) return;
    if (evt.overlayKey && evt.state && !evt.dryRun) {
      bsfState.liveStates[evt.overlayKey] = evt.state;
      const pill = document.getElementById(`bsf-state-pill-${evt.overlayKey}`);
      if (pill) {
        pill.textContent = evt.state;
        pill.className = `bsf-pill ${evt.state === 'In' ? 'state-in' : 'state-out'}`;
      }
    }
    if (bsfState.subTab === 'ops') loadHistory();
  };
})();
