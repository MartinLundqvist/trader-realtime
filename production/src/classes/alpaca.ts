import { Logger } from 'pino';
import {
  GetOrdersResponse,
  PlaceOrderRequest,
  PositionResponse,
  accountSchema,
  getOrdersSchema,
  marketClockSchema,
  mostActiveResponseSchema,
  positionSchema,
} from '../schemas/index.js';

export class AlpacaAPI {
  private apiKey: string;
  private apiSecret: string;
  private logger: Logger;
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(logger: Logger, apiKey: string, apiSecret: string, paper = true) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.logger = logger;

    if (paper) {
      this.baseUrl = 'https://paper-api.alpaca.markets';
    } else {
      this.baseUrl = 'https://api.alpaca.markets';
    }

    this.headers = {
      'APCA-API-KEY-ID': this.apiKey,
      'APCA-API-SECRET-KEY': this.apiSecret,
      accept: 'application/json',
    };
  }

  public async getMostActiveStocks(): Promise<string[]> {
    this.logger.info('Fetching most active stocks...');
    const tickers: string[] = [];
    const url =
      'https://data.alpaca.markets/v1beta1/screener/stocks/most-actives?by=trades&top=10';

    const init = {
      method: 'GET',
      headers: this.headers,
    };

    try {
      const response = await fetch(url, init);
      const data = await response.json();
      const parsedData = mostActiveResponseSchema.parse(data);
      for (let stock of parsedData.most_actives) {
        tickers.push(stock.symbol);
      }
      this.logger.info(
        `Fetched most active stocks: ${JSON.stringify(tickers)}`
      );
      return tickers;
    } catch (error) {
      this.logger.error(
        `Error fetching most active stocks: ${JSON.stringify(error)}`
      );
      return tickers;
    }
  }

  public async isMarketOpen(): Promise<boolean> {
    this.logger.info('Fetching market clock...');
    const url = 'https://paper-api.alpaca.markets/v2/clock';
    const init = {
      method: 'GET',
      headers: this.headers,
    };

    try {
      const response = await fetch(url, init);
      const data = await response.json();
      const parsedData = marketClockSchema.parse(data);
      return parsedData.is_open;
    } catch (error) {
      this.logger.error(
        `Error fetching market clock: ${JSON.stringify(error)}`
      );
      return false;
    }
  }

  public async fetchPosition(
    symbol: string
  ): Promise<PositionResponse | undefined> {
    this.logger.info(`Fetching position for ${symbol}...`);
    const url = this.baseUrl + '/v2/positions' + '/' + symbol;
    // ...
    const init = {
      method: 'GET',
      headers: this.headers,
    };

    try {
      const response = await fetch(url, init);
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      const data = await response.json();
      if (data.message === 'position does not exist') {
        throw new Error('Not Found');
      }
      const parsedData = positionSchema.parse(data);
      return parsedData;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Not Found') {
          return undefined;
        }
        this.logger.error(
          `Error fetching position for ${symbol}: ${error.message}`
        );

        return undefined;
      }

      this.logger.error(
        `Error fetching position for ${symbol}: ${JSON.stringify(error)}`
      );
      return undefined;
    }
  }

  public async closePosition(symbol: string) {
    this.logger.info(`Closing position for ${symbol}...`);
    const url = this.baseUrl + '/v2/positions' + '/' + symbol;
    const init = {
      method: 'DELETE',
      headers: this.headers,
    };

    try {
      const response = await fetch(url, init);
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      this.logger.info(
        `Successfully requested to close position for ${symbol}`
      );
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Error closing position for ${symbol}: ${error.message}`
        );
      } else {
        this.logger.error(
          `Error closing position for ${symbol}: ${JSON.stringify(error)}`
        );
      }
    }
  }

  public async cancelAllOrders(symbol: string) {
    this.logger.info(`Cancelling all orders for ${symbol}...`);

    const orders = await this.getAllOpenOrders();
    for (let order of orders) {
      if (order.symbol === symbol) {
        await this.cancelOrder(order.id);
      }
    }
  }

  private async cancelOrder(orderId: string) {
    this.logger.info(`Cancelling order ${orderId}...`);
    const url = this.baseUrl + '/v2/orders' + '/' + orderId;
    const init = {
      method: 'DELETE',
      headers: this.headers,
    };

    try {
      const response = await fetch(url, init);
      if (!response.ok) {
        throw new Error(response.statusText);
      }
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Error cancelling order ${orderId}: ${error.message}`
        );
      } else {
        this.logger.error(
          `Error cancelling order ${orderId}: ${JSON.stringify(error)}`
        );
      }
    }
  }

  private async getAllOpenOrders(): Promise<GetOrdersResponse> {
    this.logger.info('Fetching all orders...');
    const url = this.baseUrl + '/v2/orders';
    const init = {
      method: 'GET',
      headers: this.headers,
    };

    try {
      const response = await fetch(url, init);
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      const data = await response.json();
      const parsedData = getOrdersSchema.parse(data);
      return parsedData;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error fetching all orders: ${error.message}`);
      } else {
        this.logger.error(
          `Error fetching all orders: ${JSON.stringify(error)}`
        );
      }
      return [];
    }
  }

  public async getBuyingPower(): Promise<number> {
    this.logger.info('Fetching buying power...');
    const url = this.baseUrl + '/v2/account';
    const init = {
      method: 'GET',
      headers: this.headers,
    };

    try {
      const response = await fetch(url, init);
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      const data = await response.json();
      const parsedData = accountSchema.parse(data);
      return parseFloat(parsedData.buying_power);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error fetching buying power: ${error.message}`);
      } else {
        this.logger.error(
          `Error fetching buying power: ${JSON.stringify(error)}`
        );
      }
      return 0;
    }
  }

  public async placeOrder(order: PlaceOrderRequest) {
    this.logger.info(`Placing order: ${JSON.stringify(order)}`);
    const url = this.baseUrl + '/v2/orders';
    const init = {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(order),
    };

    try {
      const response = await fetch(url, init);
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      const data = await response.json();
      this.logger.info(`Successfully placed order: ${JSON.stringify(data)}`);
      return data;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error placing order: ${error.message}`);
      } else {
        this.logger.error(`Error placing order: ${JSON.stringify(error)}`);
      }
      return undefined;
    }
  }
}
