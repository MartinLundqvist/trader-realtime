import { Logger } from 'pino';
import { AlpacaAPI } from './alpaca.js';
import { TiingoAPI } from './tiingo.js';
import {
  PlaceOrderRequest,
  PositionResponse,
  TiingoBarsResponse,
} from '../schemas/index.js';
import { writeFile } from 'fs/promises';

type TiingoBarResponse = TiingoBarsResponse[number];
export interface Signal extends TiingoBarResponse {
  signal: 'buy' | 'sell' | 'hold';
  sl: number | undefined;
  tp: number | undefined;
}

export class Trader {
  private logger: Logger;
  private alpacaAPI: AlpacaAPI;
  private tiingoAPI: any;
  private symbol: string;
  private getSignalsFn: (bars: TiingoBarsResponse) => Signal[];
  private size: number;
  private position: PositionResponse | undefined;
  private updateInterval: NodeJS.Timeout | undefined;

  constructor(
    logger: Logger,
    alpacaAPI: AlpacaAPI,
    tiingoAPI: TiingoAPI,
    symbol: string,
    getSignalsFn: (bars: TiingoBarsResponse) => Signal[],
    size: number
  ) {
    this.logger = logger.child({ trader: symbol });
    this.alpacaAPI = alpacaAPI;
    this.tiingoAPI = tiingoAPI;
    this.symbol = symbol;
    this.getSignalsFn = getSignalsFn;
    this.size = size;
    this.position = undefined;
    this.logger.info('Initializing Trader...');
  }

  public async run() {
    this.logger.info('Starting trading...');
    const updateWrapper = async () => {
      await this.update();
      this.updateInterval = setTimeout(updateWrapper, 1000 * 60 * 5);
    };
    updateWrapper();
  }

  public stop() {
    this.logger.info('Stopping trading...');
    if (this.updateInterval) clearTimeout(this.updateInterval);
  }

  public async update() {
    const open = await this.alpacaAPI.isMarketOpen();
    // TODO: DEBUG ONLY!
    // const open = true;
    if (!open) {
      this.logger.info('Market is closed, skipping update');
      return;
    }
    this.logger.info('Market is open, running update');
    const yesterdayString = this.getPreviousTradingDay(
      new Date()
    ).toISOString();
    const todayString = new Date().toISOString();

    const bars = await this.tiingoAPI.getBars(
      this.symbol,
      yesterdayString,
      todayString,
      '5min'
    );

    const signals = this.getSignalsFn(bars);

    if (signals.length === 0) {
      this.logger.info('No signals found, skipping update');
      return;
    }

    this.logger.info(`Found ${signals.length} signals, writing to file...`);

    try {
      await writeFile(
        'public/chart_data/marketdata_' + this.symbol + '.json',
        JSON.stringify(signals)
      );
    } catch (error) {
      this.logger.error(`Error writing file: ${JSON.stringify(error)}`);
    }

    const signal = signals[signals.length - 1];

    if (signal.signal !== 'hold') {
      this.position = await this.alpacaAPI.fetchPosition(this.symbol);

      if (this.position) await this.managePosition(signal);
      if (!this.position) await this.enterPosition(signal);
    }
  }

  private async managePosition(signal: Signal) {
    if (this.position?.qty_available === '0') {
      this.logger.info(
        'Position has zero available quantity to manage, skipping...'
      );
      return;
    }

    if (signal.signal === 'buy' && this.position?.side === 'short') {
      this.logger.info('Closing short position...');
      await this.alpacaAPI.closePosition(this.symbol);
    }

    if (signal.signal === 'sell' && this.position?.side === 'long') {
      this.logger.info('Closing long position...');
      await this.alpacaAPI.closePosition(this.symbol);
    }
  }

  private async enterPosition(signal: Signal) {
    if (signal.signal === 'hold') return;
    this.logger.info('Entering position...: ' + JSON.stringify(signal));

    await this.alpacaAPI.cancelAllOrders(this.symbol);

    const precision = signal.close < 1 ? 4 : 2;
    const buyingPower = await this.alpacaAPI.getBuyingPower();

    if (buyingPower * this.size < signal.close) {
      this.logger.warn(
        `Buying power is ${buyingPower} and closing price is ${signal.close} - Insufficient buying power, skipping trade`
      );
      return;
    }

    const qty = Math.floor((this.size * buyingPower) / signal.close);

    const orderToPlace: PlaceOrderRequest = {
      symbol: this.symbol,
      qty: qty.toString(),
      side: signal.signal,
      type: 'limit',
      limit_price: Number(signal.close).toFixed(precision),
      time_in_force: 'gtc',
      order_class: 'bracket',
      take_profit: {
        limit_price: Number(signal.tp).toFixed(precision),
      },
      stop_loss: {
        stop_price: Number(signal.sl).toFixed(precision),
        stop_limit_price: Number(signal.sl).toFixed(precision),
      },
    };

    const orderPlaced = await this.alpacaAPI.placeOrder(orderToPlace);

    if (orderPlaced === undefined) {
      this.logger.error('Position NOT entered');
    } else {
      this.logger.info('Position entered: ' + JSON.stringify(orderPlaced));
    }
  }

  private getPreviousTradingDay(date: Date) {
    const day = date.getDay();
    let newDate = new Date(date);

    if (day === 0 || day === 1) {
      // If the day is Sunday or Monday, go back to the previous Friday
      newDate.setDate(date.getDate() - (day === 0 ? 2 : 3));
    } else {
      // Otherwise, just go back one day
      newDate.setDate(date.getDate() - 1);
    }

    return newDate;
  }
}
