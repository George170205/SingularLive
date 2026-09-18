# Comparación de roster y alineaciones

Consulta en modo lectura: 2026-09-10T05:22:34.256Z. El roster oficial se consultó para el **9 de septiembre de 2026**, fecha del juego cargado. No se reemplazaron jugadores ni se enviaron cambios a Singular.

## Resultado

- Catálogo local de Toros: **54 registros**. Coincide con el catálogo del respaldo anterior al trabajo del calendario.
- MLB Stats API: **32 jugadores activos** para la fecha consultada; 0 faltan en el catálogo por nombre o ID.
- Singular: **11 filas de alineación**. Es una alineación del gráfico, no un roster completo. Sus 11 nombres coinciden con los de la alineación local guardada, pero el orden es distinto y hay diferencias de dorsales.
- 21 registros locales no aparecen en la lista activa consultada. Esto no demuestra por sí solo una baja: el catálogo mezcla registros manuales y una importación de fullRoster.
- Posible duplicado por acento: Isaac Rodriguez. Isaac aparece con dorsal 13 en el registro manual y 74 en el registro con ID MLB.

## Los jugadores que actualmente tiene Singular

Orden de filas leído de Singular:

| Jugador | Dorsal Singular | Dorsal local | Dorsal oficial activo |
|---|---:|---:|---|
| Harold Castro | 03 | 3 | No figura activo |
| Bobby Bradley | 05 | 5 | No figura activo |
| Jairus Richards | 07 | 7 | No figura activo |
| Aneury Tavárez | 10 | 10 | No figura activo |
| Isaac Rodríguez | 13 | 13 / 74 | 74 |
| Donny Sands | 19 | 19 | No figura activo |
| Junior Lake | 23 | 27 | 27 |
| Niko Vásquez | 24 | 24 | No figura activo |
| Gabriel Gutiérrez | 31 | 31 | No figura activo |
| Teddy Stankiewicz | 55 | 22 | No figura activo |
| Silvino Bracho | 99 | 99 | No figura activo |

La alineación local guardada comienza con Junior Lake, Aneury Tavárez y Bobby Bradley. Singular comienza con Harold Castro, Bobby Bradley y Jairus Richards. La pantalla anterior mostraba otra lista: los primeros 11 registros del catálogo por dorsal, comenzando con Aneurys Zabala. Ese orden también era el que preparaba el envío del sistema, aunque todavía no coincidía con el contenido leído de Singular.

## Registros locales fuera de la lista activa consultada

- Aneurys Zabala (#0)
- Harold Castro (#3)
- Bobby Bradley (#5)
- Rafael Ortega (#5)
- Randy Acosta (#6)
- Jairus Richards (#7)
- Aneury Tavárez (#10)
- Sergio Burruel (#12)
- Danry Vasquez (#13)
- Donny Sands (#19)
- Jordi Serna (#19)
- Teddy Stankiewicz (#22)
- Niko Vásquez (#24)
- Gabriel Gutiérrez (#31)
- Randy Wynne (#36)
- Rafael Castaneda (#46)
- Domingo Germán (#59)
- Caleb Baragar (#66)
- Bryan Zazueta (#80)
- Arath Garza (#82)
- Silvino Bracho (#99)

## Corrección aplicada

La vista y el envío del lineup consultan ahora la alineación guardada, en orden de bateo. Si pertenece a un partido anterior, se identifica como tal para que el operador la revise. Sin alineación guardada, no se inventa una tomando jugadores del catálogo. Se conservaron dorsales, fotos, biografías y jugadores locales.

La sincronización existente usa fullRoster y agrega registros; no elimina ausentes y puede modificar dorsales/fotos. Por eso no conviene usarla para sustituir automáticamente la alineación del día. No se ejecutó esa sincronización durante esta revisión.

## Fuentes

- [Roster activo MLB Stats API, equipo 5010, 2026-09-09](https://statsapi.mlb.com/api/v1/teams/5010/roster?rosterType=active&season=2026&date=2026-09-09).
- API de control de tu aplicación Singular.Live: lectura de los campos lineupsTable_r1 a lineupsTable_r11, sin publicar el enlace con credenciales.
- Base local database.sqlite y respaldo database.before-calendar.sqlite.
- Evidencia filtrada de la consulta: roster-audit.json.
