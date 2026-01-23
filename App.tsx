
import React, { useState, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import { GameStatus, CAR_SKINS } from './types';
import { getGameCommentary } from './services/geminiService';

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [selectedSkinId, setSelectedSkinId] = useState(CAR_SKINS[0].id);
  const [results, setResults] = useState({ score: 0, distance: 0, level: 1, hp: 0 });
  const [aiComment, setAiComment] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const handleGameOver = useCallback(async (score: number, distance: number, level: number, hp: number) => {
    setStatus(GameStatus.GAMEOVER);
    setResults({ score, distance, level, hp });
    setIsLoadingAi(true);
    setAiComment('');
    
    const comment = await getGameCommentary(score, distance, level, hp);
    setAiComment(comment);
    setIsLoadingAi(false);
  }, []);

  const togglePause = useCallback(() => {
    setStatus(prev => {
      if (prev === GameStatus.PLAYING) return GameStatus.PAUSED;
      if (prev === GameStatus.PAUSED) return GameStatus.PLAYING;
      return prev;
    });
  }, []);

  const startGame = () => {
    setStatus(GameStatus.PLAYING);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-stone-950 text-stone-100 font-mono">
      <header className="mb-4 text-center">
        <h1 className="text-4xl font-game font-bold text-amber-500 drop-shadow-[4px_4px_0px_rgba(0,0,0,1)] uppercase tracking-tighter">
          RETRO THAR ARCADE
        </h1>
        <p className="text-sky-400 font-bold text-[10px] uppercase mt-1 tracking-widest">
          EST. 1989 • PAST PERSPECTIVE MODE
        </p>
      </header>

      <main className="relative flex flex-col items-center">
        <GameCanvas 
          status={status} 
          selectedSkinId={selectedSkinId}
          onGameOver={handleGameOver} 
          onTogglePause={togglePause}
        />

        {status === GameStatus.IDLE && (
          <div className="absolute inset-0 bg-stone-900/98 flex flex-col items-center justify-center rounded-lg p-8 text-center z-10 border-4 border-stone-800">
            <h2 className="text-xl font-game mb-6 text-white uppercase italic">INSERT COIN</h2>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {CAR_SKINS.map((skin) => (
                <button
                  key={skin.id}
                  onClick={() => setSelectedSkinId(skin.id)}
                  className={`p-3 border-4 transition-all ${
                    selectedSkinId === skin.id ? 'border-amber-500 bg-amber-950/40' : 'border-stone-800'
                  }`}
                >
                  <div className="w-10 h-6 mx-auto mb-2 border-2 border-white/20" style={{ backgroundColor: skin.primary }} />
                  <span className="text-[10px] font-bold uppercase text-stone-300">{skin.name}</span>
                </button>
              ))}
            </div>
            <button 
              onClick={startGame} 
              className="px-10 py-4 bg-amber-500 hover:bg-amber-400 text-black font-black border-b-8 border-amber-700 active:border-b-0 active:translate-y-2 transition-all font-game"
            >
              START MISSION
            </button>
          </div>
        )}

        {status === GameStatus.GAMEOVER && (
          <div className="absolute inset-0 bg-red-950/95 flex flex-col items-center justify-center rounded-lg p-8 text-center z-10 border-4 border-red-800">
            <h2 className="text-4xl font-game text-white mb-6 animate-pulse">GAME OVER</h2>
            <div className="bg-black/50 p-4 rounded-lg border-2 border-stone-800 mb-6 w-full">
              <p className="text-[10px] text-amber-500 uppercase font-black mb-2">Retro-AI Commentary</p>
              {isLoadingAi ? <p className="animate-pulse text-xs text-stone-400">Loading cartridge data...</p> : <p className="text-stone-100 italic text-sm font-serif">"{aiComment}"</p>}
            </div>
            <button onClick={startGame} className="px-10 py-4 bg-white text-black font-black rounded border-b-8 border-stone-400 font-game uppercase">
              TRY AGAIN
            </button>
          </div>
        )}

        {status === GameStatus.PAUSED && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-10">
            <h2 className="text-4xl font-game text-white mb-8 italic">PAUSE</h2>
            <button onClick={togglePause} className="text-xl font-game text-amber-500 border-4 border-amber-500 px-8 py-3 hover:bg-amber-500 hover:text-black transition-colors">CONTINUE</button>
          </div>
        )}
      </main>

      <footer className="mt-6 flex flex-col items-center gap-2 text-[10px] font-black uppercase text-stone-500 tracking-[0.2em]">
        <div className="flex gap-4">
          <span>[W/S] CHANGE LANE</span>
          <span>[P] PAUSE</span>
        </div>
        <p className="opacity-50 mt-2">Veera Bhaahu • Vannamayil Roadways</p>
      </footer>
    </div>
  );
};

export default App;
