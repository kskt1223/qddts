# 欣正义供水站

桶装水产品与价格展示网站。客户查看水价、押金和配送说明，通过电话或微信联系门店订水。页面不提供购物车、订水表单、订单记录或管理后台。

## 本地预览

使用 Node.js 22.13 或以上版本。先安装依赖，再启动本地预览：

```sh
npm ci
npm run dev
```

该命令先生成静态页面，再启动预览服务。访问 <http://localhost:4173>。可复制 `.env.example` 为 `.env`，调整 `PORT` 和 `HOST`。

## 维护价格与门店信息

编辑 `public/catalog.json` 后，执行 `npm run build` 并刷新页面：

- `products`：产品名称、分类、价格和容量说明。`price` 单位为分，例如2200表示22元；`null` 表示价格请咨询。
- `settings.phone`、`alternatePhone`：两个订水电话。
- `settings.businessHours`、`deliveryArea`：营业时间与配送说明。
- `settings.deposit`、`deliveryFee`：新桶押金与配送费，单位为分。

目前展示力之泉矿泉水22元、力之泉山泉水17元、刺猬优选17元、淳蓝山泉15元、正义水13元；崂山微矿水为咨询类商品。新桶押金50元/桶，市南、市北、崂山、李沧四区免费配送，营业时间9:00–18:00。

构建会同步更新产品卡片、价格区间、费用示例、配送说明和联系方式；产品与价格已直接写入 HTML，无需浏览器执行 JavaScript 或加载 JSON 才能查看。筛选、导航和联系弹窗由 JavaScript 增强。页面结构和固定文案在 `src/index.template.html` 中维护，不要直接编辑生成的 `public/index.html`。

## 维护微信二维码

已接入门店提供的原始二维码 `public/assets/wechat_qrcode.png`，点击悬浮框中的图片会在当前页面居中放大。支持关闭按钮、点击遮罩和 Escape 关闭，图片按屏幕大小等比例展示。

替换时可直接更新该图片，保留文件名。也支持将新图片保存为 `public/assets/wechat-qr.png`（或 `.jpg`、`.jpeg`、`.webp`），并同步修改 `public/catalog.json` 的 `settings.wechatQr` 路径，再执行 `npm run build`。图片缺失时会显示占位提示，电话仍可使用。

桌面端右侧常驻电话与二维码悬浮框；手机端通过右下角“联系门店”按钮展开。页头“联系门店”和正文“联系供水站”按钮会居中弹出完整联系方式，支持关闭按钮、点击遮罩和 Escape 关闭；窗口内仍可点击二维码放大。产品图片仍是标注清楚的示意图。

## 检查

```sh
npm run build
npm test
npm run test:coverage
npm run check
npm run build:check
```

使用 `node:test` 验证静态产品价格、配置更新后的费用计算、HTML 转义、百度验证标签、标准网址、网站地图，以及原有的只读服务和文件隔离。覆盖率要求核心服务和页面生成代码的行、分支和函数至少80%；不包含浏览器脚本与启动入口。`check` 验证 JavaScript 语法，`build:check` 检查已生成文件与当前模板、价格配置是否一致。

## 目录与部署

```text
public/     页面、价格配置、样式、脚本和图片
src/        页面模板、静态生成逻辑和本地预览服务
scripts/    静态页面构建命令
tests/      静态内容、页面生成和只读服务验证
```

执行 `npm ci`、`npm run build` 后，将 `public/` 的内容部署到网站根目录，并配置 HTTPS。运行时只需要静态托管；也可使用 `npm start` 本地预览。提交代码时应同时提交生成文件（含 `public/vendor/`），便于直接复制 `public/` 部署。

Vercel 已通过根目录的 `vercel.json` 配置：框架为 Other（`framework: null`）、构建命令为 `npm run build`、输出目录为 `public`。项目根目录保持仓库根目录。以前的“构建命令留空”设置由仓库配置覆盖，部署日志应显示执行了生成步骤。提交到 Vercel 关联的 GitHub 生产分支后会自动部署。

页面不依赖数据库、不生成管理密码、不收集客户订水信息。旧版 `.data/` 不再读取，也不会通过网页提供下载；`AGENTS.md` 保留原样。

## 访问速度监测

已安装 `@vercel/speed-insights`，按照原生 JavaScript 方式调用 `injectSpeedInsights()`，采集真实访问的页面性能指标。首页异步加载独立模块 `public/speed-insights.js`，联系方式、产品筛选等交互使用原有的 `app.js`。

- 修改初始化逻辑时编辑 `src/speed-insights.mjs`，再执行 `npm run build`。构建会复制官方 SDK、源码映射及许可证到 `public/vendor/speed-insights/`，并带入 Vercel 提供的公开客户端配置 `VERCEL_OBSERVABILITY_CLIENT_CONFIG`。
- 默认采集脚本为同源的 `/_vercel/speed-insights/script.js`；Vercel 提供自定义采集路径时，SDK 会使用相应配置。`localhost`、`127.0.0.1` 和 `[::1]` 的本地预览不加载采集脚本。
- 发布到 Vercel 后，在项目的 **Speed Insights** 中确认已启用，打开网站并产生真实访问，再查看面板数据。尚无数据时，检查浏览器是否拦截采集脚本、脚本与数据请求是否成功，并留出数据汇总时间。
- 性能采集接口由 Vercel 提供，普通 Nginx 静态部署不提供这些接口。安装和构建参考 [Vercel 官方指南](https://vercel.com/docs/speed-insights/quickstart)。

测试覆盖生产环境的 SDK 初始化、重复加载保护、本地预览禁用、Vercel 动态采集路径，以及发布文件与安装包的一致性。

## 百度搜索配置

- 标准网址为 `https://www.qddts.cn/`，构建时同时生成首页 canonical、`public/robots.txt` 和 `public/sitemap.xml`。目前只有一个独立页面，网站地图只列出首页，不列出锚点、图片或 JSON。
- 百度 HTML 验证标签保留在 `src/index.template.html` 的 `<head>` 中，构建时会带入首页。后续修改验证码也应修改模板。
- 发布后，登录百度搜索资源平台完成站点验证，并通过账号可用的入口提交首页和 `https://www.qddts.cn/sitemap.xml`。使用平台查看抓取异常、索引量、展现和点击；提交不保证收录或排名。
- 百度地图认领、真实门店地址、产品实拍与门店照片需要店主提供或操作。当前页面保留示意图说明，不发布未确认的地址、规格或送达承诺。
