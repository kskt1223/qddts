import { readFile, writeFile } from 'node:fs/promises';
import { renderSite } from '../src/site.mjs';

const [template, catalog] = await Promise.all([
  readFile(new URL('../src/index.template.html', import.meta.url), 'utf8'),
  readFile(new URL('../public/catalog.json', import.meta.url), 'utf8'),
]);
const output = renderSite(template, JSON.parse(catalog));
for (const [file, key] of [['index.html', 'html'], ['robots.txt', 'robots'], ['sitemap.xml', 'sitemap']]) {
  const path = new URL(`../public/${file}`, import.meta.url);
  if (process.argv.includes('--check')) {
    if (await readFile(path, 'utf8') !== output[key]) throw new Error(`${file} 尚未更新，请执行 npm run build`);
  } else {
    await writeFile(path, output[key]);
  }
}
console.log(process.argv.includes('--check') ? '静态页面与价格配置一致。' : '已生成首页、robots.txt 和 sitemap.xml。');
