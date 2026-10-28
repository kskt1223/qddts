import { injectSpeedInsights } from '/vendor/speed-insights/index.mjs';

if (!['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)) {
  injectSpeedInsights({ framework: 'html' }, __VERCEL_SPEED_INSIGHTS_CONFIG__);
}
