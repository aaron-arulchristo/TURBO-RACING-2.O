
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
const LANE_Y_POSITIONS = [380, 440, 500]; // Y positions for the 3 lanes in side view
const INITIAL_SPEED = 6;
const BOOST_DURATION = 3500;
const INVINCIBILITY_DURATION = 2000;

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
  const requestRef = useRef<number>();
  
  const carState = useRef({
    lane: 1, // 0, 1, 2
    y: LANE_Y_POSITIONS[1],
    targetY: LANE_Y_POSITIONS[1],
    x: 60,
    hp: 3,
    maxHp: 3,
    invincible: false,
    boostEndTime: 0,
    bounce: 0,
    frame: 0
  });
  
  const obstaclesRef = useRef<Obstacle[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const bgScroll = useRef({ sky: 0, mountains: 0, ground: 0 });
  const lastSpawnRef = useRef(0);
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
      
      // Lane switching
      if (gameStateRef.current.status === GameStatus.PLAYING) {
        if (e.code === 'ArrowUp' || e.code === 'KeyW') {
          carState.current.lane = Math.max(0, carState.current.lane - 1);
        }
        if (e.code === 'ArrowDown' || e.code === 'KeyS') {
          carState.current.lane = Math.min(2, carState.current.lane + 1);
        }
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
      x: 60,
      hp: 3,
      maxHp: 3,
      invincible: false,
      boostEndTime: 0,
      bounce: 0,
      frame: 0
    };
    obstaclesRef.current = [];
    particlesRef.current = [];
    bgScroll.current = { sky: 0, mountains: 0, ground: 0 };
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

  const createPixelSpark = (x: number, y: number, color: string) => {
    for (let i = 0; i < 6; i++) {
      particlesRef.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1.0,
        color,
        size: 4 // Large square pixels
      });
    }
  };

  const update = useCallback(() => {
    if (gameStateRef.current.status !== GameStatus.PLAYING) return;

    const now = Date.now();
    gameStateRef.current.isBoosting = now < carState.current.boostEndTime;
    
    // Smooth lane transition
    carState.current.targetY = LANE_Y_POSITIONS[carState.current.lane];
    carState.current.y += (carState.current.targetY - carState.current.y) * 0.2;
    
    // Scroll speed
    const boostFactor = gameStateRef.current.isBoosting ? 2.5 : 1;
    const speed = INITIAL_SPEED * gameStateRef.current.speedMultiplier * boostFactor;
    
    bgScroll.current.sky = (bgScroll.current.sky + speed * 0.1) % CANVAS_WIDTH;
    bgScroll.current.mountains = (bgScroll.current.mountains + speed * 0.5) % CANVAS_WIDTH;
    bgScroll.current.ground = (bgScroll.current.ground + speed) % 80;

    gameStateRef.current.distance += speed * 0.05;
    gameStateRef.current.score += gameStateRef.current.isBoosting ? 5 : 1;
    gameStateRef.current.speedMultiplier += 0.0001;

    // Sprite animation & bounce
    carState.current.frame = Math.floor(Date.now() / 100) % 2;
    carState.current.bounce = Math.sin(Date.now() / 50) * 2;

    // Spawning
    if (now - lastSpawnRef.current > 1200 / gameStateRef.current.speedMultiplier) {
      const lane = Math.floor(Math.random() * 3);
      const typeChance = Math.random();
      let type = ObstacleType.TRAFFIC;
      let color = '#ef4444';
      if (typeChance < 0.1) type = ObstacleType.REPAIR;
      else if (typeChance < 0.2) type = ObstacleType.BOOSTER;

      obstaclesRef.current.push({
        x: CANVAS_WIDTH + 50,
        y: LANE_Y_POSITIONS[lane],
        width: 60, height: 40,
        color, speed: Math.random() * 2, type, lane
      });
      lastSpawnRef.current = now;
    }

    // Update Obstacles
    obstaclesRef.current = obstaclesRef.current.filter(obs => {
      obs.x -= speed + obs.speed;

      // Collision Check
      const car = carState.current;
      if (obs.lane === car.lane && Math.abs(obs.x - car.x) < 45) {
        if (obs.type === ObstacleType.REPAIR) {
          car.hp = Math.min(car.maxHp, car.hp + 1);
          createPixelSpark(obs.x, obs.y, '#4ade80');
          return false;
        } else if (obs.type === ObstacleType.BOOSTER) {
          car.boostEndTime = Date.now() + BOOST_DURATION;
          createPixelSpark(obs.x, obs.y, '#06b6d4');
          return false;
        } else if (!car.invincible) {
          if (gameStateRef.current.isBoosting) {
            createPixelSpark(obs.x, obs.y, '#ffffff');
            return false;
          }
          car.hp -= 1;
          gameStateRef.current.hp = car.hp;
          shakeRef.current = 15;
          createPixelSpark(car.x, car.y, '#ef4444');
          
          if (car.hp <= 0) {
            gameStateRef.current.status = GameStatus.GAMEOVER;
            onGameOver(gameStateRef.current.score, gameStateRef.current.distance, gameStateRef.current.level, car.hp);
          } else {
            car.invincible = true;
            setTimeout(() => car.invincible = false, INVINCIBILITY_DURATION);
          }
          return false;
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
    const pSize = 4; // Pixel unit size

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(-w/2 + 4, h/2 - 4, w, 8);

    // Wheels (Pixelated circles)
    ctx.fillStyle = '#000';
    // Back wheel
    ctx.fillRect(-w/2 + 8, h/2 - 12, 12, 12);
    // Front wheel
    ctx.fillRect(w/2 - 20, h/2 - 12, 12, 12);
    
    // Tire highlights for motion
    if (Math.floor(Date.now()/50)%2 === 0) {
      ctx.fillStyle = '#333';
      ctx.fillRect(-w/2 + 10, h/2 - 10, 4, 4);
      ctx.fillRect(w/2 - 18, h/2 - 10, 4, 4);
    }

    // Body
    ctx.fillStyle = skin.primary;
    ctx.fillRect(-w/2, 0, w, 16); // Lower body
    ctx.fillRect(-w/2 + 8, -12, w - 16, 12); // Hood/Cabin

    // Roof / Windows
    ctx.fillStyle = skin.secondary;
    ctx.fillRect(-w/2 + 12, -10, 24, 8); // Side Window
    
    // Front Grille & Headlight (Side profile)
    ctx.fillStyle = '#000';
    ctx.fillRect(w/2 - 4, 4, 4, 8);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(w/2 - 2, 6, 2, 4);

    // Spare wheel on back
    ctx.fillStyle = '#111';
    ctx.fillRect(-w/2 - 4, 2, 6, 12);

    if (isPlayer && carState.current.invincible && Math.floor(Date.now()/100)%2 === 0) {
      ctx.globalAlpha = 0.3;
    }

    ctx.restore();
  };

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.imageSmoothingEnabled = false; // Force pixel crispness
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.save();
    if (shakeRef.current > 0) {
      ctx.translate((Math.random() - 0.5) * shakeRef.current, (Math.random() - 0.5) * shakeRef.current);
    }

    // Retro Sky
    ctx.fillStyle = '#075985';
    ctx.fillRect(0, 0, CANVAS_WIDTH, 400);

    // Sun (Pixelated)
    ctx.fillStyle = '#fde047';
    ctx.fillRect(CANVAS_WIDTH - 80, 40, 40, 40);

    // Parallax Mountains
    ctx.fillStyle = '#0c4a6e';
    for (let i = 0; i < 3; i++) {
      const x = (i * CANVAS_WIDTH) - bgScroll.current.mountains;
      ctx.beginPath();
      ctx.moveTo(x, 400);
      ctx.lineTo(x + 200, 250);
      ctx.lineTo(x + 400, 400);
      ctx.fill();
    }

    // Road Ground
    ctx.fillStyle = '#78350f'; // Dirt brown
    ctx.fillRect(0, 360, CANVAS_WIDTH, 240);

    // Lanes (Perspective trick in 2D)
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    LANE_Y_POSITIONS.forEach(y => {
      ctx.fillRect(0, y + 15, CANVAS_WIDTH, 4);
    });

    // Draw Obstacles (Sorted by lane for pseudo-depth)
    obstaclesRef.current.sort((a,b) => a.lane - b.lane).forEach(obs => {
      if (obs.type === ObstacleType.REPAIR) {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(obs.x - 10, obs.y - 10, 20, 20);
      } else if (obs.type === ObstacleType.BOOSTER) {
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y - 15);
        ctx.lineTo(obs.x - 15, obs.y + 15);
        ctx.lineTo(obs.x + 15, obs.y + 15);
        ctx.fill();
      } else {
        drawPixelThar(ctx, obs.x, obs.y, { primary: obs.color, secondary: '#111' }, false);
      }
    });

    // Draw Player
    const skin = CAR_SKINS.find(s => s.id === selectedSkinId) || CAR_SKINS[0];
    drawPixelThar(ctx, carState.current.x, carState.current.y, skin, true);

    // Particles
    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1.0;

    ctx.restore();

    // CRT Scanlines Effect
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    for (let i = 0; i < CANVAS_HEIGHT; i += 4) {
      ctx.fillRect(0, i, CANVAS_WIDTH, 2);
    }

    // Retro HUD
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, 60);
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, CANVAS_WIDTH - 8, 52);

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 20px Orbitron';
    ctx.textAlign = 'left';
    ctx.fillText(`DIST: ${Math.floor(gameStateRef.current.distance)}`, 20, 38);
    
    ctx.textAlign = 'right';
    for(let i=0; i<carState.current.maxHp; i++) {
      ctx.fillStyle = i < carState.current.hp ? '#ef4444' : '#333';
      ctx.fillRect(CANVAS_WIDTH - 30 - (i*25), 20, 15, 15);
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
    return () => cancelAnimationFrame(requestRef.current!);
  }, [animate]);

  return (
    <div className="relative border-8 border-stone-900 rounded-lg overflow-hidden shadow-2xl bg-black">
      <canvas 
        ref={canvasRef} 
        width={CANVAS_WIDTH} 
        height={CANVAS_HEIGHT} 
        className="block"
        onClick={onTogglePause}
      />
      {/* CRT Screen Glow */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/5 to-transparent opacity-20" />
    </div>
  );
};

export default GameCanvas;
