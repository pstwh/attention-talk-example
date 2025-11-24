import React, { useState, useEffect, useRef } from 'react';
import VisualizationCanvas from './VisualizationCanvas';
import { Token, AttentionWeight } from '../types';
import { getCrossAttentionScenario } from '../services/geminiService';

const CrossAttentionMode: React.FC = () => {
  // Changed to an example that demonstrates Adjective-Noun inversion (The "Cross" in Cross Attention)
  const DEFAULT_SOURCE = "O gato preto saltou sobre o muro alto.";
  const DEFAULT_TARGET = "The black cat jumped over the high wall.";

  const [sourceText, setSourceText] = useState(DEFAULT_SOURCE);
  const [targetText, setTargetText] = useState(DEFAULT_TARGET);
  
  const [sourceTokens, setSourceTokens] = useState<Token[]>([]);
  const [fullTargetTokens, setFullTargetTokens] = useState<Token[]>([]);
  const [generatedTokens, setGeneratedTokens] = useState<Token[]>([]);
  const [weights, setWeights] = useState<AttentionWeight[]>([]);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  const [activeToken, setActiveToken] = useState<number | null>(null);
  const [hoveredToken, setHoveredToken] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const fetchAndSetScenario = async (source?: string, target?: string) => {
      setLoading(true);
      pauseGeneration();
      resetGeneration();
      
      try {
          const data = await getCrossAttentionScenario(source, target);
          
          setSourceText(data.source);
          setTargetText(data.target);
          
          const sTokens = data.source.split(" ").map((t, i) => ({ id: `source-${i}`, text: t, index: i }));
          const tTokens = data.target.split(" ").map((t, i) => ({ id: `target-${i}`, text: t, index: i }));
          
          setSourceTokens(sTokens);
          setFullTargetTokens(tTokens);
          setGeneratedTokens([]); 
          
          const newWeights: AttentionWeight[] = [];
          if (data.alignment && data.alignment.length) {
              data.alignment.forEach((row, tIdx) => {
                  row.forEach((val, sIdx) => {
                      if (val > 0.01) {
                         newWeights.push({
                             sourceIndex: tIdx,
                             targetIndex: sIdx,
                             weight: val
                         });
                      }
                  });
              });
          }
          setWeights(newWeights);
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  const resetGeneration = () => {
      setGeneratedTokens([]);
      setCurrentStep(0);
      setIsComplete(false);
      setActiveToken(null);
      setIsPlaying(false);
  };

  const pauseGeneration = () => {
      setIsPlaying(false);
  };

  const stepGeneration = () => {
      if (currentStep >= fullTargetTokens.length) {
          setIsComplete(true);
          setIsPlaying(false);
          return;
      }

      const nextToken = fullTargetTokens[currentStep];
      setGeneratedTokens(prev => [...prev, nextToken]);
      setActiveToken(nextToken.index);
      setCurrentStep(prev => prev + 1);
      
      if (currentStep + 1 >= fullTargetTokens.length) {
          setIsComplete(true);
          setIsPlaying(false);
      }
  };

  useEffect(() => {
      let interval: any;
      if (isPlaying && !isComplete) {
          interval = setInterval(() => {
              stepGeneration();
          }, 1500);
      }
      return () => clearInterval(interval);
  }, [isPlaying, isComplete, currentStep, fullTargetTokens]);

  useEffect(() => {
      fetchAndSetScenario(DEFAULT_SOURCE, DEFAULT_TARGET);
  }, []);

  useEffect(() => {
      const updateDims = () => {
          if(containerRef.current) {
              setDimensions({
                  width: containerRef.current.offsetWidth,
                  height: containerRef.current.offsetHeight
              });
          }
      };
      window.addEventListener('resize', updateDims);
      updateDims();
      setTimeout(updateDims, 100); 
      return () => window.removeEventListener('resize', updateDims);
  }, [generatedTokens, sourceTokens]);

  const getAttentionIntensity = (sourceIndex: number) => {
      const relevantIndex = hoveredToken !== null ? hoveredToken : activeToken;
      if (relevantIndex === null) return 0;
      
      const w = weights.find(w => w.sourceIndex === relevantIndex && w.targetIndex === sourceIndex);
      return w ? w.weight : 0;
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
         <div className="lg:col-span-12 bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-xl shadow-blue-100/50 border border-white flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex-1">
                <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
                    Geração <span className="wavy-underline decoration-blue-400">Token a Token</span>
                </h2>
                <p className="text-slate-600 max-w-3xl">
                    Observe a <strong className="text-blue-600">Inversão de Adjetivos</strong>. 
                    Para gerar "Black" (antes de Cat), o modelo precisa olhar para "Preto" (depois de Gato) na frase original.
                </p>
            </div>

            <div className="flex items-center gap-3">
                 <button 
                    onClick={() => {
                        if (isComplete) resetGeneration();
                        setIsPlaying(!isPlaying);
                    }}
                    className={`
                        flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-md
                        ${isPlaying 
                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200' 
                            : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/20'
                        }
                    `}
                 >
                    {isPlaying ? (
                        <>PAUSAR</>
                    ) : (
                        <>{isComplete || generatedTokens.length === 0 ? 'INICIAR GERAÇÃO' : 'CONTINUAR'}</>
                    )}
                 </button>

                 <button 
                    onClick={stepGeneration}
                    disabled={isPlaying || isComplete}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-xl font-semibold disabled:opacity-50"
                 >
                    +1 Token
                 </button>
                 
                 <button 
                    onClick={() => { pauseGeneration(); resetGeneration(); }}
                    className="text-slate-400 hover:text-slate-600 px-4 py-3 font-medium"
                 >
                    Resetar
                 </button>
            </div>
        </div>

        <div className="lg:col-span-12">
            <div 
                ref={containerRef}
                className="relative bg-white rounded-3xl min-h-[550px] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-visible flex flex-col justify-between py-16 px-10"
            >
                <VisualizationCanvas 
                    width={dimensions.width}
                    height={dimensions.height}
                    tokens={sourceTokens.concat(generatedTokens)}
                    targetTokens={generatedTokens}
                    weights={weights}
                    activeTokenIndex={activeToken}
                    hoveredTokenIndex={hoveredToken}
                    isCrossAttention={true}
                />

                {/* Source (Encoder) Layer */}
                <div className="relative z-20">
                    <div className="absolute -top-8 left-0 text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                        Encoder (Português)
                    </div>
                    <div className="flex justify-center gap-x-4 gap-y-4 flex-wrap">
                        {sourceTokens.map((token) => {
                            const intensity = getAttentionIntensity(token.index);
                            return (
                                <div
                                    key={token.id}
                                    data-token-id={token.id}
                                    data-layer="source"
                                    className={`
                                        transition-all duration-300 border-2 px-4 py-2 rounded-xl text-lg font-medium whitespace-nowrap
                                        ${intensity > 0.1 
                                            ? `bg-pink-50 border-pink-500 text-pink-700 shadow-[0_0_20px_rgba(236,72,153,0.3)] scale-105` 
                                            : 'bg-slate-50 border-slate-200 text-slate-500'
                                        }
                                    `}
                                    style={{
                                        opacity: intensity > 0 ? 0.6 + (intensity * 0.4) : 0.6
                                    }}
                                >
                                    {token.text}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Arrow Indicator */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-300 animate-float">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
                </div>

                {/* Target (Decoder) Layer */}
                <div className="relative z-20 min-h-[100px]">
                     <div className="absolute -bottom-10 left-0 text-xs font-extrabold text-brand-500 uppercase tracking-widest">
                        Decoder (Inglês)
                     </div>
                     
                     <div className="flex justify-center items-center gap-3 flex-wrap">
                        {generatedTokens.map((token) => (
                            <div
                                key={token.id}
                                data-token-id={token.id}
                                data-layer="target"
                                onMouseEnter={() => setHoveredToken(token.index)}
                                onMouseLeave={() => setHoveredToken(null)}
                                onClick={() => setActiveToken(activeToken === token.index ? null : token.index)}
                                className={`
                                    cursor-pointer px-4 py-2 rounded-xl text-lg font-bold transition-all duration-500 animate-in zoom-in-50 whitespace-nowrap
                                    border-2
                                    ${activeToken === token.index || hoveredToken === token.index
                                        ? 'bg-brand-600 border-brand-600 text-white shadow-xl shadow-brand-500/40 -translate-y-2 scale-110 z-30'
                                        : 'bg-white border-slate-200 text-slate-800 hover:border-brand-300'
                                    }
                                `}
                            >
                                {token.text}
                            </div>
                        ))}
                        
                        {!isComplete && (
                            <div className="w-1 h-8 bg-brand-500 animate-pulse ml-1"></div>
                        )}
                     </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default CrossAttentionMode;