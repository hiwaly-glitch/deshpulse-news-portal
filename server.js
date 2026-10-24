import http from 'node:http';
import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {collectNews} from './lib/feeds.js';
import {createNewsCache} from './lib/news-cache.js';

const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'public');
const getNews=createNewsCache(collectNews);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.txt':'text/plain; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
  const urlPath=req.url?.split('?')[0]||'/';
  res.setHeader('X-Content-Type-Options','nosniff');
  try {
    if(urlPath==='/healthz'){
      res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
      return res.end(JSON.stringify({ok:true,service:'deshpulse',status:'web-server-ready'}));
    }
    if(urlPath==='/api/news'){
      if(req.method!=='GET'){res.writeHead(405,{'Allow':'GET'});return res.end('Method not allowed')}
      try {
        const news=await getNews();
        res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=60'});
        return res.end(JSON.stringify(news));
      } catch {
        res.writeHead(503,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
        return res.end(JSON.stringify({error:'News feeds temporarily unavailable',articles:[],feeds:[]}));
      }
    }
    if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,{'Allow':'GET, HEAD'});return res.end('Method not allowed')}
    const u=new URL(req.url,'http://localhost');
    const safe=path.posix.normalize(decodeURIComponent(u.pathname));
    if(safe.includes('..')||safe.includes('\\')||safe.startsWith('/api/')){res.writeHead(404);return res.end()}
    const resolved=path.resolve(root,`.${safe==='/'?'/index.html':safe}`);
    if(!resolved.startsWith(`${root}${path.sep}`)){res.writeHead(403);return res.end()}
    const data=await readFile(resolved);
    res.writeHead(200,{'Content-Type':mime[path.extname(resolved)]||'application/octet-stream','Cache-Control':resolved.endsWith('index.html')?'public, max-age=60':'public, max-age=600'});
    return res.end(req.method==='HEAD'?undefined:data);
  }catch(e){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Not found')}
});
const port=Number(process.env.PORT)||3000;
server.listen(port,'0.0.0.0',()=>console.log(`DeshPulse listening on ${port}`));
