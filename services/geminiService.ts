import { GoogleGenAI } from "@google/genai";
import { MarketData, AISignalResponse } from '../types';

export const getGeminiSignal = async (
  apiKey: string,
  modelName: string,
  symbol: string,
  capital: number,
  risk: number,
  marketData: MarketData[]
): Promise<AISignalResponse> => {
  
  const ai = new GoogleGenAI({ apiKey });

  // Prepare Compact JSON for the prompt
  const dataPayload = marketData.reduce((acc, md) => {
    acc[md.timeframe] = {
      price: md.currentPrice,
      indicators: md.indicators
    };
    return acc;
  }, {} as Record<string, any>);

  const prompt = `
    Você é um estrategista sênior de Algo-Trading de Criptomoedas especializado em gestão de risco e análise técnica institucional.
    Analise o ativo ${symbol} considerando um capital de $${capital} e risco por operação de ${risk}%.

    DADOS TÉCNICOS FORNECIDOS (Múltiplos Timeframes):
    ${JSON.stringify(dataPayload, null, 2)}

    TAREFA:
    Forneça um sinal de trading profissional baseado estritamente nos dados fornecidos.
    
    ESTILO DE RESPOSTA:
    Responda em tom informal, utilizando explicações didáticas e analogias criativas para facilitar o entendimento dos movimentos do mercado (ex: "o preço está esticado como um elástico", "os ursos estão hibernando"). Seja direto, mas educativo.

    IDIOMA DE SAÍDA:
    Português do Brasil (pt-BR) para todos os campos de texto.

    FORMATO DE SAÍDA:
    Responda APENAS com um objeto JSON válido (sem markdown, sem blocos de código) seguindo estritamente esta estrutura:
    {
      "verdict": "LONG|SHORT|NEUTRAL",
      "confidence": 0-100,
      "side": "long|short|null",
      "mode": "continuation|pullback|reversal|scalp",
      "entry": number,
      "entry_zone_low": number,
      "entry_zone_high": number,
      "sl": number,
      "sl_reasoning": "Explicação técnica curta do Stop Loss (EM PT-BR)",
      "tp1": number,
      "tp1_reasoning": "Explicação técnica do alvo 1 (EM PT-BR)",
      "tp2": number,
      "tp3": number,
      "rr1": number,
      "rr2": number,
      "rr3": number,
      "position_size": number,
      "leverage": number (1-20),
      "trailing_stop_pct": number,
      "trigger_conditions": "Gatilho exato para entrada (EM PT-BR)",
      "market_narrative": "Análise detalhada do macro e micro, explicando o porquê da decisão com analogias (EM PT-BR)",
      "timeframe_conflict": "Análise de alinhamento ou conflito entre os timeframes analisados (EM PT-BR)",
      "thesis": "A tese principal do trade resumida de forma criativa (EM PT-BR)",
      "bull_case": "Cenário altista (EM PT-BR)",
      "bear_case": "Cenário baixista (EM PT-BR)",
      "risk_factors": ["Fator de risco 1 (EM PT-BR)", "Fator de risco 2 (EM PT-BR)"],
      "strengths": ["Ponto forte 1 (EM PT-BR)", "Ponto forte 2 (EM PT-BR)"]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        temperature: 0.5, // Aumentado levemente para permitir criatividade nas analogias
        // Force JSON output if supported by the model features, otherwise the prompt instruction handles it
        responseMimeType: "application/json", 
      }
    });

    const text = response.text;
    if (!text) throw new Error("Resposta vazia do Gemini");

    // Clean markdown if present (just in case)
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanJson) as AISignalResponse;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Falha ao gerar análise da IA. Verifique sua API Key e cotas.");
  }
};