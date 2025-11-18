export enum SignalVerdict {
  LONG = 'LONG',
  SHORT = 'SHORT',
  NEUTRAL = 'NEUTRAL',
  LATERAL = 'LATERAL'
}

export enum Timeframe {
  M5 = '5m',
  M15 = '15m',
  M30 = '30m',
  H1 = '1h',
  H4 = '4h',
  D1 = '1d'
}

export interface MarketData {
  symbol: string;
  timeframe: string;
  currentPrice: number;
  candles: Candle[];
  indicators: TechnicalIndicators;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  rsi: number;
  macd: {
    value: number;
    signal: number;
    histogram: number;
  };
  ema: {
    ema9: number;
    ema20: number;
    ema50: number;
    ema200: number;
  };
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
    width: number;
  };
  atr: number;
}

export interface AISignalResponse {
  verdict: SignalVerdict;
  confidence: number;
  side: 'long' | 'short' | null;
  mode: 'continuation' | 'pullback' | 'reversal' | 'scalp';
  entry: number;
  entry_zone_low: number;
  entry_zone_high: number;
  sl: number;
  sl_reasoning: string;
  tp1: number;
  tp1_reasoning: string;
  tp2: number;
  tp3: number;
  rr1: number;
  rr2: number;
  rr3: number;
  position_size: number;
  leverage: number;
  trailing_stop_pct: number;
  trigger_conditions: string;
  market_narrative: string;
  timeframe_conflict: string;
  thesis: string;
  bull_case: string;
  bear_case: string;
  risk_factors: string[];
  strengths: string[];
}

export interface AppConfig {
  apiKey: string;
  model: string;
  symbol: string;
  capital: number;
  risk: number;
  selectedTimeframes: string[];
  demoMode: boolean;
}