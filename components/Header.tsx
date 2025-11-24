import React from 'react';
import { GameMode } from '../types';

interface HeaderProps {
  currentMode: GameMode;
  setMode: (mode: GameMode) => void;
  hasApiKey: boolean;
}

const Header: React.FC<HeaderProps> = ({ currentMode, setMode }) => {
  return (
    <header className="w-full py-6 px-8 flex flex-col md:flex-row justify-between items-center sticky top-0 z-50 bg-white/60 backdrop-blur-md border-b border-slate-200/50 transition-all duration-300">
      <div className="flex items-center gap-3 mb-4 md:mb-0">
        {/* Replaced Microphone with a clean Abstract shape or simple text block */}
        <div className="flex flex-col">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">
            Exemplos de Atenção
          </h1>
        </div>
      </div>

      <nav className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-full border border-slate-200 shadow-inner">
        <button
          onClick={() => setMode(GameMode.SELF_ATTENTION)}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${currentMode === GameMode.SELF_ATTENTION ? 'bg-white text-brand-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Auto-Atenção
        </button>
        <button
          onClick={() => setMode(GameMode.CROSS_ATTENTION)}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${currentMode === GameMode.CROSS_ATTENTION ? 'bg-white text-brand-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Atenção Cruzada
        </button>
        {/* <button
          onClick={() => setMode(GameMode.PLAYGROUND)}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${currentMode === GameMode.PLAYGROUND ? 'bg-white text-brand-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Playground
        </button> */}
      </nav>
    </header>
  );
};

export default Header;