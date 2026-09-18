// Isolated browser verification: in-memory database and no Singular network writes.
process.env.DATABASE_FILE=':memory:';
process.env.PORT='3001';
const client=require('../src/services/singularClient');
client.patchSingular=async()=>({});
if (process.argv.includes('--snapshot')) {
  const Database=require('better-sqlite3');
  const source=new Database('database.sqlite',{readonly:true});
  const snapshot=new Database(source.serialize());
  source.close();
  const original=require('../src/db/database');
  snapshot.LMB_TEAMS_CATALOG=original.LMB_TEAMS_CATALOG;
  require.cache[require.resolve('../src/db/database')].exports=snapshot;
  original.close();
}
require('../src/server');
