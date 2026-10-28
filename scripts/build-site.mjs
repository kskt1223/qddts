import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { renderSite } from '../src/site.mjs';

const sdkUrl = new URL(import.meta.resolve('@vercel/speed-insights'));
const [template, catalog, client, sdk, sourceMap, license] = await Promise.all([
  readFile(new URL('../src/index.template.html', import.meta.url), 'utf8'),
  readFile(new URL('../public/catalog.json', import.meta.url), 'utf8'),
  readFile(new URL('../src/speed-insights.mjs', import.meta.url), 'utf8'),
  readFile(sdkUrl, 'utf8'),
  readFile(new URL('./index.mjs.map', sdkUrl), 'utf8'),
  readFile(new URL('../LICENSE', sdkUrl), 'utf8'),
]);
const output = renderSite(template, JSON.parse(catalog));
const files = {
  'index.html': output.html,
  'robots.txt': output.robots,
  'sitemap.xml': output.sitemap,
  'speed-insights.js': client.replace('__VERCEL_SPEED_INSIGHTS_CONFIG__', JSON.stringify(process.env.VERCEL_OBSERVABILITY_CLIENT_CONFIG || '')),
  'vendor/speed-insights/index.mjs': sdk,
  'vendor/speed-insights/index.mjs.map': sourceMap,
  'vendor/speed-insights/LICENSE': license,
};
for (const [file, contents] of Object.entries(files)) {
  const path = new URL(`../public/${file}`, import.meta.url);
  if (process.argv.includes('--check')) {
    if (await readFile(path, 'utf8') !== contents) throw new Error(`${file} 尚未更新，请执行 npm run build`);
  } else {
    await mkdir(new URL('.', path), { recursive: true });
    await writeFile(path, contents);
  }
}
console.log(process.argv.includes('--check') ? '静态页面、价格配置和 Speed Insights 资源一致。' : '已生成静态页面与 Speed Insights 资源。');
