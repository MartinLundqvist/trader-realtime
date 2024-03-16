import { Logger } from 'pino';
import { AlpacaAPI } from './alpaca.js';
import { writeFile } from 'fs/promises';
import { Trader } from './trader.js';
import { TiingoAPI } from './tiingo.js';
import { getBollingerSignals } from '../signal_algos/index.js';
import { PrismaClient } from '@prisma/client';
import { Database } from './database.js';

const ALPACA_API_KEY = process.env.ALPACA_API_KEY || '';
const ALPACA_API_SECRET = process.env.ALPACA_API_SECRET || '';
const TIINGO_API_KEY = process.env.TIINGO_API_KEY || '';

export class Worker {
  private logger: Logger;
  private alpaca: AlpacaAPI;
  private tiingo: TiingoAPI;
  private stocks: string[] = [];
  private traders: Trader[] = [];
  private database: Database;

  constructor(logger: Logger, prisma: PrismaClient) {
    this.logger = logger;
    this.logger.info('Initializing Worker...');
    this.alpaca = new AlpacaAPI(logger, ALPACA_API_KEY, ALPACA_API_SECRET);
    this.tiingo = new TiingoAPI(logger, TIINGO_API_KEY);
    this.database = new Database(logger, prisma);
  }

  public async startTrading() {
    this.logger.info('Starting worker...');
    this.stocks = await this.alpaca.getMostActiveStocks();
    const fileNames = this.stocks.map((s) => 'marketdata_' + s + '.json');
    try {
      await writeFile('public/chart_data/filelist.txt', fileNames.join('\n'));
    } catch (error) {
      this.logger.error(`Error writing file list: ${JSON.stringify(error)}`);
    }

    try {
      for (let stock of this.stocks) {
        const trader = new Trader(
          this.logger,
          this.alpaca,
          this.tiingo,
          this.database,
          stock,
          getBollingerSignals,
          0.1
        );
        this.traders.push(trader);
        trader.run();
      }
    } catch (error) {
      this.logger.error(`Error creating trader: ${JSON.stringify(error)}`);
    }
  }

  public stopTrading() {
    this.logger.info('Stopping worker...');
    for (let trader of this.traders) {
      trader.stop();
    }
    this.traders = [];
    this.stocks = [];
  }
}
