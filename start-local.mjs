import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {spawn} from 'node:child_process';
if(Number(process.versions.node.split('.')[0])<24){console.error('Node.js 24 or newer is required. Install it, then run START-GAME.bat again.');process.exit(1);}
const {DatabaseSync}=await import('node:sqlite');
const {handleRooms}=await import('./server/rooms.mjs');
const root=fileURLToPath(new URL('.',import.meta.url)),publicRoot=path.join(root,'public'),args=process.argv.slice(2);
function value(flag,fallback){const i=args.indexOf(flag);return i<0?fallback:args[i+1];}
const port=Number(value('--port','5173')),host=value('--host','127.0.0.1');
if(!Number.isInteger(port)||port<0||port>65535||!['127.0.0.1','0.0.0.0','localhost'].includes(host)){console.error('Use --port 1..65535 and --host 127.0.0.1 or 0.0.0.0.');process.exit(1);}
await mkdir(path.join(root,'.local-data'),{recursive:true});
const sql=new DatabaseSync(path.join(root,'.local-data','block-empire.sqlite'));
sql.exec('PRAGMA journal_mode = WAL');
const migration=await readFile(path.join(root,'drizzle','0000_lame_mister_sinister.sql'),'utf8');
sql.exec(migration.replace('CREATE TABLE `rooms`','CREATE TABLE IF NOT EXISTS `rooms`'));
const db={prepare(query){return{bind(...bindings){return{async first(){return sql.prepare(query).get(...bindings)??null;},async run(){const r=sql.prepare(query).run(...bindings);return{meta:{changes:Number(r.changes)}};}};}};}};
const mime={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon'};
mime['.webmanifest']='application/manifest+json; charset=utf-8';
const server=createServer(async(req,res)=>{
 try{
 const url=new URL(req.url??'/','http://'+(req.headers.host??'localhost'));
 if(url.pathname==='/api/rooms'||url.pathname.startsWith('/api/rooms/')){
  if(!['GET','POST'].includes(req.method)){res.writeHead(405);res.end();return;}
  let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>8192){res.writeHead(413,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Request is too large'}));return;}chunks.push(chunk);}
  const request=new Request(url,{method:req.method,headers:req.headers,...(req.method==='POST'?{body:Buffer.concat(chunks)}:{})});
  const response=await handleRooms(request,db);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;
 }
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
 const pathname=decodeURIComponent(url.pathname),relative=pathname==='/'?'play/index.html':pathname==='/play'||pathname==='/play/'?'play/index.html':pathname.replace(/^\/+/,''),target=path.resolve(publicRoot,relative);
 if(!target.startsWith(publicRoot+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
 const data=await readFile(target);res.writeHead(200,{'Content-Type':mime[path.extname(target)]??'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:data);
 }catch(e){if(!res.headersSent){const missing=e.code==='ENOENT'||e.code==='EISDIR';res.writeHead(missing?404:400,{'Content-Type':'text/plain; charset=utf-8'});res.end(missing?'Not found':'Invalid request');}else res.end();}
});
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'Port is in use. Try: node start-local.mjs --port 5174':e.message);sql.close();process.exitCode=1;});
server.listen(port,host,()=>{const address=server.address(),url=`http://localhost:${address.port}/play/index.html`;console.log(`BLOCK EMPIRE v0.14 is ready: ${url}`);console.log('Keep this window open. Press Ctrl+C to stop.');if(host==='0.0.0.0')console.log(`LAN mode: share http://YOUR-COMPUTER-IP:${address.port}/play/index.html with devices on your network.`);if(args.includes('--open')){let child;if(process.platform==='win32')child=spawn('cmd',['/c','start','',url],{stdio:'ignore',windowsHide:true});else child=spawn(process.platform==='darwin'?'open':'xdg-open',[url],{stdio:'ignore'});child.on('error',()=>console.log('Open the address above in your browser.'));}});
function shutdown(){server.close(()=>{sql.close();process.exit(0);});server.closeIdleConnections();}
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
