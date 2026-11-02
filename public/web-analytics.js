import { inject } from '/vendor/web-analytics/index.mjs';

if (!['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)) {
  inject({ framework: 'html' }, "");
}
