# Arquitectura: Automatización de Gráficos Singular.Live — Toros de Tijuana

## 1. Objetivo del proyecto

Construir un cliente/backend propio que permita a un operador seleccionar un enfrentamiento (Toros vs. Equipo X) y que automáticamente:
- Cargue logos, colores y nombres de ambos equipos
- Cargue el roster/lineup del equipo correspondiente
- Actualice todas las composiciones relevantes en Singular.Live (score bug, matchup, lineups, bios)

Sin que el operador tenga que llenar datos manualmente por partido.

---

## 2. Arquitectura general

El sistema se divide en **dos paneles** con propósitos distintos:

- **Panel A — Setup/Pre-partido:** seleccionar equipos, cargar roster/logos, configurar control apps de Singular. Se usa una vez antes de cada partido (o al editar catálogos).
- **Panel B — Control en vivo:** botones de acción (run, out, inning, bases) que disparan actualizaciones inmediatas durante el juego. Pensado para que lo use cualquier operador, no necesariamente tú.

```
┌─────────────────┐       ┌──────────────────┐       ┌─────────────────────┐
│  Panel A/B        │ ←ws→  │   Backend propio   │  →    │   Singular.Live API   │
│  (frontend)       │  http │  (dueño de tokens) │       │  (apiv2/controlapps)  │
└─────────────────┘       └──────────────────┘       └─────────────────────┘
                                    ↓
                     ┌──────────────────────────┐
                     │  Base de datos             │
                     │  (equipos/jugadores/       │
                     │   control_apps/estado)     │
                     └──────────────────────────┘
```

**Regla de oro:** el frontend nunca habla directo con Singular. Todo pasa por tu backend, que es el único que conoce los `appToken` (guardados encriptados, ver sección 4 y 7).

Para el Panel B (tiempo real), el frontend se conecta al backend por **WebSocket** en vez de solo HTTP normal, para que cada click se refleje al instante y, si algún día hay más de un operador/pantalla, se mantengan sincronizados entre sí. El backend sigue hablando con Singular vía REST (`PATCH`) como siempre — el WebSocket es solo entre tu frontend y tu backend.

---

## 3. Stack tecnológico sugerido

| Capa | Opción recomendada | Alternativas |
|---|---|---|
| Backend | Node.js + Express, o Python + FastAPI | Django, NestJS |
| Base de datos | PostgreSQL (relacional, ideal para equipos↔jugadores) | MongoDB, SQLite si es proyecto chico |
| Frontend | React (si quieres algo pulido) o incluso HTML+JS simple | Vue, o un panel en Retool/low-code |
| Hosting backend | Render, Railway, Fly.io (fáciles y con gestor de secretos integrado) | AWS/GCP si ya tienen infraestructura |
| Hosting de imágenes/logos | Singular ya tiene su propio Asset Manager (puedes subir ahí) | Cloudinary, S3, o el propio Google Drive si es low-effort |
| Gestión de secretos | Encriptar en BD (llave maestra en variable de entorno) | AWS Secrets Manager / Doppler si escalan |
| Tiempo real | WebSockets (Socket.io) entre frontend y backend | Server-Sent Events si prefieres algo más simple |
| Estado del partido en vivo | Redis o memoria del proceso | BD si quieres persistencia entre reinicios del server |

---

## 4. Modelo de datos (mínimo viable)

**Tabla `equipos`**
- id
- nombre
- siglas (ej. "TIJ")
- logo_url
- color_primario
- color_secundario

**Tabla `jugadores`**
- id
- equipo_id (FK)
- numero
- nombre
- posicion
- foto_url (opcional)

**Tabla `partidos` (opcional, para historial/calendario)**
- id
- equipo_local_id
- equipo_visitante_id
- fecha
- estado (programado / en vivo / finalizado)

**Tabla `control_apps`** (pensada para cuando extiendan a más de un control app en Singular)
- id
- nombre (ej. "Score Bug Baseball", "Matchup Principal")
- deporte / tipo
- app_token (⚠️ **encriptado**, nunca en texto plano)
- activo (true/false)

Con esta tabla, agregar un nuevo control app a futuro es solo una fila nueva desde el Panel A — no requiere tocar código ni redeploy.

**Estado en vivo del partido** (en Redis o memoria, no necesariamente en Postgres)
- partido_id activo
- inning actual + alta/baja
- outs, bolas, strikes
- bases ocupadas (1B/2B/3B)
- runs por equipo

Esto te permite reconstruir la pantalla del operador si recarga el navegador a media transmisión.

Esto te permite después construir un calendario de temporada y no solo "seleccionar equipo A vs B" manualmente cada vez.

---

## 5. Endpoints del backend (borrador)

### Panel A — Setup / administración (HTTP normal, no urgente)

| Método | Endpoint | Función |
|---|---|---|
| GET | `/api/equipos` | Lista los 10 equipos (para llenar el selector) |
| GET | `/api/equipos/:id/roster` | Roster completo de un equipo |
| PUT | `/api/equipos/:id` | Editar datos de un equipo (logo, colores) |
| POST | `/api/jugadores` | Agregar/editar jugadores de un roster |
| POST | `/api/control-apps` | Da de alta un nuevo control app de Singular (guarda el token encriptado) |
| GET | `/api/control-apps` | Lista control apps configurados (sin exponer el token, solo estado "guardado ✓") |
| POST | `/api/matchup` | Recibe `{ equipoLocalId, equipoVisitanteId }`, arma el payload inicial y lo manda a Singular (logos, nombres, roster) |

### Panel B — Control en vivo (vía WebSocket, latencia mínima)

| Evento (cliente → backend) | Función |
|---|---|
| `run:add` `{ equipo }` | +1 carrera al equipo indicado |
| `out:add` | +1 out (al llegar a 3, resetea outs y avanza inning automáticamente) |
| `inning:set` `{ numero, alta_baja }` | Cambia inning manualmente |
| `base:toggle` `{ base }` | Marca/desmarca 1B, 2B o 3B |
| `conteo:add` `{ tipo: bola\|strike }` | +1 bola o strike |
| `bateador:nuevo` | Resetea conteo de bolas/strikes (y opcionalmente bases) |

| Evento (backend → cliente) | Función |
|---|---|
| `estado:actualizado` | Confirma el nuevo estado tras aplicar un cambio (para sincronizar todas las pantallas conectadas) |
| `singular:error` | Avisa si el PATCH a Singular falló, para mostrar botón de reintentar |

Internamente, cada evento del Panel B: actualiza el estado en Redis/memoria → arma el JSON payload → hace el `PATCH` a `https://app.singular.live/apiv2/controlapps/:appToken/control` → emite `estado:actualizado` de vuelta.

---

## 6. Inventario completo de overlays (control app "Stealth - Baseball")

Con la lista completa de tu playlist en Composer, así los clasificaría según si necesitan datos automatizados de equipo/roster o si son genéricos/manuales:

### Automatizables (dependen de datos de equipo/jugador — van por tu backend)

| Overlay | Para qué sirve | Datos que necesita |
|---|---|---|
| **Score Bug - Baseball** | Marcador principal en pantalla | runs, inning, outs, bases, nombres/colores de equipo |
| **Fullscreen - Matchup** | Pantalla completa de presentación del enfrentamiento | logos, nombres, colores de ambos equipos |
| **Lower - Matchup** | Versión "lower third" del matchup | igual que arriba |
| **Panel - Team Lineups** | Roster/alineación completa | lista de jugadores del equipo |
| **Lower - Team or Player Bio** | Destacar a un jugador específico | nombre, foto, equipo, texto |
| **Fullscreen - Comparison Stats** | Comparativa de stats entre equipos | nombres, logos, colores, filas de stats |

### Genéricos / manuales (no dependen de qué equipo juegue — probablemente no necesitan tu backend)

- **Global Data** — configuración compartida del rig (colores de acento, etc.)
- **Background Image**, **Baseline - Static**, **Freeform Image**, **Freeform Text** — elementos visuales fijos o de texto libre
- **Lower - 1 Line**, **Lower - 2 Line** — texto genérico para anuncios/mensajes
- **Upper Right - 1 Line**, **Upper Right - 2 Line**, **Upper Right - Social Media** — redes sociales, mensajes patrocinados, etc.

Esta separación te ayuda a acotar el alcance real del backend: **solo 6 overlays** necesitan integrarse con tu modelo de datos de equipos/jugadores; el resto se sigue operando manualmente desde Composer como ya lo hacen, sin que tu sistema los toque.

Cada uno tiene su propio `subCompositionId` — vas a necesitar mapear en tu backend qué composición actualizar según el contexto (inicio de partido, cambio de bateador, etc.).

### 6.1 — Catálogo de `subCompositionId` (extraídos de tu export original)

| Overlay | subCompositionId |
|---|---|
| Score Bug - Baseball | `3dd9a73e-3752-444d-beb7-a70e7b3184ba` |
| Fullscreen - Matchup | `44b94f2a-23b0-4f08-a95a-cec1aea89e81` |
| Lower - Matchup | `f12eafa1-ab55-4816-922c-7496f388fd03` |
| Panel - Team Lineups | `9a020313-2243-4d2a-98f9-c374e05cb9d2` |
| Lower - Team or Player Bio | `355a74fd-62eb-434b-b83a-d41ab28666bb` |
| Fullscreen - Comparison Stats | `b84f7f1b-f5e2-4b4b-a2e8-3b0ec0c39785` |

⚠️ **Importante:** estos IDs son válidos mientras no se borre/recree la composición en Composer (editar campos o renombrar no los cambia, pero eliminar y volver a crear el overlay sí generaría un ID nuevo). Antes de ir a producción, conviene confirmarlos con una llamada `GET` real a la API de Singular (o revisando la config del control app) en vez de solo confiar en este export ya un poco viejo.

---

## 7. Seguridad (puntos que se escapan fácil)

- **Nunca** el `appToken` en el frontend, ni en el repo. Se guarda **encriptado en la tabla `control_apps`**, usando una llave maestra que sí vive en variable de entorno. El formulario de configuración nunca vuelve a mostrar el token completo una vez guardado (solo "guardado ✓ ...terminación").
- Autenticación en tu propio backend (login simple para el admin que da de alta control apps/equipos) — si tu backend queda público sin protección, cualquiera puede disparar cambios en el aire. El Panel B (operador en vivo) puede tener un acceso más simple/ligero que el Panel A (admin), ya que son audiencias distintas.
- Usa HTTPS siempre (los hostings mencionados lo dan por default).
- Si en algún momento necesitas dar acceso a un tercero (ej. otro camarógrafo/operador), no le des el token de Singular — dale una cuenta/API key de tu propio sistema con permisos limitados.
- Considera tener un **token de Singular separado para pruebas/staging** vs el de producción, si Singular lo permite en tu plan, para no arriesgar tocar el rig en vivo mientras pruebas.

---

## 8. Cosas que normalmente se pasan por alto

- **Rate limits de la API de Singular** — revisa cuántas requests por segundo/minuto permite tu plan antes de diseñar actualizaciones muy frecuentes (ej. actualizar el score bug cada pocos segundos).
- **Manejo de errores y reintentos** — ¿qué pasa si el PATCH a Singular falla a mitad de un partido en vivo? Necesitas logs y quizás un botón de "reintentar" visible para el operador.
- **Validación de datos antes de mandarlos** — que no se pueda mandar un roster vacío o un logo roto al aire.
- **Modo de emergencia / fallback manual** — si tu backend se cae en pleno partido, ¿el operador puede seguir controlando Singular directo desde su control app normal? Vale la pena no "quemar" el acceso manual.
- **Ambiente de pruebas** — practica con partidos ficticios antes de usarlo en un juego real.
- **Documentación interna** — un mini manual para que cualquier operador (no solo tú) sepa usar el panel el día del partido.
- **Escalabilidad futura** — si esto funciona bien, ¿lo van a querer usar en otros deportes/ligas de la organización? Vale la pena que el modelo de datos no sea 100% específico a beisbol desde el día uno.

---

## 9. Fases sugeridas

1. **Fase 0** — Modelo de datos + carga manual de los 10 equipos y sus rosters (aunque sea vía un script o Postman, sin UI todavía). Placeholders para logos/fotos mientras se recopilan los reales.
2. **Fase 1** — Backend con `/api/control-apps` (guardar token encriptado) y `/api/matchup` funcionando contra un composition de prueba en Singular.
3. **Fase 2** — Panel A: frontend simple (selector de equipos + admin de control apps) conectado al backend.
4. **Fase 3** — Panel B: WebSocket + botones de control en vivo (run, out, inning, bases) contra el score bug de prueba.
5. **Fase 4** — Estado en vivo persistente (Redis) para que el Panel B sobreviva un refresh de página.
6. **Fase 5** — Autenticación diferenciada (admin vs. operador), logs, manejo de errores robusto — antes de usarlo en un partido real.
7. **Fase 6** — Pulido: calendario de temporada, historial, más control apps a futuro.

---

## 10. Decisiones ya tomadas

- **Operador:** no definido aún (puede que George o alguien más) → el Panel B se diseña para cualquier persona, sin jerga técnica.
- **Tiempo real:** sí, necesario durante el partido → arquitectura con WebSockets + estado en vivo (Redis/memoria).
- **Logos/fotos:** aún no existen, se van a recopilar → mientras tanto, placeholders en el modelo de datos.
- **Control apps en Singular:** por ahora uno solo, pero planean extenderlo → tabla `control_apps` con token encriptado, escalable sin tocar código.

---

## 11. Panel B — Controles en vivo para beisbol (borrador)

Basado en los campos reales del `Score Bug - Baseball` de tu export (`team1Runs`, `team2Runs`, `inning`, `outs`, `strikes`, `1stBase`/`2ndBase`/`3rdBase`, `topInning`/`bottomInning`):

| Control visual | Acción | Efecto en Singular |
|---|---|---|
| `+1 Run` (Local / Visitante) | Suma una carrera al equipo | Actualiza `team1Runs` o `team2Runs` |
| `-1 Run` (corrección) | Resta una carrera (para errores de captura) | Igual que arriba, en reversa |
| `+1 Out` | Suma un out | Actualiza `Outs` — **ojo:** el valor real es un texto tipo `"0 OUTS"`/`"1 OUT"`/`"2 OUTS"`, no un número puro (ver sección 13) |
| `Toggle 1B / 2B / 3B` | Marca/desmarca corredor en base | Actualiza `1st Base`/`2nd Base`/`3rd Base` (boolean) |
| `+1 Bola` / `+1 Strike` | Cuenta del bateador | Actualiza `Strikes` — **corregido:** es un solo campo con formato `"bolas-strikes"` (ej. `"2-1"`), no dos campos separados (ver sección 13) |
| `Nuevo bateador` | Resetea conteo | Pone `Strikes` en `"0-0"` |
| `Alta ⇄ Baja` | Cambia mitad del inning | Actualiza `topInning`/`bottomInning` |
| `Inning +1 / -1` | Avanza o retrocede inning manualmente | Actualiza `inning` |

**Detalles a definir contigo:**
- ¿Quieres botones de "deshacer último cambio" general, o basta con los +1/-1 individuales?
- ¿Quieres que "Nuevo bateador" también limpie las bases automáticamente, o eso se controla aparte?
- ¿Qué debe pasar exactamente al llegar a 3 outs — tu backend resetea outs a "0 OUTS" y avanza el inning automáticamente, o prefieres que sea un botón manual separado ("Cambio de inning") para no arriesgar un avance accidental en pleno partido?

---

## 12. Detalle: payload de "Panel - Team Lineups"

Tras revisar el editor real en Composer, hay tres cosas que tu backend necesita manejar bien.

### 12.1 — El roster va en campos individuales `Text Line 1`…`Text Line 11`

El campo real y editable **no es `content`** (esa era mi suposición inicial a partir del JSON exportado) — es un set fijo de campos de texto individuales, cada uno con el formato `"NN, Nombre del Jugador"` como un solo string:

```json
{
  "Text Line 1": "01, Juan Pérez",
  "Text Line 2": "02, María López",
  "Text Line 3": "03, ...",
  ...
  "Text Line 11": "11, ..."
}
```

**Confirmado en pruebas reales:** el panel tiene **11 líneas fijas** — no hay un campo `rows` visible que ajuste el tamaño dinámicamente. Si mandas menos de 11 jugadores, las líneas sobrantes **se ven como espacio en blanco visible** (no se ocultan ni se colapsa el diseño).

Esto tiene una implicación de diseño importante: este panel probablemente está pensado para el **lineup titular del día** (9-11 jugadores), no para el roster completo de un equipo de beisbol (que normalmente son 25+). Tu backend necesita decidir:
- **Opción A:** usarlo solo para lineup titular (9-11 jugadores) — encaja perfecto con el diseño actual.
- **Opción B:** si quieren mostrar el roster completo, van a necesitar pedirle al diseñador del template en Composer que rediseñe este panel para soportar scroll o paginación — no es algo que se resuelva solo desde el backend.

**Manejo de líneas vacías:** cuando el lineup tenga menos de 11 jugadores, tu backend debe mandar explícitamente un string vacío (`""`) para las `Text Line` sobrantes — si no las mandas, es probable que Singular conserve el valor anterior del último partido (placeholder o jugador de otro equipo), ya que el campo no se "limpia" solo.

### 12.2 — Los colores no son solo un hex, son un objeto completo

Un detalle que se repite en *todos* los campos de color del export (`Team Color`, `team1Color`, `accentColor`, etc.): aunque el color final sea sólido, Singular espera el objeto completo de un gradiente, con `type: "solid"` y el color real en `solidColor`:

```json
"Team Color": {
  "type": "solid",
  "solidColor": { "r": 183, "g": 6, "b": 6, "a": 1 },
  "angle": 0, "centerX": 50, "centerY": 50,
  "focalAngle": 0, "focalDistance": 0, "keepAspect": false,
  "offset": 0, "radius": 50, "scale": 100, "spreadMethod": "pad",
  "stops": [
    { "color": "#ff0000", "offset": 0, "opacity": 1 },
    { "color": "#00ff00", "offset": 0.5, "opacity": 1 },
    { "color": "#0000ff", "offset": 1, "opacity": 1 }
  ]
}
```

Los `stops` parecen ser un relleno fijo que no afecta el color mostrado cuando `type` es `"solid"` — el color real vive en `solidColor`. Aun así, hay que mandar la estructura completa o la API probablemente la rechace o la ignore. Conviene armar **una función helper única** en tu backend que convierta un hex (`#B70606`) guardado en tu tabla `equipos` a este objeto completo, y reutilizarla para cualquier campo de color en cualquier composición (Score Bug, Matchup, Lineups, etc.) — así no la repites en cada endpoint.

### 12.3 — Payload de ejemplo para actualizar el lineup de un equipo

```json
{
  "Title": "TOROS DE TIJUANA",
  "Subtitle": "Lineup titular",
  "Logo 1": "https://tu-storage.com/logos/toros.png",
  "Team Color": { /* objeto de color generado por el helper */ },
  "Text Line 1": "01, Juan Pérez",
  "Text Line 2": "02, María López",
  "Text Line 3": "",
  "Text Line 4": "",
  "Text Line 5": "",
  "Text Line 6": "",
  "Text Line 7": "",
  "Text Line 8": "",
  "Text Line 9": "",
  "Text Line 10": "",
  "Text Line 11": ""
}
```

Tu endpoint (`/api/lineup` o similar) siempre debe mandar las 11 líneas completas — las que tienen jugador, y las vacías como `""` explícito — para evitar que quede basura del partido anterior.

---

## 13. Detalle: payload de "Score Bug - Baseball" (confirmado en Composer)

Campos reales del editor, confirmados directamente por ti:

| Campo (UI) | Tipo real | Ejemplo de valor | Notas |
|---|---|---|---|
| `Team 1 Name` / `Team 2 Name` | texto | `"TIJ"` | siglas cortas del equipo |
| `Team 1 Color` / `Team 2 Color` | objeto de color completo | ver sección 12.2 | mismo helper hex→objeto |
| `Team 1 Runs` / `Team 2 Runs` | texto/número | `"0"` | carreras anotadas |
| `1st Base` / `2nd Base` / `3rd Base` | boolean | `true` / `false` | corredor en base o no |
| `Inning` | texto/número | `"1"`, `"7"` | número de inning actual |
| `Top Inning` / `Bottom Inning` | boolean | `true` / `false` | mitad del inning (alta/baja) |
| `Strikes` | **texto combinado** `"bolas-strikes"` | `"0-0"`, `"2-1"`, `"3-2"` | ⚠️ **no es solo strikes** — es un solo campo con el conteo completo del bateador. Tu backend arma el string, ej. `` `${bolas}-${strikes}` `` |
| `Outs` | **texto con palabra** | `"0 OUTS"`, `"1 OUT"`, `"2 OUTS"` | ⚠️ no es un número puro — necesitas pluralizar: singular solo cuando es exactamente 1 |

### 13.1 — Helper de formato para `Outs`

```js
function formatOuts(n) {
  return `${n} OUT${n === 1 ? '' : 'S'}`;
}
```

### 13.2 — Payload de ejemplo para un cambio de conteo

```json
{
  "Strikes": "1-2",
  "Outs": "1 OUT"
}
```

### 13.3 — Payload de ejemplo para actualizar el marcador completo

```json
{
  "Team 1 Name": "TIJ",
  "Team 1 Color": { /* objeto de color generado por el helper */ },
  "Team 1 Runs": "3",
  "Team 2 Name": "MTY",
  "Team 2 Color": { /* objeto de color generado por el helper */ },
  "Team 2 Runs": "1",
  "Inning": "5",
  "Top Inning": false,
  "Bottom Inning": true,
  "1st Base": true,
  "2nd Base": false,
  "3rd Base": true,
  "Strikes": "2-1",
  "Outs": "1 OUT"
}
```

**Confirmado en Composer:** `Top Inning` y `Bottom Inning` son **dos checkboxes independientes**, no un solo switch. Esto significa que tu backend es responsable de mantenerlos mutuamente excluyentes — Singular no lo hace por ti. Si tu código solo prende uno y olvida apagar el otro, podrías terminar con los dos en `true` (o los dos en `false`) al mismo tiempo, lo cual seguramente se ve mal o ambiguo en el gráfico.

**Regla de negocio a implementar:** cada vez que cambies la mitad del inning, tu backend debe mandar *ambos* campos en el mismo payload, nunca uno solo:

```js
function setMitadInning(esAlta) {
  return {
    "Top Inning": esAlta,
    "Bottom Inning": !esAlta
  };
}
```

Esto aplica el mismo patrón de cuidado que ya vimos con las `Text Line` vacías del lineup: cuando un campo puede quedar "colgado" de un estado anterior, el backend siempre manda el par completo, nunca un cambio parcial.

---

## 14. Detalle: "Fullscreen - Matchup" y "Lower - Matchup" (confirmado en Composer)

A diferencia de los dos overlays anteriores, aquí los campos reales **coinciden con lo esperado del export original** — sin formatos raros. Solo dos versiones con distinto nivel de detalle.

### 14.1 — Fullscreen - Matchup (versión completa, pantalla completa antes del partido)

| Campo (UI) | Tipo | Notas |
|---|---|---|
| `Title` | texto | ej. "PRÓXIMO PARTIDO" |
| `Subtitle` | texto | ej. fecha/sede |
| `Logo 1` / `Logo 2` | URL de imagen | logo de cada equipo |
| `Logo 1 Size` / `Logo 2 Size` | número (slider) | escala del logo, default `100` |
| `Team 1 Color` / `Team 2 Color` | objeto de color completo | mismo helper de la sección 12.2 |
| `Team 1 Name` / `Team 2 Name` | texto | nombre completo o siglas |
| `Dropline` | texto | línea inferior, ej. transmite por / hashtag |

```json
{
  "Title": "PRÓXIMO PARTIDO",
  "Subtitle": "Sábado 7:00 PM",
  "Logo 1": "https://tu-storage.com/logos/toros.png",
  "Logo 1 Size": "100",
  "Team 1 Color": { /* helper */ },
  "Team 1 Name": "TOROS DE TIJUANA",
  "Logo 2": "https://tu-storage.com/logos/rival.png",
  "Logo 2 Size": "100",
  "Team 2 Color": { /* helper */ },
  "Team 2 Name": "EQUIPO RIVAL",
  "Dropline": "#ToroPower"
}
```

### 14.2 — Lower - Matchup (versión reducida, banda inferior)

Mismos campos, sin `Title`, `Subtitle` ni los `Size`:

| Campo (UI) | Tipo |
|---|---|
| `Logo 1` / `Logo 2` | URL de imagen |
| `Team 1 Color` / `Team 2 Color` | objeto de color completo |
| `Team 1 Name` / `Team 2 Name` | texto |
| `Dropline` | texto |

```json
{
  "Logo 1": "https://tu-storage.com/logos/toros.png",
  "Team 1 Color": { /* helper */ },
  "Team 1 Name": "TOROS DE TIJUANA",
  "Logo 2": "https://tu-storage.com/logos/rival.png",
  "Team 2 Color": { /* helper */ },
  "Team 2 Name": "EQUIPO RIVAL",
  "Dropline": "#ToroPower"
}
```

**Conclusión práctica:** como ambos comparten casi todos los campos, tu backend puede tener **una sola función que arma el "core" del payload de matchup** (logos, colores, nombres) y cada endpoint específico (`/api/matchup/fullscreen` vs `/api/matchup/lower`) le agrega encima los campos extra que le falten (`Title`/`Subtitle`/`Size` solo para el Fullscreen).

---

## 15. Detalle: "Lower - Team or Player Bio" y "Fullscreen - Comparison Stats" (confirmado en Composer)

Con esto se completa el catálogo de los 6 overlays automatizables.

### 15.1 — Lower - Team or Player Bio

| Campo (UI) | Tipo | Notas |
|---|---|---|
| `Title` | texto | ej. nombre del jugador o cargo |
| `Logo 1` | URL de imagen | logo del equipo |
| `Logo 1 Position X` | número (slider) | ajuste de posición horizontal del logo, ej. `-12` |
| `Team Color` | objeto de color completo | mismo helper |
| `Headshot Active` | boolean (checkbox) | activa/desactiva que se muestre la foto del jugador |
| `Player Headshot` | URL de imagen | foto del jugador |
| `Text` | texto multilínea | ej. `"Player Bio\n2 Lines of Information"` — **incluye salto de línea real dentro del string** |

```json
{
  "Title": "JUAN PÉREZ — #23",
  "Logo 1": "https://tu-storage.com/logos/toros.png",
  "Logo 1 Position X": "-12",
  "Team Color": { /* helper */ },
  "Headshot Active": true,
  "Player Headshot": "https://tu-storage.com/jugadores/juan_perez.png",
  "Text": "Bateador designado\n.285 AVG, 12 HR esta temporada"
}
```

Si no tienes foto de un jugador en particular, pon `"Headshot Active": false` y no hace falta mandar una URL rota en `Player Headshot`.

### 15.2 — Fullscreen - Comparison Stats

| Campo (UI) | Tipo | Notas |
|---|---|---|
| `Team 1 Name` / `Team 2 Name` | texto | |
| `Score 1` / `Score 2` | texto/número | ej. `"00"` |
| `Indicator` | texto | separador entre scores, ej. `"-"` |
| `Subtitle` | texto | |
| `Logo 1` / `Logo 2` | URL de imagen | |
| `Logo 1 Size` / `Logo 2 Size` | número (slider) | default `100` |
| `Team 1 Color` / `Team 2 Color` | objeto de color completo | |
| `Number of Rows` | número (slider), **default 5** | ⚠️ a diferencia del Panel - Team Lineups, aquí **sí existe** un control real de cantidad de filas |
| `Stat Row 1` … `Stat Row 5` | texto combinado, formato `"valor equipo 1, categoría, valor equipo 2"` | ej. `"12, Hits, 8"` |
| `Dropline` | texto | |

```json
{
  "Team 1 Name": "TOROS DE TIJUANA",
  "Score 1": "5",
  "Indicator": "-",
  "Score 2": "3",
  "Team 2 Name": "EQUIPO RIVAL",
  "Subtitle": "Comparativa de temporada",
  "Logo 1": "https://tu-storage.com/logos/toros.png",
  "Logo 1 Size": "100",
  "Team 1 Color": { /* helper */ },
  "Logo 2": "https://tu-storage.com/logos/rival.png",
  "Logo 2 Size": "100",
  "Team 2 Color": { /* helper */ },
  "Number of Rows": "3",
  "Stat Row 1": "12, Hits, 8",
  "Stat Row 2": ".285, Promedio, .260",
  "Stat Row 3": "3, Errores, 1",
  "Dropline": "Estadísticas del enfrentamiento"
}
```

**Confirmado:** a diferencia del Panel - Team Lineups, aquí bajar `Number of Rows` **sí oculta visualmente** las filas sobrantes (no quedan en blanco visible). Esto significa que para Comparison Stats tu backend puede confiar en el control real: manda `Number of Rows` = cantidad real de stats que quieras mostrar (máximo 5, ya que solo existen `Stat Row 1`…`Stat Row 5`), y no necesitas mandar `""` en las filas sobrantes como sí tuviste que hacer con el Lineups.

---

## 16. Stack tecnológico definitivo

Con Postgres, React y Render ya decididos por tu parte, lo único que faltaba era el framework de backend. Mi recomendación:

### Backend: **Node.js + Express + Socket.io**

### Justificación de la decisión

No es que Python/FastAPI sea peor técnicamente — de hecho, para APIs puras suele ser igual de sólido, y su tipado con Pydantic es muy cómodo para validar payloads. La decisión aquí es más de **contexto del proyecto** que de superioridad de una tecnología sobre otra:

| Criterio | Node + Express + Socket.io | Python + FastAPI | Por qué gana Node en este caso |
|---|---|---|---|
| Lenguaje único con el frontend (React/JS) | ✅ Mismo lenguaje | ❌ Lenguaje distinto | Si eres tú solo desarrollando ambos lados, un solo lenguaje reduce fricción real (menos cambio de contexto, puedes compartir tipos/validaciones entre front y back) |
| Madurez de WebSockets para este caso de uso | ✅ Socket.io es el estándar de facto, con reconexión automática y salas (rooms) listas para usar | ⚠️ FastAPI soporta WebSockets nativos, pero con menos "baterías incluidas" (reconexión, salas, fallback) — tendrías que armar más tú mismo | El Panel B necesita esto funcionando confiablemente en vivo, no es el lugar para reinventar reconexión de sockets |
| Despliegue en Render | ✅ Caso de uso más común y documentado en Render | ✅ También soportado, pero con menos ejemplos específicos para el combo HTTP+WebSocket | Ambos funcionan, Node tiene ligera ventaja en documentación/ejemplos para este combo específico |
| Curva de aprendizaje si no conoces alguno a fondo | Depende de tu experiencia previa | Depende de tu experiencia previa | Este es el único punto realmente neutral — si ya conoces Python mejor que JS, ese factor podría inclinar la balanza para ti |
| Ecosistema de librerías para clientes HTTP simples (llamar a Singular) | ✅ `fetch` nativo, sin fricción | ✅ `httpx`/`requests`, también sin fricción | Empate, ambos son triviales para este uso |

**Conclusión:** la recomendación de Node no es "Python es peor", es que **para este proyecto específico** (un solo desarrollador probablemente, frontend en React, necesidad real de tiempo real vía WebSockets) el combo Node/Express/Socket.io minimiza fricción y riesgo. Si tú ya tienes más experiencia previa en Python que en JavaScript, ese es un factor legítimo para inclinarte por FastAPI de todos modos — la decisión final es tuya, esto es una recomendación fundamentada, no una imposición técnica.

**Piezas concretas del stack backend:**

| Pieza | Elección | Por qué |
|---|---|---|
| Runtime | Node.js (LTS) | Estabilidad |
| Framework HTTP | Express | Simple, maduro, de sobra para este alcance |
| Tiempo real | Socket.io | Ver arriba |
| ORM | **Prisma** | Se lleva excelente con Postgres, migraciones claras, autocompletado con TypeScript si lo usas |
| Lenguaje | TypeScript (opcional pero recomendado) | Te evita bugs tontos al armar los payloads de Singular (que tienen forma bien específica, como ya vimos) |
| Encriptación del token | Módulo nativo `crypto` de Node (AES-256) | No necesitas librería externa para esto |
| Estado en vivo | Redis (Render ofrece Redis administrado) o memoria del proceso si es un solo servidor sin reinicios frecuentes | Ver sección 4 |

### Resumen de decisiones de stack

| Capa | Definitivo |
|---|---|
| Base de datos | PostgreSQL (Render Postgres administrado) |
| Backend | Node.js + Express + Socket.io + Prisma |
| Frontend | React |
| Hosting | Render (Web Service para el backend, Static Site para el frontend) |
| Gestión de secretos | Variables de entorno de Render + token encriptado en BD (ver sección 7) |

---

## 17. Esquema completo de la base de datos (PostgreSQL)

Incorporando todo lo aprendido de las secciones anteriores (roster, control apps con token encriptado, mapeo de `subCompositionId`, lineup titular limitado a 11, y estado en vivo del partido):

```sql
-- Equipos de la liga (los 10 equipos + Toros)
CREATE TABLE equipos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  siglas VARCHAR(10) NOT NULL,
  logo_url TEXT,
  color_primario VARCHAR(7) NOT NULL,   -- hex, ej. '#B70606' — el helper lo convierte al objeto completo de Singular
  color_secundario VARCHAR(7),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Roster completo de jugadores por equipo
CREATE TABLE jugadores (
  id SERIAL PRIMARY KEY,
  equipo_id INTEGER NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  posicion VARCHAR(50),
  foto_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Control apps de Singular.Live (uno hoy, extensible a futuro)
CREATE TABLE control_apps (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,          -- ej. "Stealth - Baseball"
  deporte VARCHAR(50) NOT NULL DEFAULT 'baseball',
  app_token_encriptado TEXT NOT NULL,    -- encriptado con la llave maestra (variable de entorno)
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Mapeo de cada tipo de overlay -> su subCompositionId real, por control app
CREATE TABLE overlays (
  id SERIAL PRIMARY KEY,
  control_app_id INTEGER NOT NULL REFERENCES control_apps(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,             -- 'score_bug' | 'fullscreen_matchup' | 'lower_matchup' |
                                          -- 'team_lineups' | 'player_bio' | 'comparison_stats'
  subcomposition_id VARCHAR(100) NOT NULL,
  nombre_descriptivo VARCHAR(150),
  UNIQUE (control_app_id, tipo)
);

-- Calendario / historial de partidos
CREATE TABLE partidos (
  id SERIAL PRIMARY KEY,
  equipo_local_id INTEGER NOT NULL REFERENCES equipos(id),
  equipo_visitante_id INTEGER NOT NULL REFERENCES equipos(id),
  fecha TIMESTAMP NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'programado',  -- 'programado' | 'en_vivo' | 'finalizado'
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Lineup titular por partido (máx. 11 — límite real del template "Panel - Team Lineups")
CREATE TABLE lineups (
  id SERIAL PRIMARY KEY,
  partido_id INTEGER NOT NULL REFERENCES partidos(id) ON DELETE CASCADE,
  equipo_id INTEGER NOT NULL REFERENCES equipos(id),
  jugador_id INTEGER NOT NULL REFERENCES jugadores(id),
  orden_bateo INTEGER NOT NULL CHECK (orden_bateo BETWEEN 1 AND 11),
  UNIQUE (partido_id, equipo_id, orden_bateo)
);

-- Snapshot del estado en vivo (respaldo persistente; la fuente "caliente" en tiempo real vive en Redis/memoria)
CREATE TABLE estado_partido (
  partido_id INTEGER PRIMARY KEY REFERENCES partidos(id) ON DELETE CASCADE,
  inning INTEGER NOT NULL DEFAULT 1,
  mitad VARCHAR(10) NOT NULL DEFAULT 'alta',   -- 'alta' | 'baja' -> mapea a Top Inning/Bottom Inning
  outs INTEGER NOT NULL DEFAULT 0,
  bolas INTEGER NOT NULL DEFAULT 0,
  strikes INTEGER NOT NULL DEFAULT 0,
  base_1 BOOLEAN NOT NULL DEFAULT false,
  base_2 BOOLEAN NOT NULL DEFAULT false,
  base_3 BOOLEAN NOT NULL DEFAULT false,
  runs_local INTEGER NOT NULL DEFAULT 0,
  runs_visitante INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
```

**Notas de diseño:**

- Los colores se guardan como **hex simple** (`color_primario`) — el objeto completo de gradiente que Singular necesita (sección 12.2) se genera al vuelo con el helper, nunca se guarda en la BD tal cual.
- La tabla `overlays` es la que hace que agregar un nuevo control app a futuro sea solo insertar filas nuevas — tu código de negocio (ej. "actualizar el score bug") busca el `subcomposition_id` por `tipo` + `control_app_id`, nunca lo tiene hardcodeado.
- `estado_partido` es un respaldo — la actualización en vivo campo por campo (para que se sienta instantánea) vive en Redis/memoria; este snapshot en Postgres es útil para reconstruir el estado si el proceso se reinicia, o para consultar el historial después.
- `lineups` está separado de `jugadores` a propósito: `jugadores` es el roster completo (25+), `lineups` es la selección de titulares de un partido específico (máx. 11, por el límite real del template que confirmamos en la sección 12).

---

## Apéndice A — JSON original de referencia (export de subcomposiciones)

Este es el export completo que compartiste al inicio, con todos los `subCompositionId` y payloads default de cada overlay del control app "Stealth - Baseball". Se deja aquí completo como referencia técnica permanente del proyecto.

```json
[
    {
        "subCompositionId": "-MSECrtOjSZpoXHno96P",
        "subCompositionName": "mainComposition",
        "mainComposition": true,
        "state": "In",
        "payload": {
            "Panel X Position": "34",
            "accentColor": {
                "angle": 0,
                "centerX": 50,
                "centerY": 50,
                "focalAngle": 0,
                "focalDistance": 0,
                "keepAspect": false,
                "offset": 0,
                "radius": 50,
                "scale": 100,
                "solidColor": {
                    "a": 1,
                    "b": 6,
                    "g": 6,
                    "r": 183
                },
                "spreadMethod": "pad",
                "stops": [
                    {
                        "color": "#ff0000",
                        "offset": 0,
                        "opacity": 1
                    },
                    {
                        "color": "#00ff00",
                        "offset": 0.5,
                        "opacity": 1
                    },
                    {
                        "color": "#0000ff",
                        "offset": 1,
                        "opacity": 1
                    }
                ],
                "type": "solid"
            },
            "accentText": {
                "a": 1,
                "b": 255,
                "g": 255,
                "r": 255
            }
        }
    },
    {
        "subCompositionId": "06beea16-952c-48c2-8a5b-a6f3449a47d4",
        "subCompositionName": "Score Bug - Tennis",
        "mainComposition": false,
        "state": "Out2",
        "payload": {
            "Team 1 Color": {
                "angle": 0,
                "centerX": 50,
                "centerY": 50,
                "focalAngle": 0,
                "focalDistance": 0,
                "keepAspect": false,
                "offset": 0,
                "radius": 50,
                "scale": 100,
                "solidColor": {
                    "a": 1,
                    "b": 60,
                    "g": 60,
                    "r": 60
                },
                "spreadMethod": "pad",
                "stops": [
                    {
                        "color": "#ff0000",
                        "offset": 0,
                        "opacity": 1
                    },
                    {
                        "color": "#00ff00",
                        "offset": 0.5,
                        "opacity": 1
                    },
                    {
                        "color": "#0000ff",
                        "offset": 1,
                        "opacity": 1
                    }
                ],
                "type": "solid"
            },
            "Team 2 Color": {
                "angle": 0,
                "centerX": 50,
                "centerY": 50,
                "focalAngle": 0,
                "focalDistance": 0,
                "keepAspect": false,
                "offset": 0,
                "radius": 50,
                "scale": 100,
                "solidColor": {
                    "a": 1,
                    "b": 78,
                    "g": 78,
                    "r": 78
                },
                "spreadMethod": "pad",
                "stops": [
                    {
                        "color": "#ff0000",
                        "offset": 0,
                        "opacity": 1
                    },
                    {
                        "color": "#00ff00",
                        "offset": 0.5,
                        "opacity": 1
                    },
                    {
                        "color": "#0000ff",
                        "offset": 1,
                        "opacity": 1
                    }
                ],
                "type": "solid"
            },
            "player1Name": "F. LASTNAME",
            "player1Score": "0",
            "player1Serve": true,
            "player1Set1": "0",
            "player1Set2": "0",
            "player1Set3": "0",
            "player2Name": "F. LASTNAME",
            "player2Score": "0",
            "player2Serve": false,
            "player2Set1": "0",
            "player2Set2": "0",
            "player2Set3": "0"
        }
    },
    {
        "subCompositionId": "0aae4a08-5c6d-4b2f-9325-7d0750534fbd",
        "subCompositionName": "Score Bug - Golf",
        "mainComposition": false,
        "state": "Out2",
        "payload": {
            "Player Name": "F. LASTNAME",
            "Score": "00",
            "Text 1": "18TH",
            "Text 2": "PAR 3",
            "Text 3": "400 YDS"
        }
    },
    {
        "subCompositionId": "17886998-32d9-4efd-919d-2dcc1fd226d0",
        "subCompositionName": "Score Bug - Football",
        "mainComposition": false,
        "state": "Out2",
        "payload": {
            "downDistance": "1st & 10",
            "gameClockActive": true,
            "gameClockBeginTimeMinutes": "15",
            "gameClockBeginTimeSeconds": "0",
            "gameClockControl": {
                "UTC": 1606313580475.5,
                "isRunning": false,
                "value": 0
            },
            "gameStatus": "",
            "playClockActive": true,
            "playClockBeginTimeSeconds": "40",
            "playClockControl": {
                "UTC": 1606313545029.5,
                "isRunning": false,
                "value": 0
            },
            "quarter": "1st",
            "team1Color": {
                "angle": 0,
                "centerX": 50,
                "centerY": 50,
                "focalAngle": 0,
                "focalDistance": 0,
                "keepAspect": false,
                "offset": 0,
                "radius": 50,
                "scale": 100,
                "solidColor": {
                    "a": 1,
                    "b": 60,
                    "g": 60,
                    "r": 60
                },
                "spreadMethod": "pad",
                "stops": [
                    {
                        "color": "#ff0000",
                        "offset": 0,
                        "opacity": 1
                    },
                    {
                        "color": "#00ff00",
                        "offset": 0.5,
                        "opacity": 1
                    },
                    {
                        "color": "#0000ff",
                        "offset": 1,
                        "opacity": 1
                    }
                ],
                "type": "solid"
            },
            "team1Name": "TRI",
            "team1Score": "0",
            "team1Timeout1": false,
            "team1Timeout2": false,
            "team1Timeout3": false,
            "team2Color": {
                "angle": 0,
                "centerX": 50,
                "centerY": 50,
                "focalAngle": 0,
                "focalDistance": 0,
                "keepAspect": false,
                "offset": 0,
                "radius": 50,
                "scale": 100,
                "solidColor": {
                    "a": 1,
                    "b": 78,
                    "g": 78,
                    "r": 78
                },
                "spreadMethod": "pad",
                "stops": [
                    {
                        "color": "#ff0000",
                        "offset": 0,
                        "opacity": 1
                    },
                    {
                        "color": "#00ff00",
                        "offset": 0.5,
                        "opacity": 1
                    },
                    {
                        "color": "#0000ff",
                        "offset": 1,
                        "opacity": 1
                    }
                ],
                "type": "solid"
            },
            "team2Name": "TRI",
            "team2Score": "0",
            "team2Timeout1": false,
            "team2Timeout2": false,
            "team2Timeout3": false
        }
    },
    {
        "subCompositionId": "192df71d-3efa-4f04-96d2-09bfe0d642b5",
        "subCompositionName": "Team Lineups",
        "mainComposition": false,
        "state": "Out1",
        "payload": {}
    },
    {
        "subCompositionId": "1b62c12b-b2b1-49cc-a27a-45cdfaaa7870",
        "subCompositionName": "LeftContent",
        "mainComposition": false,
        "state": "Out1",
        "payload": {}
    },
    {
        "subCompositionId": "2606b2b5-082e-4406-80b4-8b11da3af36f",
        "subCompositionName": "Upper Right - 1 Line",
        "mainComposition": false,
        "state": "Out2",
        "payload": {
            "text": "Upper Right Text"
        }
    },
    {
        "subCompositionId": "2675716d-451c-4e76-b52d-6bc1f1e023b3",
        "subCompositionName": "Background Image",
        "mainComposition": false,
        "state": "Out1",
        "payload": {
            "backgroundImage": "//image.singular.live/12086e0462c894187cf486fc291e0d58/images/0SSYwHSIkboAVnXJw0ImEF.png"
        }
    },
    {
        "subCompositionId": "355a74fd-62eb-434b-b83a-d41ab28666bb",
        "subCompositionName": "Lower - Team or Player Bio",
        "mainComposition": false,
        "state": "Out2",
        "payload": {
            "headshotActive": true,
            "logo1": "//image.singular.live/12086e0462c894187cf486fc291e0d58/images/7z4Zo5opftfq94PoEZQNQm.png",
            "logo1PositionX": "-12",
            "playerHeadshot": "//image.singular.live/12086e0462c894187cf486fc291e0d58/images/2iXeTF94lgxSo0o9PYu7nE.png",
            "teamColor": {
                "angle": 0,
                "centerX": 50,
                "centerY": 50,
                "focalAngle": 0,
                "focalDistance": 0,
                "keepAspect": false,
                "offset": 0,
                "radius": 50,
                "scale": 100,
                "solidColor": {
                    "a": 1,
                    "b": 60,
                    "g": 60,
                    "r": 60
                },
                "spreadMethod": "pad",
                "stops": [
                    {
                        "color": "#ff0000",
                        "offset": 0,
                        "opacity": 1
                    },
                    {
                        "color": "#00ff00",
                        "offset": 0.5,
                        "opacity": 1
                    },
                    {
                        "color": "#0000ff",
                        "offset": 1,
                        "opacity": 1
                    }
                ],
                "type": "solid"
            },
            "text": "Player Bio\n2 Lines of Information",
            "title": "TITLE"
        }
    },
    {
        "subCompositionId": "3b53f332-f127-4dbf-accb-9977111ea9c5",
        "subCompositionName": "Upper Right - Social Media",
        "mainComposition": false,
        "state": "In",
        "payload": {
            "socialMediaLogo": "//assets.singular.live/12086e0462c894187cf486fc291e0d58/svgs/1NazNq05b11URTioABHB46_w512h512.svg",
            "text": "Username or URL"
        }
    },
    {
        "subCompositionId": "3bdd4161-8463-4f2c-8b5a-29adde25e67a",
        "subCompositionName": "MainContent",
        "mainComposition": false,
        "state": "Out1",
        "payload": {}
    },
    {
        "subCompositionId": "3dd9a73e-3752-444d-beb7-a70e7b3184ba",
        "subCompositionName": "Score Bug - Baseball",
        "mainComposition": false,
        "state": "In",
        "payload": {
            "1stBase": false,
            "2ndBase": false,
            "3rdBase": false,
            "bottomInning": false,
            "inning": "1",
            "outs": "0 OUTS",
            "strikes": "0-0",
            "team1Color": {
                "angle": 0,
                "centerX": 50,
                "centerY": 50,
                "focalAngle": 0,
                "focalDistance": 0,
                "keepAspect": false,
                "offset": 0,
                "radius": 50,
                "scale": 100,
                "solidColor": {
                    "a": 1,
                    "b": 60,
                    "g": 60,
                    "r": 60
                },
                "spreadMethod": "pad",
                "stops": [
                    {
                        "color": "#ff0000",
                        "offset": 0,
                        "opacity": 1
                    },
                    {
                        "color": "#00ff00",
                        "offset": 0.5,
                        "opacity": 1
                    },
                    {
                        "color": "#0000ff",
                        "offset": 1,
                        "opacity": 1
                    }
                ],
                "type": "solid"
            },
            "team1Name": "TRI",
            "team1Runs": "0",
            "team2Color": {
                "angle": 0,
                "centerX": 50,
                "centerY": 50,
                "focalAngle": 0,
                "focalDistance": 0,
                "keepAspect": false,
                "offset": 0,
                "radius": 50,
                "scale": 100,
                "solidColor": {
                    "a": 1,
                    "b": 78,
                    "g": 78,
                    "r": 78
                },
                "spreadMethod": "pad",
                "stops": [
                    {
                        "color": "#ff0000",
                        "offset": 0,
                        "opacity": 1
                    },
                    {
                        "color": "#00ff00",
                        "offset": 0.5,
                        "opacity": 1
                    },
                    {
                        "color": "#0000ff",
                        "offset": 1,
                        "opacity": 1
                    }
                ],
                "type": "solid"
            },
            "team2Name": "TRI",
            "team2Runs": "0",
            "topInning": false
        }
    },
    {
        "subCompositionId": "44b94f2a-23b0-4f08-a95a-cec1aea89e81",
        "subCompositionName": "Fullscreen - Matchup",
        "mainComposition": false,
        "state": "Out2",
        "payload": {
            "dropline": "Dropline",
            "logo1": "//image.singular.live/12086e0462c894187cf486fc291e0d58/images/0O5hzDfgbHL1MbHE5zbRqy.png",
            "logo1Size": "100",
            "logo2": "//image.singular.live/12086e0462c894187cf486fc291e0d58/images/0sDGZb8Z8r0jiEHOkhO5z6.png",
            "logo2Size": "100",
            "subtitle": "Subtitle",
            "team1Color": {
                "angle": 0,
                "centerX": 50,
                "centerY": 50,
                "focalAngle": 0,
                "focalDistance": 0,
                "keepAspect": false,
                "offset": 0,
                "radius": 50,
                "scale": 100,
                "solidColor": {
                    "a": 1,
                    "b": 60,
                    "g": 60,
                    "r": 60
                },
                "spreadMethod": "pad",
                "stops": [
                    {
                        "color": "#ff0000",
                        "offset": 0,
                        "opacity": 1
                    },
                    {
                        "color": "#00ff00",
                        "offset": 0.5,
                        "opacity": 1
                    },
                    {
                        "color": "#0000ff",
                        "offset": 1,
                        "opacity": 1
                    }
                ],
                "type": "solid"
            },
            "team1Name": "TEAM NAME 1",
            "team2Color": {
                "angle": 0,
                "centerX": 50,
                "centerY": 50,
                "focalAngle": 0,
                "focalDistance": 0,
                "keepAspect": false,
                "offset": 0,
                "radius": 50,
                "scale": 100,
                "solidColor": {
                    "a": 1,
                    "b": 78,
                    "g": 78,
                    "r": 78
                },
                "spreadMethod": "pad",
                "stops": [
                    {
                        "color": "#ff0000",
                        "offset": 0,
                        "opacity": 1
                    },
                    {
                        "color": "#00ff00",
                        "offset": 0.5,
                        "opacity": 1
                    },
                    {
                        "color": "#0000ff",
                        "offset": 1,
                        "opacity": 1
                    }
                ],
                "type": "solid"
            },
            "team2Name": "TEAM NAME 2",
            "title": "TITLE"
        }
    },
    {
        "subCompositionId": "5bae6f0b-5b7e-4990-bf5c-c6296719c99b",
        "subCompositionName": "Lower - 1 Line",
        "mainComposition": false,
        "state": "Out2",
        "payload": {
            "text": "Title or Name"
        }
    },
    {
        "subCompositionId": "61694c8d-4d50-b0b9-ea3a-4ace4e6d3501",
        "subCompositionName": "rightContent",
        "mainComposition": false,
        "state": "Out1",
        "payload": {}
    },
    {
        "subCompositionId": "73bd8f0e-726d-47f5-ae54-a40660b40569",
        "subCompositionName": "Freeform Image",
        "mainComposition": false,
        "state": "Out1",
        "payload": {
            "image": "https://assets.singular.live/12086e0462c894187cf486fc291e0d58/svgs/4bIqkCNSZAoudT1myq6Sii_w327h32.svg",
            "positionX": "40",
            "positionY": "40",
            "size": "15",
            "transparency": "100"
        }
    },
    {
        "subCompositionId": "7a36a463-b40b-47ce-a17e-42f8d2e8b2fc",
        "subCompositionName": "RightContent",
        "mainComposition": false,
        "state": "Out1",
        "payload": {}
    },
    {
        "subCompositionId": "7d5591b9-a03c-405a-86d9-2e56e52e9430",
        "subCompositionName": "Lower - 2 Line",
        "mainComposition": false,
        "state": "Out2",
        "payload": {
            "Line 1 Text": "Line One Text",
            "Line 2 Text": "Line Two Text"
        }
    },
    {
        "subCompositionId": "8663f3fa-f6e6-4d65-a9dc-f68df1184762",
        "subCompositionName": "Upper Right - 2 Line",
        "mainComposition": false,
        "state": "Out2",
        "payload": {
            "Line 1 Text": "Line One Text",
            "Line 2 Text": "Line Two Text"
        }
    },
    {
        "subCompositionId": "8a96097f-fcbe-4f9a-8836-ba5c35c0c6d9",
        "subCompositionName": "Score Bug - Soccer",
        "mainComposition": false,
        "state": "Out2",
        "payload": {
            "clockActive": true,
            "clockBeginTime": "00:00",
            "clockControl": {
                "UTC": 1593624800908.5,
                "isRunning": false,
                "value": 0
            },
            "clockEndTime": "45:00",
            "gameStatus": "",
            "team1Color": {
                "angle": 0,
                "centerX": 50,
                "centerY": 50,
                "focalAngle": 0,
                "focalDistance": 0,
                "keepAspect": false,
                "offset": 0,
                "radius": 50,
                "scale": 100,
                "solidColor": {
                    "a": 1,
                    "b": 60,
                    "g": 60,
                    "r": 60
                },
                "spreadMethod": "pad",
                "stops": [
                    {
                        "color": "#ff0000",
                        "offset": 0,
                        "opacity": 1
                    },
                    {
                        "color": "#00ff00",
                        "offset": 0.5,
                        "opacity": 1
                    },
                    {
                        "color": "#0000ff",
                        "offset": 1,
                        "opacity": 1
                    }
                ],
                "type": "solid"
            },
            "team1Name": "TRI",
            "team1Score": "0",
            "team2Color": {
                "angle": 0,
                "centerX": 50,
                "centerY": 50,
                "focalAngle": 0,
                "focalDistance": 0,
                "keepAspect": false,
                "offset": 0,
                "radius": 50,
                "scale": 100,
                "solidColor": {
                    "a": 1,
                    "b": 78,
                    "g": 78,
                    "r": 78
                },
                "spreadMethod": "pad",
                "stops": [
                    {
                        "color": "#ff0000",
                        "offset": 0,
                        "opacity": 1
                    },
                    {
                        "color": "#00ff00",
                        "offset": 0.5,
                        "opacity": 1
                    },
                    {
                        "color": "#0000ff",
                        "offset": 1,
                        "opacity": 1
                    }
                ],
                "type": "solid"
            },
            "team2Name": "TRI",
            "team2Score": "0"
        }
    },
    {
        "subCompositionId": "8dd3dad4-620a-4f88-b3f3-49e0a8bb34a9",
        "subCompositionName": "Freeform Text",
        "mainComposition": false,
        "state": "Out1",
        "payload": {
            "positionX": "40",
            "positionY": "35",
            "size": "40",
            "text": "Freeform Text",
            "tranpsarency": "100"
        }
    },
    {
        "subCompositionId": "94dcc4f4-d12f-4b1c-8156-94d587059cba",
        "subCompositionName": "Score Bug - Hockey",
        "mainComposition": false,
        "state": "Out2",
        "payload": {
            "clockActive": true,
            "clockBeginTimeMinutes": "20",
            "clockBeginTimeSeconds": "0",
            "clockControl": {
                "UTC": 1606313855440.5,
                "isRunning": false,
                "value": 0
            },
            "dropline": "Dropline Text",
            "droplineActive": false,
            "gameStatus": "",
            "period": "1st",
            "team1Color": {
                "angle": 0,
                "centerX": 50,
                "centerY": 50,
                "focalAngle": 0,
                "focalDistance": 0,
                "keepAspect": false,
                "offset": 0,
                "radius": 50,
                "scale": 100,
                "solidColor": {
                    "a": 1,
                    "b": 60,
                    "g": 60,
                    "r": 60
                },
                "spreadMethod": "pad",
                "stops": [
                    {
                        "color": "#ff0000",
                        "offset": 0,
                        "opacity": 1
                    },
                    {
                        "color": "#00ff00",
                        "offset": 0.5,
                        "opacity": 1
                    },
                    {
                        "color": "#0000ff",
                        "offset": 1,
                        "opacity": 1
                    }
                ],
                "type": "solid"
            },
            "team1Name": "TRI",
            "team1Score": "0",
            "team2Color": {
                "angle": 0,
                "centerX": 50,
                "centerY": 50,
                "focalAngle": 0,
                "focalDistance": 0,
                "keepAspect": false,
                "offset": 0,
                "radius": 50,
                "scale": 100,
                "solidColor": {
                    "a": 1,
                    "b": 78,
                    "g": 78,
                    "r": 78
                },
                "spreadMethod": "pad",
                "stops": [
                    {
                        "color": "#ff0000",
                        "offset": 0,
                        "opacity": 1
                    },
                    {
                        "color": "#00ff00",
                        "offset": 0.5,
                        "opacity": 1
                    },
                    {
                        "color": "#0000ff",
                        "offset": 1,
                        "opacity": 1
                    }
                ],
                "type": "solid"
            },
            "team2Name": "TRI",
            "team2Score": "0"
        }
    },
    {
        "subCompositionId": "9a020313-2243-4d2a-98f9-c374e05cb9d2",
        "subCompositionName": "Panel - Team Lineups",
        "mainComposition": false,
        "state": "Out2",
        "payload": {
            "Logo 1": "//image.singular.live/12086e0462c894187cf486fc291e0d58/images/4YMZVaFiT6PabYmEi44xQp.png",
            "Subtitle": "Subtitle",
            "Team Color": {
                "angle": 0,
                "centerX": 50,
                "centerY": 50,
                "focalAngle": 0,
                "focalDistance": 0,
                "keepAspect": false,
                "offset": 0,
                "radius": 50,
                "scale": 100,
                "solidColor": {
                    "a": 1,
                    "b": 60,
                    "g": 60,
                    "r": 60
                },
                "spreadMethod": "pad",
                "stops": [
                    {
                        "color": "#ff0000",
                        "offset": 0,
                        "opacity": 1
                    },
                    {
                        "color": "#00ff00",
                        "offset": 0.5,
                        "opacity": 1
                    },
                    {
                        "color": "#0000ff",
                        "offset": 1,
                        "opacity": 1
                    }
                ],
                "type": "solid"
            },
            "Title": "TITLE",
            "content": "{ \"content\":[\n  {\n  \"text2\":\"Player or Team Name 1\",\n  \"text1\":\"01\"\n  },\n  {\n  \"text2\":\"Player or Team Name 2\",\n  \"text1\":\"02\"\n  },\n  {\n  \"text2\":\"Player or Team Name 3\",\n  \"text1\":\"03\"\n  },\n  {\n  \"text2\":\"Player or Team Name 4\",\n  \"text1\":\"04\"\n  },\n  {\n  \"text2\":\"Player or Team Name 5\",\n  \"text1\":\"05\"\n  },\n  {\n  \"text2\":\"Player or Team Name 6\",\n  \"text1\":\"06\"\n  },\n  {\n  \"text2\":\"Player or Team Name 7\",\n  \"text1\":\"07\"\n  },\n  {\n  \"text2\":\"Player or Team Name 8\",\n  \"text1\":\"08\"\n  },\n  {\n  \"text2\":\"Player or Team Name 9\",\n  \"text1\":\"09\"\n  },\n  {\n  \"text2\":\"Player or Team Name 10\",\n  \"text1\":\"10\"\n  },\n  {\n  \"text2\":\"Player or Team Name 11\",\n  \"text1\":\"11\"\n  }\n]}",
            "lineupsTable_r1": "01, Player or Team Name 1",
            "lineupsTable_r10": "10, Player or Team Name 10",
            "lineupsTable_r11": "11, Player or Team Name 11",
            "lineupsTable_r2": "02, Player or Team Name 2",
            "lineupsTable_r3": "03, Player or Team Name 3",
            "lineupsTable_r4": "04, Player or Team Name 4",
            "lineupsTable_r5": "05, Player or Team Name 5",
            "lineupsTable_r6": "06, Player or Team Name 6",
            "lineupsTable_r7": "07, Player or Team Name 7",
            "lineupsTable_r8": "08, Player or Team Name 8",
            "lineupsTable_r9": "09, Player or Team Name 9",
            "rows": "11",
            "ySize": "100.00"
        }
    },
    {
        "subCompositionId": "aaaae2bd-2fae-0a00-9d87-25ec326915da",
        "subCompositionName": "leftContent",
        "mainComposition": false,
        "state": "Out1",
        "payload": {}
    },
    {
        "subCompositionId": "b84f7f1b-f5e2-4b4b-a2e8-3b0ec0c39785",
        "subCompositionName": "Fullscreen - Comparison Stats",
        "mainComposition": false,
        "state": "Out2",
        "payload": {
            "Dropline": "Dropline",
            "Indicator": "-",
            "Logo 1": "//image.singular.live/12086e0462c894187cf486fc291e0d58/images/2Iz4p0haAczVn4BofThVte.png",
            "Logo 1 Size": "100",
            "Logo 2": "//image.singular.live/12086e0462c894187cf486fc291e0d58/images/6NtbpdnYPnnVKvMr6sP44s.png",
            "Logo 2 Size": "100",
            "Number of Rows": "5",
            "Score 1": "00",
            "Score 2": "00",
            "Subtitle": "Subtitle",
            "Team 1 Color": {
                "angle": 0,
                "centerX": 50,
                "centerY": 50,
                "focalAngle": 0,
                "focalDistance": 0,
                "keepAspect": false,
                "offset": 0,
                "radius": 50,
                "scale": 100,
                "solidColor": {
                    "a": 1,
                    "b": 60,
                    "g": 60,
                    "r": 60
                },
                "spreadMethod": "pad",
                "stops": [
                    {
                        "color": "#ff0000",
                        "offset": 0,
                        "opacity": 1
                    },
                    {
                        "color": "#00ff00",
                        "offset": 0.5,
                        "opacity": 1
                    },
                    {
                        "color": "#0000ff",
                        "offset": 1,
                        "opacity": 1
                    }
                ],
                "type": "solid"
            },
            "Team 1 Name": "TEAM NAME 1",
            "Team 2 Color": {
                "angle": 0,
                "centerX": 50,
                "centerY": 50,
                "focalAngle": 0,
                "focalDistance": 0,
                "keepAspect": false,
                "offset": 0,
                "radius": 50,
                "scale": 100,
                "solidColor": {
                    "a": 1,
                    "b": 78,
                    "g": 78,
                    "r": 78
                },
                "spreadMethod": "pad",
                "stops": [
                    {
                        "color": "#ff0000",
                        "offset": 0,
                        "opacity": 1
                    },
                    {
                        "color": "#00ff00",
                        "offset": 0.5,
                        "opacity": 1
                    },
                    {
                        "color": "#0000ff",
                        "offset": 1,
                        "opacity": 1
                    }
                ],
                "type": "solid"
            },
            "Team 2 Name": "TEAM NAME 2",
            "statTable_r1": "STAT 1, CAT 1, STAT 2",
            "statTable_r2": "STAT 1, CAT 2, STAT 2",
            "statTable_r3": "STAT 1, CAT 3, STAT 2",
            "statTable_r4": "STAT 1, CAT 4, STAT 2",
            "statTable_r5": "STAT 1, CAT 5, STAT 2"
        }
    },
    {
        "subCompositionId": "e2840a63-771b-41a5-91e2-38fa823ed325",
        "subCompositionName": "Baseline - Static",
        "mainComposition": false,
        "state": "Out1",
        "payload": {
            "baselineText": "Baseline Text"
        }
    },
    {
        "subCompositionId": "ebac0985-ccbb-406e-b03c-3ff7d6741254",
        "subCompositionName": "Score Bug - Basketball",
        "mainComposition": false,
        "state": "Out2",
        "payload": {
            "Play Timer Control": {
                "UTC": 0,
                "isRunning": false,
                "value": 0
            },
            "gameClockActive": true,
            "gameClockBeginTimeMinutes": "20",
            "gameClockBeginTimeSeconds": "0",
            "gameClockControl": {
                "UTC": 1606311433197,
                "isRunning": false,
                "value": 0
            },
            "gameStatus": " ",
            "period": "1st",
            "shotClockActive": true,
            "shotClockBeginTimeSeconds": "30",
            "shotClockControl": {
                "UTC": 1606311472213,
                "isRunning": false,
                "value": 0
            },
            "team1Color": {
                "angle": 0,
                "centerX": 50,
                "centerY": 50,
                "focalAngle": 0,
                "focalDistance": 0,
                "keepAspect": false,
                "offset": 0,
                "radius": 50,
                "scale": 100,
                "solidColor": {
                    "a": 1,
                    "b": 60,
                    "g": 60,
                    "r": 60
                },
                "spreadMethod": "pad",
                "stops": [
                    {
                        "color": "#ff0000",
                        "offset": 0,
                        "opacity": 1
                    },
                    {
                        "color": "#00ff00",
                        "offset": 0.5,
                        "opacity": 1
                    },
                    {
                        "color": "#0000ff",
                        "offset": 1,
                        "opacity": 1
                    }
                ],
                "type": "solid"
            },
            "team1Name": "TRI",
            "team1Score": "0",
            "team1Timeout1": false,
            "team1Timeout2": false,
            "team1Timeout3": false,
            "team1Timeout4": false,
            "team1Timeout5": false,
            "team1Timeout5Active": false,
            "team1Timeout6": false,
            "team1Timeout6Active": false,
            "team1Timeout7": false,
            "team1Timeout7Active": false,
            "team2Color": {
                "angle": 0,
                "centerX": 50,
                "centerY": 50,
                "focalAngle": 0,
                "focalDistance": 0,
                "keepAspect": false,
                "offset": 0,
                "radius": 50,
                "scale": 100,
                "solidColor": {
                    "a": 1,
                    "b": 78,
                    "g": 78,
                    "r": 78
                },
                "spreadMethod": "pad",
                "stops": [
                    {
                        "color": "#ff0000",
                        "offset": 0,
                        "opacity": 1
                    },
                    {
                        "color": "#00ff00",
                        "offset": 0.5,
                        "opacity": 1
                    },
                    {
                        "color": "#0000ff",
                        "offset": 1,
                        "opacity": 1
                    }
                ],
                "type": "solid"
            },
            "team2Name": "TRI",
            "team2Score": "0",
            "team2Timeout1": false,
            "team2Timeout2": false,
            "team2Timeout3": false,
            "team2Timeout4": false,
            "team2Timeout5": false,
            "team2Timeout5Active": false,
            "team2Timeout6": false,
            "team2Timeout6Active": false,
            "team2Timeout7": false,
            "team2Timeout7Active": false
        }
    },
    {
        "subCompositionId": "f12eafa1-ab55-4816-922c-7496f388fd03",
        "subCompositionName": "Lower - Matchup",
        "mainComposition": false,
        "state": "In",
        "payload": {
            "dropline": "Dropline",
            "logo1": "//image.singular.live/12086e0462c894187cf486fc291e0d58/images/5RS7fApiyL7nIHoukU0wXJ.png",
            "logo2": "//image.singular.live/12086e0462c894187cf486fc291e0d58/images/07BO1406T1LR08CjOwbQZr.png",
            "team1Color": {
                "angle": 0,
                "centerX": 50,
                "centerY": 50,
                "focalAngle": 0,
                "focalDistance": 0,
                "keepAspect": false,
                "offset": 0,
                "radius": 50,
                "scale": 100,
                "solidColor": {
                    "a": 1,
                    "b": 60,
                    "g": 60,
                    "r": 60
                },
                "spreadMethod": "pad",
                "stops": [
                    {
                        "color": "#ff0000",
                        "offset": 0,
                        "opacity": 1
                    },
                    {
                        "color": "#00ff00",
                        "offset": 0.5,
                        "opacity": 1
                    },
                    {
                        "color": "#0000ff",
                        "offset": 1,
                        "opacity": 1
                    }
                ],
                "type": "solid"
            },
            "team1Name": "Team Name 1",
            "team2Color": {
                "angle": 0,
                "centerX": 50,
                "centerY": 50,
                "focalAngle": 0,
                "focalDistance": 0,
                "keepAspect": false,
                "offset": 0,
                "radius": 50,
                "scale": 100,
                "solidColor": {
                    "a": 1,
                    "b": 78,
                    "g": 78,
                    "r": 78
                },
                "spreadMethod": "pad",
                "stops": [
                    {
                        "color": "#ff0000",
                        "offset": 0,
                        "opacity": 1
                    },
                    {
                        "color": "#00ff00",
                        "offset": 0.5,
                        "opacity": 1
                    },
                    {
                        "color": "#0000ff",
                        "offset": 1,
                        "opacity": 1
                    }
                ],
                "type": "solid"
            },
            "team2Name": "Team Name 2"
        }
    }
]
```
