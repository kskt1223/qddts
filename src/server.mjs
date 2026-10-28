import { createApp } from './app.mjs';

const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '127.0.0.1';
const server = createApp();
server.listen(port, host, () => console.log(`欣正义供水站：http://localhost:${port}`));
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.close(() => process.exit(0)));
