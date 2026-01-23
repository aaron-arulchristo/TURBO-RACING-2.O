
import React, { useRef, useEffect, useCallback } from 'react';
import { GameStatus, Car, Obstacle, GameState, ObstacleType, CAR_SKINS } from '../types';

interface GameCanvasProps {
  status: GameStatus;
  selectedSkinId: string;
  onGameOver: (score: number, distance: number, level: number, hp: number) => void;
  onTogglePause: () => void;
}

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const LANE_Y_POSITIONS = [390, 450, 510]; // Slightly adjusted for better road fit
const ROAD_TOP = 360;
const ROAD_HEIGHT = 200;
const INITIAL_SPEED = 6;
const BOOST_DURATION = 3500;
const INVINCIBILITY_DURATION = 2000;

interface GroundSymbol {
  x: number;
  y: number;
  type: 'arrow' | 'text' | 'warning';
  text?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ status, selectedSkinId, onGameOver, onTogglePause }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  
  const carState = useRef({
    lane: 1,
    y: LANE_Y_POSITIONS[1],
    targetY: LANE_Y_POSITIONS[1],
    x: 70,
    hp: 3,
    maxHp: 3,
    invincible: false,
    boostEndTime: 0,
    bounce: 0,
    frame: 0
  });
  
  const obstaclesRef = useRef<Obstacle[]>([]);
  const symbolsRef = useRef<GroundSymbol[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const bgScroll = useRef({ sky: 0, mountains: 0, ground: 0, dash: 0 });
  const lastSpawnRef = useRef(0);
  const lastSymbolSpawnRef = useRef(0);
  const shakeRef = useRef(0);

  const gameStateRef = useRef<GameState>({
    score: 0,
    distance: 0,
    speedMultiplier: 1,
    status: status,
    level: 1,
    hp: 3,
    isBoosting: false
  });

  const keysRef = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === 'KeyP' || e.code === 'Escape') onTogglePause();
      if (gameStateRef.current.status === GameStatus.PLAYING) {
        if (e.code === 'ArrowUp' || e.code === 'KeyW') carState.current.lane = Math.max(0, carState.current.lane - 1);
        if (e.code === 'ArrowDown' || e.code === 'KeyS') carState.current.lane = Math.min(2, carState.current.lane + 1);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => (keysRef.current[e.code] = false);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onTogglePause]);

  const resetGame = useCallback(() => {
    carState.current = {
      lane: 1,
      y: LANE_Y_POSITIONS[1],
      targetY: LANE_Y_POSITIONS[1],
      x: 70,
      hp: 3,
      maxHp: 3,
      invincible: false,
      boostEndTime: 0,
      bounce: 0,
      frame: 0
    };
    obstaclesRef.current = [];
    symbolsRef.current = [];
    particlesRef.current = [];
    bgScroll.current = { sky: 0, mountains: 0, ground: 0, dash: 0 };
    gameStateRef.current = {
      score: 0,
      distance: 0,
      speedMultiplier: 1,
      status: GameStatus.PLAYING,
      level: 1,
      hp: 3,
      isBoosting: false
    };
  }, []);

  const update = useCallback(() => {
    if (gameStateRef.current.status !== GameStatus.PLAYING) return;

    const now = Date.now();
    gameStateRef.current.isBoosting = now < carState.current.boostEndTime;
    
    carState.current.targetY = LANE_Y_POSITIONS[carState.current.lane];
    carState.current.y += (carState.current.targetY - carState.current.y) * 0.25;
    
    const boostFactor = gameStateRef.current.isBoosting ? 2.5 : 1;
    const speed = INITIAL_SPEED * gameStateRef.current.speedMultiplier * boostFactor;
    
    bgScroll.current.sky = (bgScroll.current.sky + speed * 0.05) % CANVAS_WIDTH;
    bgScroll.current.mountains = (bgScroll.current.mountains + speed * 0.2) % CANVAS_WIDTH;
    bgScroll.current.dash = (bgScroll.current.dash + speed) % 80;

    gameStateRef.current.distance += speed * 0.05;
    gameStateRef.current.score += gameStateRef.current.isBoosting ? 5 : 1;
    gameStateRef.current.speedMultiplier += 0.00012;

    carState.current.frame = Math.floor(Date.now() / 100) % 2;
    carState.current.bounce = Math.sin(Date.now() / 40) * 1.5;

    // Symbol Spawning
    if (now - lastSymbolSpawnRef.current > 1000) {
      const typeChance = Math.random();
      if (typeChance < 0.3) {
        symbolsRef.current.push({
          x: CANVAS_WIDTH + 50,
          y: LANE_Y_POSITIONS[Math.floor(Math.random() * 3)],
          type: 'arrow'
        });
      } else if (typeChance < 0.4) {
        symbolsRef.current.push({
          x: CANVAS_WIDTH + 50,
          y: ROAD_TOP + 10,
          type: 'text',
          text: Math.random() > 0.5 ? 'STAY ALERT' : 'GO FAST'
        });
      }
      lastSymbolSpawnRef.current = now;
    }

    // Obstacle Spawning
    if (now - lastSpawnRef.current > 1100 / gameStateRef.current.speedMultiplier) {
      const lane = Math.floor(Math.random() * 3);
      const typeChance = Math.random();
      let type = ObstacleType.TRAFFIC;
      let color = '#ef4444';
      if (typeChance < 0.1) type = ObstacleType.REPAIR;
      else if (typeChance < 0.18) type = ObstacleType.BOOSTER;

      obstaclesRef.current.push({
        x: CANVAS_WIDTH + 50,
        y: LANE_Y_POSITIONS[lane],
        width: 60, height: 40,
        color, speed: Math.random() * 2, type, lane
      });
      lastSpawnRef.current = now;
    }

    // Update Symbols
    symbolsRef.current = symbolsRef.current.filter(s => {
      s.x -= speed;
      return s.x > -150;
    });

    // Update Obstacles
    obstaclesRef.current = obstaclesRef.current.filter(obs => {
      obs.x -= speed + obs.speed;
      const car = carState.current;
      if (obs.lane === car.lane && Math.abs(obs.x - car.x) < 48) {
        if (obs.type === ObstacleType.REPAIR) {
          car.hp = Math.min(car.maxHp, car.hp + 1);
          return false;
        } else if (obs.type === ObstacleType.BOOSTER) {
          car.boostEndTime = Date.now() + BOOST_DURATION;
          return false;
        } else if (!car.invincible && !gameStateRef.current.isBoosting) {
          car.hp -= 1;
          gameStateRef.current.hp = car.hp;
          shakeRef.current = 15;
          if (car.hp <= 0) {
            gameStateRef.current.status = GameStatus.GAMEOVER;
            onGameOver(gameStateRef.current.score, gameStateRef.current.distance, gameStateRef.current.level, car.hp);
          } else {
            car.invincible = true;
            setTimeout(() => car.invincible = false, INVINCIBILITY_DURATION);
          }
          return false;
        } else if (gameStateRef.current.isBoosting) {
          return false; // Smash through
        }
      }
      return obs.x > -100;
    });

    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx; p.y += p.vy; p.life -= 0.05;
      return p.life > 0;
    });

    if (shakeRef.current > 0) shakeRef.current -= 1;
  }, [onGameOver]);

  const drawPixelThar = (ctx: CanvasRenderingContext2D, x: number, y: number, skin: any, isPlayer: boolean) => {
    ctx.save();
    ctx.translate(x, y + (isPlayer ? carState.current.bounce : 0));
    const w = 64;
    const h = 40;
    
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(-w/2 + 4, h/2 - 4, w, 10);

    // Wheels
    ctx.fillStyle = '#000';
    ctx.fillRect(-w/2 + 8, h/2 - 10, 14, 14);
    ctx.fillRect(w/2 - 22, h/2 - 10, 14, 14);

    // Body
    ctx.fillStyle = skin.primary;
    ctx.fillRect(-w/2, 0, w, 18); 
    ctx.fillRect(-w/2 + 10, -14, w - 20, 14);

    // Side Window
    ctx.fillStyle = skin.secondary;
    ctx.fillRect(-w/2 + 15, -10, 25, 8);
    
    // Front Detail
    ctx.fillStyle = '#000';
    ctx.fillRect(w/2 - 4, 4, 4, 10);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(w/2 - 2, 6, 2, 6);

    if (isPlayer && carState.current.invincible && Math.floor(Date.now()/100)%2 === 0) {
      ctx.globalAlpha = 0.3;
    }
    ctx.restore();
  };

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.save();
    if (shakeRef.current > 0) {
      ctx.translate((Math.random() - 0.5) * shakeRef.current, (Math.random() - 0.5) * shakeRef.current);
    }

    // Retro Sky
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(0, 0, CANVAS_WIDTH, 400);

    // Parallax Mountains
    ctx.fillStyle = '#312e81';
    for (let i = -1; i < 2; i++) {
      const x = (i * CANVAS_WIDTH) - bgScroll.current.mountains;
      ctx.beginPath();
      ctx.moveTo(x, 400);
      ctx.lineTo(x + 200, 220);
      ctx.lineTo(x + 400, 400);
      ctx.fill();
    }

    // THREE-WAY TRACK
    // Asphalt Ground
    ctx.fillStyle = '#111827'; 
    ctx.fillRect(0, ROAD_TOP, CANVAS_WIDTH, ROAD_HEIGHT);

    // Guardrails
    ctx.fillStyle = '#4b5563';
    ctx.fillRect(0, ROAD_TOP - 4, CANVAS_WIDTH, 6); // Top Rail
    ctx.fillRect(0, ROAD_TOP + ROAD_HEIGHT - 2, CANVAS_WIDTH, 6); // Bottom Rail
    
    // Lane Dividers (Dashed)
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    const dashW = 40;
    const gapW = 40;
    const laneDivs = [ROAD_TOP + 66, ROAD_TOP + 133];
    laneDivs.forEach(divY => {
      for (let x = -bgScroll.current.dash; x < CANVAS_WIDTH; x += (dashW + gapW)) {
        ctx.fillRect(x, divY, dashW, 4);
      }
    });

    // Symbols on Ground
    symbolsRef.current.forEach(s => {
      ctx.save();
      ctx.translate(s.x, s.y);
      if (s.type === 'arrow') {
        ctx.fillStyle = 'rgba(251, 191, 36, 0.4)';
        ctx.beginPath();
        ctx.moveTo(0, -10); ctx.lineTo(15, 0); ctx.lineTo(0, 10); ctx.lineTo(0, 4); ctx.lineTo(-15, 4); ctx.lineTo(-15, -4); ctx.lineTo(0, -4);
        ctx.fill();
      } else if (s.type === 'text') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.font = 'bold 14px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText(s.text || '', 0, 0);
      }
      ctx.restore();
    });

    // Draw Obstacles
    obstaclesRef.current.sort((a,b) => a.lane - b.lane).forEach(obs => {
      if (obs.type === ObstacleType.REPAIR) {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(obs.x - 12, obs.y - 12, 24, 24);
        ctx.fillStyle = '#fff';
        ctx.fillRect(obs.x - 2, obs.y - 8, 4, 16);
        ctx.fillRect(obs.x - 8, obs.y - 2, 16, 4);
      } else if (obs.type === ObstacleType.BOOSTER) {
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.moveTo(obs.x - 15, obs.y + 15); ctx.lineTo(obs.x, obs.y - 15); ctx.lineTo(obs.x + 15, obs.y + 15); ctx.fill();
      } else {
        drawPixelThar(ctx, obs.x, obs.y, { primary: obs.color, secondary: '#111' }, false);
      }
    });

    // Draw Player
    const skin = CAR_SKINS.find(s => s.id === selectedSkinId) || CAR_SKINS[0];
    drawPixelThar(ctx, carState.current.x, carState.current.y, skin, true);

    ctx.restore();

    // CRT Scanlines Effect
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    for (let i = 0; i < CANVAS_HEIGHT; i += 4) {
      ctx.fillRect(0, i, CANVAS_WIDTH, 2);
    }

    // HUD Display
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, 60);
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2;
    ctx.strokeRect(6, 6, CANVAS_WIDTH - 12, 48);

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 16px Orbitron';
    ctx.textAlign = 'left';
    ctx.fillText(`KM: ${Math.floor(gameStateRef.current.distance)}`, 20, 38);
    
    ctx.textAlign = 'right';
    for(let i=0; i<carState.current.maxHp; i++) {
      ctx.fillStyle = i < carState.current.hp ? '#ef4444' : '#1f2937';
      ctx.fillRect(CANVAS_WIDTH - 30 - (i*25), 22, 15, 15);
    }

  }, [selectedSkinId]);

  const animate = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      update();
      draw(ctx);
    }
    requestRef.current = requestAnimationFrame(animate);
  }, [update, draw]);

  useEffect(() => {
    if (status === GameStatus.PLAYING) resetGame();
    gameStateRef.current.status = status;
  }, [status, resetGame]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [animate]);

  return (
    <div className="relative border-[12px] border-stone-800 rounded-xl overflow-hidden shadow-2xl bg-black">
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="block" onClick={onTogglePause} />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-stone-900/40 via-transparent to-white/5 opacity-40" />
    </div>
  );
};

export default GameCanvas;
