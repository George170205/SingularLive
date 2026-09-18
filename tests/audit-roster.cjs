// Read-only comparison. Only player/lineup fields are written; no credentials.
const fs=require('fs');
const config=require('../src/config');
const db=new(require('better-sqlite3'))('database.sqlite',{readonly:true});
async function read(url){const r=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error(`HTTP ${r.status}`);return r.json();}
(async()=>{
 const result={checkedAt:new Date().toISOString(),local:db.prepare('SELECT nombre,numero,posicion,mlb_id FROM jugadores WHERE equipo_id=1 ORDER BY numero').all()};
 const checks=await Promise.allSettled([
  read('https://statsapi.mlb.com/api/v1/teams/5010/roster?rosterType=active&season=2026&date=2026-09-09'),
  read(`${config.SINGULAR_API_BASE}/${config.SINGULAR_APP_TOKEN}/control`)
 ]);
 let failed=false;
 for(let i=0;i<checks.length;i++){
  const c=checks[i],key=i?'singular':'official';
  if(c.status==='rejected'){result[key]={error:c.reason.message};failed=true;continue;}
  if(!i) result.official=(c.value.roster||[]).map(p=>({nombre:p.person?.fullName,mlb_id:p.person?.id,numero:p.jerseyNumber,posicion:p.position?.abbreviation,status:p.status?.description}));
  else {
   result.singular=[];
   function walk(v){if(!v||typeof v!=='object')return; for(const [k,val] of Object.entries(v)){if(/lineupsTable_r\d+|^Subtitle$|^Title$/i.test(k)&&typeof val==='string')result.singular.push({field:k,value:val});else if(val&&typeof val==='object')walk(val);}}
   walk(c.value);
   if(!result.singular.length) result.singularStructure=Array.isArray(c.value)?c.value.map(v=>({keys:Object.keys(v)})):Object.keys(c.value);
  }
 }
 fs.writeFileSync('roster-audit.json',JSON.stringify(result,null,2));
 console.log(JSON.stringify({local:result.local.length,official:Array.isArray(result.official)?result.official.length:result.official,singular:result.singular,structure:result.singularStructure}));
 db.close();if(failed)process.exitCode=1;
})().catch(e=>{console.error(e.message);process.exitCode=1;});
