import React from 'react';
import { AISignalResponse, SignalVerdict } from '../types';
import { TrendingUp, TrendingDown, Minus, Target, AlertTriangle, CheckCircle, ShieldAlert, Copy } from 'lucide-react';

interface SignalCardProps {
  data: AISignalResponse;
}

export const SignalCard: React.FC<SignalCardProps> = ({ data }) => {
  const getVerdictColor = (v: SignalVerdict) => {
    switch (v) {
      case SignalVerdict.LONG: return 'text-brand-green border-brand-green';
      case SignalVerdict.SHORT: return 'text-brand-red border-brand-red';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  const getConfidenceColor = (c: number) => {
    if (c >= 75) return 'bg-brand-green';
    if (c >= 50) return 'bg-brand-gold';
    return 'bg-brand-red';
  };

  const copyToClipboard = () => {
    const text = `SINAL IA: ${data.verdict} @ ${data.entry}\nSL: ${data.sl} | TP1: ${data.tp1} | TP2: ${data.tp2} | TP3: ${data.tp3}\nTese: ${data.thesis}`;
    navigator.clipboard.writeText(text);
    alert("Sinal copiado para a área de transferência!");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabeçalho */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Veredito Card */}
        <div className={`col-span-2 bg-dark-800 border-2 rounded-xl p-6 flex flex-col justify-between relative ${getVerdictColor(data.verdict)} bg-opacity-50`}>
           <div className="absolute top-4 right-4">
              <button onClick={copyToClipboard} className="p-2 hover:bg-dark-700 rounded-full transition text-gray-400" title="Copiar Sinal">
                 <Copy className="w-5 h-5" />
              </button>
           </div>
           
           <div>
             <span className="text-sm font-bold tracking-widest uppercase text-gray-400">Veredito da IA</span>
             <h2 className="text-5xl font-black mt-2 flex items-center gap-4">
                {data.verdict === SignalVerdict.LONG && <TrendingUp className="w-12 h-12" />}
                {data.verdict === SignalVerdict.SHORT && <TrendingDown className="w-12 h-12" />}
                {(data.verdict === SignalVerdict.NEUTRAL || data.verdict === SignalVerdict.LATERAL) && <Minus className="w-12 h-12" />}
                {data.verdict}
             </h2>
             <p className="text-lg mt-2 opacity-80 font-mono">{data.mode.toUpperCase()} STRATEGY • {data.leverage}x ALAVANCAGEM</p>
           </div>

           <div className="mt-6">
             <div className="flex justify-between mb-1">
               <span className="text-sm font-medium text-gray-400">Confiança da IA</span>
               <span className="text-sm font-bold text-white">{data.confidence}%</span>
             </div>
             <div className="w-full bg-dark-900 rounded-full h-3">
               <div className={`h-3 rounded-full transition-all duration-1000 ${getConfidenceColor(data.confidence)}`} style={{ width: `${data.confidence}%` }}></div>
             </div>
           </div>
        </div>

        {/* Estatísticas Rápidas */}
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 flex flex-col justify-center space-y-4">
           <div className="flex justify-between items-center border-b border-dark-700 pb-3">
             <span className="text-gray-400 text-sm">Zona de Entrada</span>
             <span className="text-brand-cyan font-mono font-bold text-lg">${data.entry}</span>
           </div>
           <div className="flex justify-between items-center border-b border-dark-700 pb-3">
             <span className="text-gray-400 text-sm">Stop Loss</span>
             <span className="text-brand-red font-mono font-bold text-lg">${data.sl}</span>
           </div>
           <div className="flex justify-between items-center border-b border-dark-700 pb-3">
             <span className="text-gray-400 text-sm">Alvo 1 (R:R {data.rr1})</span>
             <span className="text-brand-green font-mono font-bold text-lg">${data.tp1}</span>
           </div>
           <div className="flex justify-between items-center border-b border-dark-700 pb-3">
             <span className="text-gray-400 text-sm">Alvo 2 (R:R {data.rr2})</span>
             <span className="text-brand-green font-mono font-bold text-lg">${data.tp2}</span>
           </div>
           <div className="flex justify-between items-center">
             <span className="text-gray-400 text-sm">Alvo 3 (R:R {data.rr3})</span>
             <span className="text-brand-green font-mono font-bold text-lg">${data.tp3}</span>
           </div>
        </div>
      </div>

      {/* Abas Narrativas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
           <h3 className="text-brand-gold font-bold text-lg mb-4 flex items-center gap-2">
             <Target className="w-5 h-5" /> Tese do Trade
           </h3>
           <p className="text-gray-300 leading-relaxed">{data.thesis}</p>
           
           <div className="mt-6 space-y-4">
             <div className="bg-dark-900 p-4 rounded-lg border-l-4 border-brand-green">
               <h4 className="font-bold text-brand-green text-sm mb-1">Cenário de Alta (Bull Case)</h4>
               <p className="text-xs text-gray-400">{data.bull_case}</p>
             </div>
             <div className="bg-dark-900 p-4 rounded-lg border-l-4 border-brand-red">
               <h4 className="font-bold text-brand-red text-sm mb-1">Cenário de Baixa (Bear Case)</h4>
               <p className="text-xs text-gray-400">{data.bear_case}</p>
             </div>
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
              <h3 className="text-brand-cyan font-bold text-lg mb-4 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" /> Gestão de Risco
              </h3>
              <ul className="space-y-2">
                {data.risk_factors.map((risk, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                    <AlertTriangle className="w-4 h-4 text-brand-red shrink-0 mt-0.5" />
                    {risk}
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t border-dark-700 grid grid-cols-2 gap-4">
                 <div>
                    <span className="text-xs text-gray-500 block">Tamanho Posição</span>
                    <span className="font-mono text-brand-gold">{data.position_size.toFixed(4)}</span>
                 </div>
                 <div>
                    <span className="text-xs text-gray-500 block">Trailing Stop</span>
                    <span className="font-mono text-white">{data.trailing_stop_pct}%</span>
                 </div>
              </div>
           </div>

           <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
              <h3 className="text-brand-green font-bold text-lg mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" /> Forças / Confluências
              </h3>
              <ul className="space-y-2">
                {data.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
                    {str}
                  </li>
                ))}
              </ul>
           </div>
        </div>
      </div>
      
      {/* Plano de Execução */}
      <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
        <h3 className="text-white font-bold text-lg mb-2">Gatilho de Execução</h3>
        <div className="bg-dark-900 p-4 rounded font-mono text-brand-cyan text-sm border border-brand-cyan/20">
          {data.trigger_conditions}
        </div>
      </div>

    </div>
  );
};