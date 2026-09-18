const test = require('node:test');
const assert = require('node:assert/strict');
const config = require('../src/config');
const singularClient = require('../src/services/singularClient');

test('OVERLAY_IDS contiene los identificadores oficiales de las 10 animaciones solicitadas', () => {
  const expectedKeys = [
    'score_bug',
    'fullscreen_matchup',
    'lower_matchup',
    'team_lineups',
    'player_bio',
    'comparison_stats',
    'background_image',
    'baseline_static',
    'freeform_image',
    'freeform_text',
    'lower_1_line',
    'lower_2_line',
    'upper_right_1_line',
    'upper_right_2_line',
    'upper_right_social'
  ];

  for (const key of expectedKeys) {
    assert.ok(config.OVERLAY_IDS[key], `Falta key en OVERLAY_IDS: ${key}`);
    assert.match(config.OVERLAY_IDS[key], /^[0-9a-f-]{36}$/i, `Formato UUID incorrecto para ${key}`);
  }
});

test('constructores de payload generan la estructura JSON exacta esperada por Singular.Live', () => {
  // 1. Background Image
  const bg = singularClient.buildBackgroundImagePayload('https://example.com/bg.png');
  assert.equal(bg.backgroundImage, 'https://example.com/bg.png');

  // 2. Baseline - Static
  const base = singularClient.buildBaselineStaticPayload('AVISO PARROQUIAL EN CINTILLO');
  assert.equal(base.baselineText, 'AVISO PARROQUIAL EN CINTILLO');

  // 3. Freeform Image
  const fImg = singularClient.buildFreeformImagePayload({
    image: 'https://example.com/sponsor.png',
    positionX: 50,
    positionY: 20,
    size: 30,
    transparency: 90
  });
  assert.equal(fImg.image, 'https://example.com/sponsor.png');
  assert.equal(fImg.positionX, '50');
  assert.equal(fImg.positionY, '20');
  assert.equal(fImg.size, '30');
  assert.equal(fImg.transparency, '90');

  // 4. Freeform Text
  const fTxt = singularClient.buildFreeformTextPayload({
    text: 'Texto Libre Flotante',
    positionX: 45,
    positionY: 35,
    size: 25,
    transparency: 100
  });
  assert.equal(fTxt.text, 'Texto Libre Flotante');
  assert.equal(fTxt.positionX, '45');
  assert.equal(fTxt.tranpsarency, '100'); // singular typo check

  // 5. Fullscreen - Comparison Stats
  const comp = singularClient.buildComparisonStatsPayload(
    { nombre: 'TOROS', siglas: 'TIJ', color_primario: '#C4122F', score: '5' },
    { nombre: 'SULTANES', siglas: 'MTY', color_primario: '#0C2340', score: '3' },
    [
      { v1: '5', cat: 'CARRERAS', v2: '3' },
      { v1: '8', cat: 'HITS', v2: '6' }
    ],
    'Serie Final'
  );
  assert.equal(comp['Team 1 Name'], 'TOROS');
  assert.equal(comp['Team 2 Name'], 'SULTANES');
  assert.equal(comp['statTable_r1'], '5, CARRERAS, 3');
  assert.equal(comp['statTable_r2'], '8, HITS, 6');
  assert.equal(comp['Subtitle'], 'Serie Final');

  // 6. Lower - 1 Line
  const l1 = singularClient.buildLower1LinePayload('TOROS AL FRENTE');
  assert.equal(l1.text, 'TOROS AL FRENTE');

  // 7. Lower - 2 Line
  const l2 = singularClient.buildLower2LinePayload('GRAN JUGADA DE DOBLE PLAY', 'FIN DEL QUINTO INNING');
  assert.equal(l2['Line 1 Text'], 'GRAN JUGADA DE DOBLE PLAY');
  assert.equal(l2['Line 2 Text'], 'FIN DEL QUINTO INNING');

  // 8. Upper Right - 1 Line
  const ur1 = singularClient.buildUpperRight1LinePayload('TRANSMISIÓN EN DIRECTO');
  assert.equal(ur1.text, 'TRANSMISIÓN EN DIRECTO');

  // 9. Upper Right - 2 Line
  const ur2 = singularClient.buildUpperRight2LinePayload('TIJUANA vs MONTERREY', 'JUEGO 4 DE LA SERIE');
  assert.equal(ur2['Line 1 Text'], 'TIJUANA vs MONTERREY');
  assert.equal(ur2['Line 2 Text'], 'JUEGO 4 DE LA SERIE');

  // 10. Upper Right - Social Media
  const soc = singularClient.buildUpperRightSocialPayload('@TorosDeTijuana', 'https://example.com/x-icon.svg');
  assert.equal(soc.text, '@TorosDeTijuana');
  assert.equal(soc.socialMediaLogo, 'https://example.com/x-icon.svg');
});
