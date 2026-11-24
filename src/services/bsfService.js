const defaultConfig = require('../config');
const bsfStore = require('./bsfStore');
const builders = require('./bsfBuilders');

const MLB_STATS_HOST = 'https://statsapi.mlb.com';

function todayInTijuana() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Tijuana' }).format(new Date());
}

function yesterdayInTijuana() {
  const dt = new Date(Date.now() - 24 * 3600 * 1000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Tijuana' }).format(dt);
}

function clockAndDateInTijuana(dateObj = new Date()) {
  const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Tijuana' }).format(dateObj);
  const timeStr = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Tijuana',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(dateObj);
  return { dateStr, timeStr };
}

function createBsfService({
  db,
  singularClient,
  config = defaultConfig,
  fetchFn = global.fetch,
  io = null,
  appToken = defaultConfig.BSF_APP_TOKEN
} = {}) {
  if (!db) throw new Error('createBsfService requiere instancia de db');
  if (!singularClient) throw new Error('createBsfService requiere singularClient');

  let schedulerTimer = null;
  let lastMorningRunDate = null;
  let lastNightRunDate = null;
  let lastSchedulerRun = null;

  function resolveLeagueConfig(leagueCode = 'LMP') {
    const key = String(leagueCode || 'LMP').toUpperCase();
    return config.BSF_LEAGUES[key] || config.BSF_LEAGUES.LMP;
  }

  async function fetchStatsApi(apiPath, { cacheKey = apiPath, ttlMs = 300000, force = false } = {}) {
    if (!force) {
      const cached = bsfStore.getCache(db, cacheKey, false);
      if (cached) {
        return { data: cached.data, fromCache: true, stale: false };
      }
    }

    const url = apiPath.startsWith('http') ? apiPath : `${MLB_STATS_HOST}${apiPath}`;
    try {
      const res = await fetchFn(url, { signal: AbortSignal.timeout(20000) });
      if (!res || !res.ok) {
        throw new Error(`MLB Stats API HTTP ${res ? res.status : 'NO_RESPONSE'} (${apiPath})`);
      }
      const data = await res.json();
      bsfStore.setCache(db, cacheKey, data, ttlMs);
      return { data, fromCache: false, stale: false };
    } catch (err) {
      const stale = bsfStore.getCache(db, cacheKey, true);
      if (stale) {
        return { data: stale.data, fromCache: true, stale: true, warning: err.message };
      }
      throw err;
    }
  }

  function buildSchedulePath(leagueCfg, date, hydrate = 'team,linescore,venue') {
    const omitLeague = Boolean(leagueCfg.omitLeagueIdInPostseason && leagueCfg.postseason);
    const qs = new URLSearchParams({
      sportId: String(leagueCfg.sportId),
      date
    });
    if (!omitLeague && leagueCfg.leagueId) {
      qs.set('leagueId', String(leagueCfg.leagueId));
    } else if (!omitLeague && leagueCfg.code === 'MLB') {
      qs.set('leagueId', `${leagueCfg.alLeagueId},${leagueCfg.nlLeagueId}`);
    }
    if (hydrate) qs.set('hydrate', hydrate);
    return `/api/v1/schedule?${qs.toString()}`;
  }

  async function fetchStandingsData(leagueCfg, season, { force = false, withDivisions = false, mlbLeagueId = null } = {}) {
    const lid =
      leagueCfg.code === 'MLB'
        ? (mlbLeagueId || `${leagueCfg.alLeagueId},${leagueCfg.nlLeagueId}`)
        : leagueCfg.leagueId;
    const hydrate = withDivisions ? 'team,division' : 'team';
    const path = `/api/v1/standings?leagueId=${lid}&season=${season}&standingsTypes=regularSeason&hydrate=${hydrate}`;
    return fetchStatsApi(path, { cacheKey: `standings:${lid}:${season}:${hydrate}`, ttlMs: 300000, force });
  }

  async function listGames({ league = 'LMP', date = yesterdayInTijuana(), postseason = false, force = false } = {}) {
    const settings = bsfStore.getSettings(db);
    const leagueCfg = { ...resolveLeagueConfig(league), postseason: Boolean(postseason) };
    const path = buildSchedulePath(leagueCfg, date, 'team,linescore,decisions,venue');
    const res = await fetchStatsApi(path, {
      cacheKey: `schedule:${leagueCfg.code}:${date}:${postseason ? 'ps' : 'reg'}`,
      ttlMs: 120000,
      force
    });

    const games = (res.data.dates && res.data.dates[0] && res.data.dates[0].games) || [];
    return {
      league: leagueCfg.code,
      date,
      fromCache: res.fromCache,
      stale: res.stale,
      games: games.map(g => ({
        gamePk: g.gamePk,
        officialDate: g.officialDate,
        gameDate: g.gameDate,
        timeFormatted: builders.formatGameTime(g.gameDate, settings.tzMode),
        status: g.status?.detailedState || '',
        abstractGameState: g.status?.abstractGameState || '',
        isRain: builders.isRainOrPostponed(g),
        venue: g.venue?.name || '',
        awayTeam: {
          id: g.teams?.away?.team?.id,
          name: builders.getTeamName(g.teams?.away?.team, 'short'),
          fullName: g.teams?.away?.team?.name || '',
          score: g.teams?.away?.score ?? null
        },
        homeTeam: {
          id: g.teams?.home?.team?.id,
          name: builders.getTeamName(g.teams?.home?.team, 'short'),
          fullName: g.teams?.home?.team?.name || '',
          score: g.teams?.home?.score ?? null
        }
      })),
      rawGames: games
    };
  }

  async function searchPlayers({ query = '', sportId } = {}) {
    const q = String(query || '').trim();
    if (!q) return [];
    const qs = new URLSearchParams({ names: q });
    if (sportId) qs.set('sportIds', String(sportId));
    const res = await fetchStatsApi(`/api/v1/people/search?${qs.toString()}`, {
      cacheKey: `search:${q.toLowerCase()}:${sportId || 'all'}`,
      ttlMs: 600000
    });
    return (res.data.people || []).slice(0, 20).map(p => ({
      id: p.id,
      fullName: p.fullName,
      primaryPosition: p.primaryPosition?.abbreviation || '',
      currentTeam: p.currentTeam || null,
      birthDate: p.birthDate || '',
      currentAge: p.currentAge ?? null
    }));
  }

  async function fetchLeaguePlayers(leagueCfg, season, force = false) {
    const sportRes = await fetchStatsApi(`/api/v1/sports/${leagueCfg.sportId}/players?season=${season}`, {
      cacheKey: `sportPlayers:${leagueCfg.sportId}:${season}`,
      ttlMs: 12 * 3600 * 1000,
      force
    });
    const allPlayers = sportRes.data.players || [];

    if (!leagueCfg.leagueId) {
      return { players: allPlayers, teamsById: {} };
    }

    const teamsRes = await fetchStatsApi(
      `/api/v1/teams?sportId=${leagueCfg.sportId}&leagueId=${leagueCfg.leagueId}&season=${season}`,
      { cacheKey: `teams:${leagueCfg.sportId}:${leagueCfg.leagueId}:${season}`, ttlMs: 12 * 3600 * 1000, force }
    );
    const teamsList = teamsRes.data.teams || [];
    const teamsById = {};
    for (const t of teamsList) teamsById[Number(t.id)] = t;

    const leaguePlayers = allPlayers.filter(p => p.currentTeam && teamsById[Number(p.currentTeam.id)]);
    if (leaguePlayers.length > 0) {
      return { players: leaguePlayers, teamsById };
    }

    // Fallback si currentTeam no viene en sports/{sportId}/players: consultar rosters de la liga + /people
    const rosterBatches = await Promise.all(
      teamsList.map(async t => {
        try {
          const r = await fetchStatsApi(
            `/api/v1/teams/${t.id}/roster?rosterType=active&season=${season}`,
            { cacheKey: `roster:${t.id}:${season}`, ttlMs: 6 * 3600 * 1000, force }
          );
          return (r.data.roster || []).map(item => ({
            personId: item.person?.id,
            team: t,
            position: item.position?.abbreviation || ''
          }));
        } catch (e) {
          return [];
        }
      })
    );

    const flat = rosterBatches.flat().filter(x => x.personId);
    const personTeamMap = {};
    const ids = [];
    for (const x of flat) {
      if (!personTeamMap[x.personId]) {
        personTeamMap[x.personId] = x;
        ids.push(x.personId);
      }
    }

    const detailed = [];
    for (let i = 0; i < ids.length; i += 80) {
      const slice = ids.slice(i, i + 80);
      const pRes = await fetchStatsApi(`/api/v1/people?personIds=${slice.join(',')}`, {
        cacheKey: `peopleBatch:${slice.join(',')}`,
        ttlMs: 12 * 3600 * 1000,
        force
      });
      for (const p of pRes.data.people || []) {
        const meta = personTeamMap[p.id];
        detailed.push({
          ...p,
          currentTeam: p.currentTeam || meta?.team || null,
          primaryPosition: p.primaryPosition || { abbreviation: meta?.position || '' }
        });
      }
    }

    return { players: detailed, teamsById };
  }

  async function previewOverlay(overlayKey, params = {}) {
    const subCompositionId = config.BSF_OVERLAY_IDS[overlayKey];
    if (!subCompositionId) {
      throw new Error(`Overlay BSF no reconocido: ${overlayKey}`);
    }

    const settings = bsfStore.getSettings(db);
    const assetsMap = bsfStore.getAssetsMap(db);
    const leagueCode = String(params.league || settings.defaultLeague || 'LMP').toUpperCase();
    const leagueCfg = { ...resolveLeagueConfig(leagueCode), postseason: Boolean(params.postseason) };
    const season = String(params.season || settings.defaultSeason || '2026');
    const tzMode = params.tzMode || settings.tzMode || 'BOTH';
    const force = Boolean(params.force);

    let payload = {};
    let meta = { league: leagueCfg.code, season, tzMode };

    switch (overlayKey) {
      // ==================== FASE 1 ====================
      case 'overlay_2': {
        const res = await fetchStandingsData(leagueCfg, season, { force, mlbLeagueId: params.mlbLeagueId });
        payload = builders.buildOverlay2Standing10Payload({
          standingsData: res.data,
          leagueCode: leagueCfg.code,
          leagueName: params.leagueName || leagueCfg.name,
          useHtmlTitle: params.useHtmlTitle !== false,
          divisionIndex: Number(params.divisionIndex || 0),
          assetsMap
        });
        meta = { ...meta, fromCache: res.fromCache, stale: res.stale };
        break;
      }

      case 'overlay_5': {
        const lmbCfg = resolveLeagueConfig(params.league || 'LMB');
        const res = await fetchStandingsData(lmbCfg, season, { force, withDivisions: true });
        const ranks = Array.isArray(params.ranks) ? params.ranks : [7, 8];
        payload = builders.buildOverlay5Playoffs8Payload({
          standingsData: res.data,
          leagueName: lmbCfg.name,
          subtitle: params.subtitle || 'PLAYOFFS CON OCHO EQUIPOS',
          ranks,
          assetsMap
        });
        meta = { ...meta, league: lmbCfg.code, fromCache: res.fromCache, stale: res.stale };
        break;
      }

      case 'overlay_6': {
        const res = await fetchStandingsData(leagueCfg, season, { force, mlbLeagueId: params.mlbLeagueId });
        payload = builders.buildOverlay6Standing8LogosPayload({
          standingsData: res.data,
          leagueCode: leagueCfg.code,
          leagueName: params.leagueName || leagueCfg.name,
          divisionIndex: Number(params.divisionIndex || 0),
          assetsMap
        });
        meta = { ...meta, fromCache: res.fromCache, stale: res.stale };
        break;
      }

      case 'overlay_7': {
        const date = params.date || yesterdayInTijuana();
        const listRes = await listGames({ league: leagueCfg.code, date, postseason: params.postseason, force });
        payload = builders.buildOverlay7YesterdaySummaryPayload({
          games: listRes.rawGames,
          leagueCode: leagueCfg.code,
          leagueName: leagueCfg.name,
          assetsMap
        });
        meta = { ...meta, date, gamesFound: listRes.rawGames.length, fromCache: listRes.fromCache };
        break;
      }

      case 'overlay_9': {
        const date = params.date || todayInTijuana();
        const listRes = await listGames({ league: leagueCfg.code, date, postseason: params.postseason, force });
        payload = builders.buildOverlay9GamesTodayPayload({
          games: listRes.rawGames,
          dateStr: date,
          leagueCode: leagueCfg.code,
          leagueName: leagueCfg.name,
          tzMode,
          assetsMap
        });
        meta = { ...meta, date, gamesFound: listRes.rawGames.length, fromCache: listRes.fromCache };
        break;
      }

      // ==================== FASE 2 ====================
      case 'overlay_8': {
        const date = params.date || yesterdayInTijuana();
        let gamePk = params.gamePk ? Number(params.gamePk) : null;
        if (!gamePk) {
          const listRes = await listGames({ league: leagueCfg.code, date, postseason: params.postseason, force });
          const chosen =
            listRes.games.find(g => g.abstractGameState === 'Final') ||
            listRes.games[0];
          if (!chosen) {
            throw new Error(`No hay juegos encontrados para ${leagueCfg.code} el ${date}.`);
          }
          gamePk = chosen.gamePk;
        }
        const feedRes = await fetchStatsApi(`/api/v1.1/game/${gamePk}/feed/live`, {
          cacheKey: `feedLive:${gamePk}`,
          ttlMs: 300000,
          force
        });
        const feed = { ...(feedRes.data || {}) };
        if (!feed.liveData?.plays?.allPlays?.length) {
          try {
            const pbp = await fetchStatsApi(`/api/v1/game/${gamePk}/playByPlay`, {
              cacheKey: `pbp:${gamePk}`,
              ttlMs: 300000,
              force
            });
            feed.playByPlay = pbp.data;
          } catch (e) {}
        }
        payload = builders.buildOverlay8GameDetailPayload({
          feed,
          leagueCode: leagueCfg.code,
          leagueName: leagueCfg.name,
          photoUrl: params.photoUrl,
          assetsMap
        });
        meta = { ...meta, gamePk, date, fromCache: feedRes.fromCache };
        break;
      }

      case 'overlay_4': {
        const mode = params.mode === 'hitting' ? 'hitting' : 'pitching';
        const endDate = params.endDate || yesterdayInTijuana();
        const startDate = params.startDate || endDate;
        const leagueParam = leagueCfg.leagueId ? `&leagueId=${leagueCfg.leagueId}` : '';
        const rangePath = `/api/v1/stats?stats=byDateRange&group=${mode}&sportId=${leagueCfg.sportId}${leagueParam}&season=${season}&startDate=${startDate}&endDate=${endDate}&limit=30`;
        let statsRes = await fetchStatsApi(rangePath, {
          cacheKey: `standouts:${leagueCfg.code}:${mode}:${startDate}:${endDate}`,
          ttlMs: 180000,
          force
        });
        let splits = (statsRes.data.stats && statsRes.data.stats[0] && statsRes.data.stats[0].splits) || [];
        let fallbackToSeason = false;
        if (splits.length === 0) {
          const seasonPath = `/api/v1/stats?stats=season&group=${mode}&sportId=${leagueCfg.sportId}${leagueParam}&season=${season}&limit=30`;
          statsRes = await fetchStatsApi(seasonPath, {
            cacheKey: `standoutsSeason:${leagueCfg.code}:${mode}:${season}`,
            ttlMs: 300000,
            force
          });
          splits = (statsRes.data.stats && statsRes.data.stats[0] && statsRes.data.stats[0].splits) || [];
          fallbackToSeason = true;
        }

        const sorted = [...splits].sort((a, b) => {
          const sa = a.stat || {};
          const sb = b.stat || {};
          if (mode === 'pitching') {
            const wDiff = Number(sb.wins || 0) - Number(sa.wins || 0);
            if (wDiff !== 0) return wDiff;
            const ipDiff = Number(sb.inningsPitched || 0) - Number(sa.inningsPitched || 0);
            if (ipDiff !== 0) return ipDiff;
            return Number(sa.era || 99) - Number(sb.era || 99);
          }
          const opsDiff = Number(sb.ops || 0) - Number(sa.ops || 0);
          if (opsDiff !== 0) return opsDiff;
          return Number(sb.rbi || 0) - Number(sa.rbi || 0);
        });

        payload = builders.buildOverlay4StandoutsPayload({
          leagueCode: leagueCfg.code,
          leagueName: leagueCfg.name,
          mode,
          players: sorted.slice(0, 4),
          assetsMap
        });
        meta = { ...meta, mode, startDate, endDate, fallbackToSeason };
        break;
      }

      case 'main_player':
      case 'overlay_1': {
        let personId = params.personId ? Number(params.personId) : null;
        if (!personId && params.playerName) {
          const matches = await searchPlayers({ query: params.playerName, sportId: leagueCfg.sportId });
          if (matches[0]) personId = matches[0].id;
        }
        if (!personId) {
          throw new Error('Selecciona o proporciona un jugador (personId o playerName).');
        }
        const group = params.group === 'hitting' ? 'hitting' : 'pitching';
        const hydrate = `currentTeam,stats(group=[${group}],type=[season],sportId=${leagueCfg.sportId})`;
        const pRes = await fetchStatsApi(`/api/v1/people/${personId}?hydrate=${encodeURIComponent(hydrate)}`, {
          cacheKey: `person:${personId}:${group}:${leagueCfg.sportId}:${season}`,
          ttlMs: 300000,
          force
        });
        const person = (pRes.data.people && pRes.data.people[0]) || null;
        if (!person) throw new Error(`Jugador ${personId} no encontrado en MLB Stats API.`);

        const splits = (person.stats && person.stats[0] && person.stats[0].splits) || [];
        const seasonSplit = splits.find(s => String(s.season) === season) || splits[0] || {};

        let suggestedNote = params.note !== undefined ? params.note : '';
        if (!suggestedNote) {
          try {
            const mlbHist = await fetchStatsApi(
              `/api/v1/people/${personId}/stats?stats=yearByYear&group=${group}&sportId=1`,
              { cacheKey: `personMlbHist:${personId}:${group}`, ttlMs: 12 * 3600 * 1000 }
            );
            const mlbSplits = (mlbHist.data.stats && mlbHist.data.stats[0] && mlbHist.data.stats[0].splits) || [];
            if (mlbSplits.length > 0) {
              const years = [...new Set(mlbSplits.map(s => s.season).filter(Boolean))].sort();
              const lastTeam = mlbSplits[mlbSplits.length - 1]?.team;
              const teamEs = lastTeam ? builders.getTeamName(lastTeam, 'full').toUpperCase() : 'MLB';
              suggestedNote = `*JUGÓ CON ${teamEs} EN ${years.join(', ')}`;
            }
          } catch (e) {}
        }

        const builderFn = overlayKey === 'main_player' ? builders.buildMainPlayerPayload : builders.buildOverlay1PlayerPayload;
        payload = builderFn({
          player: person,
          stat: seasonSplit.stat || {},
          leagueName: params.leagueName || leagueCfg.name,
          teamName: params.teamName || (seasonSplit.team && builders.getTeamName(seasonSplit.team, 'full')),
          group,
          note: suggestedNote,
          imageUrl: params.imageUrl,
          assetsMap
        });
        meta = { ...meta, personId, playerName: person.fullName, group };
        break;
      }

      // ==================== FASE 3 ====================
      case 'overlay_3': {
        const source = params.source === 'historical' ? 'historical' : 'season';
        if (source === 'historical') {
          const record = bsfStore.getHistorical(db, params.recordKey || 'lmp_lmb_hits');
          if (!record) throw new Error('Registro histórico no encontrado.');
          const parts = String(record.title || '').split('|');
          payload = builders.buildOverlay3Compare2ColsPayload({
            titleLeft: (parts[0] || record.col1_label || 'HISTÓRICOS').trim(),
            titleRight: (parts[1] || 'RÉCORDS').trim(),
            leftRows: record.left_rows,
            rightRows: record.right_rows,
            imageUrl: params.imageUrl || record.image_url,
            assetsMap
          });
          meta = { ...meta, source: 'historical', recordKey: record.record_key };
        } else {
          const category = params.leaderCategory || 'hits';
          const leftCode = String(params.leftLeague || 'LMP').toUpperCase();
          const rightCode = String(params.rightLeague || 'LMB').toUpperCase();
          const leftCfg = resolveLeagueConfig(leftCode);
          const rightCfg = resolveLeagueConfig(rightCode);
          const [lRes, rRes] = await Promise.all([
            fetchStatsApi(
              `/api/v1/stats/leaders?leaderCategories=${category}&sportId=${leftCfg.sportId}${leftCfg.leagueId ? `&leagueId=${leftCfg.leagueId}` : ''}&season=${season}&limit=8`,
              { cacheKey: `leaders:${leftCfg.code}:${category}:${season}`, ttlMs: 300000, force }
            ),
            fetchStatsApi(
              `/api/v1/stats/leaders?leaderCategories=${category}&sportId=${rightCfg.sportId}${rightCfg.leagueId ? `&leagueId=${rightCfg.leagueId}` : ''}&season=${season}&limit=8`,
              { cacheKey: `leaders:${rightCfg.code}:${category}:${season}`, ttlMs: 300000, force }
            )
          ]);
          const mapLeaders = d =>
            ((d.leagueLeaders && d.leagueLeaders[0] && d.leagueLeaders[0].leaders) || []).map(x => ({
              name: x.person?.fullName || '',
              value: x.value ?? 0
            }));
          payload = builders.buildOverlay3Compare2ColsPayload({
            titleLeft: `${leftCfg.code} Y ${rightCfg.code}`,
            titleRight: params.titleRight || `LÍDERES DE ${String(category).toUpperCase()} (${season})`,
            leftRows: mapLeaders(lRes.data),
            rightRows: mapLeaders(rRes.data),
            imageUrl: params.imageUrl,
            assetsMap
          });
          meta = { ...meta, source: 'season', category, leftLeague: leftCfg.code, rightLeague: rightCfg.code };
        }
        break;
      }

      case 'overlay_10': {
        const awardId = params.awardId || 'ALMOY';
        const cardsInput = Array.isArray(params.cards) ? params.cards : null;
        if (cardsInput && cardsInput.length > 0) {
          payload = builders.buildOverlay10Awards3CardsPayload({
            leagueName: params.leagueName || 'GRANDES LIGAS',
            awardTitle: params.awardTitle || awardId,
            cards: cardsInput,
            assetsMap
          });
        } else {
          const allAwRes = await fetchStatsApi(`/api/v1/awards/${awardId}/recipients`, {
            cacheKey: `awardAll:${awardId}`,
            ttlMs: 12 * 3600 * 1000,
            force
          });
          const rawAwards = allAwRes.data.awards || [];
          const reqSeason = String(params.awardSeason || season);
          let candidates = rawAwards.filter(a => String(a.season) === reqSeason);
          if (candidates.length < 3) {
            candidates = [...rawAwards]
              .filter(a => !params.awardSeason || Number(a.season || 0) <= Number(reqSeason))
              .sort((a, b) => Number(b.season || 0) - Number(a.season || 0) || String(b.date || '').localeCompare(String(a.date || '')));
            if (candidates.length === 0) {
              candidates = [...rawAwards].sort((a, b) => Number(b.season || 0) - Number(a.season || 0));
            }
          }
          const recipients = candidates.slice(0, 3);
          const mlbTeamsRes = await fetchStatsApi('/api/v1/teams?sportId=1', {
            cacheKey: 'teams:MLB:1',
            ttlMs: 24 * 3600 * 1000,
            force
          }).catch(() => ({ data: { teams: [] } }));
          const mlbTeamsById = {};
          for (const t of mlbTeamsRes.data.teams || []) mlbTeamsById[Number(t.id)] = t;

          const distinctSeasons = [...new Set(recipients.map(r => String(r.season || reqSeason)))];
          const standingsBySeasonTeam = {};
          await Promise.all(
            distinctSeasons.map(async yr => {
              try {
                const stRes = await fetchStatsApi(
                  `/api/v1/standings?leagueId=103,104&season=${yr}&standingsTypes=regularSeason`,
                  { cacheKey: `standings:MLB:${yr}`, ttlMs: 3600 * 1000 }
                );
                standingsBySeasonTeam[yr] = {};
                for (const rec of stRes.data.records || []) {
                  for (const tr of rec.teamRecords || []) {
                    standingsBySeasonTeam[yr][Number(tr.team?.id)] = `${tr.wins}-${tr.losses}`;
                  }
                }
              } catch (e) {}
            })
          );

          const cards = recipients.map(a => {
            const p = a.player || {};
            const yr = String(a.season || reqSeason);
            const teamObj = mlbTeamsById[Number(a.team?.id)] || a.team || {};
            const wlMap = standingsBySeasonTeam[yr] || {};
            const wl = wlMap[Number(teamObj.id)] ? ` (${wlMap[Number(teamObj.id)]})` : '';
            const teamEs = builders.getTeamName(teamObj, 'standing').toUpperCase();
            const personName = p.fullName || p.nameFirstLast || p.lastFirstName || '';
            return {
              name: personName,
              teamRecord: `${teamEs}${wl}`,
              notes: `*GANADOR ${yr} — ${a.name || awardId}`,
              imageUrl: p.id
                ? `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_426,q_auto:best/v1/people/${p.id}/headshot/67/current`
                : assetsMap.default_player_img
            };
          });
          payload = builders.buildOverlay10Awards3CardsPayload({
            leagueName: params.leagueName || 'GRANDES LIGAS',
            awardTitle: params.awardTitle || `${(recipients[0] && recipients[0].name) || awardId}`,
            cards,
            assetsMap
          });
        }
        meta = { ...meta, awardId };
        break;
      }

      case 'overlay_11':
      case 'overlay_12': {
        const mode = params.mode || 'birthdays';
        const targetDate = params.date || todayInTijuana();
        let rows = Array.isArray(params.rows) ? params.rows : [];
        let rightTitle = params.titleRight || 'CUMPLEAÑOS DE HOY';
        let col1Header = params.col1Header || 'Nombre';
        let col2Header = params.col2Header || 'Año';

        if (rows.length === 0 && mode === 'birthdays') {
          const mmDd = targetDate.slice(5, 10);
          const { players } = await fetchLeaguePlayers(leagueCfg, season, force);
          rows = players
            .filter(p => p.birthDate && p.birthDate.slice(5, 10) === mmDd)
            .sort((a, b) => String(b.birthDate).localeCompare(String(a.birthDate)))
            .slice(0, 10)
            .map(p => ({ name: p.fullName, value: String(p.birthDate).slice(0, 4) }));
          rightTitle = params.titleRight || `CUMPLEAÑEROS (${builders.formatSpanishDateUpper(targetDate)})`;
        } else if (rows.length === 0 && mode === 'leaders') {
          const cat = params.leaderCategory || 'homeRuns';
          const lRes = await fetchStatsApi(
            `/api/v1/stats/leaders?leaderCategories=${cat}&sportId=${leagueCfg.sportId}${leagueCfg.leagueId ? `&leagueId=${leagueCfg.leagueId}` : ''}&season=${season}&limit=8`,
            { cacheKey: `leaders:${leagueCfg.code}:${cat}:${season}`, ttlMs: 300000, force }
          );
          rows = ((lRes.data.leagueLeaders && lRes.data.leagueLeaders[0] && lRes.data.leagueLeaders[0].leaders) || []).map(x => ({
            name: x.person?.fullName || '',
            value: x.value ?? 0
          }));
          rightTitle = params.titleRight || `LÍDERES ${String(cat).toUpperCase()}`;
          col2Header = params.col2Header || String(cat).toUpperCase();
        }

        payload =
          overlayKey === 'overlay_11'
            ? builders.buildOverlay11List2ColsPayload({
                titleLeft: params.titleLeft || leagueCfg.name,
                titleRight: rightTitle,
                rows,
                imageUrl: params.imageUrl,
                assetsMap
              })
            : builders.buildOverlay12List2ColsHeadersPayload({
                titleLeft: params.titleLeft || leagueCfg.name,
                titleRight: rightTitle,
                col1Header,
                col2Header,
                rows,
                imageUrl: params.imageUrl,
                assetsMap
              });
        meta = { ...meta, mode, rowsCount: rows.length };
        break;
      }

      case 'overlay_13':
      case 'overlay_15':
      case 'overlay_16': {
        const { players, teamsById } = await fetchLeaguePlayers(leagueCfg, season, force);
        const sorted = [...players]
          .filter(p => Number.isFinite(Number(p.currentAge)) || p.birthDate)
          .sort((a, b) => {
            const ageDiff = Number(b.currentAge || 0) - Number(a.currentAge || 0);
            if (ageDiff !== 0) return ageDiff;
            return String(a.birthDate || '9999').localeCompare(String(b.birthDate || '9999'));
          })
          .slice(0, 10);

        const rows = sorted.map(p => {
          const teamObj = teamsById[Number(p.currentTeam?.id)] || p.currentTeam || {};
          return {
            name: p.fullName || '',
            team: builders.getTeamName(teamObj, 'standing'),
            age: p.currentAge ?? '',
            col1: p.fullName || '',
            col2: builders.translatePositionEs(p.primaryPosition?.abbreviation || '')
          };
        });

        payload =
          overlayKey === 'overlay_16'
            ? builders.buildOverlay16Table4ColsPayload({
                leagueCode: leagueCfg.code,
                leagueName: params.leagueName || leagueCfg.name,
                subtitle: params.subtitle || 'Los más veteranos',
                rows,
                abbreviateLongNames: params.abbreviateLongNames !== false,
                imageUrl: params.imageUrl,
                assetsMap
              })
            : builders.buildOverlay13Or15VeteransPayload({
                leagueCode: leagueCfg.code,
                leagueName: params.leagueName || leagueCfg.name,
                subtitle: params.subtitle || 'Los más veteranos',
                rows,
                abbreviateLongNames: params.abbreviateLongNames !== false,
                imageUrl: params.imageUrl,
                assetsMap
              });
        meta = { ...meta, playersEvaluated: players.length, rowsCount: rows.length };
        break;
      }

      case 'overlay_14': {
        const awardId = params.awardId || 'NLGG';
        const [awRes, mlbTeamsRes] = await Promise.all([
          fetchStatsApi(`/api/v1/awards/${awardId}/recipients`, {
            cacheKey: `awardAll:${awardId}`,
            ttlMs: 12 * 3600 * 1000,
            force
          }),
          fetchStatsApi('/api/v1/teams?sportId=1', {
            cacheKey: 'teams:MLB:1',
            ttlMs: 24 * 3600 * 1000,
            force
          }).catch(() => ({ data: { teams: [] } }))
        ]);
        const mlbTeamsById = {};
        for (const t of mlbTeamsRes.data.teams || []) mlbTeamsById[Number(t.id)] = t;

        const sorted = [...(awRes.data.awards || [])]
          .sort((a, b) => Number(b.season || 0) - Number(a.season || 0))
          .slice(0, 11);

        const rows = sorted.map(a => {
          const teamObj = mlbTeamsById[Number(a.team?.id)] || a.team || {};
          const aliasAbbr = builders.TEAM_ALIASES[Number(teamObj.id)]?.abbr;
          return {
            season: a.season || '',
            player: a.player?.fullName || a.player?.nameFirstLast || a.player?.lastFirstName || '',
            position: a.player?.primaryPosition?.abbreviation || '',
            team: teamObj.abbreviation || aliasAbbr || builders.getTeamName(teamObj, 'short')
          };
        });

        payload = builders.buildOverlay14AwardsTable4ColsPayload({
          titleLeft: params.titleLeft || 'GRANDES LIGAS',
          titleRight: params.titleRight || ((sorted[0] && sorted[0].name) || awardId).toUpperCase(),
          rows,
          imageUrl: params.imageUrl,
          assetsMap
        });
        meta = { ...meta, awardId, rowsCount: rows.length };
        break;
      }

      // ==================== EDITORIALES / LOWER THIRDS ====================
      case 'lower_third': {
        payload = builders.buildLowerThirdPayload({
          line1: params.line1 ?? '',
          line2: params.line2 ?? ''
        });
        break;
      }

      case 'lower_third_medio': {
        payload = builders.buildLowerThirdMedioPayload({
          nameIzq: params.nameIzq ?? '',
          cargoIzq: params.cargoIzq ?? '',
          nameDer: params.nameDer ?? '',
          cargoDer: params.cargoDer ?? ''
        });
        break;
      }

      default:
        throw new Error(`Overlay BSF no implementado: ${overlayKey}`);
    }

    return { overlayKey, subCompositionId, payload, meta };
  }

  function resolveLocalAssetsInPayload(payload = {}) {
    const out = {};
    for (const [k, v] of Object.entries(payload)) {
      if (typeof v === 'string' && v.startsWith('/assets/')) {
        out[k] = singularClient.resolveAssetToDataUrl(v);
      } else {
        out[k] = v;
      }
    }
    return out;
  }

  async function pushOverlay(overlayKey, { payload = null, state = null, params = {}, dryRun = false } = {}) {
    const subCompositionId = config.BSF_OVERLAY_IDS[overlayKey];
    if (!subCompositionId) {
      throw new Error(`Overlay BSF no reconocido: ${overlayKey}`);
    }

    let finalPayload = payload;
    let meta = { league: params.league || null };
    if (!finalPayload || Object.keys(finalPayload).length === 0) {
      const built = await previewOverlay(overlayKey, params);
      finalPayload = built.payload;
      meta = built.meta;
    }

    const resolvedPayload = resolveLocalAssetsInPayload(finalPayload);
    const targetState = state || null;

    if (dryRun) {
      const historyId = bsfStore.logHistory(db, {
        overlayKey,
        subCompositionId,
        league: meta.league || null,
        state: targetState,
        payload: resolvedPayload,
        dryRun: true,
        status: 'simulated'
      });
      return {
        success: true,
        dryRun: true,
        historyId,
        overlayKey,
        subCompositionId,
        state: targetState,
        payload: resolvedPayload,
        meta
      };
    }

    try {
      const singularResponse = await singularClient.patchSingular(
        appToken,
        subCompositionId,
        resolvedPayload,
        targetState
      );
      const historyId = bsfStore.logHistory(db, {
        overlayKey,
        subCompositionId,
        league: meta.league || null,
        state: targetState,
        payload: resolvedPayload,
        dryRun: false,
        status: 'sent'
      });
      if (io) {
        io.emit('bsf:actualizado', {
          overlayKey,
          subCompositionId,
          state: targetState,
          historyId,
          timestamp: new Date().toISOString()
        });
      }
      return {
        success: true,
        dryRun: false,
        historyId,
        overlayKey,
        subCompositionId,
        state: targetState,
        payload: resolvedPayload,
        singularResponse
      };
    } catch (err) {
      bsfStore.logHistory(db, {
        overlayKey,
        subCompositionId,
        league: meta.league || null,
        state: targetState,
        payload: resolvedPayload,
        dryRun: false,
        status: 'error',
        error: err.message
      });
      throw err;
    }
  }

  async function getLiveControlState() {
    const url = `${config.SINGULAR_API_BASE}/${appToken}/control`;
    const res = await fetchFn(url, { signal: AbortSignal.timeout(15000) });
    if (!res || !res.ok) {
      throw new Error(`No se pudo consultar control app Singular (${res ? res.status : 'NO_RESPONSE'})`);
    }
    const items = await res.json();
    const idToKey = {};
    for (const [k, v] of Object.entries(config.BSF_OVERLAY_IDS)) {
      idToKey[v] = k;
    }
    return (Array.isArray(items) ? items : []).map(it => ({
      overlayKey: idToKey[it.subCompositionId] || null,
      subCompositionId: it.subCompositionId,
      subCompositionName: it.subCompositionName,
      state: it.state,
      mainComposition: Boolean(it.mainComposition),
      payload: it.payload || {}
    }));
  }

  async function runScheduledBatch({ slot = 'manual', dryRunOverride } = {}) {
    const settings = bsfStore.getSettings(db);
    const sched = settings.scheduler;
    const dryRun = dryRunOverride !== undefined ? Boolean(dryRunOverride) : Boolean(sched.dryRunOnly);
    const leagues = Array.isArray(sched.leagues) && sched.leagues.length ? sched.leagues : ['LMP'];
    const primaryLeague = leagues[0];
    const results = [];

    const jobs = [];
    if (slot === 'morning' || slot === 'manual') {
      jobs.push({ overlayKey: 'overlay_9', params: { league: primaryLeague, date: todayInTijuana(), force: true } });
      if (leagues.includes('LMP')) jobs.push({ overlayKey: 'overlay_2', params: { league: 'LMP', force: true } });
      if (leagues.includes('LVBP')) jobs.push({ overlayKey: 'overlay_6', params: { league: 'LVBP', force: true } });
      if (leagues.includes('LMB')) jobs.push({ overlayKey: 'overlay_5', params: { league: 'LMB', force: true } });
    }
    if (slot === 'night' || slot === 'manual') {
      const resLeague = leagues.includes('LVBP') ? 'LVBP' : primaryLeague;
      jobs.push({ overlayKey: 'overlay_7', params: { league: resLeague, date: yesterdayInTijuana(), force: true } });
    }

    for (const job of jobs) {
      try {
        const r = await pushOverlay(job.overlayKey, {
          params: job.params,
          state: 'Out1',
          dryRun
        });
        results.push({ ...job, ok: true, dryRun: r.dryRun, historyId: r.historyId });
      } catch (err) {
        results.push({ ...job, ok: false, error: err.message });
      }
    }

    lastSchedulerRun = { slot, at: new Date().toISOString(), dryRun, results };
    if (io) {
      io.emit('bsf:scheduler', lastSchedulerRun);
    }
    return lastSchedulerRun;
  }

  async function tickScheduler(now = new Date()) {
    const settings = bsfStore.getSettings(db);
    const sched = settings.scheduler;
    if (!sched || !sched.enabled) return null;
    const { dateStr, timeStr } = clockAndDateInTijuana(now);

    if (timeStr === sched.morningTime && lastMorningRunDate !== dateStr) {
      lastMorningRunDate = dateStr;
      return runScheduledBatch({ slot: 'morning' });
    }
    if (timeStr === sched.nightTime && lastNightRunDate !== dateStr) {
      lastNightRunDate = dateStr;
      return runScheduledBatch({ slot: 'night' });
    }
    return null;
  }

  function startScheduler(intervalMs = 60000) {
    if (schedulerTimer) return schedulerTimer;
    schedulerTimer = setInterval(() => {
      tickScheduler().catch(err => console.error('[BSF Scheduler Error]:', err.message));
    }, intervalMs);
    if (typeof schedulerTimer.unref === 'function') schedulerTimer.unref();
    return schedulerTimer;
  }

  function stopScheduler() {
    if (schedulerTimer) {
      clearInterval(schedulerTimer);
      schedulerTimer = null;
    }
  }

  function getSchedulerStatus() {
    const settings = bsfStore.getSettings(db);
    return {
      running: Boolean(schedulerTimer),
      ...settings.scheduler,
      lastRun: lastSchedulerRun
    };
  }

  return {
    appToken,
    fetchStatsApi,
    listGames,
    searchPlayers,
    previewOverlay,
    pushOverlay,
    getLiveControlState,
    runScheduledBatch,
    tickScheduler,
    startScheduler,
    stopScheduler,
    getSchedulerStatus
  };
}

module.exports = {
  createBsfService,
  todayInTijuana,
  yesterdayInTijuana
};
