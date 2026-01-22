
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-950">
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl p-6 text-center">
            <h2 className="text-2xl font-game mb-4">READY TO DRIVE?</h2>
            <p className="text-slate-300 mb-8 max-w-xs">Use Arrow Keys or WASD to steer. Avoid other vehicles.</p>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-