// import 'dotenv/config';
// import logger from './utils/logger.js';
// import { Trader } from './classes/trader.js';
// import { AlpacaAPI } from './classes/alpaca.js';
// import { TiingoAPI } from './classes/tiingo.js';
// import { getBollingerSignals } from './signal_algos/index.js';

// const ALPACA_API_KEY = process.env.ALPACA_API_KEY || '';
// const ALPACA_API_SECRET = process.env.ALPACA_API_SECRET || '';
// const TIINGO_API_KEY = process.env.TIINGO_API_KEY || '';

// const alpaca = new AlpacaAPI(logger, ALPACA_API_KEY, ALPACA_API_SECRET);

import { PrismaClient } from '@prisma/client';
import { Database } from './classes/database.js';
import logger from './utils/logger.js';
import { PlaceOrderRequest } from './schemas/index.js';

const prisma = new PrismaClient();

const database = new Database(logger, prisma);

const testOrder: PlaceOrderRequest = {
  symbol: 'MSFT',
  qty: '100',
  side: 'buy',
  type: 'market',
  time_in_force: 'gtc',
  order_class: 'bracket',
  take_profit: {
    limit_price: '200',
  },
  stop_loss: {
    stop_price: '180',
    stop_limit_price: '180',
  },
};

database.readSymbol('MSFT').then((order) => {
  console.log(order);
  prisma.$disconnect();
});

// const main = async () => {
//   const post = await prisma.post.update({
//     where: { id: 1 },
//     data: { published: true },
//   });
//   console.log(post);
//   await prisma.user.create({
//     data: {
//       name: 'Alice',
//       email: 'alice@prisma.io',
//       posts: {
//         create: { title: 'Hello World' },
//       },
//       profile: {
//         create: { bio: 'I like turtles' },
//       },
//     },
//   });

//   const allUsers = await prisma.user.findMany({
//     include: {
//       posts: true,
//       profile: true,
//     },
//   });
//   console.dir(allUsers, { depth: null });
// };

// main()
//   .catch((e) => {
//     throw e;
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
