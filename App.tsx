
import React, { useState, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import { GameStatus } from './types';
import { getGameCommentary } from './services/geminiService';

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [lastScore, setLastScore] = useState(0);
  const [lastDistance, setLastDistance] = useState(0);
  const [aiComment, setAiComment] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const handleGameOver = useCallback(async (score: number, distance: number) => {
    setStatus(GameStatus.GAMEOVER);
    setLastScore(score);
    setLastDistance(distance);
    setIsLoadingAi(true);
    setAiComment('');
    
    const comment = await getGameCommentary(score, distance);
    setAiComment(comment);
    setIsLoadingAi(false);
  }, []);

  const startGame = () => {
    setStatus(GameStatus.PLAYING);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-950 text-white">
      <header className="mb-6 text-center">
        <h1 className="text-4xl md:text-5xl font-game font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent drop-shadow-lg">
          TURBO RACER 2.0
        </h1>
        <p className="text-slate-400 mt-2">Dodge obstacles, increase speed, survive.</p>
      </header>

      <main className="relative flex flex-col items-center">
        <GameCanvas status={status} onGameOver={handleGameOver} />

        {/* Overlays */}
        {status === GameStatus.IDLE && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl p-6 text-center z-10">
            <h2 className="text-2xl font-game mb-4 text-white">READY TO DRIVE?</h2>
            <p className="text-slate-300 mb-8 max-w-xs">Use Arrow Keys or WASD to steer. Avoid other vehicles.</p>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/30"
            >
              START ENGINE
            </button>
          </div>
        )}

        {status === GameStatus.GAMEOVER && (
          <div className="absolute inset-0 bg-red-900/40 backdrop-blur-md flex flex-col items-center justify-center rounded-xl p-6 text-center animate-in fade-in zoom-in duration-300 z-10">
            <h2 className="text-4xl font-game font-bold text-red-400 mb-2">CRASH!</h2>
            <div className="mb-6 space-y-1">
              <p className="text-xl">Score: <span className="font-bold text-white">{lastScore}</span></p>
              <p className="text-slate-200">Distance: <span className="font-bold text-white">{Math.floor(lastDistance)}m</span></p>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-700 mb-8 w-full max-w-[280px]">
              <p className="text-xs text-blue-400 font-bold uppercase tracking-widest mb-2">AI Feedback</p>
              {isLoadingAi ? (
                <div className="flex space-x-1 justify-center py-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-.1s]"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-.2s]"></div>
                </div>
              ) : (
                <p className="text-slate-100 italic">"{aiComment}"</p>
              )}
            </div>

            <button
              onClick={startGame}
              className="px-8 py-3 bg-white text-slate-950 hover:bg-slate-200 rounded-full font-bold transition-all transform hover:scale-105 active:scale-95 shadow-xl"
            >
              RETRY
            </button>
          </div>
        )}
      </main>

      <footer className="mt-8 text-slate-500 text-sm flex gap-4">
        <span>⬅️ / A to Left</span>
        <span>➡️ / D to Right</span>
      </footer>
    </div>
  );
};

export default App;
