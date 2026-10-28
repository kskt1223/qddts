const $ = (selector) => document.querySelector(selector);
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const amount = (cents) => cents === null ? '请咨询' : String(Number((cents / 100).toFixed(2)));

const navigation = [...document.querySelectorAll('.header nav a[href^="#"]')].map((link) => ({
  link, section: document.getElementById(link.hash.slice(1)),
}));
let navigationFrame = 0, navigationTarget = null, navigationTimer;

function selectNavigation(section) {
  for (const item of navigation) {
    const active = item.section === section;
    item.link.classList.toggle('active', active);
    if (active) item.link.setAttribute('aria-current', 'location');
    else item.link.removeAttribute('aria-current');
  }
}

function syncNavigation() {
  navigationFrame = 0;
  const offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 110;
  const atBottom = window.scrollY > 0 && Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 2;
  if (navigationTarget) {
    const top = navigationTarget.getBoundingClientRect().top;
    if (Math.abs(top - offset) > 4 && !(atBottom && top > offset)) return;
    navigationTarget = null;
  }
  let current = navigation[0].section;
  for (const { section } of navigation) {
    if (section.getBoundingClientRect().top <= offset + 4) current = section;
  }
  selectNavigation(atBottom ? navigation.at(-1).section : current);
}

function scheduleNavigation() {
  if (!navigationFrame) navigationFrame = requestAnimationFrame(syncNavigation);
}

function followNavigation(section) {
  clearTimeout(navigationTimer);
  navigationTarget = section;
  selectNavigation(section);
  // Keep the clicked item selected while smooth scrolling passes other sections.
  navigationTimer = setTimeout(() => { navigationTarget = null; scheduleNavigation(); }, 1500);
}

function releaseNavigation() {
  clearTimeout(navigationTimer);
  navigationTarget = null;
  scheduleNavigation();
}

for (const { link, section } of navigation) link.addEventListener('click', (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  followNavigation(section);
});
window.addEventListener('hashchange', () => {
  const item = navigation.find(({ link }) => link.hash === window.location.hash);
  if (item) followNavigation(item.section);
  else releaseNavigation();
});
window.addEventListener('scroll', scheduleNavigation, { passive: true });
window.addEventListener('resize', scheduleNavigation);
window.addEventListener('wheel', releaseNavigation, { passive: true });
window.addEventListener('touchstart', releaseNavigation, { passive: true });
window.addEventListener('keydown', (event) => {
  if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) releaseNavigation();
});
const initialNavigation = navigation.find(({ link }) => link.hash === window.location.hash);
if (initialNavigation) followNavigation(initialNavigation.section);
else scheduleNavigation();

let products = [], category = '全部';
const contactFloat = $('.contact-float');
const contactToggle = $('#contact-toggle');
const contactCard = $('#contact-card');
const contactDialog = $('#contact-dialog');
const qrDialog = $('#wechat-qr-dialog');
const qrButton = $('#wechat-qr-button');

qrButton.addEventListener('click', () => {
  $('#wechat-qr-large').src = $('#wechat-qr').currentSrc || $('#wechat-qr').src;
  if (!qrDialog.open) qrDialog.showModal();
});
$('#qr-viewer-close').addEventListener('click', () => qrDialog.close());
qrDialog.addEventListener('click', (event) => {
  if (event.target !== qrDialog) return;
  const bounds = qrDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) qrDialog.close();
});

function openContact() {
  contactFloat.classList.add('is-open');
  contactToggle.setAttribute('aria-expanded', 'true');
  contactToggle.setAttribute('aria-label', '收起电话和微信联系方式');
  $('#float-phone').focus({ preventScroll: true });
}

function closeContact() {
  contactFloat.classList.remove('is-open');
  contactToggle.setAttribute('aria-expanded', 'false');
  contactToggle.setAttribute('aria-label', '展开电话和微信联系方式');
}

function openContactDialog() {
  if (contactDialog.open) return;
  closeContact();
  contactDialog.appendChild(contactCard);
  contactDialog.showModal();
}

contactDialog.addEventListener('close', () => contactFloat.appendChild(contactCard));
contactDialog.addEventListener('click', (event) => {
  if (event.target !== contactDialog) return;
  const bounds = contactDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) contactDialog.close();
});

contactToggle.addEventListener('click', () => contactFloat.classList.contains('is-open') ? closeContact() : openContact());
$('#contact-close').addEventListener('click', () => {
  if (contactDialog.open) contactDialog.close();
  else { closeContact(); contactToggle.focus(); }
});
document.querySelectorAll('.contact-trigger').forEach((button) => button.addEventListener('click', openContactDialog));
document.addEventListener('click', (event) => {
  if (!event.target.closest('.contact-float, .contact-trigger, #contact-dialog, #wechat-qr-dialog')) closeContact();
});
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !qrDialog.open && !contactDialog.open && contactFloat.classList.contains('is-open')) {
    closeContact();
    if (window.matchMedia('(max-width: 999px)').matches) contactToggle.focus();
  }
});

function renderProducts() {
  const visible = products.filter((product) => category === '全部' || product.category === category);
  $('#products-grid').innerHTML = visible.map((product) => `<article class="product-card">
    <div class="product-visual ${esc(product.color)}"><span class="product-tag">${esc(product.category)}</span><div class="product-jug"><img src="/assets/jug.svg" alt="${esc(product.name)}桶装水示意图" loading="lazy"><span class="jug-label"><strong>${esc(product.brand)}</strong><small>${esc(product.label)}</small></span></div><span class="visual-caption">包装示意</span></div>
    <div class="product-content"><h3>${esc(product.name)}</h3><p class="product-spec">${esc(product.spec || '桶装 · 容量以实物为准')}</p><p class="product-description">${esc(product.description)}</p><div class="product-bottom">
      ${product.price === null ? '<span class="price inquiry">价格请咨询门店</span>' : `<span class="price"><span class="currency">¥</span>${amount(product.price)}<small>/桶</small></span>`}
      <span class="product-service-note">${product.available ? '门店配送' : '供货请咨询'}</span>
    </div></div></article>`).join('') || '<div class="empty-state">暂时没有此类产品</div>';
  scheduleNavigation();
}

function renderSettings(settings) {
  for (const [id, phone] of [
    ['#footer-phone', settings.phone], ['#footer-alt-phone', settings.alternatePhone],
    ['#float-phone', settings.phone], ['#float-alt-phone', settings.alternatePhone],
  ]) {
    $(id).hidden = !phone;
    $(id).textContent = phone || '';
    $(id).href = `tel:${(phone || '').replace(/[^\d+]/g, '')}`;
  }
  $('.hero-phone').href = `tel:${settings.phone.replace(/[^\d+]/g, '')}`;
  $('.hero-phone span').innerHTML = `${esc(settings.phone)}<small>电话 / 微信，联系订水</small>`;
  $('#strip-area').textContent = settings.deliveryArea;
  $('#strip-hours').textContent = settings.businessHours;
  $('#float-hours').textContent = settings.businessHours;
  $('#strip-fee').textContent = settings.deliveryFee === 0 ? '免费配送上门' : `配送费${amount(settings.deliveryFee)}元`;
  $('#service-area').textContent = `${settings.deliveryArea}。${settings.deliveryFee === 0 ? '免费配送上门。' : `配送费${amount(settings.deliveryFee)}元。`}`;
  $('#service-deposit').textContent = `需要新桶时，每桶押金${amount(settings.deposit)}元。已有空桶，订水时请告知门店，确认是否可以换桶。`;
  $('#service-hours').textContent = `营业时间${settings.businessHours}。请通过电话或微信告知希望送达的时间，由门店确认配送安排。`;
  $('#deposit-price').textContent = amount(settings.deposit);
  $('#delivery-price').textContent = amount(settings.deliveryFee);
  const prices = products.filter((product) => product.price !== null).map((product) => product.price);
  $('#water-price-range').textContent = prices.length ? `${amount(Math.min(...prices))}–${amount(Math.max(...prices))}` : '请咨询';
  const example = products.find((product) => product.id === 'zhengyi');
  if (example && example.price !== null && settings.deposit !== null && settings.deliveryFee === 0) {
    $('#pricing-example').textContent = `例如：${example.name}${amount(example.price)}元 + 新桶押金${amount(settings.deposit)}元 = 首次一桶${amount(example.price + settings.deposit)}元；已有适用空桶换水为${amount(example.price)}元，配送免费。`;
  } else $('#pricing-example').textContent = '水费按产品单价和桶数计算；新桶押金、换桶与具体配送安排，请电话或微信联系门店确认。';
  if (typeof settings.wechatQr === 'string' && /^\/assets\/(?:wechat-qr\.(?:png|jpe?g|webp)|wechat_qrcode\.png)$/.test(settings.wechatQr)) {
    const qr = $('#wechat-qr');
    qr.addEventListener('error', () => {
      qr.src = '/assets/wechat-placeholder.svg';
      qr.alt = '微信二维码预留位置，待添加';
      qrButton.disabled = true;
      qrButton.setAttribute('aria-label', '二维码暂未加载，请电话联系门店');
      $('#wechat-note').textContent = '二维码暂未提供，请先电话联系订水';
    }, { once: true });
    qr.src = settings.wechatQr;
    qr.alt = '欣正义供水站微信订水二维码';
    qrButton.disabled = false;
    qrButton.setAttribute('aria-label', '查看欣正义供水站微信二维码大图');
    $('#wechat-note').textContent = '微信扫一扫，联系门店订水；点击二维码可查看大图';
  }
}

$('#filters').addEventListener('click', (event) => {
  const button = event.target.closest('[data-category]');
  if (!button) return;
  category = button.dataset.category;
  for (const item of $('#filters').children) {
    item.classList.toggle('active', item === button);
    item.setAttribute('aria-pressed', String(item === button));
  }
  renderProducts();
});

async function loadCatalog() {
  try {
    const response = await fetch('/catalog.json');
    if (!response.ok) throw new Error('价格信息未能加载');
    const catalog = await response.json();
    products = catalog.products;
    renderSettings(catalog.settings);
    renderProducts();
  } catch {
    $('#products-grid').innerHTML = '<div class="empty-state"><h3>产品价格暂时未能加载</h3><p>可以先拨打15588692891或19963998585咨询价格。</p><button class="button button-small" id="reload-catalog">重新加载</button></div>';
    $('#reload-catalog').addEventListener('click', loadCatalog);
  }
}
$('#year').textContent = new Date().getFullYear();
loadCatalog();
