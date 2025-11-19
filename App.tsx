import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { SignalCard } from './components/SignalCard';
import { AppConfig, MarketData, AISignalResponse, Timeframe } from './types';
import { analyzeCandles } from './services/indicators';
import { getGeminiSignal } from './services/geminiService';
import { Terminal, Layers, FileJson, Menu } from 'lucide-react';

const INITIAL_CONFIG: AppConfig = {
  apiKey: '',
  model: 'gemini-2.0-flash',
  symbol: 'BTC/USDT',
  capital: 1000,
  risk: 2.0,
  selectedTimeframes: [Timeframe.H1, Timeframe.H4]
};

const App: React.FC = () => {
  const [config, setConfig] = useState<AppConfig>(INITIAL_CONFIG);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [signal, setSignal] = useState<AISignalResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'details' | 'raw'>('dashboard');
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  
  // Sidebar começa colapsada (false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    setSignal(null);

    try {
      // 1. Buscar Dados (Real via CCXT)
      const timeframes = config.selectedTimeframes;
      const mData: MarketData[] = [];

      // Acessa o CCXT injetado via script tag global no index.html
      const ccxt = (window as any).ccxt;
      
      if (!ccxt) {
        throw new Error("Erro de carregamento da biblioteca CCXT. Recarregue a página.");
      }

      // Configuração corrigida conforme instrução (Sem Proxy, Swap explícito no símbolo)
      const exchange = new ccxt.bybit({
        enableRateLimit: true,
        options: {
          defaultType: 'swap',
          recvWindow: 10000,
        },
      });
      
      // Reforço da opção
      exchange.options['defaultType'] = 'swap';

      for (const tf of timeframes) {
        let candles;
        let currentPrice;

        try {
           // Mapeamento de Timeframes do App para CCXT
           const tfMap: Record<string, string> = { 
             '5m': '5m',
             '15m': '15m', 
             '30m': '30m',
             '1h': '1h', 
             '4h': '4h', 
             '1d': '1d' 
           };

           // Ajuste crítico: Formato Unified do CCXT para Perpétuos Lineares (Symbol/Quote:Settle)
           // Transforma BTC/USDT em BTC/USDT:USDT
           let symbolClean = config.symbol.toUpperCase().trim();
           if (!symbolClean.includes(':')) {
              // Se o usuário digitou apenas BTC/USDT, adicionamos o sufixo :USDT
              symbolClean = `${symbolClean}:USDT`;
           }
           
           // Fetch OHLCV via CCXT
           const ohlcv = await exchange.fetchOHLCV(symbolClean, tfMap[tf], undefined, 100);
           
           if (!ohlcv || ohlcv.length === 0) {
             throw new Error(`Sem dados para ${tf}`);
           }

           // Formatar dados do CCXT [timestamp, open, high, low, close, volume] para objeto Candle
           candles = ohlcv.map((d: number[]) => ({
             time: d[0], 
             open: d[1], 
             high: d[2], 
             low: d[3], 
             close: d[4], 
             volume: d[5]
           }));

           currentPrice = candles[candles.length-1].close;

        } catch (e: any) {
           console.error(e);
           // Mensagem de erro amigável
           let msg = e.message || 'Erro desconhecido';
           if (msg.includes('fetch failed')) {
             msg = 'Bloqueio de Rede/CORS. A Bybit pode estar bloqueando requisições diretas do navegador neste momento ou região.';
           }
           throw new Error(`Erro Bybit (${tf}): ${msg}`);
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

      // 2. Chamar IA
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
      setError(err.message || "Ocorreu um erro desconhecido");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-dark-900 text-gray-200 font-sans overflow-hidden">
      <Sidebar 
        config={config} 
        setConfig={setConfig} 
        onAnalyze={handleAnalyze} 
        isAnalyzing={isAnalyzing}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main 
        className={`
          flex-1 p-8 overflow-y-auto h-screen transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'ml-80' : 'ml-0'}
        `}
      >
        
        {/* Navegação Superior */}
        <div className="flex justify-between items-center mb-8">
           <div className="flex items-center gap-4">
             {!isSidebarOpen && (
               <button 
                 onClick={() => setIsSidebarOpen(true)}
                 className="p-2 hover:bg-dark-800 rounded text-brand-cyan transition-colors"
                 title="Abrir Menu"
               >
                 <Menu className="w-6 h-6" />
               </button>
             )}
             
             <div>
               <h2 className="text-3xl font-bold text-white">Análise {config.symbol}</h2>
               <p className="text-gray-500 text-sm mt-1">
                 {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR')} • Capital: ${config.capital} • Risco: {config.risk}%
               </p>
             </div>
           </div>
           
           {/* Abas */}
           {signal && (
             <div className="flex bg-dark-800 rounded-lg p-1 border border-dark-700">
               <button 
                 onClick={() => setActiveTab('dashboard')}
                 className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition ${activeTab === 'dashboard' ? 'bg-dark-700 text-brand-cyan shadow-sm' : 'text-gray-400 hover:text-white'}`}
               >
                 <Layers className="w-4 h-4" /> Painel
               </button>
               <button 
                 onClick={() => setActiveTab('details')}
                 className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition ${activeTab === 'details' ? 'bg-dark-700 text-brand-gold shadow-sm' : 'text-gray-400 hover:text-white'}`}
               >
                 <Terminal className="w-4 h-4" /> Narrativa
               </button>
               <button 
                 onClick={() => setActiveTab('raw')}
                 className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition ${activeTab === 'raw' ? 'bg-dark-700 text-brand-green shadow-sm' : 'text-gray-400 hover:text-white'}`}
               >
                 <FileJson className="w-4 h-4" /> Dados Brutos
               </button>
             </div>
           )}
        </div>

        {/* Área de Conteúdo */}
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
              <h3 className="text-xl font-medium text-gray-400">Pronto para Analisar</h3>
              <p className="text-sm mt-2 max-w-md text-center">
                Configure sua chave API no menu lateral, selecione o ativo e clique em "Analisar com IA" para gerar sinais profissionais.
              </p>
            </div>
          )}

          {isAnalyzing && (
             <div className="flex flex-col items-center justify-center h-[60vh]">
                <div className="relative w-24 h-24 mb-8">
                   <div className="absolute inset-0 border-4 border-dark-700 rounded-full"></div>
                   <div className="absolute inset-0 border-4 border-brand-cyan rounded-full border-t-transparent animate-spin"></div>
                </div>
                <h3 className="text-xl font-bold text-brand-cyan animate-pulse">Processando Dados de Mercado (Bybit)...</h3>
                <p className="text-gray-500 text-sm mt-2">Calculando Indicadores & Consultando Gemini {config.model}</p>
             </div>
          )}

          {signal && activeTab === 'dashboard' && (
            <SignalCard data={signal} />
          )}

          {signal && activeTab === 'details' && (
            <div className="space-y-6 animate-fade-in">
               <div className="bg-dark-800 border border-dark-700 rounded-xl p-8">
                 <h3 className="text-brand-gold font-bold text-xl mb-6">Narrativa de Mercado Completa</h3>
                 <div className="prose prose-invert max-w-none">
                   <p className="text-gray-300 text-lg leading-loose whitespace-pre-wrap">
                     {signal.market_narrative}
                   </p>
                   <div className="my-8 h-px bg-dark-700 w-full"></div>
                   <h4 className="text-brand-cyan font-bold text-lg mb-2">Conflito de Timeframes</h4>
                   <p className="text-gray-400">{signal.timeframe_conflict}</p>
                 </div>
               </div>
            </div>
          )}

          {signal && activeTab === 'raw' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                <h3 className="text-brand-green font-mono text-sm mb-4">RESPOSTA_IA.JSON</h3>
                <pre className="bg-dark-900 p-4 rounded-lg overflow-x-auto text-xs font-mono text-brand-green/80 leading-5 border border-dark-700">
                  {JSON.stringify(signal, null, 2)}
                </pre>
              </div>
              <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                <h3 className="text-brand-cyan font-mono text-sm mb-4">INPUTS_TECNICOS.JSON</h3>
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