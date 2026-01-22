
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameStatus, Car, Obstacle, GameState } from '../types';

interface GameCanvasProps {
  status: GameStatus;
  onGameOver: (score: number, distance: number) => void;
}

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const LANE_WIDTH = CANVAS_WIDTH / 3;
const INITIAL_SPEED = 5;
const CAR_WIDTH = 50;
const CAR_HEIGHT = 80;

const GameCanvas: React.FC<GameCanvasProps> = ({ status, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  // Game state refs (to avoid stale closures in requestAnimationFrame)
  const carRef = useRef<Car>({
    x: LANE_WIDTH + (LANE_WIDTH - CAR_WIDTH) / 2,
    y: CANVAS_HEIGHT - CAR_HEIGHT - 40,
    width: CAR_WIDTH,
    height: CAR_HEIGHT,
    color: '#3b82f6',
    speed: 0,
    lane: 1
  });
  
  const obstaclesRef = useRef<Obstacle[]>([]);
  const scrollRef = useRef(0);
  const gameStateRef = useRef<GameState>({
    score: 0,
    distance: 0,
    speedMultiplier: 1,
    status: status
  });

  const keysRef = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => (keysRef.current[e.code] = true);
    const handleKeyUp = (e: KeyboardEvent) => (keysRef.current[e.code] = false);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const spawnObstacle = useCallback(() => {
    const lane = Math.floor(Math.random() * 3);
    const newObstacle: Obstacle = {
      x: lane * LANE_WIDTH + (LANE_WIDTH - 40) / 2,
      y: -100,
      width: 40,
      height: 70,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      speed: 4 * gameStateRef.current.speedMultiplier
    };
    obstaclesRef.current.push(newObstacle);
  }, []);

  const resetGame = useCallback(() => {
    carRef.current.x = LANE_WIDTH + (LANE_WIDTH - CAR_WIDTH) / 2;
    obstaclesRef.current = [];
    scrollRef.current = 0;
    gameStateRef.current = {
      score: 0,
      distance: 0,
      speedMultiplier: 1,
      status: GameStatus.PLAYING
    };
  }, []);

  const update = useCallback(() => {
    if (gameStateRef.current.status !== GameStatus.PLAYING) return;

    // Movement logic
    const moveSpeed = 6;
    if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) {
      carRef.current.x = Math.max(0, carRef.current.x - moveSpeed);
    }
    if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) {
      carRef.current.x = Math.min(CANVAS_WIDTH - CAR_WIDTH, carRef.current.x + moveSpeed);
    }

    // Scroll and progression
    const currentGlobalSpeed = INITIAL_SPEED * gameStateRef.current.speedMultiplier;
    scrollRef.current = (scrollRef.current + currentGlobalSpeed) % 100;
    gameStateRef.current.distance += currentGlobalSpeed / 60;
    gameStateRef.current.score += 1;
    gameStateRef.current.speedMultiplier += 0.0002;

    // Obstacle logic
    if (Math.random() < 0.015) spawnObstacle();

    obstaclesRef.current = obstaclesRef.current.filter(obs => {
      obs.y += currentGlobalSpeed;
      
      // Collision detection
      if (
        carRef.current.x < obs.x + obs.width &&
        carRef.current.x + carRef.current.width > obs.x &&
        carRef.current.y < obs.y + obs.height &&
        carRef.current.y + carRef.current.height > obs.y
      ) {
        gameStateRef.current.status = GameStatus.GAMEOVER;
        onGameOver(gameStateRef.current.score, gameStateRef.current.distance);
        return false;
      }
      return obs.y < CANVAS_HEIGHT;
    });
  }, [onGameOver, spawnObstacle]);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    // Clear
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Road Lines
    ctx.setLineDash([40, 40]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(LANE_WIDTH, -100 + scrollRef.current);
    ctx.lineTo(LANE_WIDTH, CANVAS_HEIGHT + 100);
    ctx.moveTo(LANE_WIDTH * 2, -100 + scrollRef.current);
    ctx.lineTo(LANE_WIDTH * 2, CANVAS_HEIGHT + 100);
    ctx.stroke();

    // Draw Car
    const car = carRef.current;
    // Body shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(car.x + 5, car.y + 5, car.width, car.height);
    
    // Main Body
    ctx.fillStyle = car.color;
    ctx.fillRect(car.x, car.y, car.width, car.height);
    
    // Windshield
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(car.x + 5, car.y + 10, car.width - 10, 20);
    
    // Headlights
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(car.x + 5, car.y - 5, 10, 5);
    ctx.fillRect(car.x + car.width - 15, car.y - 5, 10, 5);

    // Tail lights
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(car.x + 5, car.y + car.height, 10, 4);
    ctx.fillRect(car.x + car.width - 15, car.y + car.height, 10, 4);

    // Draw Obstacles
    obstaclesRef.current.forEach(obs => {
      ctx.fillStyle = obs.color;
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      // Detail for obstacle
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(obs.x + 4, obs.y + 4, obs.width - 8, obs.height - 8);
    });

    // Score UI Overlay
    ctx.setLineDash([]);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Inter';
    ctx.fillText(`SCORE: ${gameStateRef.current.score}`, 20, 30);
    ctx.fillText(`SPD: ${(INITIAL_SPEED * gameStateRef.current.speedMultiplier).toFixed(1)}x`, 20, 50);
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      update();
      draw(ctx);
    }
    requestRef.current = requestAnimationFrame(animate);
  }, [update, draw]);

  useEffect(() => {
    gameStateRef.current.status = status;
    if (status === GameStatus.PLAYING) {
      resetGame();
    }
  }, [status, resetGame]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  return (
    <div className="relative border-4 border-slate-700 rounded-xl overflow-hidden shadow-2xl bg-slate-900">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="block"
      />
    </div>
  );
};

export default GameCanvas;
