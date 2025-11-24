import React from 'react';

const GameControls: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto mt-10 p-12 bg-white/90 backdrop-blur border border-white rounded-3xl text-center shadow-2xl shadow-indigo-200/50">
        <h2 className="text-3xl font-extrabold text-slate-900 mb-6">Modo Playground</h2>
        <p className="text-slate-600 mb-8 text-lg leading-relaxed max-w-2xl mx-auto">
            Em breve você poderá assumir o papel da <strong className="text-brand-600">Cabeça de Atenção</strong>. 
            Conecte as palavras manualmente e veja se consegue superar o modelo.
        </p>
        
        <button className="bg-slate-900 text-white font-bold px-10 py-4 rounded-2xl hover:scale-105 transition-transform shadow-xl">
            Iniciar Desafio
        </button>
        
        <div className="mt-12 grid grid-cols-3 gap-6 opacity-50 pointer-events-none">
            <div className="h-40 bg-slate-100 rounded-2xl animate-pulse"></div>
            <div className="h-40 bg-slate-100 rounded-2xl animate-pulse delay-100"></div>
            <div className="h-40 bg-slate-100 rounded-2xl animate-pulse delay-200"></div>
        </div>
    </div>
  );
};

export default GameControls;