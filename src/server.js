const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const config = require('./config');
const db = require('./db/database');
const singularClient = require('./services/singularClient');
const gameStateManager = require('./services/gameStateManager');
const mlbStatsService = require('./services/mlbStatsService');

const calendar = require('./services/calendarService')(db, gameStateManager);
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.resolve(__dirname, '../public')));

// Pasar instancia de socket.io al gestor de estado
gameStateManager.setIo(io);

// === RUTAS REST API ===

// Estado general del sistema
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    appToken: config.SINGULAR_APP_TOKEN ? `${config.SINGULAR_APP_TOKEN.slice(0, 5)}...` : 'not_configured',
    singularQueue: {
      status: singularClient.queue.lastStatus,
      latencyMs: singularClient.queue.lastLatencyMs,
      lastError: singularClient.queue.lastError
    },
    activeMatchId: gameStateManager.activeMatchId
  });
});

// Carga de imágenes (Logos y Fotos) en base64
app.post('/api/upload', (req, res) => {
  try {
    const { dataUrl, folder, filename } = req.body;
    if (!dataUrl || !folder || !filename) {
      return res.status(400).json({ error: 'dataUrl, folder y filename son requeridos' });
    }
    const cleanFolder = folder === 'players' ? 'players' : 'logos';
    const ext = filename.split('.').pop() || 'png';
    const safeFilename = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`;
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    const targetDir = path.resolve(__dirname, '../public/assets', cleanFolder);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    
    const filePath = path.join(targetDir, safeFilename);
    fs.writeFileSync(filePath, buffer);
    
    const publicUrl = `/assets/${cleanFolder}/${safeFilename}`;
    res.json({ success: true, url: publicUrl });
  } catch (err) {
    console.error('Error al subir imagen:', err);
    res.status(500).json({ error: err.message });
  }
});

// Catálogo de Equipos: Listar
app.get('/api/equipos', (req, res) => {
  try {
    const equipos = db.prepare('SELECT * FROM equipos ORDER BY id ASC').all();
    res.json(equipos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear nuevo Equipo
app.post('/api/equipos', (req, res) => {
  try {
    const { nombre, siglas, color_primario, color_secundario, logo_url, mlb_id } = req.body;
    if (!nombre || !siglas || !color_primario) {
      return res.status(400).json({ error: 'Nombre, siglas y color primario son requeridos' });
    }
    const result = db.prepare(`
      INSERT INTO equipos (nombre, siglas, color_primario, color_secundario, logo_url, mlb_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(nombre, siglas.toUpperCase(), color_primario, color_secundario || '#000000', logo_url || '/assets/logos/tij.svg', mlb_id || null);
    
    const newTeam = db.prepare('SELECT * FROM equipos WHERE id = ?').get(result.lastInsertRowid);
    res.json({ success: true, equipo: newTeam });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Editar datos de un Equipo
app.put('/api/equipos/:id', async (req, res) => {
  try {
    const { nombre, siglas, color_primario, color_secundario, logo_url, mlb_id } = req.body;
    db.prepare(`
      UPDATE equipos 
      SET nombre = COALESCE(?, nombre),
          siglas = COALESCE(?, siglas),
          color_primario = COALESCE(?, color_primario),
          color_secundario = COALESCE(?, color_secundario),
          logo_url = COALESCE(?, logo_url),
          mlb_id = COALESCE(?, mlb_id)
      WHERE id = ?
    `).run(nombre, siglas ? siglas.toUpperCase() : null, color_primario, color_secundario, logo_url, mlb_id !== undefined ? mlb_id : null, req.params.id);

    gameStateManager.loadStateFromDb();
    const updated = db.prepare('SELECT * FROM equipos WHERE id = ?').get(req.params.id);

    // Si el equipo editado es parte del enfrentamiento activo (local o visitante), reenviar actualización integral a Singular
    const teamId = parseInt(req.params.id, 10);
    if (gameStateManager.localTeam && gameStateManager.visitorTeam &&
        (gameStateManager.localTeam.id === teamId || gameStateManager.visitorTeam.id === teamId)) {
      const sbPayload = singularClient.buildScoreBugPayload(gameStateManager.state, gameStateManager.localTeam, gameStateManager.visitorTeam);
      const fsPayload = singularClient.buildFullscreenMatchupPayload(gameStateManager.localTeam, gameStateManager.visitorTeam);
      const lwPayload = singularClient.buildLowerMatchupPayload(gameStateManager.localTeam, gameStateManager.visitorTeam);
      await Promise.all([
        singularClient.patchSingular(null, config.OVERLAY_IDS.score_bug, sbPayload),
        singularClient.patchSingular(null, config.OVERLAY_IDS.fullscreen_matchup, fsPayload),
        singularClient.patchSingular(null, config.OVERLAY_IDS.lower_matchup, lwPayload)
      ]).catch(err => console.error('[Equipos Sync Error]:', err.message));
      gameStateManager.broadcastAndSync(`Equipo actualizado en vivo: ${updated.nombre}`);
    }

    res.json({ success: true, equipo: updated });
  } catch (err) {
    console.error('Error al editar equipo:', err);
    res.status(500).json({ error: err.message });
  }
});

// Eliminar un Equipo
app.delete('/api/equipos/:id', (req, res) => {
  try {
    if (parseInt(req.params.id, 10) === 1) {
      return res.status(400).json({ error: 'No se puede eliminar el equipo principal de Toros' });
    }
    db.prepare('DELETE FROM equipos WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Roster de un Equipo
app.get('/api/equipos/:id/roster', async (req, res) => {
  try {
    const team=db.prepare('SELECT id FROM equipos WHERE id=?').get(req.params.id);
    if(!team) return res.status(404).json({error:'Equipo no encontrado'});
    const store=require('./services/rosterStore');
    const saved=store.list(db,team.id,req.query.includeInactive==='1');
    if(saved.length) return res.json(saved);
    try { await mlbStatsService.syncTeamRosterToDatabase(team.id); }
    catch(e) { res.set('X-Roster-Warning','Using saved roster; official source unavailable'); }
    const jugadores = require('./services/rosterStore').list(db,team.id,req.query.includeInactive==='1');
    res.json(jugadores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear nuevo Jugador
app.post('/api/jugadores', (req, res) => {
  try {
    const { equipo_id, numero, nombre, posicion, foto_url, bio_texto, mlb_id } = req.body;
    if (!equipo_id || !nombre) {
      return res.status(400).json({ error: 'equipo_id y nombre son requeridos' });
    }
    const result = db.prepare(`
      INSERT INTO jugadores (equipo_id, numero, nombre, posicion, foto_url, bio_texto, mlb_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(equipo_id, parseInt(numero, 10) || 0, nombre, posicion || 'OF', foto_url || '', bio_texto || '', mlb_id || null);
    
    const newPlayer = db.prepare('SELECT * FROM jugadores WHERE id = ?').get(result.lastInsertRowid);
    res.json({ success: true, jugador: newPlayer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Editar Jugador
app.put('/api/jugadores/:id', (req, res) => {
  try {
    const { numero, nombre, posicion, foto_url, bio_texto, mlb_id } = req.body;
    db.prepare(`
      UPDATE jugadores
      SET numero = COALESCE(?, numero),
          nombre = COALESCE(?, nombre),
          posicion = COALESCE(?, posicion),
          foto_url = COALESCE(?, foto_url),
          bio_texto = COALESCE(?, bio_texto),
          mlb_id = COALESCE(?, mlb_id)
      WHERE id = ?
    `).run(numero, nombre, posicion, foto_url, bio_texto, mlb_id !== undefined ? mlb_id : null, req.params.id);
    
    const updated = db.prepare('SELECT * FROM jugadores WHERE id = ?').get(req.params.id);
    res.json({ success: true, jugador: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar Jugador
app.delete('/api/jugadores/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM jugadores WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Estado actual del juego
app.get('/api/partidos/activo', (req, res) => {
  try {
    res.json(gameStateManager.getFullState());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Configurar y emitir Matchup (Panel A)
app.post('/api/matchup/set', async (req, res) => {
  try {
    const scheduled=db.prepare('SELECT * FROM calendario_partidos WHERE activo=1').get();
    if (scheduled && (Number(req.body.localId)!==scheduled.equipo_local_id || Number(req.body.visitorId)!==scheduled.equipo_visitante_id)) return res.status(409).json({error:'El enfrentamiento está vinculado al calendario. Finaliza el juego activo antes de cambiarlo.'});
    const { localId, visitorId } = req.body;
    if (!localId || !visitorId) {
      return res.status(400).json({ error: 'localId y visitorId son requeridos' });
    }

    const fullState = await gameStateManager.setActiveMatchup(localId, visitorId, scheduled?.partido_id);
    res.json({ success: true, state: fullState });
  } catch (err) {
    console.error('Error al actualizar matchup:', err);
    res.status(500).json({ error: err.message });
  }
});

// Enviar Lineup titular a Singular (Panel A o Panel B)
app.put('/api/lineups/:teamId', (req,res)=>{
  try{const lineup=require('./services/lineupTemplates').save(db,Number(req.params.teamId),req.body.rows);res.json(lineup);}
  catch(e){res.status(400).json({error:e.message});}
});
app.get('/api/lineups/:teamId', (req,res)=>{
  res.json(require('./services/lineupService')(db,Number(req.params.teamId),gameStateManager.activeMatchId));
});
app.post('/api/lineups/push', async (req, res) => {
  try {
    const { teamId, subtitle, state } = req.body;
    const targetTeamId = teamId || gameStateManager.localTeam.id;

    const team = db.prepare('SELECT * FROM equipos WHERE id = ?').get(targetTeamId);
    if (!team) return res.status(404).json({ error: 'Equipo no encontrado' });

    const {players} = require('./services/lineupService')(db,Number(targetTeamId),gameStateManager.activeMatchId);
    if(players.length!==11) return res.status(409).json({error:'Guarda la plantilla de 11 jugadores antes de transmitir.'});

    const targetState = state || 'In';
    const payload = singularClient.buildLineupPayload(team, players, subtitle || `Lineup Titular - ${team.nombre}`);
    const result = await singularClient.patchSingular(null, config.OVERLAY_IDS.team_lineups, payload, targetState);

    res.json({ success: true, result, teamName: team.nombre, targetState });
  } catch (err) {
    console.error('Error al enviar lineup a Singular:', err);
    res.status(500).json({ error: err.message });
  }
});

// Enviar Bio de Jugador a Singular (Panel B o Panel A)
app.post('/api/bio/push', async (req, res) => {
  try {
    const { playerId, customText, customTitle, state } = req.body;
    const player = db.prepare('SELECT * FROM jugadores WHERE id = ?').get(playerId);
    if (!player) return res.status(404).json({ error: 'Jugador no encontrado' });

    const team = db.prepare('SELECT * FROM equipos WHERE id = ?').get(player.equipo_id);
    const payload = singularClient.buildPlayerBioPayload(player, team, customText, customTitle);

    const targetState = state || 'In';
    const result = await singularClient.patchSingular(null, config.OVERLAY_IDS.player_bio, payload, targetState);
    res.json({ success: true, result, targetState, playerName: player.nombre });
  } catch (err) {
    console.error('Error al enviar bio a Singular:', err);
    res.status(500).json({ error: err.message });
  }
});

const OUT2_OVERLAYS = new Set([
  'player_bio',
  'comparison_stats',
  'lower_1_line',
  'lower_2_line',
  'upper_right_1_line',
  'upper_right_2_line'
]);

function resolveTargetState(overlayKey, requestedState) {
  if (!requestedState || requestedState === 'In') return 'In';
  const isOut = requestedState === 'Out' || requestedState === 'Out1' || requestedState === 'Out2';
  if (isOut) {
    return OUT2_OVERLAYS.has(overlayKey) ? 'Out2' : 'Out1';
  }
  return requestedState;
}

// Alternar visibilidad de un Overlay al aire (In / Out1 / Out2) y emitir payloads dinámicos
app.post('/api/overlay/toggle-state', async (req, res) => {
  try {
    const { overlayKey, state, payload: customPayload } = req.body;
    const subCompId = config.OVERLAY_IDS[overlayKey];
    if (!subCompId) return res.status(400).json({ error: 'Overlay no reconocido: ' + overlayKey });

    const finalState = resolveTargetState(overlayKey, state || 'In');
    let payload = customPayload || {};

    if ((!customPayload || Object.keys(customPayload).length === 0) && finalState === 'In') {
      const b = req.body;
      switch (overlayKey) {
        case 'score_bug':
          payload = singularClient.buildScoreBugPayload(
            gameStateManager.state,
            gameStateManager.localTeam,
            gameStateManager.visitorTeam
          );
          break;

        case 'fullscreen_matchup':
          payload = singularClient.buildFullscreenMatchupPayload(
            gameStateManager.localTeam,
            gameStateManager.visitorTeam,
            b.subtitle,
            b.dropline
          );
          break;

        case 'lower_matchup':
          payload = singularClient.buildLowerMatchupPayload(
            gameStateManager.localTeam,
            gameStateManager.visitorTeam,
            b.dropline
          );
          break;

        case 'team_lineups': {
          const teamId = Number(b.teamId || gameStateManager.localTeam.id);
          const team = db.prepare('SELECT * FROM equipos WHERE id=?').get(teamId);
          const lineup = require('./services/lineupService')(db, teamId, gameStateManager.activeMatchId);
          if (!team || lineup.players.length !== 11) {
            return res.status(409).json({ error: 'Guarda la plantilla de 11 jugadores antes de activar Team Lineups.' });
          }
          payload = singularClient.buildLineupPayload(team, lineup.players, b.subtitle || `Plantilla - ${team.nombre}`);
          break;
        }

        case 'comparison_stats': {
          const stats = Array.isArray(b.stats) && b.stats.length > 0 ? b.stats : [
            { v1: String(gameStateManager.localTeam.siglas || 'TIJ'), cat: 'VS', v2: String(gameStateManager.visitorTeam.siglas || 'VIS') },
            { v1: String(gameStateManager.state.runs_local || 0), cat: 'CARRERAS', v2: String(gameStateManager.state.runs_visitante || 0) },
            { v1: '.285', cat: 'AVG BATEO', v2: '.272' },
            { v1: '3.45', cat: 'PCL / ERA', v2: '4.10' },
            { v1: '42-28', cat: 'RECORD', v2: '38-32' }
          ];
          payload = singularClient.buildComparisonStatsPayload(
            gameStateManager.localTeam,
            gameStateManager.visitorTeam,
            stats,
            b.subtitle || 'Comparativa de Temporada',
            {
              dropline: b.dropline || 'Estadísticas Oficiales LMB',
              score1: b.score1 !== undefined ? b.score1 : gameStateManager.state.runs_local,
              score2: b.score2 !== undefined ? b.score2 : gameStateManager.state.runs_visitante
            }
          );
          break;
        }

        case 'background_image':
          payload = singularClient.buildBackgroundImagePayload(b.image || b.imageUrl || b.backgroundImage || '');
          break;

        case 'baseline_static':
          payload = singularClient.buildBaselineStaticPayload(b.text || b.baselineText || 'TOROS DE TIJUANA · TEMPORADA 2026');
          break;

        case 'freeform_image':
          payload = singularClient.buildFreeformImagePayload({
            image: b.image || b.imageUrl || '',
            positionX: b.positionX !== undefined ? b.positionX : 40,
            positionY: b.positionY !== undefined ? b.positionY : 40,
            size: b.size !== undefined ? b.size : 15,
            transparency: b.transparency !== undefined ? b.transparency : 100
          });
          break;

        case 'freeform_text':
          payload = singularClient.buildFreeformTextPayload({
            text: b.text || 'Toros de Tijuana',
            positionX: b.positionX !== undefined ? b.positionX : 40,
            positionY: b.positionY !== undefined ? b.positionY : 35,
            size: b.size !== undefined ? b.size : 40,
            transparency: b.transparency !== undefined ? b.transparency : 100
          });
          break;

        case 'lower_1_line':
          payload = singularClient.buildLower1LinePayload(b.text || 'TOROS DE TIJUANA');
          break;

        case 'lower_2_line':
          payload = singularClient.buildLower2LinePayload(
            b.line1 || b.line1Text || b['Line 1 Text'] || 'TOROS DE TIJUANA',
            b.line2 || b.line2Text || b['Line 2 Text'] || 'LIGA MEXICANA DE BÉISBOL'
          );
          break;

        case 'upper_right_1_line':
          payload = singularClient.buildUpperRight1LinePayload(b.text || '#ToroPower');
          break;

        case 'upper_right_2_line':
          payload = singularClient.buildUpperRight2LinePayload(
            b.line1 || b.line1Text || b['Line 1 Text'] || '#ToroPower',
            b.line2 || b.line2Text || b['Line 2 Text'] || 'EN VIVO'
          );
          break;

        case 'upper_right_social':
          payload = singularClient.buildUpperRightSocialPayload(
            b.text || '@TorosDeTijuana',
            b.socialMediaLogo || b.logo || ''
          );
          break;

        default:
          payload = {};
          break;
      }
    }

    const result = await singularClient.patchSingular(null, subCompId, payload, finalState);
    res.json({ success: true, overlayKey, state: finalState, result });
  } catch (err) {
    console.error('Error al conmutar overlay:', err);
    res.status(500).json({ error: err.message });
  }
});

// Gestión de Control Apps
app.get('/api/control-apps', (req, res) => {
  try {
    const apps = db.prepare(`
      SELECT id, nombre, deporte, activo, created_at,
             substr(app_token, 1, 4) || '...' || substr(app_token, -4) as token_preview
      FROM control_apps
    `).all();
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === RUTAS PROGRAMADOR DE CALENDARIO (Local DB) ===

// Listar partidos del calendario
app.get('/api/calendario', (req, res) => {
  try {
    const items = db.prepare(`
      SELECT c.*,
             l.nombre as local_nombre, l.siglas as local_siglas, l.logo_url as local_logo, l.color_primario as local_color,
             v.nombre as visitor_nombre, v.siglas as visitor_siglas, v.logo_url as visitor_logo, v.color_primario as visitor_color
      FROM calendario_partidos c
      JOIN equipos l ON c.equipo_local_id = l.id
      JOIN equipos v ON c.equipo_visitante_id = v.id
      ORDER BY c.fecha_hora ASC, c.id ASC
    `).all();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/calendario', (req,res)=>{
  try { const item=calendar.save(req.body); io.emit('calendario:actualizado'); res.json({success:true,item}); }
  catch(e){res.status(400).json({error:e.message});}
});
app.put('/api/calendario/:id',(req,res)=>{
  try { const item=calendar.save(req.body,req.params.id); io.emit('calendario:actualizado'); res.json({success:true,item}); }
  catch(e){res.status(400).json({error:e.message});}
});
app.delete('/api/calendario/:id',(req,res)=>{
  const c=calendar.get(req.params.id);
  if(!c) return res.status(404).json({error:'Partido no encontrado'});
  if(c.activo||c.estado!=='programado'||c.partido_id) return res.status(409).json({error:'Solo se pueden eliminar partidos pendientes sin cargar.'});
  db.prepare('DELETE FROM calendario_partidos WHERE id=?').run(c.id);
  io.emit('calendario:actualizado'); res.json({success:true});
});
app.post('/api/calendario/:id/activar',async(req,res)=>{
  try {
    const item=calendar.activate(req.params.id);
    gameStateManager.history=[];
    gameStateManager.loadStateFromDb(item.partido_id);
    let syncError=null;
    try { await gameStateManager.setActiveMatchup(item.equipo_local_id,item.equipo_visitante_id,item.partido_id); }
    catch(e){syncError=e.message;}
    io.emit('estado:actualizado',gameStateManager.getFullState());
    io.emit('calendario:actualizado');
    res.json({success:true,item,state:gameStateManager.getFullState(),syncError});
  }catch(e){res.status(400).json({error:e.message});}
});
app.post('/api/calendario/:id/finalizar',(req,res)=>{
  try {
    const item=calendar.finish(req.params.id,req.body);
    gameStateManager.history=[];
    io.emit('estado:actualizado',gameStateManager.getFullState()); io.emit('calendario:actualizado');
    res.json({success:true,item});
  }catch(e){res.status(409).json({error:e.message});}
});

// === RUTAS CUADRO DE PLAYOFFS / BRACKET LMB ===
app.post('/api/bracket', (req,res)=>{
  try {
    const {equipo_local_id,equipo_visitante_id,zona,ronda,nombre}=req.body;
    if (!['norte','sur','final'].includes(zona)||!['cuartos','semis','final_zona','serie_del_rey'].includes(ronda)||!String(nombre||'').trim()) throw Error('Completa nombre, zona y ronda de la serie.');
    const a=Number(equipo_local_id),b=Number(equipo_visitante_id);
    if(a===b||!db.prepare('SELECT id FROM equipos WHERE id=?').get(a)||!db.prepare('SELECT id FROM equipos WHERE id=?').get(b)) throw Error('Selecciona dos equipos distintos.');
    const id=require('crypto').randomUUID();
    db.prepare("INSERT INTO playoff_bracket (id,zona,ronda,pos_index,equipo_1_id,equipo_2_id,estado,fecha_desc) VALUES (?,?,?,0,?,?,'programado',?)").run(id,zona,ronda,a,b,String(nombre).trim());
    io.emit('calendario:actualizado'); res.json({success:true,id});
  }catch(e){res.status(400).json({error:e.message});}
});

// Obtener árbol completo de playoffs
app.get('/api/bracket', (req, res) => {
  try {
    const nodes = db.prepare(`
      SELECT b.*,
             e1.nombre as equipo_1_nombre, e1.siglas as equipo_1_siglas, e1.logo_url as equipo_1_logo, e1.color_primario as equipo_1_color,
             e2.nombre as equipo_2_nombre, e2.siglas as equipo_2_siglas, e2.logo_url as equipo_2_logo, e2.color_primario as equipo_2_color
      FROM playoff_bracket b
      JOIN equipos e1 ON b.equipo_1_id = e1.id
      JOIN equipos e2 ON b.equipo_2_id = e2.id
      ORDER BY 
        CASE b.zona WHEN 'norte' THEN 1 WHEN 'final' THEN 2 WHEN 'sur' THEN 3 END,
        CASE b.ronda WHEN 'cuartos' THEN 1 WHEN 'semis' THEN 2 WHEN 'final_zona' THEN 3 WHEN 'serie_del_rey' THEN 4 END,
        b.pos_index ASC
    `).all();
    res.json(nodes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === RUTAS MLB STATS API (Rosters, Headshots y Calendario) ===

// Consultar próximo partido oficial de Toros en calendario
app.get('/api/mlb/schedule/next', async (req, res) => {
  try {
    const nextGame = await mlbStatsService.getNextGame();
    res.json({ success: true, game: nextGame });
  } catch (err) {
    console.error('Error al obtener próximo juego:', err);
    res.status(500).json({ error: err.message });
  }
});

// Consultar calendario de próximos partidos
app.get('/api/mlb/schedule/upcoming', async (req, res) => {
  try {
    const games = await mlbStatsService.fetchSchedule();
    res.json({ success: true, games: games.slice(0, 10) });
  } catch (err) {
    console.error('Error al obtener calendario:', err);
    res.status(500).json({ error: err.message });
  }
});

// Sincronizar Roster oficial de un equipo (Cache-First)
app.post('/api/mlb/roster/sync/:teamId', async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId, 10);
    const force = Boolean(req.body && req.body.force);
    const result = await mlbStatsService.syncTeamRosterToDatabase(teamId, force);
    io.emit('roster:actualizado',{teamId});
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Error al sincronizar roster desde MLB:', err);
    res.status(500).json({ error: err.message });
  }
});

// === SOCKET.IO (Panel B - Tiempo Real) ===

io.on('connection', (socket) => {
  // Enviar estado actual de inmediato
  socket.emit('estado:actualizado', gameStateManager.getFullState());

  socket.use(([event],next)=>{
    const match=db.prepare('SELECT estado FROM partidos WHERE id=?').get(gameStateManager.activeMatchId);
    if(match?.estado==='finalizado') return;
    next();
  });
  socket.on('run:add', ({ team, delta }) => {
    gameStateManager.addRun(team, delta || 1);
  });

  socket.on('ball:add', () => {
    gameStateManager.addBall();
  });

  socket.on('strike:add', () => {
    gameStateManager.addStrike();
  });

  socket.on('count:reset', () => {
    gameStateManager.resetCount();
  });

  socket.on('out:add', ({ delta }) => {
    gameStateManager.addOut(delta !== undefined ? delta : 1);
  });

  socket.on('base:toggle', ({ base }) => {
    gameStateManager.toggleBase(parseInt(base, 10));
  });

  socket.on('bases:clear', () => {
    gameStateManager.clearBases();
  });

  socket.on('inning:set', ({ numero, mitad }) => {
    gameStateManager.setInning(numero, mitad);
  });

  socket.on('inning:confirmChange', () => {
    gameStateManager.executeInningChange();
  });

  socket.on('undo', () => {
    gameStateManager.undo();
  });
});

// Iniciar Servidor
const PORT = config.PORT;
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`[SERVIDOR] Servidor Toros Tijuana - Singular.Live Activo`);
  console.log(`[RED] URL Local: http://localhost:${PORT}`);
  console.log(`[AUTH] Singular Token Activo: ${config.SINGULAR_APP_TOKEN.slice(0, 6)}...`);
  console.log(`=======================================================`);
});
