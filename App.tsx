import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SelfAttentionMode from './components/SelfAttentionMode';
import CrossAttentionMode from './components/CrossAttentionMode';
import GameControls from './components/GameControls';
import { GameMode } from './types';

const App: React.FC = () => {
  const [mode, setMode] = useState<GameMode>(GameMode.SELF_ATTENTION);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {

  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#eef2ff] to-[#e0e7ff] text-slate-900 font-sans selection:bg-brand-200 relative overflow-hidden">

      {/* Background Watermark mimicking the "15" in the reference */}
      <div className="fixed right-[-5%] bottom-[-10%] text-[40rem] font-extrabold text-slate-200/50 leading-none pointer-events-none select-none z-0 font-sans tracking-tighter">
        AI
      </div>
      <div className="fixed left-[-10%] top-[10%] text-[20rem] font-extrabold text-indigo-50/80 leading-none pointer-events-none select-none z-0 font-sans tracking-tighter rotate-12">
        Attention
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header
          currentMode={mode}
          setMode={setMode}
          hasApiKey={hasApiKey}
        />

        <main className="flex-grow flex flex-col items-center justify-start pt-4 pb-20 px-4 md:px-8">
          <div className="w-full max-w-7xl">
            {mode === GameMode.SELF_ATTENTION && <SelfAttentionMode />}
            {mode === GameMode.CROSS_ATTENTION && <CrossAttentionMode />}
            {mode === GameMode.PLAYGROUND && <GameControls />}
          </div>
        </main>

        <footer className="w-full p-6 text-center text-slate-400 text-sm border-t border-slate-200 bg-white/40 backdrop-blur-sm">
          Visualização de Mecanismos de Atenção
        </footer>
      </div>
    </div>
  );
};

export default App;