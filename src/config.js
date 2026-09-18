require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  SINGULAR_APP_TOKEN: process.env.SINGULAR_APP_TOKEN || '3ObWIqbNNtoA6mI3Di4GmJ',
  SINGULAR_API_BASE: 'https://app.singular.live/apiv2/controlapps',
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
  }
};
