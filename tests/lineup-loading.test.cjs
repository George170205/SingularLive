const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs'),vm=require('vm');
const source=fs.readFileSync('public/app.js','utf8');
const code=source.slice(source.indexOf('let rosterLoadVersion=0;'),source.indexOf('// Actualiza toda la interfaz que depende'));
function harness(fetch){
 const context=vm.createContext({fetch,AbortSignal,localTeamRoster:[],visitorTeamRoster:[],savedLineups:{},refreshMatchupRosterUI(){},torosRoster:[],rivalRoster:[]});
 vm.runInContext(code,context);return context;
}
test('missing lineup route does not hide either roster and explains server restart',async()=>{
 const c=harness(async url=>({ok:!url.includes('lineups'),status:404,json:async()=>[{id:url.includes('/1/')?10:20}]}));
 await c.loadMatchupRosters(1,15);
 assert.equal(c.localTeamRoster[0].id,10);assert.equal(c.visitorTeamRoster[0].id,20);
 assert.match(c.savedLineups[15].error,/Reinicia el servidor/);
});
test('a delayed previous selection cannot overwrite the new matchup',async()=>{
 const pending=[];
 const c=harness(url=>new Promise(resolve=>pending.push(()=>resolve({ok:true,json:async()=>url.includes('lineups')?{players:[]}:[{id:Number(url.split('/')[3])}]}))));
 const old=c.loadMatchupRosters(1,15),latest=c.loadMatchupRosters(15,13);
 pending.slice(4).forEach(f=>f());await latest;
 pending.slice(0,4).forEach(f=>f());await old;
 assert.equal(c.localTeamRoster[0].id,15);assert.equal(c.visitorTeamRoster[0].id,13);
});
test('bio output uses the team logo and disables player portraits',()=>{
 const build=require('../src/services/singularClient').buildPlayerBioPayload;
 const payload=build({nombre:'Jugador',foto_url:'https://example.com/portrait.png'},{nombre:'Equipo',logo_url:'https://example.com/logo.svg'});
 assert.equal(payload['Logo 1'],'https://example.com/logo.svg');
 assert.equal(payload['Headshot Active'],false);assert.equal(payload['Player Headshot'],'');
});
