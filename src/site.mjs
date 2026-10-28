const siteUrl = 'https://www.qddts.cn/';
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);
const amount = (cents) => String(Number((cents / 100).toFixed(2)));

function checkMoney(value, label, allowInquiry = false) {
  if (allowInquiry && value === null) return;
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${label}必须是非负整数，单位为分`);
}

function renderProduct(product) {
  return `<article class="product-card" data-product-id="${escapeHtml(product.id)}" data-category="${escapeHtml(product.category)}">
    <div class="product-visual ${escapeHtml(product.color)}"><span class="product-tag">${escapeHtml(product.category)}</span><div class="product-jug"><img src="/assets/jug.svg" alt="${escapeHtml(product.name)}桶装水示意图" loading="lazy"><span class="jug-label"><strong>${escapeHtml(product.brand)}</strong><small>${escapeHtml(product.label)}</small></span></div><span class="visual-caption">包装示意</span></div>
    <div class="product-content"><h3>${escapeHtml(product.name)}</h3><p class="product-spec">${escapeHtml(product.spec || '桶装 · 容量以实物为准')}</p><p class="product-description">${escapeHtml(product.description)}</p><div class="product-bottom">
      ${product.price === null ? '<span class="price inquiry">价格请咨询门店</span>' : `<span class="price"><span class="currency">¥</span>${amount(product.price)}<small>/桶</small></span>`}
      <span class="product-service-note">${product.available ? '门店配送' : '供货请咨询'}</span>
    </div></div></article>`;
}

export function renderSite(template, { products, settings }) {
  for (const product of products) checkMoney(product.price, `${product.name}价格`, true);
  checkMoney(settings.deposit, '押金');
  checkMoney(settings.deliveryFee, '配送费');
  const prices = products.filter((product) => product.price !== null).map((product) => product.price);
  const priceRange = prices.length ? `${amount(Math.min(...prices))}–${amount(Math.max(...prices))}` : '请咨询';
  const deliveryLabel = settings.deliveryFee === 0 ? '免费配送上门' : `配送费${amount(settings.deliveryFee)}元`;
  const deliveryShort = settings.deliveryFee === 0 ? '免费配送' : deliveryLabel;
  const brands = [...new Set(products.map((product) => product.brand))].join('、');
  const phone = String(settings.phone);
  const alternatePhone = String(settings.alternatePhone || '');
  const phoneHref = (number) => `tel:${number.replace(/[^\d+]/g, '')}`;
  const qrAvailable = /^\/assets\/(?:wechat-qr\.(?:png|jpe?g|webp)|wechat_qrcode\.png)$/.test(settings.wechatQr);
  const qrPath = qrAvailable ? settings.wechatQr : '/assets/wechat-placeholder.svg';
  const qrNote = qrAvailable ? '微信扫一扫，联系门店订水；点击二维码可查看大图' : '二维码暂未提供，请先电话联系订水';
  const example = products.find((product) => product.id === 'zhengyi' && product.price !== null)
    || products.find((product) => product.price !== null);
  const pricingExample = example
    ? `例如：${example.name}${amount(example.price)}元 + 新桶押金${amount(settings.deposit)}元${settings.deliveryFee ? ` + 配送费${amount(settings.deliveryFee)}元` : ''} = 首次一桶${amount(example.price + settings.deposit + settings.deliveryFee)}元；已有适用空桶换水为${amount(example.price + settings.deliveryFee)}元${settings.deliveryFee === 0 ? '，配送免费' : '（含配送费）'}。`
    : '水费按产品单价和桶数计算；新桶押金、换桶与具体配送安排，请电话或微信联系门店确认。';
  const description = `${settings.name}提供${brands ? `${brands}等` : ''}桶装水，${prices.length ? `水价${priceRange}元/桶，` : ''}${settings.city}${settings.deliveryArea}${deliveryShort}。营业时间${settings.businessHours}，新桶押金${amount(settings.deposit)}元/桶，电话${phone}，微信联系订水。`;
  const text = {
    siteUrl,
    title: `${settings.city}桶装水价格与送水服务－${settings.name}`,
    description,
    shopName: settings.name,
    city: settings.city,
    phone,
    phoneHref: phoneHref(phone),
    alternatePhone,
    alternatePhoneHref: phoneHref(alternatePhone),
    businessHours: settings.businessHours,
    deliveryArea: settings.deliveryArea,
    districtNames: settings.deliveryDistricts.join(' / '),
    deliveryLabel,
    deliveryShort,
    priceRange,
    deposit: amount(settings.deposit),
    deliveryFee: amount(settings.deliveryFee),
    pricingExample,
    serviceArea: `${settings.city}${settings.deliveryArea}。${deliveryLabel}。`,
    qrPath,
    qrNote,
    qrAlt: qrAvailable ? `${settings.name}微信订水二维码` : '微信二维码预留位置，待添加',
    year: new Date().getFullYear(),
  };
  const values = Object.fromEntries(Object.entries(text).map(([key, value]) => [key, escapeHtml(value)]));
  const categories = ['全部', ...new Set(products.map((product) => product.category))];
  values.filterButtons = categories.map((category, index) => `<button class="filter${index === 0 ? ' active' : ''}" data-category="${escapeHtml(category)}" aria-pressed="${index === 0}">${escapeHtml(index === 0 ? '全部好水' : category)}</button>`).join('');
  values.productCards = products.map(renderProduct).join('\n') || '<p class="empty-state">暂无产品信息，请电话或微信咨询门店。</p>';
  values.alternatePhoneHidden = alternatePhone ? '' : 'hidden';
  values.qrDisabled = qrAvailable ? '' : 'disabled';
  const html = template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!Object.hasOwn(values, key)) throw new Error(`缺少模板数据：${key}`);
    return values[key];
  });
  return {
    html,
    robots: `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}sitemap.xml\n`,
    sitemap: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${siteUrl}</loc></url>\n</urlset>\n`,
  };
}
