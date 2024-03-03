import { ATR, BollingerBands, EMA } from 'technicalindicators';
import { TiingoBarsResponse } from '../schemas/index.js';
import { Signal } from '../classes/trader.js';

interface BollingerSignal extends Signal {
  trend: 'bull' | 'bear' | 'none';
  bb_high: number | undefined;
  bb_low: number | undefined;
  ema_slow: number | undefined;
  ema_fast: number | undefined;
  atr: number | undefined;
}

const getTrend = (data: BollingerSignal[]): BollingerSignal['trend'] => {
  if (data.some((c) => c.ema_fast === undefined || c.ema_slow === undefined)) {
    return 'none';
  }

  if (data.every((c) => c.ema_fast! > c.ema_slow!)) {
    return 'bull';
  }
  if (data.every((c) => c.ema_fast! < c.ema_slow!)) {
    return 'bear';
  }

  return 'none';
};

export const getBollingerSignals = (
  bars: TiingoBarsResponse
): BollingerSignal[] => {
  const periodEMASlow = 26;
  const periodEMAFast = 13;
  const periodBB = 13;
  const stdDev = 2;
  const periodATR = 7;
  const periodTrend = 7;
  const slCoef = 1.1;
  const TPSLRatio = 1.5;

  const emaSlow = new EMA({ values: [], period: periodEMASlow });
  const emaFast = new EMA({ values: [], period: periodEMAFast });
  const bb = new BollingerBands({ values: [], period: periodBB, stdDev });
  const atr = new ATR({ high: [], low: [], close: [], period: periodATR });

  const signals: Array<BollingerSignal> = [];

  // First add all indicators

  for (let bar of bars) {
    if (bar.open === bar.close) continue;

    const nextEMASlow = emaSlow.nextValue(bar.close);
    const nextEMAFast = emaFast.nextValue(bar.close);
    const nextBB = bb.nextValue(bar.close);
    const nextATR = atr.nextValue({
      high: bar.high,
      low: bar.low,
      close: bar.close,
    });

    signals.push({
      date: bar.date,
      signal: 'hold',
      sl: undefined,
      tp: undefined,
      trend: 'none',
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
      bb_high: nextBB ? nextBB.upper : undefined,
      bb_low: nextBB ? nextBB.lower : undefined,
      ema_slow: nextEMASlow,
      ema_fast: nextEMAFast,
      atr: nextATR,
      volume: bar.volume,
    });
  }

  // Then update the trend and signals
  if (signals.length > periodTrend) {
    for (let i = periodTrend; i < signals.length; i++) {
      signals[i].trend = getTrend(signals.slice(i - periodTrend, i));

      if (
        signals[i].bb_high === undefined ||
        signals[i].bb_low === undefined ||
        signals[i].atr === undefined
      )
        continue;

      if (
        signals[i].trend === 'bull' &&
        signals[i].close < signals[i].bb_low!
      ) {
        signals[i].signal = 'buy';
        signals[i].sl = signals[i].close - signals[i].atr! * slCoef;
        signals[i].tp = signals[i].close + signals[i].atr! * slCoef * TPSLRatio;
      }

      if (
        signals[i].trend === 'bear' &&
        signals[i].close > signals[i].bb_high!
      ) {
        signals[i].signal = 'sell';
        signals[i].sl = signals[i].close + signals[i].atr! * slCoef;
        signals[i].tp = signals[i].close - signals[i].atr! * slCoef * TPSLRatio;
      }
    }
  }

  return signals;
};
