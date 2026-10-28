import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const catalog = JSON.parse(await readFile(new URL('../public/catalog.json', import.meta.url)));
const template = () => readFile(new URL('../src/index.template.html', import.meta.url), 'utf8');

test('a catalog change updates static cards, price ranges, deposit examples and contact details together', async () => {
  const { renderSite } = await import('../src/site.mjs');
  const updated = structuredClone(catalog);
  updated.products.find((product) => product.id === 'zhengyi').price = 1400;
  updated.settings.deposit = 6000;
  updated.settings.phone = '15500000000';
  updated.settings.alternatePhone = '';
  updated.settings.businessHours = '10:00–19:00';
  updated.settings.deliveryFee = 300;
  const { html } = renderSite(await template(), updated);
  assert.match(html, />14<small>\/桶/);
  assert.match(html, /id="water-price-range">14–22</);
  assert.match(html, /正义水14元 \+ 新桶押金60元 \+ 配送费3元 = 首次一桶77元/);
  assert.match(html, /已有适用空桶换水为17元/);
  assert.match(html, /href="tel:15500000000"/);
  assert.doesNotMatch(html, /15588692891|19963998585|9:00–18:00|免费配送/);
  assert.match(html, /10:00–19:00/);
});

test('catalog text is escaped while inquiry products keep their consultation price', async () => {
  const { renderSite } = await import('../src/site.mjs');
  const updated = structuredClone(catalog);
  updated.settings.name = '门店 <script>alert(1)</script>';
  updated.products[0].name = '水 <img src=x onerror=alert(1)>';
  updated.products[0].category = '矿泉水" onclick="alert(1)';
  const { html } = renderSite(await template(), updated);
  assert.ok(html.includes('门店 &lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(html.includes('水 &lt;img src=x onerror=alert(1)&gt;'));
  assert.doesNotMatch(html, /<script>alert|<img src=x/);
  assert.ok(html.includes('data-category="矿泉水&quot; onclick=&quot;alert(1)"'));
  assert.match(html, /价格请咨询门店/);
});

test('empty or inquiry-only catalogs and unavailable products remain readable', async () => {
  const { renderSite } = await import('../src/site.mjs');
  const updated = structuredClone(catalog);
  updated.products = [{ ...catalog.products.at(-1), available: false }];
  updated.settings.wechatQr = '/not-an-allowed-image.png';
  let { html } = renderSite(await template(), updated);
  assert.match(html, /id="water-price-range">请咨询</);
  assert.match(html, /供货请咨询/);
  assert.match(html, /src="\/assets\/wechat-placeholder.svg"/);
  assert.doesNotMatch(html, /NaN|Infinity/);
  updated.products = [];
  ({ html } = renderSite(await template(), updated));
  assert.match(html, /暂无产品信息，请电话或微信咨询门店/);
});

test('invalid prices and incomplete templates stop a build instead of publishing incorrect information', async () => {
  const { renderSite } = await import('../src/site.mjs');
  const updated = structuredClone(catalog);
  updated.products[0].price = -100;
  assert.throws(() => renderSite('test', updated), /价格/);
  updated.products[0].price = 100.5;
  assert.throws(() => renderSite('test', updated), /价格/);
  assert.throws(() => renderSite('{{unknownValue}}', catalog), /unknownValue/);
});

test('checked-in static output matches the current catalog and template', async () => {
  const { renderSite } = await import('../src/site.mjs');
  const output = renderSite(await template(), catalog);
  for (const [file, key] of [['index.html', 'html'], ['robots.txt', 'robots'], ['sitemap.xml', 'sitemap']]) {
    assert.equal(await readFile(new URL(`../public/${file}`, import.meta.url), 'utf8'), output[key], `${file} needs rebuilding`);
  }
});
