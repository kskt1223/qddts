import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const publicPath = fileURLToPath(new URL('../public/', import.meta.url));
const assets = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/styles.css': ['styles.css', 'text/css; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/speed-insights.js': ['speed-insights.js', 'text/javascript; charset=utf-8'],
  '/vendor/speed-insights/index.mjs': ['vendor/speed-insights/index.mjs', 'text/javascript; charset=utf-8'],
  '/vendor/speed-insights/index.mjs.map': ['vendor/speed-insights/index.mjs.map', 'application/json; charset=utf-8'],
  '/vendor/speed-insights/LICENSE': ['vendor/speed-insights/LICENSE', 'text/plain; charset=utf-8'],
  '/catalog.json': ['catalog.json', 'application/json; charset=utf-8'],
  '/robots.txt': ['robots.txt', 'text/plain; charset=utf-8'],
  '/sitemap.xml': ['sitemap.xml', 'application/xml; charset=utf-8'],
  '/assets/jug.svg': ['assets/jug.svg', 'image/svg+xml'],
  '/assets/logo.svg': ['assets/logo.svg', 'image/svg+xml'],
  '/assets/wechat-placeholder.svg': ['assets/wechat-placeholder.svg', 'image/svg+xml'],
  '/assets/wechat_qrcode.png': ['assets/wechat_qrcode.png', 'image/png'],
  '/assets/wechat-qr.png': ['assets/wechat-qr.png', 'image/png'],
  '/assets/wechat-qr.jpg': ['assets/wechat-qr.jpg', 'image/jpeg'],
  '/assets/wechat-qr.jpeg': ['assets/wechat-qr.jpeg', 'image/jpeg'],
  '/assets/wechat-qr.webp': ['assets/wechat-qr.webp', 'image/webp'],
};

export function createApp() {
  return createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
    response.setHeader('Cache-Control', 'no-store');
    const sendText = (status, text) => {
      response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(request.method === 'HEAD' ? undefined : text);
    };
    let path;
    try { path = new URL(request.url, 'http://localhost').pathname; }
    catch { return sendText(400, '请求地址无效'); }
    if (!Object.hasOwn(assets, path)) return sendText(404, '页面不存在');
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.setHeader('Allow', 'GET, HEAD');
      return sendText(405, '仅支持浏览产品与价格');
    }
    try {
      const [file, type] = assets[path];
      const data = await readFile(join(publicPath, file));
      response.writeHead(200, { 'Content-Type': type });
      response.end(request.method === 'HEAD' ? undefined : data);
    } catch (error) {
      sendText(error.code === 'ENOENT' ? 404 : 500, error.code === 'ENOENT' ? '页面不存在' : '暂时无法加载页面');
    }
  });
}
