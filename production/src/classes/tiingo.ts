import { Logger } from 'pino';
import { TiingoBarsResponse, tiingoBarsSchema } from '../schemas/index.js';

export class TiingoAPI {
  private apiKey: string;
  private logger: Logger;

  constructor(logger: Logger, apiKey: string) {
    this.apiKey = apiKey;
    this.logger = logger;
  }

  public async getBars(
    symbol: string,
    startDate: string,
    endDate: string,
    timeframe: string
  ) {
    this.logger.info(`Fetching bars for ${symbol}...`);
    const url = `https://api.tiingo.com/iex/${symbol}/prices?startDate=${
      startDate.split('T')[0]
    }&endDate=${
      endDate.split('T')[0]
    }&resampleFreq=${timeframe}&columns=open,high,low,close,volume&token=${
      this.apiKey
    }`;

    const init = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    let results: TiingoBarsResponse = [];

    try {
      const response = await fetch(url, init);
      const data = await response.json();
      results = tiingoBarsSchema.parse(data);
    } catch (error) {
      this.logger.error(
        `Error fetching bars for ${symbol}: ${JSON.stringify(error)}`
      );
    } finally {
      this.logger.info(`Returning ${results.length} bars`);
      return results;
    }
  }
}
