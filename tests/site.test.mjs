import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { readFile } from 'node:fs/promises';
import { createApp } from '../src/app.mjs';

async function request(path, method = 'GET') {
  const input = Object.assign(Readable.from([]), { url: path, method, headers: {} });
  const headers = new Headers();
  let status = 200, output;
  const response = {
    headersSent: false,
    setHeader(key, value) { headers.set(key, value); },
    writeHead(code, values) { status = code; for (const [key, value] of Object.entries(values)) headers.set(key, value); this.headersSent = true; },
    end(value) { output = value; },
  };
  await createApp().listeners('request')[0](input, response);
  return new Response(output, { status, headers });
}

test('serves the price showcase without ordering forms or management links', async () => {
  const response = await request('/');
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /欣正义供水站/);
  assert.match(html, /id="contact-card"/);
  assert.match(html, /tel:15588692891/);
  assert.match(html, /tel:19963998585/);
  assert.doesNotMatch(html, /<form\b|id="order-dock"|id="checkout-dialog"|我的订单|href="\/admin"/);
  assert.equal(response.headers.get('set-cookie'), null);
});

test('publishes the five confirmed prices and delivery terms as read-only data', async () => {
  const response = await request('/catalog.json');
  assert.equal(response.status, 200);
  const { products, settings } = await response.json();
  assert.deepEqual(products.filter((p) => p.price !== null).map((p) => p.price), [2200, 1700, 1700, 1500, 1300]);
  assert.equal(settings.deposit, 5000);
  assert.equal(settings.deliveryFee, 0);
  assert.equal(settings.businessHours, '9:00–18:00');
  assert.equal(settings.wechatQr, '/assets/wechat_qrcode.png');
  const qr = await request(settings.wechatQr);
  assert.equal(qr.status, 200);
  assert.equal(qr.headers.get('content-type'), 'image/png');
  assert.deepEqual(Buffer.from(await qr.arrayBuffer()), await readFile(new URL('../public/assets/wechat_qrcode.png', import.meta.url)));
  assert.equal(response.headers.get('set-cookie'), null);
});

test('serves complete product names and prices before any JavaScript runs', async () => {
  const html = await (await request('/')).text();
  const { products } = await (await request('/catalog.json')).json();
  for (const product of products) {
    const card = html.match(new RegExp(`<article[^>]*data-product-id="${product.id}"[\\s\\S]*?</article>`))?.[0];
    assert.ok(card, `missing static product: ${product.name}`);
    assert.ok(card.includes(product.name));
    if (product.price === null) assert.match(card, /价格请咨询门店/);
    else assert.ok(card.includes(`>${product.price / 100}<`), `missing price: ${product.name}`);
  }
  assert.doesNotMatch(html, /正在为您准备好水/);
});

test('publishes a canonical homepage and preserves Baidu verification', async () => {
  const html = await (await request('/')).text();
  const head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
  assert.match(head, /<title>青岛桶装水价格与送水服务－欣正义供水站<\/title>/);
  assert.match(head, /<link rel="canonical" href="https:\/\/www\.qddts\.cn\/">/);
  assert.equal((head.match(/name="baidu-site-verification" content="codeva-Nbfdj96HGy"/g) || []).length, 1);
  assert.match(html, /<h1[^>]*>[\s\S]*?欣正义供水站[\s\S]*?青岛桶装水配送[\s\S]*?<\/h1>/);
});

test('serves crawl rules and a sitemap containing only the canonical page', async () => {
  const robots = await request('/robots.txt');
  assert.equal(robots.status, 200);
  assert.match(robots.headers.get('content-type'), /text\/plain/);
  const rules = await robots.text();
  assert.match(rules, /User-agent: \*/);
  assert.match(rules, /Sitemap: https:\/\/www\.qddts\.cn\/sitemap\.xml/);
  assert.doesNotMatch(rules, /Disallow:\s*\//);
  const sitemap = await request('/sitemap.xml');
  assert.equal(sitemap.status, 200);
  assert.match(sitemap.headers.get('content-type'), /application\/xml/);
  assert.deepEqual([...((await sitemap.text()).matchAll(/<loc>(.*?)<\/loc>/g))].map((match) => match[1]), ['https://www.qddts.cn/']);
});

test('removes admin pages, scripts, APIs and all ordering APIs', async () => {
  for (const path of ['/admin', '/admin.html', '/admin.js', '/api/shop', '/api/orders', '/api/admin/session', '/api/admin/orders', '/api/admin/login']) {
    for (const method of ['GET', 'POST']) assert.equal((await request(path, method)).status, 404, `${method} ${path}`);
  }
});

test('serves static assets and the explicit QR placeholder with security headers', async () => {
  for (const path of ['/styles.css', '/app.js', '/assets/logo.svg', '/assets/jug.svg', '/assets/wechat-placeholder.svg']) {
    const response = await request(path);
    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.ok(response.headers.get('content-security-policy'));
  }
});

test('does not expose environment files or the old local database and credentials', async () => {
  for (const path of ['/.env', '/.data/orders.sqlite', '/.data/admin-password.txt', '/assets/../../.env', '/assets/wechat-qr.png', '/missing']) {
    assert.equal((await request(path)).status, 404, path);
  }
});

test('supports HEAD and rejects writes to the price catalog', async () => {
  const head = await request('/', 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
  const response = await request('/catalog.json', 'POST');
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'GET, HEAD');
});

test('handles malformed request URLs without exposing server errors', async () => {
  assert.equal((await request('http://[')).status, 400);
});
