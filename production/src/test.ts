import 'dotenv/config';
import logger from './utils/logger.js';
import { Trader } from './classes/trader.js';
import { AlpacaAPI } from './classes/alpaca.js';
import { TiingoAPI } from './classes/tiingo.js';
import { getBollingerSignals } from './signal_algos/index.js';

const ALPACA_API_KEY = process.env.ALPACA_API_KEY || '';
const ALPACA_API_SECRET = process.env.ALPACA_API_SECRET || '';
const TIINGO_API_KEY = process.env.TIINGO_API_KEY || '';

const alpaca = new AlpacaAPI(logger, ALPACA_API_KEY, ALPACA_API_SECRET);
