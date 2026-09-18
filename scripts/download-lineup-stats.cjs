const fs=require('fs');
(async()=>{
 const result={season:2025,checkedAt:new Date().toISOString(),groups:{}};
 for(const group of ['hitting','pitching']){
  const url=`https://statsapi.mlb.com/api/v1/stats?stats=season&group=${group}&season=2025&sportIds=23&leagueIds=125&limit=2000&playerPool=ALL`;
  const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error(`HTTP ${response.status}`);
  const data=await response.json();result.groups[group]={url,data};
  console.log(group,JSON.stringify(data).slice(0,180),data.stats?.[0]?.splits?.length);
 }
 fs.writeFileSync('lineup-stats-2025.json',JSON.stringify(result,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
