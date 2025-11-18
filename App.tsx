import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { SignalCard } from './components/SignalCard';
import { AppConfig, MarketData, AISignalResponse, Timeframe } from './types';
import { generateMockCandles, analyzeCandles } from './services/indicators';
import { getGeminiSignal } from './services/geminiService';
import { Terminal, Layers, FileJson } from 'lucide-react';

const INITIAL_CONFIG: AppConfig = {
  apiKey: '',
  model: 'gemini-2.0-flash',
  symbol: 'BTC/USDT',
  capital: 1000,
  risk: 2.0,
  selectedTimeframes: [Timeframe.H1, Timeframe.H4],
  demoMode: true
};

const App: React.FC = () => {
  const [config, setConfig] = useState<AppConfig>(INITIAL_CONFIG);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [signal, setSignal] = useState<AISignalResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'details' | 'raw'>('dashboard');
  const [marketData, setMarketData] = useState<MarketData[]>([]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    setSignal(null);

    try {
      // 1. Fetch Data (Simulated for this environment to avoid CORS/Server reqs)
      const timeframes = config.selectedTimeframes;
      const mData: MarketData[] = [];
      const nowPrice = config.demoMode ? 65000 + Math.random() * 1000 : 0; 

      // In a real app, we would use fetch() to Binance API here.
      // For this demo, we use the robust demo generator or fail if not in demo mode without a proxy.
      
      for (const tf of timeframes) {
        let candles;
        let currentPrice;

        if (config.demoMode) {
           candles = generateMockCandles(200, nowPrice);
           currentPrice = candles[candles.length - 1].close;
        } else {
           // Attempt a real fetch to Binance Public API (might fail due to CORS on some browsers/networks)
           try {
             const intervalMap: Record<string, string> = { 
               '5m': '5m',
               '15m': '15m', 
               '30m': '30m',
               '1h': '1h', 
               '4h': '4h', 
               '1d': '1d' 
             };
             const symbolClean = config.symbol.replace('/', '').toUpperCase();
             const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbolClean}&interval=${intervalMap[tf]}&limit=100`);
             if(!response.ok) throw new Error("Network response was not ok");
             const rawData = await response.json();
             candles = rawData.map((d: any) => ({
               time: d[0], open: parseFloat(d[1]), high: parseFloat(d[2]), low: parseFloat(d[3]), close: parseFloat(d[4]), volume: parseFloat(d[5])
             }));
             currentPrice = candles[candles.length-1].close;
           } catch (e) {
             throw new Error("Failed to fetch real data (CORS/Network). Enable 'Demo Mode' in settings to test the AI logic.");
           }
        }

        const indicators = analyzeCandles(candles);
        mData.push({
          symbol: config.symbol,
          timeframe: tf,
          currentPrice,
          candles,
          indicators
        });
      }
      
      setMarketData(mData);

      // 2. Call AI
      const aiResponse = await getGeminiSignal(
        config.apiKey,
        config.model,
        config.symbol,
        config.capital,
        config.risk,
        mData
      );

      setSignal(aiResponse);

    } catch (err: any) {
      setError(err.message || "An unknown error occurred");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-dark-900 text-gray-200 font-sans">
      <Sidebar 
        config={config} 
        setConfig={setConfig} 
        onAnalyze={handleAnalyze} 
        isAnalyzing={isAnalyzing} 
      />

      <main className="flex-1 ml-80 p-8 overflow-y-auto h-screen">
        
        {/* Top Navigation / Breadcrumbs */}
        <div className="flex justify-between items-center mb-8">
           <div>
             <h2 className="text-3xl font-bold text-white">{config.symbol} Analysis</h2>
             <p className="text-gray-500 text-sm mt-1">
               {new Date().toUTCString()} • Capital: ${config.capital} • Risk: {config.risk}%
             </p>
           </div>
           
           {/* Tabs */}
           {signal && (
             <div className="flex bg-dark-800 rounded-lg p-1 border border-dark-700">
               <button 
                 onClick={() => setActiveTab('dashboard')}
                 className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition ${activeTab === 'dashboard' ? 'bg-dark-700 text-brand-cyan shadow-sm' : 'text-gray-400 hover:text-white'}`}
               >
                 <Layers className="w-4 h-4" /> Dashboard
               </button>
               <button 
                 onClick={() => setActiveTab('details')}
                 className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition ${activeTab === 'details' ? 'bg-dark-700 text-brand-gold shadow-sm' : 'text-gray-400 hover:text-white'}`}
               >
                 <Terminal className="w-4 h-4" /> Narrative
               </button>
               <button 
                 onClick={() => setActiveTab('raw')}
                 className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition ${activeTab === 'raw' ? 'bg-dark-700 text-brand-green shadow-sm' : 'text-gray-400 hover:text-white'}`}
               >
                 <FileJson className="w-4 h-4" /> Raw Data
               </button>
             </div>
           )}
        </div>

        {/* Content Area */}
        <div className="max-w-6xl mx-auto">
          
          {error && (
            <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-xl mb-6 flex items-center gap-3">
               <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
               {error}
            </div>
          )}

          {!signal && !isAnalyzing && !error && (
            <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500 border-2 border-dashed border-dark-700 rounded-2xl bg-dark-800/30">
              <Layers className="w-16 h-16 mb-4 opacity-20" />
              <h3 className="text-xl font-medium text-gray-400">Ready to Analyze</h3>
              <p className="text-sm mt-2 max-w-md text-center">
                Configure your API key in the sidebar settings, select your asset, and click "Analyze with AI" to generate professional-grade signals.
              </p>
            </div>
          )}

          {isAnalyzing && (
             <div className="flex flex-col items-center justify-center h-[60vh]">
                <div className="relative w-24 h-24 mb-8">
                   <div className="absolute inset-0 border-4 border-dark-700 rounded-full"></div>
                   <div className="absolute inset-0 border-4 border-brand-cyan rounded-full border-t-transparent animate-spin"></div>
                </div>
                <h3 className="text-xl font-bold text-brand-cyan animate-pulse">Processing Market Data...</h3>
                <p className="text-gray-500 text-sm mt-2">Calculating EMA, RSI, MACD & Consulting Gemini {config.model}</p>
             </div>
          )}

          {signal && activeTab === 'dashboard' && (
            <SignalCard data={signal} />
          )}

          {signal && activeTab === 'details' && (
            <div className="space-y-6 animate-fade-in">
               <div className="bg-dark-800 border border-dark-700 rounded-xl p-8">
                 <h3 className="text-brand-gold font-bold text-xl mb-6">Full Market Narrative</h3>
                 <div className="prose prose-invert max-w-none">
                   <p className="text-gray-300 text-lg leading-loose whitespace-pre-wrap">
                     {signal.market_narrative}
                   </p>
                   <div className="my-8 h-px bg-dark-700 w-full"></div>
                   <h4 className="text-brand-cyan font-bold text-lg mb-2">Timeframe Conflict Analysis</h4>
                   <p className="text-gray-400">{signal.timeframe_conflict}</p>
                 </div>
               </div>
            </div>
          )}

          {signal && activeTab === 'raw' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                <h3 className="text-brand-green font-mono text-sm mb-4">AI_RESPONSE.JSON</h3>
                <pre className="bg-dark-900 p-4 rounded-lg overflow-x-auto text-xs font-mono text-brand-green/80 leading-5 border border-dark-700">
                  {JSON.stringify(signal, null, 2)}
                </pre>
              </div>
              <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                <h3 className="text-brand-cyan font-mono text-sm mb-4">TECHNICAL_INPUTS.JSON</h3>
                <pre className="bg-dark-900 p-4 rounded-lg overflow-x-auto text-xs font-mono text-brand-cyan/80 leading-5 border border-dark-700">
                  {JSON.stringify(marketData.map(m => ({ 
                    tf: m.timeframe, 
                    price: m.currentPrice, 
                    indicators: m.indicators 
                  })), null, 2)}
                </pre>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default App;