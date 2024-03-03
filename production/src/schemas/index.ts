import { z } from 'zod';

const activeSchema = z.object({
  symbol: z.string(),
  trade_count: z.number(),
  volume: z.number(),
});

const mostActivesSchema = z.array(activeSchema);

export const mostActiveResponseSchema = z.object({
  last_updated: z.string(), // You might want to further validate this as a date string
  most_actives: mostActivesSchema,
});

export const marketClockSchema = z.object({
  timestamp: z.string(),
  is_open: z.boolean(),
  next_open: z.string(),
  next_close: z.string(),
});

const tiingoBarSchema = z.object({
  date: z.string(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number(),
});

export const tiingoBarsSchema = z.array(tiingoBarSchema);

export const positionSchema = z.object({
  asset_id: z.string(),
  symbol: z.string(),
  exchange: z.string(),
  asset_class: z.string(),
  asset_marginable: z.boolean(),
  qty: z.string(),
  avg_entry_price: z.string(),
  side: z.enum(['short', 'long']), // Assuming 'short' and 'long' are the only valid options
  market_value: z.string(),
  cost_basis: z.string(),
  unrealized_pl: z.string(),
  unrealized_plpc: z.string(),
  unrealized_intraday_pl: z.string(),
  unrealized_intraday_plpc: z.string(),
  current_price: z.string(),
  lastday_price: z.string(),
  change_today: z.string(),
  qty_available: z.string(),
});

export const getOrdersSchema = z.array(
  z.object({
    id: z.string(),
    symbol: z.string(),
  })
);

export const accountSchema = z.object({
  id: z.string(),
  admin_configurations: z.record(z.unknown()), // {} indicates an object with any keys and values
  user_configurations: z.record(z.unknown()).or(z.null()), // Can be an object or null
  account_number: z.string(),
  status: z.string(),
  crypto_status: z.string(),
  currency: z.string(),
  buying_power: z.string(),
  regt_buying_power: z.string(),
  daytrading_buying_power: z.string(),
  effective_buying_power: z.string(),
  non_marginable_buying_power: z.string(),
  bod_dtbp: z.string(),
  cash: z.string(),
  accrued_fees: z.string(),
  pending_transfer_in: z.string(),
  portfolio_value: z.string(),
  pattern_day_trader: z.boolean(),
  trading_blocked: z.boolean(),
  transfers_blocked: z.boolean(),
  account_blocked: z.boolean(),
  created_at: z.string(), // Could use z.date() if you want to parse to Date object
  trade_suspended_by_user: z.boolean(),
  multiplier: z.string(),
  shorting_enabled: z.boolean(),
  equity: z.string(),
  last_equity: z.string(),
  long_market_value: z.string(),
  short_market_value: z.string(),
  position_market_value: z.string(),
  initial_margin: z.string(),
  maintenance_margin: z.string(),
  last_maintenance_margin: z.string(),
  sma: z.string(),
  daytrade_count: z.number(),
  balance_asof: z.string(),
  crypto_tier: z.number(),
});

export const placeOrderSchema = z.object({
  symbol: z.string(),
  qty: z.string(),
  side: z.enum(['buy', 'sell']),
  type: z.enum(['market', 'limit']),
  time_in_force: z.enum(['day', 'gtc', 'opg']),
  order_class: z.enum(['simple', 'bracket', 'oco', 'oto']),
  limit_price: z.string().optional(),
  stop_price: z.string().optional(),
  trail_price: z.string().optional(),
  trail_percent: z.string().optional(),
  take_profit: z
    .object({
      limit_price: z.string(),
    })
    .optional(),
  stop_loss: z
    .object({
      stop_price: z.string(),
      stop_limit_price: z.string(),
    })
    .optional(),
});

export type MostActiveResponse = z.infer<typeof mostActiveResponseSchema>;
export type MarketClockResponse = z.infer<typeof marketClockSchema>;
export type TiingoBarsResponse = z.infer<typeof tiingoBarsSchema>;
export type PositionResponse = z.infer<typeof positionSchema>;
export type GetOrdersResponse = z.infer<typeof getOrdersSchema>;
export type AccountResponse = z.infer<typeof accountSchema>;
export type PlaceOrderRequest = z.infer<typeof placeOrderSchema>;
