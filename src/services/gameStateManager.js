const db = require('../db/database');
const config = require('../config');
const singularClient = require('./singularClient');

class GameStateManager {
  constructor() {
    const activeCal = db.prepare(`
      SELECT cp.partido_id 
      FROM calendario_partidos cp
      JOIN partidos p ON cp.partido_id = p.id
      WHERE cp.activo = 1 AND p.estado = 'en_vivo'
      LIMIT 1
    `).get();

    const activeLive = db.prepare(`
      SELECT id FROM partidos WHERE estado = 'en_vivo' ORDER BY id DESC LIMIT 1
    `).get();

    const latestMatch = db.prepare(`
      SELECT id FROM partidos ORDER BY id DESC LIMIT 1
    `).get();

    this.activeMatchId = activeCal?.partido_id || activeLive?.id || latestMatch?.id || 1;
    this.state = null;
    this.localTeam = null;
    this.visitorTeam = null;
    this.history = [];
    this.maxHistory = 25;
    this.io = null;

    this.loadStateFromDb();
  }

  setIo(ioInstance) {
    this.io = ioInstance;
  }

  loadStateFromDb(matchId = null) {
    if (matchId) this.activeMatchId = matchId;

    const match = db.prepare(`
      SELECT p.*, 
             el.nombre as local_nombre, el.siglas as local_siglas, el.logo_url as local_logo, el.color_primario as local_color,
             ev.nombre as visitor_nombre, ev.siglas as visitor_siglas, ev.logo_url as visitor_logo, ev.color_primario as visitor_color
      FROM partidos p
      JOIN equipos el ON p.equipo_local_id = el.id
      JOIN equipos ev ON p.equipo_visitante_id = ev.id
      WHERE p.id = ?
    `).get(this.activeMatchId);

    if (!match) {
      console.warn(`Partido ${this.activeMatchId} no encontrado en BD.`);
      return;
    }

    this.localTeam = {
      id: match.equipo_local_id,
      nombre: match.local_nombre,
      siglas: match.local_siglas,
      logo_url: match.local_logo,
      color_primario: match.local_color
    };

    this.visitorTeam = {
      id: match.equipo_visitante_id,
      nombre: match.visitor_nombre,
      siglas: match.visitor_siglas,
      logo_url: match.visitor_logo,
      color_primario: match.visitor_color
    };

    let estado = db.prepare('SELECT * FROM estado_partido WHERE partido_id = ?').get(this.activeMatchId);
    if (!estado) {
      db.prepare(`
        INSERT INTO estado_partido (partido_id, inning, mitad, outs, bolas, strikes, base_1, base_2, base_3, runs_local, runs_visitante)
        VALUES (?, 1, 'alta', 0, 0, 0, 0, 0, 0, 0, 0)
      `).run(this.activeMatchId);
      estado = db.prepare('SELECT * FROM estado_partido WHERE partido_id = ?').get(this.activeMatchId);
    }

    this.state = {
      partidoId: this.activeMatchId,
      inning: estado.inning,
      mitad: estado.mitad,
      outs: estado.outs,
      bolas: estado.bolas,
      strikes: estado.strikes,
      base_1: Boolean(estado.base_1),
      base_2: Boolean(estado.base_2),
      base_3: Boolean(estado.base_3),
      runs_local: estado.runs_local,
      runs_visitante: estado.runs_visitante,
      pendingInningChange: estado.outs >= 3,
      lastActionDescription: 'Estado inicial cargado'
    };
  }

  saveSnapshot(actionDesc) {
    if (this.state) {
      this.history.push({
        snapshot: JSON.parse(JSON.stringify(this.state)),
        action: actionDesc,
        timestamp: new Date().toISOString()
      });
      if (this.history.length > this.maxHistory) {
        this.history.shift();
      }
    }
  }

  persistStateToDb() {
    if (!this.state) return;
    db.prepare(`
      UPDATE estado_partido
      SET inning = ?, mitad = ?, outs = ?, bolas = ?, strikes = ?,
          base_1 = ?, base_2 = ?, base_3 = ?, runs_local = ?, runs_visitante = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE partido_id = ?
    `).run(
      this.state.inning,
      this.state.mitad,
      this.state.outs,
      this.state.bolas,
      this.state.strikes,
      this.state.base_1 ? 1 : 0,
      this.state.base_2 ? 1 : 0,
      this.state.base_3 ? 1 : 0,
      this.state.runs_local,
      this.state.runs_visitante,
      this.activeMatchId
    );
  }

  async broadcastAndSync(actionDesc = '') {
    this.state.lastActionDescription = actionDesc;
    this.persistStateToDb();

    // Sincronizar hacia Singular.Live en segundo plano mediante la cola FIFO
    const scoreBugId = config.OVERLAY_IDS.score_bug;
    const payload = singularClient.buildScoreBugPayload(this.state, this.localTeam, this.visitorTeam);

    singularClient.patchSingular(null, scoreBugId, payload)
      .then(() => {
        if (this.io) {
          this.io.emit('singular:status', {
            status: 'in_sync',
            latencyMs: singularClient.queue.lastLatencyMs,
            lastUpdated: new Date().toISOString()
          });
        }
      })
      .catch(err => {
        if (this.io) {
          this.io.emit('singular:status', {
            status: 'error',
            error: err.message,
            lastUpdated: new Date().toISOString()
          });
        }
      });

    // Notificar inmediatamente a todas las pantallas de operadores conectadas
    if (this.io) {
      this.io.emit('estado:actualizado', this.getFullState());
    }
  }

  getFullState() {
    return {
      match: {
        id: this.activeMatchId,
        estado: db.prepare('SELECT estado FROM partidos WHERE id=?').get(this.activeMatchId)?.estado,
        local: this.localTeam,
        visitor: this.visitorTeam
      },
      state: this.state,
      canUndo: this.history.length > 0,
      historyCount: this.history.length,
      singularStatus: {
        status: singularClient.queue.lastStatus,
        latencyMs: singularClient.queue.lastLatencyMs,
        lastError: singularClient.queue.lastError
      }
    };
  }

  // ACCIONES OPERATIVAS

  addRun(team, delta = 1) {
    this.saveSnapshot(`Carrera ${delta > 0 ? '+' : ''}${delta} (${team})`);
    if (team === 'local') {
      this.state.runs_local = Math.max(0, this.state.runs_local + delta);
    } else {
      this.state.runs_visitante = Math.max(0, this.state.runs_visitante + delta);
    }
    this.broadcastAndSync(`Carrera ${team === 'local' ? this.localTeam.siglas : this.visitorTeam.siglas}: ${delta > 0 ? '+1' : '-1'}`);
  }

  addBall() {
    this.saveSnapshot('+1 Bola');
    if (this.state.bolas < 3) {
      this.state.bolas += 1;
      this.broadcastAndSync(`Bola ${this.state.bolas}`);
    } else {
      // 4ta bola: Base por bolas
      this.state.bolas = 0;
      this.state.strikes = 0;
      this.broadcastAndSync('Base por bolas (Pasaporte) - Conteo reseteado');
    }
  }

  addStrike() {
    this.saveSnapshot('+1 Strike');
    if (this.state.strikes < 2) {
      this.state.strikes += 1;
      this.broadcastAndSync(`Strike ${this.state.strikes}`);
    } else {
      // 3er strike: Ponche (Out)
      this.state.bolas = 0;
      this.state.strikes = 0;
      this.addOut(1, 'Ponche (Strikeout)');
    }
  }

  resetCount() {
    this.saveSnapshot('Reset conteo');
    this.state.bolas = 0;
    this.state.strikes = 0;
    this.broadcastAndSync('Nuevo bateador (0-0)');
  }

  addOut(delta = 1, customDesc = null) {
    const desc = customDesc || `${delta > 0 ? '+1' : '-1'} Out`;
    this.saveSnapshot(desc);
    
    const newOuts = Math.max(0, Math.min(3, this.state.outs + delta));
    this.state.outs = newOuts;

    if (newOuts >= 3) {
      this.state.pendingInningChange = true;
    } else {
      this.state.pendingInningChange = false;
    }

    this.broadcastAndSync(`${this.state.outs} OUT${this.state.outs === 1 ? '' : 'S'}`);
  }

  toggleBase(base) {
    this.saveSnapshot(`Toggle Base ${base}`);
    if (base === 1) this.state.base_1 = !this.state.base_1;
    if (base === 2) this.state.base_2 = !this.state.base_2;
    if (base === 3) this.state.base_3 = !this.state.base_3;
    this.broadcastAndSync(`Base ${base}B: ${this.state['base_' + base] ? 'Ocupada' : 'Libre'}`);
  }

  clearBases() {
    this.saveSnapshot('Limpiar bases');
    this.state.base_1 = false;
    this.state.base_2 = false;
    this.state.base_3 = false;
    this.broadcastAndSync('Bases limpias');
  }

  setInning(numero, mitad) {
    this.saveSnapshot(`Set Inning ${numero} ${mitad}`);
    this.state.inning = Math.max(1, parseInt(numero, 10) || 1);
    this.state.mitad = (mitad || 'alta').toLowerCase();
    this.broadcastAndSync(`Inning ${this.state.inning} (${this.state.mitad})`);
  }

  executeInningChange() {
    this.saveSnapshot('Cambio de Inning');
    if (this.state.mitad === 'alta') {
      this.state.mitad = 'baja';
    } else {
      this.state.mitad = 'alta';
      this.state.inning += 1;
    }

    this.state.outs = 0;
    this.state.bolas = 0;
    this.state.strikes = 0;
    this.state.base_1 = false;
    this.state.base_2 = false;
    this.state.base_3 = false;
    this.state.pendingInningChange = false;

    this.broadcastAndSync(`Inicio ${this.state.mitad} del Inning ${this.state.inning}`);
  }

  undo() {
    if (this.history.length === 0) return false;
    const previous = this.history.pop();
    this.state = JSON.parse(JSON.stringify(previous.snapshot));
    this.state.lastActionDescription = `Deshecho: ${previous.action}`;
    this.broadcastAndSync(`Acción revertida: ${previous.action}`);
    return true;
  }

  // Cambio de partido activo (Setup / Pre-partido)
  async setActiveMatchup(localId, visitorId, exactMatchId = null) {
    this.saveSnapshot('Cambio de enfrentamiento');
    let partido = exactMatchId ? {id: exactMatchId} : db.prepare(`
      SELECT id FROM partidos 
      WHERE equipo_local_id = ? AND equipo_visitante_id = ? AND estado = 'en_vivo'
      ORDER BY id DESC LIMIT 1
    `).get(localId, visitorId);

    if (!partido) {
      const res = db.prepare(`
        INSERT INTO partidos (equipo_local_id, equipo_visitante_id, estado)
        VALUES (?, ?, 'en_vivo')
      `).run(localId, visitorId);
      this.activeMatchId = res.lastInsertRowid;
      db.prepare(`
        INSERT INTO estado_partido (partido_id, inning, mitad, outs, bolas, strikes, base_1, base_2, base_3, runs_local, runs_visitante)
        VALUES (?, 1, 'alta', 0, 0, 0, 0, 0, 0, 0, 0)
      `).run(this.activeMatchId);
    } else {
      this.activeMatchId = partido.id;
    }

    this.loadStateFromDb(this.activeMatchId);

    // Mandar actualización integral a Singular
    const sbPayload = singularClient.buildScoreBugPayload(this.state, this.localTeam, this.visitorTeam);
    const fsPayload = singularClient.buildFullscreenMatchupPayload(this.localTeam, this.visitorTeam);
    const lwPayload = singularClient.buildLowerMatchupPayload(this.localTeam, this.visitorTeam);

    await Promise.all([
      singularClient.patchSingular(null, config.OVERLAY_IDS.score_bug, sbPayload),
      singularClient.patchSingular(null, config.OVERLAY_IDS.fullscreen_matchup, fsPayload),
      singularClient.patchSingular(null, config.OVERLAY_IDS.lower_matchup, lwPayload)
    ]);

    this.broadcastAndSync(`Enfrentamiento actualizado: ${this.localTeam.siglas} vs ${this.visitorTeam.siglas}`);
    return this.getFullState();
  }
}

const instance = new GameStateManager();
module.exports = instance;
