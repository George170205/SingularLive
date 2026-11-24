require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  SINGULAR_APP_TOKEN: process.env.SINGULAR_APP_TOKEN || '3ObWIqbNNtoA6mI3Di4GmJ',
  SINGULAR_API_BASE: 'https://app.singular.live/apiv2/controlapps',
  CUSTOM_STATS_APP_TOKEN: process.env.CUSTOM_STATS_APP_TOKEN || '3EXsWdULgKljfXOakhd6QQ',
  CUSTOM_STATS_SUBCOMP_ID: '-P3dvERXV-J_I-B_Rb8Z',
  DATABASE_FILE: process.env.DATABASE_FILE || 'database.sqlite',
  MASTER_KEY: process.env.MASTER_KEY || 'toros_tijuana_broadcast_secret_key_2026',
  OVERLAY_IDS: {
    score_bug: '3dd9a73e-3752-444d-beb7-a70e7b3184ba',
    fullscreen_matchup: '44b94f2a-23b0-4f08-a95a-cec1aea89e81',
    lower_matchup: 'f12eafa1-ab55-4816-922c-7496f388fd03',
    team_lineups: '9a020313-2243-4d2a-98f9-c374e05cb9d2',
    player_bio: '355a74fd-62eb-434b-b83a-d41ab28666bb',
    comparison_stats: 'b84f7f1b-f5e2-4b4b-a2e8-3b0ec0c39785',
    background_image: '2675716d-451c-4e76-b52d-6bc1f1e023b3',
    baseline_static: 'e2840a63-771b-41a5-91e2-38fa823ed325',
    freeform_image: '73bd8f0e-726d-47f5-ae54-a40660b40569',
    freeform_text: '8dd3dad4-620a-4f88-b3f3-49e0a8bb34a9',
    lower_1_line: '5bae6f0b-5b7e-4990-bf5c-c6296719c99b',
    lower_2_line: '7d5591b9-a03c-405a-86d9-2e56e52e9430',
    upper_right_1_line: '2606b2b5-082e-4406-80b4-8b11da3af36f',
    upper_right_2_line: '8663f3fa-f6e6-4d65-a9dc-f68df1184762',
    upper_right_social: '3b53f332-f127-4dbf-accb-9977111ea9c5'
  },
  BSF_APP_TOKEN: process.env.BSF_APP_TOKEN || '0FuwnDA057k7zosJmUACw5',
  BSF_OVERLAY_IDS: {
    main_player: '-P4ykk26D5g-4HCNPfBb',
    overlay_1: '4813e7dc-fa3e-459b-ad65-34e477d63f76',
    overlay_2: '03dbba3a-b283-47d6-acaf-db26975335e6',
    overlay_3: '91dd5782-5e48-4472-8e1b-30fde02783d9',
    overlay_4: 'c2622f06-b0d0-4816-ba9e-93e4ecfe95f3',
    overlay_5: '83150026-00db-490d-b5f3-6cfdf7dd7452',
    overlay_6: '14cffa3b-61f8-4592-9e3a-6ff1952133b1',
    overlay_7: '4893753a-8655-49fb-9bf0-21a7e4858413',
    overlay_8: '860c9efd-c125-4ad7-b9e8-94a88981467d',
    overlay_9: 'e4bf7b3e-6d7f-46f8-bf6a-da3b02d7c297',
    overlay_10: '9454e7b4-3f34-465f-a80b-331b47a0e75b',
    overlay_11: '-P3dvERXV-J_I-B_Rb8Z',
    overlay_12: 'd763377f-0d18-4341-bbeb-85623843adb3',
    overlay_13: '3cb5a265-3ae3-4f54-94a8-ce449221a307',
    overlay_14: '3d2e3237-34d8-416a-a31f-fe9bd01eb8d2',
    overlay_15: '3737a449-6392-4a24-900e-04ed694e7e95',
    overlay_16: '17ada1c3-d5ba-434e-84a5-79178a4f03ea',
    lower_third: 'a8a5b908-3129-4e5a-889f-b027282797b0',
    lower_third_medio: '0bf6655e-660b-40ba-a529-f171b300df8f'
  },
  BSF_LEAGUES: {
    LMP: { code: 'LMP', name: 'LIGA MEXICANA DEL PACÍFICO', sportId: 17, leagueId: 132 },
    LMB: {
      code: 'LMB',
      name: 'LIGA MEXICANA DE BEISBOL',
      sportId: 23,
      leagueId: 125,
      omitLeagueIdInPostseason: true,
      divisions: { norte: 222, sur: 223 }
    },
    LVBP: { code: 'LVBP', name: 'LIGA VENEZOLANA DE BEISBOL PROFESIONAL', sportId: 17, leagueId: 135 },
    MLB: { code: 'MLB', name: 'GRANDES LIGAS', sportId: 1, leagueId: null, alLeagueId: 103, nlLeagueId: 104 },
    LIDOM: { code: 'LIDOM', name: 'LIGA DE BÉISBOL PROFESIONAL DE REPÚBLICA DOMINICANA', sportId: 17, leagueId: 131 }
  },
  BSF_TIMEZONES: {
    TIJ: 'America/Tijuana',
    CDMX: 'America/Mexico_City',
    BOTH: 'BOTH'
  }
};
