import 'dotenv/config';
import logger from './utils/logger.js';
import express from 'express';
import path from 'path';
import { pinoHttp } from 'pino-http';
import { Worker } from './classes/worker.js';
import cron from 'node-cron';

logger.info(
  'Starting RealTime Trader application! Enjoy making money... or losing it!'
);

const app = express();

app.use(pinoHttp({ logger }));

app.use(express.static('public'));
// app.use('chart_data', express.static(path.join('public', 'chart_data ')));

app.get('/healthz', (req, res) => {
  res.send('OK');
});

const server = app.listen(3000, () => {
  logger.info('Server is running on port 3000');
});

const worker = new Worker(logger);
// worker.startTrading().then(() => {
//   setTimeout(() => {
//     worker.stopTrading();
//   }, 15 * 60 * 1000);
// });

// cron.schedule(
//   '20 13 * * Sunday',
//   () => {
//     worker.startTrading();
//   },
//   {
//     scheduled: true,
//     timezone: 'America/New_York',
//   }
// );

// cron.schedule(
//   '40 13 * * Sunday',
//   () => {
//     worker.stopTrading();
//   },
//   {
//     scheduled: true,
//     timezone: 'America/New_York',
//   }
// );
cron.schedule(
  '30 09 * * Monday-Friday',
  () => {
    worker.startTrading();
  },
  {
    scheduled: true,
    timezone: 'America/New_York',
  }
);

cron.schedule(
  '00 16 * * Monday-Friday',
  () => {
    worker.stopTrading();
  },
  {
    scheduled: true,
    timezone: 'America/New_York',
  }
);

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, closing down application');
  server.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT, closing down application');
  server.close();
  process.exit(0);
});
