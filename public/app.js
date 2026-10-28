const $ = (selector) => document.querySelector(selector);

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

const contactFloat = $('.contact-float');
const contactToggle = $('#contact-toggle');
const contactCard = $('#contact-card');
const contactDialog = $('#contact-dialog');
const qrDialog = $('#wechat-qr-dialog');
const qrButton = $('#wechat-qr-button');
const qr = $('#wechat-qr');

function showQrFallback() {
  qr.src = '/assets/wechat-placeholder.svg';
  qr.alt = '微信二维码预留位置，待添加';
  qrButton.disabled = true;
  qrButton.setAttribute('aria-label', '二维码暂未加载，请电话联系门店');
  $('#wechat-note').textContent = '二维码暂未提供，请先电话联系订水';
}

qr.addEventListener('error', showQrFallback, { once: true });
if (qr.complete && qr.naturalWidth === 0) showQrFallback();

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

const filters = $('#filters');
const productCards = [...document.querySelectorAll('#products-grid .product-card')];
filters.addEventListener('click', (event) => {
  const button = event.target.closest('[data-category]');
  if (!button) return;
  for (const item of filters.children) {
    item.classList.toggle('active', item === button);
    item.setAttribute('aria-pressed', String(item === button));
  }
  for (const card of productCards) {
    card.hidden = button.dataset.category !== '全部' && card.dataset.category !== button.dataset.category;
  }
  scheduleNavigation();
});
filters.hidden = productCards.length === 0;
$('#year').textContent = new Date().getFullYear();
