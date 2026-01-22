
export enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAMEOVER = 'GAMEOVER'
}

export interface Point {
  x: number;
  y: number;
}

export interface Entity extends Point {
  width: number;
  height: number;
  color: string;
}

export interface CarSkin {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
}

export const CAR_SKINS: CarSkin[] = [
  { id: 'red_rage', name: 'Red Rage', primary: '#dc2626', secondary: '#1e293b', accent: '#000000' },
  { id: 'desert_fury', name: 'Desert Sand', primary: '#d4b483', secondary: '#2d2d2d', accent: '#4a4a4a' },
  { id: 'napoli_black', name: 'Midnight Black', primary: '#0f172a', secondary: '#334155', accent: '#111827' },
  { id: 'everest_white', name: 'Everest White', primary: '#f8fafc', secondary: '#475569', accent: '#94a3b8' },
];

export interface Car extends Entity {
  speed: number;
  lane: number;
  hp: number;
  maxHp: number;
  invincible: boolean;
  skinId: string;
}

export enum ObstacleType {
  TRAFFIC = 'TRAFFIC',
  OPPONENT = 'OPPONENT',
  REPAIR = 'REPAIR',
  BOOSTER = 'BOOSTER'
}

export interface Obstacle extends Entity {
  speed: number;
  type: ObstacleType;
  lane: number;
  targetX?: number;
  z?: number;
}

export interface GameState {
  score: number;
  distance: number;
  speedMultiplier: number;
  status: GameStatus;
  level: number;
  hp: number;
  isBoosting: boolean;
}
