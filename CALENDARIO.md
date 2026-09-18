# Calendario y series

1. Inicia el servidor con `npm start` y abre http://localhost:3000.
2. En Panel A, la cuarta pestaña es **Programador de Calendario y Series**. Permite crear, editar y eliminar juegos pendientes, indicar sede y hora de Tijuana, y vincularlos a una serie del bracket. Para agregar una serie, abre «Crear una nueva serie» dentro del formulario; después guarda cada juego con esa serie seleccionada.
3. En **Configuración de Partido & Lineup**, pulsa **Cargar este juego**. Se ofrece el juego activo o el primer pendiente por fecha. Cada juego conserva un identificador propio, marcador y lineup; repetir la carga no reinicia el marcador.
4. Opera el marcador desde Panel B. Al terminar, pulsa **Finalizar partido** y confirma el resultado mostrado. El cierre guarda las carreras, suma una victoria a su serie y refresca todas las pantallas. No permite empate, doble conteo ni cambiar un partido ya cerrado.
5. Al llegar a cuatro victorias, se muestra el ganador y se cancelan los juegos pendientes de esa serie. La siguiente ronda se programa explícitamente: el formato LMB incluye mejores perdedores y no permite inferir todos los cruces por un árbol de eliminación simple.

Los resultados iniciales son una instantánea verificada al 9 de septiembre de 2026, después del Juego 1 de la final; no es un servicio de resultados en vivo. Los cierres posteriores corresponden al operador. Las fuentes se pueden abrir desde calendario y bracket. Los juegos 5–7 son condicionales.

## Fuentes

- Calendario oficial, siete juegos y horarios de Tijuana: https://torosdetijuana.com/index.php/toros-y-olmecas-disputaran-la-serie-del-rey-2026/2026/09/
- Juego 1: Olmecas 7–1 Toros: https://torosdetijuana.com/index.php/cede-toros-el-primer-duelo-de-la-serie-del-rey/2026/09/
- Camino de Toros: tres series ganadas 4–1: https://torosdetijuana.com/index.php/el-camino-de-toros-a-la-serie-del-rey/2026/09/
- Resultados de las trece series, incluyendo mejores perdedores: https://www.clarosports.com/beisbol/mexicano/playoffs-lmb-2026-equipos-cruces-calendario-y-resultados/

## Conservación y pruebas

`database.before-calendar.sqlite` es el respaldo completo previo a la migración. Las tablas `calendario_legacy_backup` y `bracket_legacy_backup` también conservan los registros anteriores. La migración se ejecuta una sola vez; no vuelve a insertar partidos borrados ni sobrescribe resultados al reiniciar. Los equipos, logos, jugadores y lineups existentes se conservan. Se añadió Bravos de León, que faltaba por una coincidencia parcial con Leones.

`npm test` prueba la migración, validaciones, carga repetida, separación de partidos, empates, marcadores desactualizados, doble cierre, victorias visitantes y conclusión de serie. `node tests/preview.cjs` abre una copia en memoria en el puerto 3001 con los envíos de marcadores a Singular simulados. No usar esa copia para operar una transmisión.
