import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { renderSite } from '../src/site.mjs';

const speedInsightsUrl = new URL(import.meta.resolve('@vercel/speed-insights'));
const webAnalyticsUrl = new URL(import.meta.resolve('@vercel/analytics'));
const [template, catalog, speedInsightsClient, speedInsightsSdk, speedInsightsSourceMap, speedInsightsLicense, webAnalyticsClient, webAnalyticsSdk, webAnalyticsSourceMap, webAnalyticsLicense] = await Promise.all([
  readFile(new URL('../src/index.template.html', import.meta.url), 'utf8'),
  readFile(new URL('../public/catalog.json', import.meta.url), 'utf8'),
  readFile(new URL('../src/speed-insights.mjs', import.meta.url), 'utf8'),
  readFile(speedInsightsUrl, 'utf8'),
  readFile(new URL('./index.mjs.map', speedInsightsUrl), 'utf8'),
  readFile(new URL('../LICENSE', speedInsightsUrl), 'utf8'),
  readFile(new URL('../src/web-analytics.mjs', import.meta.url), 'utf8'),
  readFile(webAnalyticsUrl, 'utf8'),
  readFile(new URL('./index.mjs.map', webAnalyticsUrl), 'utf8'),
  readFile(new URL('../LICENSE', webAnalyticsUrl), 'utf8'),
]);
const output = renderSite(template, JSON.parse(catalog));
const files = {
  'index.html': output.html,
  'robots.txt': output.robots,
  'sitemap.xml': output.sitemap,
  'speed-insights.js': speedInsightsClient.replace('__VERCEL_SPEED_INSIGHTS_CONFIG__', JSON.stringify(process.env.VERCEL_OBSERVABILITY_CLIENT_CONFIG || '')),
  'vendor/speed-insights/index.mjs': speedInsightsSdk,
  'vendor/speed-insights/index.mjs.map': speedInsightsSourceMap,
  'vendor/speed-insights/LICENSE': speedInsightsLicense,
  'web-analytics.js': webAnalyticsClient.replace('__VERCEL_WEB_ANALYTICS_CONFIG__', JSON.stringify(process.env.VERCEL_WEB_ANALYTICS_CONFIG || '')),
  'vendor/web-analytics/index.mjs': webAnalyticsSdk,
  'vendor/web-analytics/index.mjs.map': webAnalyticsSourceMap,
  'vendor/web-analytics/LICENSE': webAnalyticsLicense,
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
console.log(process.argv.includes('--check') ? '静态页面、价格配置、Speed Insights 和 Web Analytics 资源一致。' : '已生成静态页面、Speed Insights 和 Web Analytics 资源。');
