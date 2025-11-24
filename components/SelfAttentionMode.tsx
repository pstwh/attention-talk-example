import React, { useState, useEffect, useRef } from 'react';
import VisualizationCanvas from './VisualizationCanvas';
import { Token, AttentionWeight } from '../types';
import { analyzeSelfAttention } from '../services/geminiService';

const PRESET_SENTENCES = [
    "A costureira consertou a manga da camisa enquanto comia uma manga doce.",
    "O banco de madeira estava no jardim perto do banco financeiro.",
    "Conhecimento, paixão e muito trabalho são os pilares fundamentais.",
    "A inteligência artificial transforma o mundo rapidamente."
];

const SelfAttentionMode: React.FC = () => {
    const [inputText, setInputText] = useState(PRESET_SENTENCES[0]);
    const [tokens, setTokens] = useState<Token[]>([]);
    const [weights, setWeights] = useState<AttentionWeight[]>([]);
    const [activeToken, setActiveToken] = useState<number | null>(null);
    const [hoveredToken, setHoveredToken] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [explanation, setExplanation] = useState<string>("");
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    const processSentence = async () => {
        setLoading(true);
        try {
            const rawTokens = inputText.trim().split(/\s+/);
            const uiTokens = rawTokens.map((t, i) => ({ id: `token-${i}`, text: t, index: i }));
            setTokens(uiTokens);

            const data = await analyzeSelfAttention(inputText);

            const newWeights: AttentionWeight[] = [];
            if (data.matrix && data.matrix.length) {
                data.matrix.forEach((row: number[], sourceIdx: number) => {
                    row.forEach((val: number, targetIdx: number) => {
                        // Causal Mask: Token can only attend to previous tokens
                        if (targetIdx > sourceIdx) return;

                        if (val > 0.01) {
                            newWeights.push({
                                sourceIndex: sourceIdx,
                                targetIndex: targetIdx,
                                weight: val
                            });
                        }
                    });
                });
            }
            setWeights(newWeights);
            setExplanation(data.explanation);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        processSentence();
    }, []);

    useEffect(() => {
        const updateDims = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                });
            }
        };
        window.addEventListener('resize', updateDims);
        updateDims();
        return () => window.removeEventListener('resize', updateDims);
    }, []);

    return (
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Controls & Explanation */}
            <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-xl shadow-indigo-100/50 border border-white">
                    <h2 className="text-3xl font-extrabold mb-6 text-slate-900 leading-tight">
                        Auto-Atenção <br />
                        <span className="wavy-underline decoration-brand-500/30">Mascarada</span>
                    </h2>

                    <p className="text-slate-600 mb-8 leading-relaxed text-lg">
                        Para entender o significado de uma palavra, o modelo precisa olhar para o contexto anterior.
                        <br /><br />
                        <span className="text-slate-900 font-semibold">Como ele sabe a diferença?</span>
                        <br />
                        Na frase ao lado, a palavra <span className="text-brand-600 font-bold">"manga"</span> aparece duas vezes.
                        Passe o mouse sobre elas para ver como o modelo olha para <strong>"camisa"</strong> ou <strong>"comia"</strong> para definir se é roupa ou fruta.
                    </p>

                    <div className="flex flex-col gap-4">
                        <div className="relative group">
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-4 text-slate-700 font-medium focus:outline-none focus:border-brand-500 focus:ring-0 transition-all resize-none h-32"
                                placeholder="Digite uma frase..."
                            />
                            <div className="absolute bottom-3 right-3">
                                <button
                                    onClick={processSentence}
                                    disabled={loading}
                                    className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-brand-500/20 flex items-center gap-2"
                                >
                                    {loading ? (
                                        <span className="animate-spin">⟳</span>
                                    ) : (
                                        <span>ANALIZE <span className="ml-1">↗</span></span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <span className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-3 block">Exemplos de Ambiguidade</span>
                        <div className="flex flex-wrap gap-2">
                            {PRESET_SENTENCES.slice(0, 3).map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => { setInputText(s); setTimeout(processSentence, 10); }}
                                    className="text-xs bg-white hover:bg-brand-50 text-slate-600 hover:text-brand-600 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors font-medium text-left"
                                >
                                    {s.substring(0, 35)}...
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {explanation && (
                    <div className="bg-indigo-50 rounded-3xl p-6 border border-indigo-100">
                        <h3 className="text-brand-800 font-bold mb-2 uppercase tracking-wide text-xs">Insight do Modelo</h3>
                        <p className="text-slate-700 text-sm leading-relaxed">
                            {explanation}
                        </p>
                    </div>
                )}
            </div>

            {/* Right Column: Visualization */}
            <div className="lg:col-span-8">
                <div
                    ref={containerRef}
                    className="relative bg-white rounded-3xl min-h-[600px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col items-center justify-center p-12"
                >
                    {/* Visualization Canvas */}
                    <VisualizationCanvas
                        width={dimensions.width}
                        height={dimensions.height}
                        tokens={tokens}
                        weights={weights}
                        activeTokenIndex={activeToken}
                        hoveredTokenIndex={hoveredToken}
                    />

                    {/* Tokens */}
                    <div className="relative z-20 flex flex-wrap justify-center gap-x-6 gap-y-12 max-w-4xl">
                        {tokens.map((token) => (
                            <div
                                key={token.id}
                                data-token-id={token.id}
                                onMouseEnter={() => setHoveredToken(token.index)}
                                onMouseLeave={() => setHoveredToken(null)}
                                onClick={() => setActiveToken(activeToken === token.index ? null : token.index)}
                                className={`
                            cursor-pointer px-5 py-3 rounded-2xl text-xl font-semibold transition-all duration-300 select-none
                            border-2
                            ${activeToken === token.index
                                        ? 'bg-brand-600 border-brand-600 text-white shadow-xl shadow-brand-500/40 scale-110'
                                        : hoveredToken === token.index
                                            ? 'bg-white border-brand-200 text-brand-600 shadow-lg scale-105'
                                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                                    }
                        `}
                            >
                                {token.text}

                                {/* Connector Dot for visualization anchor */}
                                <div className={`absolute top-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white ${activeToken === token.index ? 'bg-brand-300' : 'bg-slate-300'} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                            </div>
                        ))}
                    </div>

                    <div className="absolute bottom-8 text-center">
                        <p className="text-slate-400 text-sm font-medium">
                            Passe o mouse sobre a palavra <span className="text-brand-500 font-bold">"manga"</span> para ver o contexto
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SelfAttentionMode;