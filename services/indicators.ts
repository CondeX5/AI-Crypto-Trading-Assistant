import { Candle, TechnicalIndicators } from '../types';

// Helper to extract closes
const getCloses = (candles: Candle[]) => candles.map(c => c.close);

// EMA Calculation
const calculateEMA = (data: number[], period: number): number[] => {
  const k = 2 / (period + 1);
  const emaArray = [data[0]];
  for (let i = 1; i < data.length; i++) {
    emaArray.push(data[i] * k + emaArray[i - 1] * (1 - k));
  }
  return emaArray;
};

// RSI Calculation
const calculateRSI = (data: number[], period: number = 14): number => {
  if (data.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;

  for (let i = data.length - period; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

// MACD Calculation
const calculateMACD = (data: number[]) => {
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);
  
  // MACD Line
  const macdLine = ema12.map((v, i) => v - ema26[i]).slice(26); // align
  
  // Signal Line (9 EMA of MACD Line)
  const signalLine = calculateEMA(macdLine, 9);
  
  const lastMacd = macdLine[macdLine.length - 1] || 0;
  const lastSignal = signalLine[signalLine.length - 1] || 0;
  
  return {
    value: lastMacd,
    signal: lastSignal,
    histogram: lastMacd - lastSignal
  };
};

// Bollinger Bands
const calculateBollinger = (data: number[], period: number = 20, stdDev: number = 2) => {
  if (data.length < period) return { upper: 0, middle: 0, lower: 0, width: 0 };
  
  const slice = data.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const squaredDiffs = slice.map(x => Math.pow(x - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  const sd = Math.sqrt(variance);
  
  const upper = mean + (stdDev * sd);
  const lower = mean - (stdDev * sd);
  
  return {
    upper,
    middle: mean,
    lower,
    width: (upper - lower) / mean
  };
};

// ATR Calculation (Simplified)
const calculateATR = (candles: Candle[], period: number = 14): number => {
  if (candles.length < period + 1) return 0;
  
  const trs = [];
  for(let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const closePrev = candles[i-1].close;
    
    const tr = Math.max(high - low, Math.abs(high - closePrev), Math.abs(low - closePrev));
    trs.push(tr);
  }
  
  const recentTrs = trs.slice(-period);
  return recentTrs.reduce((a,b) => a+b, 0) / period;
};

export const analyzeCandles = (candles: Candle[]): TechnicalIndicators => {
  const closes = getCloses(candles);
  const lastClose = closes[closes.length - 1];
  
  // EMAs
  const ema9Arr = calculateEMA(closes, 9);
  const ema20Arr = calculateEMA(closes, 20);
  const ema50Arr = calculateEMA(closes, 50);
  const ema200Arr = calculateEMA(closes, 200);

  const macd = calculateMACD(closes);
  const bollinger = calculateBollinger(closes);
  
  return {
    rsi: calculateRSI(closes),
    macd,
    ema: {
      ema9: ema9Arr[ema9Arr.length - 1],
      ema20: ema20Arr[ema20Arr.length - 1],
      ema50: ema50Arr[ema50Arr.length - 1],
      ema200: ema200Arr[ema200Arr.length - 1],
    },
    bollinger,
    atr: calculateATR(candles)
  };
};

// Mock Data Generator for Demo Mode
export const generateMockCandles = (count: number = 100, startPrice: number = 50000): Candle[] => {
  const candles: Candle[] = [];
  let currentPrice = startPrice;
  let time = Date.now() - (count * 3600 * 1000); // Hourly back
  
  for (let i = 0; i < count; i++) {
    const volatility = currentPrice * 0.02;
    const change = (Math.random() - 0.5) * volatility;
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    
    candles.push({
      time,
      open,
      high,
      low,
      close,
      volume: Math.random() * 1000
    });
    
    currentPrice = close;
    time += 3600 * 1000;
  }
  return candles;
};