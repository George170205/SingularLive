const fs=require('fs');
const a=JSON.parse(fs.readFileSync('roster-audit.json','utf8'));
const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const rows=a.singular.filter(x=>/^lineupsTable_r\d+$/.test(x.field)).sort((x,y)=>Number(x.field.split('_r')[1])-Number(y.field.split('_r')[1])).map(x=>{const [n,...name]=x.value.split(',');return {name:name.join(',').trim(),number:n.trim()};});
const extras=a.local.filter(p=>!a.official.some(o=>o.mlb_id===p.mlb_id||norm(o.nombre)===norm(p.nombre)));
const missing=a.official.filter(o=>!a.local.some(p=>p.mlb_id===o.mlb_id||norm(o.nombre)===norm(p.nombre)));
const duplicates=a.local.filter((p,i)=>a.local.findIndex(q=>norm(q.nombre)===norm(p.nombre))!==i);
const table=rows.map(p=>{
 const l=a.local.filter(q=>norm(q.nombre)===norm(p.name));
 const o=a.official.find(q=>norm(q.nombre)===norm(p.name));
 return `| ${p.name} | ${p.number} | ${l.map(q=>q.numero).join(' / ')} | ${o?o.numero:'No figura activo'} |`;
}).join('\n');
fs.writeFileSync('REVISION-ROSTER.md',`# Comparación de roster y alineaciones

Consulta en modo lectura: ${a.checkedAt}. El roster oficial se consultó para el **9 de septiembre de 2026**, fecha del juego cargado. No se reemplazaron jugadores ni se enviaron cambios a Singular.

## Resultado

- Catálogo local de Toros: **${a.local.length} registros**. Coincide con el catálogo del respaldo anterior al trabajo del calendario.
- MLB Stats API: **${a.official.length} jugadores activos** para la fecha consultada; ${missing.length} faltan en el catálogo por nombre o ID.
- Singular: **${rows.length} filas de alineación**. Es una alineación del gráfico, no un roster completo. Sus 11 nombres coinciden con los de la alineación local guardada, pero el orden es distinto y hay diferencias de dorsales.
- ${extras.length} registros locales no aparecen en la lista activa consultada. Esto no demuestra por sí solo una baja: el catálogo mezcla registros manuales y una importación de fullRoster.
- Posible duplicado por acento: ${duplicates.map(p=>p.nombre).join(', ')}. Isaac aparece con dorsal 13 en el registro manual y 74 en el registro con ID MLB.

## Los jugadores que actualmente tiene Singular

Orden de filas leído de Singular:

| Jugador | Dorsal Singular | Dorsal local | Dorsal oficial activo |
|---|---:|---:|---|
${table}

La alineación local guardada comienza con Junior Lake, Aneury Tavárez y Bobby Bradley. Singular comienza con Harold Castro, Bobby Bradley y Jairus Richards. La pantalla anterior mostraba otra lista: los primeros 11 registros del catálogo por dorsal, comenzando con Aneurys Zabala. Ese orden también era el que preparaba el envío del sistema, aunque todavía no coincidía con el contenido leído de Singular.

## Registros locales fuera de la lista activa consultada

${extras.map(p=>`- ${p.nombre} (#${p.numero})`).join('\n')}

## Corrección aplicada

La vista y el envío del lineup consultan ahora la alineación guardada, en orden de bateo. Si pertenece a un partido anterior, se identifica como tal para que el operador la revise. Sin alineación guardada, no se inventa una tomando jugadores del catálogo. Se conservaron dorsales, fotos, biografías y jugadores locales.

La sincronización existente usa fullRoster y agrega registros; no elimina ausentes y puede modificar dorsales/fotos. Por eso no conviene usarla para sustituir automáticamente la alineación del día. No se ejecutó esa sincronización durante esta revisión.

## Fuentes

- [Roster activo MLB Stats API, equipo 5010, 2026-09-09](https://statsapi.mlb.com/api/v1/teams/5010/roster?rosterType=active&season=2026&date=2026-09-09).
- API de control de tu aplicación Singular.Live: lectura de los campos lineupsTable_r1 a lineupsTable_r11, sin publicar el enlace con credenciales.
- Base local database.sqlite y respaldo database.before-calendar.sqlite.
- Evidencia filtrada de la consulta: roster-audit.json.
`);
console.log({official:a.official.length,local:a.local.length,singular:rows.length,extras:extras.length,missing:missing.length});
