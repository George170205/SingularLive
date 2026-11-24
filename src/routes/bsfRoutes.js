const express = require('express');
const config = require('../config');
const defaultBsfStore = require('../services/bsfStore');

function createBsfRouter({ db, bsfService, bsfStore = defaultBsfStore, io = null } = {}) {
  const router = express.Router();

  router.get('/status', (req, res) => {
    try {
      res.json({
        success: true,
        appTokenPreview: bsfService.appToken
          ? `${bsfService.appToken.slice(0, 5)}...${bsfService.appToken.slice(-4)}`
          : null,
        leagues: Object.values(config.BSF_LEAGUES),
        timezones: config.BSF_TIMEZONES,
        overlayIds: config.BSF_OVERLAY_IDS,
        settings: bsfStore.getSettings(db),
        scheduler: bsfService.getSchedulerStatus()
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.get('/live-control', async (req, res) => {
    try {
      const items = await bsfService.getLiveControlState();
      res.json({ success: true, items });
    } catch (err) {
      res.status(502).json({ success: false, error: err.message });
    }
  });

  router.get('/settings', (req, res) => {
    try {
      res.json({ success: true, settings: bsfStore.getSettings(db) });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.put('/settings', (req, res) => {
    try {
      const updated = bsfStore.saveSettings(db, req.body || {});
      res.json({ success: true, settings: updated, scheduler: bsfService.getSchedulerStatus() });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  router.get('/assets', (req, res) => {
    try {
      res.json({ success: true, assets: bsfStore.listAssets(db) });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.put('/assets/:key', (req, res) => {
    try {
      const asset = bsfStore.upsertAsset(db, req.params.key, req.body || {});
      res.json({ success: true, asset });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  router.get('/historical', (req, res) => {
    try {
      res.json({ success: true, records: bsfStore.listHistorical(db) });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.put('/historical/:key', (req, res) => {
    try {
      const record = bsfStore.saveHistorical(db, req.params.key, req.body || {});
      res.json({ success: true, record });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  router.get('/history', (req, res) => {
    try {
      const limit = Number(req.query.limit || 30);
      res.json({ success: true, history: bsfStore.listHistory(db, limit) });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.get('/games', async (req, res) => {
    try {
      const data = await bsfService.listGames({
        league: req.query.league || 'LMP',
        date: req.query.date,
        postseason: req.query.postseason === '1' || req.query.postseason === 'true',
        force: req.query.force === '1'
      });
      res.json({ success: true, ...data });
    } catch (err) {
      res.status(502).json({ success: false, error: err.message });
    }
  });

  router.get('/players/search', async (req, res) => {
    try {
      const people = await bsfService.searchPlayers({
        query: req.query.q || '',
        sportId: req.query.sportId
      });
      res.json({ success: true, people });
    } catch (err) {
      res.status(502).json({ success: false, error: err.message });
    }
  });

  router.post('/preview/:overlayKey', async (req, res) => {
    try {
      const built = await bsfService.previewOverlay(req.params.overlayKey, req.body || {});
      res.json({ success: true, ...built });
    } catch (err) {
      const status = /no reconocido|no encontrado|requerido|Selecciona/i.test(err.message) ? 400 : 502;
      res.status(status).json({ success: false, error: err.message });
    }
  });

  router.post('/push/:overlayKey', async (req, res) => {
    try {
      const body = req.body || {};
      const result = await bsfService.pushOverlay(req.params.overlayKey, {
        payload: body.payload,
        state: body.state,
        params: body.params || {},
        dryRun: Boolean(body.dryRun)
      });
      if (io && result.dryRun) {
        io.emit('bsf:actualizado', {
          overlayKey: result.overlayKey,
          dryRun: true,
          state: result.state,
          historyId: result.historyId
        });
      }
      res.json(result);
    } catch (err) {
      const status = /no reconocido/i.test(err.message) ? 400 : 502;
      res.status(status).json({ success: false, error: err.message });
    }
  });

  router.post('/scheduler/run', async (req, res) => {
    try {
      const runResult = await bsfService.runScheduledBatch({
        slot: (req.body && req.body.slot) || 'manual',
        dryRunOverride: req.body && req.body.dryRun
      });
      res.json({ success: true, run: runResult });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}

module.exports = createBsfRouter;
