import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createContext, runInContext } from 'node:vm';

async function startClient(hostname = 'www.qddts.cn', configuration = '') {
  const scripts = [];
  const context = createContext({
    window: { location: { hostname } },
    document: {
      head: {
        querySelector(selector) {
          const src = selector.match(/src\*="(.*?)"/)[1];
          return scripts.find((script) => script.src.includes(src));
        },
        appendChild(script) { scripts.push(script); },
      },
      createElement() { return { dataset: {} }; },
    },
  });
  const sdk = await readFile(new URL('../public/vendor/speed-insights/index.mjs', import.meta.url), 'utf8');
  // Exercise the shipped SDK in a browser-like context with no Node.js globals.
  runInContext(sdk.replace(/^export \{[\s\S]*?\};/m, ''), context);
  const sourceUrl = new URL('../src/speed-insights.mjs', import.meta.url);
  const source = await readFile(sourceUrl, 'utf8');
  runInContext(source.replace(/^import .*$/m, '').replace('__VERCEL_SPEED_INSIGHTS_CONFIG__', JSON.stringify(configuration)), context, { filename: sourceUrl.href });
  return { scripts, context };
}

test('production initializes the official SDK once and requests same-origin performance collection', async () => {
  const { scripts, context } = await startClient();
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].src, '/_vercel/speed-insights/script.js');
  assert.equal(scripts[0].defer, true);
  assert.equal(scripts[0].dataset.sdkn, '@vercel/speed-insights/html');
  assert.equal(typeof context.window.si, 'function');
  context.injectSpeedInsights({ framework: 'html' });
  assert.equal(scripts.length, 1, 'the SDK must avoid duplicate collection scripts');
});

test('local previews do not load Vercel collection endpoints', async () => {
  for (const hostname of ['localhost', '127.0.0.1', '[::1]']) {
    const { scripts, context } = await startClient(hostname);
    assert.equal(scripts.length, 0, hostname);
    assert.equal(context.window.si, undefined, hostname);
  }
});

test('Vercel deployment configuration is forwarded to the SDK', async () => {
  const { scripts } = await startClient('preview.vercel.app', JSON.stringify({
    speedInsights: { scriptSrc: '/custom-observability/script.js', endpoint: '/custom-observability/vitals' },
  }));
  assert.equal(scripts[0].src, '/custom-observability/script.js');
  assert.equal(scripts[0].dataset.endpoint, '/custom-observability/vitals');
  const fallback = await startClient('www.qddts.cn', 'invalid configuration');
  assert.equal(fallback.scripts[0].src, '/_vercel/speed-insights/script.js');
});

test('static deployment includes the exact installed SDK, source map, license, and current bootstrap', async () => {
  const files = ['index.mjs', 'index.mjs.map', 'LICENSE'];
  for (const file of files) {
    const original = file === 'LICENSE' ? file : `dist/${file}`;
    assert.deepEqual(
      await readFile(new URL(`../public/vendor/speed-insights/${file}`, import.meta.url)),
      await readFile(new URL(`../node_modules/@vercel/speed-insights/${original}`, import.meta.url)),
      file,
    );
  }
  const source = await readFile(new URL('../src/speed-insights.mjs', import.meta.url), 'utf8');
  assert.equal(
    await readFile(new URL('../public/speed-insights.js', import.meta.url), 'utf8'),
    source.replace('__VERCEL_SPEED_INSIGHTS_CONFIG__', JSON.stringify(process.env.VERCEL_OBSERVABILITY_CLIENT_CONFIG || '')),
  );
});
