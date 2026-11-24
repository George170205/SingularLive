const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const express = require('express');
const Database = require('better-sqlite3');

function invokeExpress(app, { method = 'GET', url = '/', body = null } = {}) {
  return new Promise((resolve, reject) => {
    const req = new EventEmitter();
    req.method = method;
    req.url = url;
    req.originalUrl = url;
    req.headers = body ? { 'content-type': 'application/json' } : {};
    req._body = true;
    req.body = body || {};
    req.connection = { remoteAddress: '127.0.0.1' };
    req.socket = req.connection;

    const headers = {};
    const chunks = [];
    const res = new EventEmitter();
    res.statusCode = 200;
    res.locals = Object.create(null);
    res.setHeader = (k, v) => { headers[String(k).toLowerCase()] = v; };
    res.getHeader = k => headers[String(k).toLowerCase()];
    res.getHeaders = () => ({ ...headers });
    res.hasHeader = k => String(k).toLowerCase() in headers;
    res.removeHeader = k => { delete headers[String(k).toLowerCase()]; };
    res.writeHead = (code, h) => {
      res.statusCode = code;
      if (h) for (const [k, v] of Object.entries(h)) res.setHeader(k, v);
      return res;
    };
    res.write = chunk => {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), 'utf8'));
      return true;
    };
    res.end = chunk => {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), 'utf8'));
      const text = Buffer.concat(chunks).toString('utf8');
      let parsed = text;
      try { parsed = JSON.parse(text); } catch (e) {}
      res.finished = true;
      res.writableEnded = true;
      resolve({ status: res.statusCode, body: parsed });
      return res;
    };

    app(req, res, err => {
      if (err) reject(err);
      else resolve({ status: res.statusCode || 404, body: null });
    });
  });
}

process.env.DATABASE_FILE = ':memory:';

const config = require('../src/config');
const bsfStore = require('../src/services/bsfStore');
const builders = require('../src/services/bsfBuilders');
const { createBsfService } = require('../src/services/bsfService');
const createBsfRouter = require('../src/routes/bsfRoutes');

function createTestDb() {
  const db = new Database(':memory:');
  bsfStore.init(db);
  return db;
}

function makeMockFetch() {
  const calls = [];
  const sampleFeed = {
    gameData: {
      teams: {
        away: { id: 676, name: 'Mayos de Navojoa', locationName: 'Navojoa' },
        home: { id: 674, name: 'Charros de Jalisco', locationName: 'Jalisco' }
      },
      venue: { name: 'Estadio Panamericano' },
      gameInfo: { attendance: 6503, gameDurationMinutes: 205 }
    },
    liveData: {
      linescore: { teams: { away: { runs: 13 }, home: { runs: 5 } } },
      decisions: {
        winner: { id: 1001, fullName: 'Colin Wiles' },
        loser: { id: 1002, fullName: 'Luis Payan' },
        save: { id: 1003, fullName: 'Trevor Clifton' }
      },
      plays: {
        allPlays: [
          {
            result: { event: 'Home Run', eventType: 'home_run', rbi: 4 },
            matchup: { batter: { id: 2002 } }
          }
        ]
      },
      boxscore: {
        teams: {
          away: {
            team: { id: 676, name: 'Mayos de Navojoa' },
            players: {
              ID1001: { person: { id: 1001 }, seasonStats: { pitching: { wins: 1, losses: 3, saves: 0 } } },
              ID2001: {
                person: { id: 2001, fullName: 'Carlos De La Cruz' },
                stats: { batting: { atBats: 5, hits: 3, runs: 3, rbi: 3, doubles: 0, triples: 0, homeRuns: 0, baseOnBalls: 0 } }
              },
              ID2002: {
                person: { id: 2002, fullName: 'Misael Rivera' },
                stats: { batting: { atBats: 2, hits: 2, runs: 1, rbi: 6, doubles: 0, triples: 0, homeRuns: 1, baseOnBalls: 0 } }
              }
            }
          },
          home: {
            team: { id: 674, name: 'Charros de Jalisco' },
            players: {
              ID1002: { person: { id: 1002 }, seasonStats: { pitching: { wins: 1, losses: 1, saves: 0 } } },
              ID1003: { person: { id: 1003 }, seasonStats: { pitching: { wins: 0, losses: 0, saves: 5 } } },
              ID2003: {
                person: { id: 2003, fullName: 'Jose Angel Cecena' },
                stats: { batting: { atBats: 4, hits: 2, runs: 1, rbi: 1, doubles: 0, triples: 0, homeRuns: 1, baseOnBalls: 0 } }
              }
            }
          }
        }
      }
    }
  };

  const fetchFn = async url => {
    calls.push(String(url));
    const json = async () => {
      if (url.includes('/api/v1/standings') && url.includes('leagueId=125')) {
        return {
          records: [
            {
              division: { id: 222, name: 'Mexican League Norte' },
              teamRecords: Array.from({ length: 10 }, (_, idx) => ({
                divisionRank: String(idx + 1),
                wins: 50 - idx,
                losses: 40 + idx,
                winningPercentage: '.500',
                gamesBack: idx === 0 ? '-' : `${idx}.0`,
                divisionGamesBack: `${idx * 2}.0`,
                runDifferential: idx === 6 ? -44 : -65,
                team: { id: idx === 6 ? 528 : idx === 7 ? 502 : 5010, name: idx === 6 ? 'Rieleros de Aguascalientes' : 'Saraperos de Saltillo' }
              }))
            },
            {
              division: { id: 223, name: 'Mexican League Sur' },
              teamRecords: Array.from({ length: 10 }, (_, idx) => ({
                divisionRank: String(idx + 1),
                wins: 52 - idx,
                losses: 38 + idx,
                winningPercentage: '.520',
                gamesBack: `${idx}.0`,
                divisionGamesBack: '21.0',
                runDifferential: idx === 6 ? -92 : -74,
                team: { id: idx === 6 ? 5567 : 569, name: idx === 6 ? 'El Aguila de Veracruz' : 'Tigres de Quintana Roo' }
              }))
            }
          ]
        };
      }
      if (url.includes('/api/v1/standings')) {
        return {
          records: [
            {
              teamRecords: [
                { wins: 17, losses: 6, winningPercentage: '.739', gamesBack: '-', team: { id: 677, name: 'Naranjeros de Hermosillo' } },
                { wins: 13, losses: 10, winningPercentage: '.565', gamesBack: '4.0', team: { id: 5482, name: 'Algodoneros de Guasave' } },
                { wins: 10, losses: 12, winningPercentage: '.455', gamesBack: '7.0', team: { id: 696, name: 'Navegantes del Magallanes' } }
              ]
            }
          ]
        };
      }
      if (url.includes('/api/v1/schedule')) {
        return {
          dates: [
            {
              date: '2026-11-13',
              games: [
                {
                  gamePk: 789001,
                  officialDate: '2026-11-13',
                  gameDate: '2026-11-14T03:05:00Z',
                  status: { abstractGameState: 'Final', detailedState: 'Final' },
                  teams: {
                    away: { team: { id: 679, name: 'Venados de Mazatlan' }, score: 6 },
                    home: { team: { id: 678, name: 'Tomateros de Culiacan' }, score: 5 }
                  },
                  venue: { name: 'Estadio Tomateros' }
                },
                {
                  gamePk: 789002,
                  officialDate: '2026-11-13',
                  gameDate: '2026-11-14T03:10:00Z',
                  status: { abstractGameState: 'Final', detailedState: 'Postponed', reason: 'Rain' },
                  teams: {
                    away: { team: { id: 6483, name: 'Jaguares de Nayarit' }, score: 4 },
                    home: { team: { id: 680, name: 'Yaquis de Obregon' }, score: 7 }
                  },
                  venue: { name: 'Estadio Yaquis' }
                }
              ]
            }
          ]
        };
      }
      if (url.includes('/feed/live')) {
        return sampleFeed;
      }
      if (url.includes('/api/v1/stats/leaders')) {
        return {
          leagueLeaders: [
            {
              leaders: [
                { person: { id: 1, fullName: 'Lider Uno' }, value: 120 },
                { person: { id: 2, fullName: 'Lider Dos' }, value: 110 }
              ]
            }
          ]
        };
      }
      if (url.includes('/api/v1/stats')) {
        return {
          stats: [
            {
              splits: [
                {
                  player: { id: 51, fullName: 'Raul Zoe Carrillo' },
                  team: { id: 679, name: 'Venados de Mazatlan' },
                  stat: { wins: 2, losses: 1, inningsPitched: '5.0', earnedRuns: 0, hits: 4, baseOnBalls: 2, strikeOuts: 3, era: '3.00', avg: '.400', obp: '.478', ops: '1.128', rbi: 11, runs: 4, doubles: 3, triples: 1, homeRuns: 1 }
                }
              ]
            }
          ]
        };
      }
      if (url.includes('/api/v1/people/search')) {
        return {
          people: [{ id: 660670, fullName: 'Roel Ramirez', primaryPosition: { abbreviation: 'P' }, birthDate: '1995-05-26', currentAge: 31 }]
        };
      }
      if (url.includes('/api/v1/people/660670/stats')) {
        return {
          stats: [{ splits: [{ season: '2020', team: { id: 138, name: 'St. Louis Cardinals' } }] }]
        };
      }
      if (url.includes('/api/v1/people/660670')) {
        return {
          people: [
            {
              id: 660670,
              fullName: 'Roel Ramirez',
              currentTeam: { id: 5010, name: 'Toros de Tijuana' },
              stats: [
                {
                  splits: [
                    {
                      season: '2026',
                      team: { id: 5010, name: 'Toros de Tijuana' },
                      stat: { gamesPitched: 47, inningsPitched: '46.0', era: '1.76', whip: '0.89', avg: '.190', strikeOuts: 63, baseOnBalls: 9, holds: 19 }
                    }
                  ]
                }
              ]
            }
          ]
        };
      }
      if (url.includes('/api/v1/teams')) {
        return { teams: [{ id: 677, name: 'Naranjeros de Hermosillo' }] };
      }
      if (url.includes('/players')) {
        return {
          players: [
            { id: 701, fullName: 'Agustin Murillo', currentAge: 44, birthDate: '1982-11-23', currentTeam: { id: 677 }, primaryPosition: { abbreviation: '3B' } },
            { id: 702, fullName: 'Alejandro Kirk', currentAge: 28, birthDate: '1998-11-23', currentTeam: { id: 677 }, primaryPosition: { abbreviation: 'C' } }
          ]
        };
      }
      if (url.includes('/api/v1/awards/')) {
        return {
          awards: [
            { season: '2025', date: '2025-11-11', name: 'AL Manager of the Year', player: { id: 901, nameFirstLast: 'Kevin Cash', primaryPosition: { abbreviation: 'RF' } }, team: { id: 139 } }
          ]
        };
      }
      return {};
    };
    return { ok: true, status: 200, json };
  };

  return { fetchFn, calls };
}

test('BSF_OVERLAY_IDS contiene los 19 IDs exactos de 0FuwnDA057k7zosJmUACw5', () => {
  assert.equal(config.BSF_APP_TOKEN, '0FuwnDA057k7zosJmUACw5');
  assert.equal(Object.keys(config.BSF_OVERLAY_IDS).length, 19);
  assert.equal(config.BSF_OVERLAY_IDS.main_player, '-P4ykk26D5g-4HCNPfBb');
  assert.equal(config.BSF_OVERLAY_IDS.overlay_9, 'e4bf7b3e-6d7f-46f8-bf6a-da3b02d7c297');
  assert.equal(config.BSF_OVERLAY_IDS.lower_third_medio, '0bf6655e-660b-40ba-a529-f171b300df8f');
});

test('bsfBuilders respeta todos los typos, asimetrias y ambos horarios (TIJ y CDMX)', () => {
  // Horarios
  const iso = '2026-11-14T03:05:00Z';
  const expectedTij = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Tijuana', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));
  const expectedCdmx = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));
  assert.equal(builders.formatGameTime(iso, 'America/Tijuana'), expectedTij);
  assert.equal(builders.formatGameTime(iso, 'America/Mexico_City'), expectedCdmx);
  assert.equal(builders.formatGameTime(iso, 'BOTH'), `${expectedTij} TIJ / ${expectedCdmx} CDMX`);

  // Overlay 6 Img 1 vs img 2..8
  const ov6 = builders.buildOverlay6Standing8LogosPayload({
    standingsData: {
      records: [{ teamRecords: [{ wins: 10, losses: 3, winningPercentage: '.769', gamesBack: '-', team: { id: 694 } }, { wins: 8, losses: 3, winningPercentage: '.727', gamesBack: '1.0', team: { id: 693 } }] }]
    }
  });
  assert.ok('Img 1' in ov6);
  assert.ok('img 2' in ov6);
  assert.equal('img 1' in ov6, false);

  // Overlay 7 VS1 vs VS 2..4 + LLUVIA limpia M3/M4
  const ov7 = builders.buildOverlay7YesterdaySummaryPayload({
    games: [
      { status: { abstractGameState: 'Final', detailedState: 'Final' }, teams: { away: { team: { id: 696 }, score: 6 }, home: { team: { id: 692 }, score: 5 } } },
      { status: { abstractGameState: 'Final', detailedState: 'Postponed', reason: 'Rain' }, teams: { away: { team: { id: 698 }, score: 2 }, home: { team: { id: 699 }, score: 1 } } }
    ]
  });
  assert.equal(ov7.VS1, 'VS');
  assert.equal(ov7.M1, '6');
  assert.equal(ov7['VS 2'], 'LLUVIA');
  assert.equal(ov7.M3, '');
  assert.equal(ov7.M4, '');

  // Overlay 10 Image 1 / Imagen2 / Imagen 3 / Description 3
  const ov10 = builders.buildOverlay10Awards3CardsPayload({
    cards: [{ name: 'A', notes: 'n1' }, { name: 'B', notes: 'n2' }, { name: 'C', notes: 'n3' }]
  });
  assert.ok('Image 1' in ov10);
  assert.ok('Imagen2' in ov10);
  assert.ok('Imagen 3' in ov10);
  assert.equal(ov10['Description 3'], 'n3');

  // LOWER_THIRD y LOWER_THIRD MEDIO omiten Video Clip (tipo button)
  const lt1 = builders.buildLowerThirdPayload({ line1: 'L1', line2: 'L2' });
  const lt2 = builders.buildLowerThirdMedioPayload({ nameIzq: 'N1', cargoIzq: 'C1', nameDer: 'N2', cargoDer: 'C2' });
  assert.equal('Video Clip' in lt1, false);
  assert.equal('Video Clip' in lt2, false);

  // abbreviateLongName acorta nombres > 16 caracteres preservando cortos
  assert.equal(builders.abbreviateLongName('Agustin Murillo'), 'Agustin Murillo');
  assert.equal(builders.abbreviateLongName('Reynaldo Rodriguez'), 'R. Rodriguez');
  assert.equal(builders.abbreviateLongName('Odrisamer Despaigne'), 'O. Despaigne');
  const ov13Abbrev = builders.buildOverlay13Or15VeteransPayload({
    rows: [
      { name: 'Agustin Murillo', team: 'Naranjeros', age: 44 },
      { name: 'Odrisamer Despaigne', team: 'Yaquis', age: 39 }
    ]
  });
  assert.equal(ov13Abbrev['Jugadores 1'], 'Agustin Murillo\nO. Despaigne');
});

test('singularClient.patchSingular reintenta automaticamente ante fetch failed transitorio', async () => {
  const singularClient = require('../src/services/singularClient');
  let calls = 0;
  const flakyFetch = async () => {
    calls += 1;
    if (calls === 1) {
      const err = new TypeError('fetch failed');
      err.cause = { code: 'ECONNRESET' };
      throw err;
    }
    return { ok: true, status: 200, json: async () => ({ ok: true }) };
  };
  const res = await singularClient.patchSingular('0FuwnDA057k7zosJmUACw5', '3cb5a265-3ae3-4f54-94a8-ce449221a307', { Titulo: 'Test' }, 'Out1', {
    fetchFn: flakyFetch,
    retryDelays: [10, 10]
  });
  assert.equal(calls, 2);
  assert.equal(res.ok, true);
});

test('bsfService cubre las 3 fases completas, postemporada LMB sin leagueId y Overlay 8 Grand Slam', async () => {
  const db = createTestDb();
  const { fetchFn, calls } = makeMockFetch();
  const patchCalls = [];
  const singularMock = {
    resolveAssetToDataUrl: v => `data:image/png;base64,MOCK:${v}`,
    patchSingular: async (token, subId, payload, state) => {
      patchCalls.push({ token, subId, payload, state });
      return { ok: true };
    }
  };
  const svc = createBsfService({ db, singularClient: singularMock, config, fetchFn });

  // Fase 1: Overlay 9 postemporada LMB omite leagueId=125
  const ov9 = await svc.previewOverlay('overlay_9', { league: 'LMB', date: '2026-11-13', postseason: true });
  const lastSchedCall = calls.find(c => c.includes('/api/v1/schedule'));
  assert.ok(lastSchedCall.includes('sportId=23'));
  assert.equal(lastSchedCall.includes('leagueId=125'), false);
  assert.match(ov9.payload.Hora1, /TIJ \/ .* CDMX/);

  // Fase 1: Overlay 5 LMB playoffs Norte/Sur
  const ov5 = await svc.previewOverlay('overlay_5', { league: 'LMB', season: '2026' });
  assert.equal(ov5.payload['Equipo 1'], '7 AGUASCALIENTES');
  assert.equal(ov5.payload['stats 1'], '44-46  12.0  -44');
  assert.equal(ov5.payload['Equipo 3'], '7 VERACRUZ');

  // Fase 2: Overlay 8 boxscore + playByPlay Grand Slam + typos exactos
  const ov8 = await svc.previewOverlay('overlay_8', { league: 'LMP', gamePk: 789001 });
  assert.equal(ov8.payload.Marcador1, '13');
  assert.equal(ov8.payload['PG-PD'], 'PG\nPD\nSV');
  assert.match(ov8.payload['Description izquierda'], /MISAEL RIVERA\n\(2-2, GRAND SLAM, 1 CA, 6 CPS\)/);
  assert.match(ov8.payload['Descipcion derecha'], /JOSE ANGEL CECENA/);
  assert.match(ov8.payload.estadio, /ESTADIO- ESTADIO PANAMERICANO/);

  // Fase 2: Overlay 4 Lomita vs Ofensiva
  const ov4Hit = await svc.previewOverlay('overlay_4', { league: 'LMP', mode: 'hitting', startDate: '2026-11-10', endDate: '2026-11-13' });
  assert.match(ov4Hit.payload.Titulo, /DESTACADOS EN LA OFENSIVA/);
  assert.doesNotMatch(ov4Hit.payload.Titulo, /MEXIACANA/);
  assert.match(ov4Hit.payload['Informacion 1'], /\.400\/\.478\/1\.128/);

  // Fase 2: main_player y overlay_1
  const mainP = await svc.previewOverlay('main_player', { league: 'LMB', playerName: 'Roel Ramirez' });
  assert.equal(mainP.payload.Num_Relevos, '47');
  assert.match(mainP.payload['*Juego con Cardenales de'], /2020/);

  // Fase 3: Overlay 3 histórico vs temporada, Overlay 11 cumpleaños, Overlay 13 veteranos, Overlay 14 premios
  const ov3Hist = await svc.previewOverlay('overlay_3', { source: 'historical' });
  assert.match(ov3Hist.payload['Jugadores 1'], /HÉCTOR ESPINO/);
  const ov3Sea = await svc.previewOverlay('overlay_3', { source: 'season' });
  assert.match(ov3Sea.payload['Jugadores 1'], /LIDER UNO/);

  const ov11 = await svc.previewOverlay('overlay_11', { league: 'LMP', date: '2026-11-23', mode: 'birthdays' });
  assert.match(ov11.payload.Nombres, /Alejandro Kirk/);
  assert.match(ov11.payload.Valores, /1998/);

  const ov13 = await svc.previewOverlay('overlay_13', { league: 'LMP' });
  assert.equal(ov13.payload['Jugadores 1'].split('\n')[0], 'Agustin Murillo');
  assert.equal(ov13.payload.Edad.split('\n')[0], '44');

  const ov14 = await svc.previewOverlay('overlay_14', { awardId: 'NLGG' });
  assert.equal(ov14.payload.Posiciones, 'JD');
  assert.equal(ov14.payload['Jugadores 1'], 'KEVIN CASH');
  assert.equal(ov14.payload.Equipo, 'TB');

  const ov10 = await svc.previewOverlay('overlay_10', { awardId: 'ALMOY', awardSeason: '2025' });
  assert.match(ov10.payload['Nombre 1'], /^KEVIN CASH\nRAYS/);
});

test('Rutas HTTP /api/bsf/* y Scheduler respetan dryRun y empuje seguro a Singular', async () => {
  const db = createTestDb();
  const { fetchFn } = makeMockFetch();
  const patchCalls = [];
  const singularMock = {
    resolveAssetToDataUrl: v => v,
    patchSingular: async (token, subId, payload, state) => {
      patchCalls.push({ token, subId, payload, state });
      return { ok: true };
    }
  };
  const svc = createBsfService({ db, singularClient: singularMock, config, fetchFn });
  const app = express();
  app.use(express.json());
  app.use('/api/bsf', createBsfRouter({ db, bsfService: svc, bsfStore }));

  const reqJson = (url, opts = {}) => invokeExpress(app, {
    method: opts.method || 'GET',
    url,
    body: opts.body ? JSON.parse(opts.body) : null
  });

  try {
    const st = await reqJson('/api/bsf/status');
    assert.equal(st.status, 200);
    assert.equal(st.body.settings.tzMode, 'BOTH');

    // Preview + Settings + Assets + Historical routes
    const setRes = await reqJson('/api/bsf/settings', {
      method: 'PUT',
      body: JSON.stringify({ tzMode: 'America/Tijuana' })
    });
    assert.equal(setRes.status, 200);
    assert.equal(setRes.body.settings.tzMode, 'America/Tijuana');

    const assetUp = await reqJson('/api/bsf/assets/team_675', {
      method: 'PUT',
      body: JSON.stringify({ url: 'https://example.com/caneros.png' })
    });
    assert.equal(assetUp.status, 200);
    assert.equal(assetUp.body.asset.url, 'https://example.com/caneros.png');

    const histUp = await reqJson('/api/bsf/historical/lmp_lmb_hits', {
      method: 'PUT',
      body: JSON.stringify({ title: 'LMP Y LMB | HITS EDITADO' })
    });
    assert.equal(histUp.status, 200);
    assert.equal(histUp.body.record.title, 'LMP Y LMB | HITS EDITADO');

    const prevRes = await reqJson('/api/bsf/preview/overlay_9', {
      method: 'POST',
      body: JSON.stringify({ league: 'LMP', date: '2026-11-13' })
    });
    assert.equal(prevRes.status, 200);
    assert.equal(prevRes.body.subCompositionId, 'e4bf7b3e-6d7f-46f8-bf6a-da3b02d7c297');

    // Dry-Run NO llama patchSingular
    const dryRes = await reqJson('/api/bsf/push/overlay_9', {
      method: 'POST',
      body: JSON.stringify({ state: 'Out1', dryRun: true, params: { league: 'LMP', date: '2026-11-13' } })
    });
    assert.equal(dryRes.status, 200);
    assert.equal(dryRes.body.dryRun, true);
    assert.equal(patchCalls.length, 0);

    // Push real llama patchSingular con token 0FuwnDA057k7zosJmUACw5
    const realRes = await reqJson('/api/bsf/push/overlay_9', {
      method: 'POST',
      body: JSON.stringify({ state: 'Out1', dryRun: false, params: { league: 'LMP', date: '2026-11-13' } })
    });
    assert.equal(realRes.status, 200);
    assert.equal(patchCalls.length, 1);
    assert.equal(patchCalls[0].token, '0FuwnDA057k7zosJmUACw5');
    assert.equal(patchCalls[0].subId, 'e4bf7b3e-6d7f-46f8-bf6a-da3b02d7c297');
    assert.equal(patchCalls[0].state, 'Out1');

    // Scheduler idempotente en mismo minuto/fecha
    await reqJson('/api/bsf/settings', {
      method: 'PUT',
      body: JSON.stringify({ scheduler: { enabled: true, morningTime: '09:00', dryRunOnly: true } })
    });
    const fakeNow = new Date('2026-11-23T17:00:00Z'); // 09:00 PST Tijuana
    const run1 = await svc.tickScheduler(fakeNow);
    const run2 = await svc.tickScheduler(fakeNow);
    assert.ok(run1 && run1.results.length > 0);
    assert.equal(run2, null);

    const hist = await reqJson('/api/bsf/history?limit=10');
    assert.equal(hist.status, 200);
    assert.ok(hist.body.history.length >= 2);
  } finally {
    svc.stopScheduler();
    db.close();
  }
});
