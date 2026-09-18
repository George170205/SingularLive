# Sincronización del 10 de septiembre de 2026

Se guardaron 630 jugadores activos de 20 equipos y sus URLs de fotografía. Toros y Olmecas tienen 32 activos cada uno. Las fotografías personalizadas se conservan; disponer de URL no garantiza que el proveedor tenga una foto para todos. Los jugadores ausentes y duplicados permanecen en el historial, disponible con la casilla del Gestor de Jugadores.

Se guardaron 1004 juegos oficiales únicos en caché, se sincronizó el calendario operativo y se verificaron las 13 series del bracket. El juego 2 se corrigió de 2–0 a Toros 13–Olmecas 2; la Serie del Rey queda 1–1. Se incorporaron los nueve titulares de ambos equipos del 9 de septiembre como alineaciones de ese partido, sin inventar la alineación del próximo juego.

Fuente de roster: https://statsapi.mlb.com/api/v1/teams/5010/roster?rosterType=active&season=2026&date=2026-09-10

Fuente de postemporada: https://statsapi.mlb.com/api/v1/schedule?sportId=23&startDate=2026-08-08&endDate=2026-09-30

Fuente de alineación: https://statsapi.mlb.com/api/v1/game/867487/boxscore

El roster se lee de SQLite mientras la consulta guardada corresponda al día actual y tenga menos de 24 horas. El botón de sincronización permite forzar una consulta. Una respuesta vacía o fallida conserva los datos locales. El calendario de postemporada requiere omitir el filtro leagueId que excluía esos juegos.

Respaldo previo: `database.before-official-sync-1789067975483.sqlite`. Detalle aplicado: `official-sync-report.json`. La segunda simulación no agregó jugadores ni alineaciones duplicadas y no volvió a corregir resultados. Pasaron seis pruebas automatizadas.

Para repetir la descarga completa: `node scripts/download-official.cjs`, revisar con `node scripts/apply-official.cjs` y aplicar con `node scripts/apply-official.cjs --apply`. Cada aplicación crea respaldo. Estos scripts actualizan SQLite; no transmiten gráficos a Singular.Live.
