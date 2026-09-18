# Plantillas editables de 11 jugadores

La tabla `lineups` conserva las alineaciones históricas por partido. `lineup_templates` guarda una plantilla de emisión por equipo, con once jugadores, posiciones y orden. La plantilla tiene prioridad al consultar y transmitir Team Lineups; no modifica las alineaciones históricas.

Se prepararon los 20 equipos usando el roster activo guardado en SQLite y estadísticas LMB de 2025. Se priorizaron apariciones al plato para bateadores, aperturas para un pitcher y apariciones para el segundo. Se buscó cubrir catcher, posiciones del cuadro, tres jardineros, un bateador designado y dos pitchers. Las once filas son una selección sugerida para el gráfico, no once titulares oficiales ni un orden de bateo confirmado. La pantalla señala cuántos jugadores elegidos no tienen registro en la LMB de 2025.

En Configuración de Partido & Lineup, selecciona los equipos y Local o Visitante. Cambia jugadores y posiciones con los selectores y usa las flechas para ordenar. Pulsa **Guardar plantilla de 11** antes de transmitir. Los cambios se conservan para ese equipo en futuros enfrentamientos. No se aceptan duplicados, jugadores de otro equipo ni cantidades distintas de once.

El interruptor Team Lineups envía los once guardados del equipo seleccionado en la sección Lineup; no envía el roster completo. Editar o guardar no transmite a Singular. Si se activa el interruptor mientras existen cambios sin guardar, se usa la última plantilla guardada.

Fuentes y descarga: `scripts/download-lineup-stats.cjs`, `lineup-stats-2025.json`. API pública: `https://statsapi.mlb.com/api/v1/stats?stats=season&group=hitting&season=2025&sportIds=23&leagueIds=125&limit=2000&playerPool=ALL` y la misma consulta con `group=pitching`. Se recibieron todos los splits indicados por la respuesta: 456 de bateo y 576 de pitcheo.

`scripts/seed-lineup-templates.cjs` permite revisar la propuesta; `--apply` crea un respaldo y guarda solo plantillas ausentes. Nunca reemplaza las ediciones existentes. El informe inicial está en `lineup-templates-report.json`. El respaldo previo se llama `database.before-lineup-templates-<fecha>.sqlite`.

Verificación: once pruebas automatizadas, veinte respuestas con once jugadores distintos y prueba de edición/guardado y activación en instancia aislada con envíos a Singular simulados.
