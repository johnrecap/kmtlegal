import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import pg from 'pg';

const root=path.resolve('_workspace/batch3-postgres');
const database=new URL(process.env.DATABASE_URL||'');
if(process.env.BATCH3_ISOLATED_DB!=='true'||process.env.APP_ENV!=='local'||database.hostname!=='127.0.0.1'||database.port!=='55437'||database.pathname!=='/kmt_batch3'||decodeURIComponent(database.username)!=='kmt_batch3') throw Error('Dedicated batch3 database required');
if(await fs.realpath(root)!==root) throw Error('Unexpected disposable root');
const uploads=path.join(root,'uploads');
if(path.resolve(process.env.UPLOADS_DIR||'')!==uploads||await fs.realpath(uploads)!==uploads) throw Error('Unexpected uploads root');
const config={host:'127.0.0.1',port:55437,user:'kmt_batch3',password:decodeURIComponent(database.password)};
const source=new pg.Client({...config,database:'kmt_batch3'});
const restore=new pg.Client({...config,database:'kmt_batch3_restore'});
const bin='C:/Program Files/PostgreSQL/18/bin';
const toolEnv={...process.env,PGPASSWORD:config.password};
const toolVersions=Object.fromEntries(['pg_dump','pg_restore'].map(tool=>[tool,execFileSync(path.join(bin,tool+'.exe'),['--version'],{encoding:'utf8',windowsHide:true}).trim()]));
const report={scope:'Local disposable PostgreSQL and private-file copy restore; not an aaPanel production restore',sourceDatabase:'kmt_batch3',restoreDatabase:'kmt_batch3_restore',host:config.host,port:config.port,dataDirectory:path.join(root,'data'),toolVersions,commands:[],tables:[],files:[]};
async function verify(client,name){
 const {rows}=await client.query("SELECT current_database() AS db, inet_server_port() AS port, current_setting('data_directory') AS directory, current_setting('server_version') AS version");
 if(rows[0].db!==name||rows[0].port!==55437||path.resolve(rows[0].directory)!==path.join(root,'data')) throw Error('Target database identity mismatch');
 report.serverVersion=rows[0].version;
}
function run(tool,args){execFileSync(path.join(bin,tool+'.exe'),args,{env:toolEnv,windowsHide:true,stdio:'pipe'});report.commands.push({tool,args,exitCode:0});}
async function inventory(dir,prefix=''){
 const out=[];
 for(const entry of await fs.readdir(dir,{withFileTypes:true})){
  if(entry.isSymbolicLink()) throw Error('Symlink not allowed in disposable file backup');
  const relative=path.join(prefix,entry.name),absolute=path.join(dir,entry.name);
  if(entry.isDirectory()) out.push(...await inventory(absolute,relative));
  else out.push({relative,sha256:crypto.createHash('sha256').update(await fs.readFile(absolute)).digest('hex')});
 }
 return out.sort((a,b)=>a.relative.localeCompare(b.relative));
}
try{
 await source.connect();await verify(source,'kmt_batch3');
 const others=await source.query("SELECT count(*)::int AS count FROM pg_stat_activity WHERE datname='kmt_batch3' AND backend_type='client backend' AND pid<>pg_backend_pid()");
 if(others.rows[0].count!==0) throw Error('Other database clients still connected; stop test writers first');
 report.noOtherSourceDatabaseClients=true;
 if((await source.query("SELECT datname FROM pg_database WHERE datname='kmt_batch3_restore'")).rowCount) throw Error('Restore database already exists; refusing overwrite');
 const backup=path.join(root,'backup');await fs.mkdir(backup);const dump=path.join(backup,'database.dump');
 const common=['-h','127.0.0.1','-p','55437','-U','kmt_batch3'];
 run('pg_dump',[...common,'-d','kmt_batch3','--format=custom','--file',dump]);
 run('pg_restore',['--list',dump]);
 run('createdb',[...common,'kmt_batch3_restore']);
 await restore.connect();await verify(restore,'kmt_batch3_restore');
 run('pg_restore',[...common,'-d','kmt_batch3_restore','--exit-on-error',dump]);
 await verify(restore,'kmt_batch3_restore');
 const tables=(await source.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")).rows;
 for(const {tablename} of tables){
  const quoted='"'+tablename.replaceAll('"','""')+'"';
  const sql=`SELECT to_jsonb(t)::text AS row FROM public.${quoted} t ORDER BY to_jsonb(t)::text`;
  const a=(await source.query(sql)).rows.map(r=>r.row),b=(await restore.query(sql)).rows.map(r=>r.row);
  const hash=rows=>crypto.createHash('sha256').update(JSON.stringify(rows)).digest('hex');
  const result={table:tablename,sourceCount:a.length,restoredCount:b.length,sourceSha256:hash(a),restoredSha256:hash(b)};
  if(result.sourceSha256!==result.restoredSha256) throw Error(`Row mismatch: ${tablename}`);
  report.tables.push(result);
 }
 const before=await inventory(uploads);
 await fs.cp(uploads,path.join(backup,'uploads'),{recursive:true,errorOnExist:true,force:false});
 const restoredFiles=path.join(root,'restored-uploads');
 await fs.cp(path.join(backup,'uploads'),restoredFiles,{recursive:true,errorOnExist:true,force:false});
 const after=await inventory(restoredFiles);
 if(JSON.stringify(before)!==JSON.stringify(after)||!before.length) throw Error('Restored file mismatch or empty source');
 report.files=before;report.fileCount=before.length;report.restoredFilesIdentical=true;
 report.dumpBytes=(await fs.stat(dump)).size;report.result='passed';
 await fs.writeFile('docs/reviews/2026-09-11/batch3/restore-results.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({result:report.result,tables:report.tables.length,files:report.fileCount,dumpBytes:report.dumpBytes}));
}finally{await source.end();await restore.end().catch(()=>{});}
