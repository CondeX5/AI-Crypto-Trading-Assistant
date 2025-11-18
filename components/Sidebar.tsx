import React, { useState, useEffect } from 'react';
import { AppConfig, Timeframe } from '../types';
import { Activity, Settings, Save, RefreshCw, Database, ChevronDown, ChevronRight, Clock, Info, X } from 'lucide-react';

interface SidebarProps {
  config: AppConfig;
  setConfig: (config: AppConfig) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ config, setConfig, onAnalyze, isAnalyzing, isOpen, onClose }) => {
  const [localKey, setLocalKey] = useState(config.apiKey);
  
  // Estado para seções colapsáveis (Iniciam fechadas conforme solicitado)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMarketDataOpen, setIsMarketDataOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const handleSaveKey = () => {
    setConfig({ ...config, apiKey: localKey });
    localStorage.setItem('gemini_api_key', localKey);
  };

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setLocalKey(savedKey);
      setConfig({ ...config, apiKey: savedKey });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTimeframeToggle = (tf: string) => {
    const current = config.selectedTimeframes;
    if (current.includes(tf)) {
      // Prevenir desmarcar o último
      if (current.length > 1) {
        setConfig({ ...config, selectedTimeframes: current.filter(t => t !== tf) });
      }
    } else {
      setConfig({ ...config, selectedTimeframes: [...current, tf] });
    }
  };

  const availableModels = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
  ];

  const availableTimeframes = Object.values(Timeframe);

  return (
    <aside 
      className={`
        w-80 bg-dark-800 border-r border-dark-700 flex flex-col h-screen fixed left-0 top-0 overflow-y-auto z-50
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      <div className="p-6 border-b border-dark-700 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-brand-gold flex items-center gap-2">
            <Activity className="w-6 h-6 text-brand-cyan" />
            Crypto AI Pro
          </h1>
          <p className="text-gray-500 text-xs mt-1">Golden Goose Edition • Criado por Gabriel Arten Conde</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        
        {/* Seção Configurações */}
        <div className="border-b border-dark-700">
          <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="w-full p-4 flex items-center justify-between hover:bg-dark-700 transition-colors group"
          >
            <div className="flex items-center gap-2 text-brand-cyan group-hover:text-cyan-400">
              <Settings className="w-4 h-4" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Configurações</h2>
            </div>
            {isSettingsOpen ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
          </button>
          
          {isSettingsOpen && (
            <div className="p-4 space-y-4 bg-dark-900/50 animate-fade-in">
              <div className="space-y-2">
                <label className="text-xs text-gray-400">Chave API Gemini (API Key)</label>
                <div className="relative">
                  <input
                    type="password"
                    value={localKey}
                    onChange={(e) => setLocalKey(e.target.value)}
                    className="w-full bg-dark-900 border border-dark-600 rounded px-3 py-2 text-sm text-white focus:border-brand-cyan focus:outline-none"
                    placeholder="Cole sua chave AIza..."
                  />
                </div>
                <button 
                  onClick={handleSaveKey}
                  className="flex items-center justify-center gap-2 w-full bg-dark-700 hover:bg-dark-600 text-xs text-gray-300 py-1 rounded transition"
                >
                  <Save className="w-3 h-3" /> Salvar Chave
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-400">Modelo IA</label>
                <select
                  value={config.model}
                  onChange={(e) => setConfig({ ...config, model: e.target.value })}
                  className="w-full bg-dark-900 border border-dark-600 rounded px-3 py-2 text-sm text-white focus:border-brand-cyan focus:outline-none"
                >
                  {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

               <div className="flex items-center gap-2 mt-4">
                <input 
                  type="checkbox" 
                  id="demoMode" 
                  checked={config.demoMode} 
                  onChange={(e) => setConfig({...config, demoMode: e.target.checked})}
                  className="rounded bg-dark-900 border-dark-600 text-brand-cyan focus:ring-0"
                />
                <label htmlFor="demoMode" className="text-xs text-gray-400 select-none cursor-pointer">
                  Modo Demo (Dados Simulados)
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Seção Market Data */}
        <div className="border-b border-dark-700">
           <button 
            onClick={() => setIsMarketDataOpen(!isMarketDataOpen)}
            className="w-full p-4 flex items-center justify-between hover:bg-dark-700 transition-colors group"
          >
            <div className="flex items-center gap-2 text-brand-cyan group-hover:text-cyan-400">
              <Database className="w-4 h-4" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Dados de Mercado</h2>
            </div>
            {isMarketDataOpen ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
          </button>

          {isMarketDataOpen && (
            <div className="p-4 space-y-4 bg-dark-900/50 animate-fade-in">
              <div className="space-y-2">
                <label className="text-xs text-gray-400">Símbolo (ex: BTC/USDT)</label>
                <input
                  type="text"
                  value={config.symbol}
                  onChange={(e) => setConfig({ ...config, symbol: e.target.value.toUpperCase() })}
                  className="w-full bg-dark-900 border border-dark-600 rounded px-3 py-2 text-sm text-white focus:border-brand-cyan focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-gray-400">Capital ($)</label>
                  <input
                    type="number"
                    value={config.capital}
                    onChange={(e) => setConfig({ ...config, capital: parseFloat(e.target.value) })}
                    className="w-full bg-dark-900 border border-dark-600 rounded px-3 py-2 text-sm text-white focus:border-brand-cyan focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-400">Risco (%)</label>
                  <input
                    type="number"
                    value={config.risk}
                    onChange={(e) => setConfig({ ...config, risk: parseFloat(e.target.value) })}
                    className="w-full bg-dark-900 border border-dark-600 rounded px-3 py-2 text-sm text-white focus:border-brand-cyan focus:outline-none"
                  />
                </div>
              </div>

              {/* Timeframe Selector */}
              <div className="space-y-2 pt-2 border-t border-dark-700">
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <Clock className="w-3 h-3" />
                  <label className="text-xs font-bold">Tempos Gráficos</label>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {availableTimeframes.map((tf) => (
                    <div 
                      key={tf}
                      onClick={() => handleTimeframeToggle(tf)}
                      className={`
                        cursor-pointer flex items-center justify-center px-2 py-2 rounded text-xs font-mono border transition-all text-center
                        ${config.selectedTimeframes.includes(tf) 
                          ? 'bg-brand-cyan/10 border-brand-cyan text-brand-cyan' 
                          : 'bg-dark-900 border-dark-600 text-gray-500 hover:border-gray-500'}
                      `}
                    >
                      <span>{tf}</span>
                      {config.selectedTimeframes.includes(tf) && <div className="w-1 h-1 rounded-full bg-brand-cyan absolute top-1 right-1"></div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Seção Sobre o App */}
        <div className="border-b border-dark-700">
           <button 
            onClick={() => setIsAboutOpen(!isAboutOpen)}
            className="w-full p-4 flex items-center justify-between hover:bg-dark-700 transition-colors group"
          >
            <div className="flex items-center gap-2 text-brand-cyan group-hover:text-cyan-400">
              <Info className="w-4 h-4" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Sobre o App</h2>
            </div>
            {isAboutOpen ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
          </button>

          {isAboutOpen && (
            <div className="p-4 space-y-4 bg-dark-900/50 animate-fade-in text-gray-400 text-xs leading-relaxed">
              <p>
                <strong className="text-white">Crypto AI Pro</strong> é uma ferramenta de análise técnica institucional alimentada pelo <strong className="text-brand-gold">Google Gemini</strong>.
              </p>
              
              <div className="space-y-2 mt-2">
                <h3 className="font-bold text-white border-b border-dark-700 pb-1">Como Usar:</h3>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>
                    Insira sua <span className="text-brand-cyan">Chave API</span> do Gemini nas Configurações.
                  </li>
                  <li>
                    Defina o <span className="text-white">Símbolo</span> (ex: ETH/USDT) e seus parâmetros de risco.
                  </li>
                  <li>
                    Selecione os <span className="text-white">Timeframes</span> desejados para análise de confluência.
                  </li>
                  <li>
                    Clique em <span className="text-brand-cyan font-bold">ANALISAR COM IA</span>.
                  </li>
                </ol>
              </div>

              <div className="p-2 bg-dark-800 rounded border border-dark-600 mt-2">
                <p className="text-[10px] text-gray-500">
                  Nota: Ative o "Modo Demo" para testar a lógica da IA com dados simulados caso não tenha conexão direta com a exchange.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      <div className="p-6 bg-dark-900 border-t border-dark-700">
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing || !config.apiKey}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded font-bold text-white transition-all duration-200 
            ${isAnalyzing || !config.apiKey ? 'bg-dark-600 cursor-not-allowed text-gray-500' : 'bg-brand-cyan hover:bg-cyan-500 hover:shadow-[0_0_15px_rgba(6,182,212,0.5)] text-dark-900'}
          `}
        >
          {isAnalyzing ? (
             <>
               <RefreshCw className="w-5 h-5 animate-spin" /> Processando...
             </>
          ) : (
             <>
               🚀 ANALISAR COM IA
             </>
          )}
        </button>
        {!config.apiKey && <p className="text-red-500 text-xs text-center mt-2">Chave API Obrigatória</p>}
      </div>
    </aside>
  );
};