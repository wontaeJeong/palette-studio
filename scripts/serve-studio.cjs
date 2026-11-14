/* Local, dependency-free static server for the generated web artifact. */
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
function createStudioServer({directory = path.resolve(__dirname,'../out/web'), base = '/'} = {}) {
  const root = fs.realpathSync(directory);
  if (!base.startsWith('/') || !base.endsWith('/')) throw Error('base must start and end with /');
  return http.createServer(async (request,response) => {
    try {
      if (!['GET','HEAD'].includes(request.method)) {response.writeHead(405).end();return;}
      const pathname = decodeURIComponent(new URL(request.url,'http://localhost').pathname);
      if (!pathname.startsWith(base)) {response.writeHead(404).end();return;}
      let file = path.resolve(root,pathname.slice(base.length));
      if (file !== root && !file.startsWith(root+path.sep)) {response.writeHead(403).end();return;}
      if ((await fs.promises.stat(file)).isDirectory()) file = path.join(file,'index.html');
      file = await fs.promises.realpath(file);
      if (!file.startsWith(root+path.sep)) {response.writeHead(403).end();return;}
      const info = await fs.promises.stat(file);
      if (!info.isFile()) {response.writeHead(404).end();return;}
      response.writeHead(200,{'Content-Type':mime[path.extname(file)] || 'application/octet-stream','Content-Length':info.size,'Cache-Control':'no-store'});
      if (request.method === 'HEAD') {response.end();return;}
      const stream = fs.createReadStream(file);
      stream.on('error',()=>response.destroy());
      stream.pipe(response);
    } catch (error) {
      response.writeHead(error.code === 'ENOENT' ? 404 : 400).end();
    }
  });
}
if (require.main === module) {
  const args = process.argv.slice(2);
  const option = (name,fallback) => {const i=args.indexOf(name);return i<0?fallback:args[i+1];};
  const port = Number(option('--port','4173'));
  const base = option('--base','/');
  const server = createStudioServer({base});
  server.on('error',error=>{console.error(error.message);process.exitCode=1;});
  server.listen(port,'127.0.0.1',()=>console.log(`Palette Studio: http://127.0.0.1:${server.address().port}${base} (static build; restart npm run dev to rebuild)`));
}
module.exports = {createStudioServer};
