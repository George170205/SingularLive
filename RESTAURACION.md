# Restauración del 16 de septiembre de 2026

Se recuperaron las ediciones de la sesión del 9–10 de septiembre a partir del historial local de herramientas y se compararon con los archivos reemplazados el 16 de septiembre. No había repositorio Git ni una copia completa versionada: se reaplicaron las ediciones originales y se retiraron las secciones añadidas que interferían con ellas.

Archivos restaurados: `public/index.html`, `public/app.js`, `public/app.css`, `src/server.js` y `src/db/database.js`. Los servicios de calendario, estado de partido, sincronización y roster conservaban las versiones de la sesión anterior.

Se recuperaron el panel de overlays en su columna original, los logos del marcador, las cuatro pestañas de configuración, el aviso compacto de juego programado junto a la vista previa original, el programador con series y fuentes, el cierre de partidos vinculado al calendario y la distinción entre alineaciones guardadas y roster completo de los rivales. Se retiraron el aviso alternativo y el segundo cierre que modificaba el bracket directamente.

Antes de modificar archivos se guardó `recovery-2026-09-16/`, con copia del código y respaldo consistente de SQLite. La base de datos operativa no se restauró a una fecha anterior: equipos, jugadores, alineaciones, calendario, bracket y pertenencia al roster quedaron iguales al respaldo previo a esta intervención.

Verificación: seis pruebas automatizadas, prueba HTTP de creación/edición/eliminación de juegos y creación de series en una copia en memoria, revisión visual del panel B y navegación por configuración y bracket. Se comprobó en navegador que Querétaro muestra sus 32 jugadores al seleccionar Visitante. Los envíos a Singular de la instancia de prueba estaban simulados.

Para cargar los cambios del servidor, reiniciar `npm start` y recargar el navegador con Ctrl+F5.
