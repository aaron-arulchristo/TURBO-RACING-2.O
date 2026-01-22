
export enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
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

export interface Car extends Entity {
  speed: number;
  lane: number;
}

export interface Obstacle extends Entity {
  speed: number;
}

export interface GameState {
  score: number;
  distance: number;
  speedMultiplier: number;
  status: GameStatus;
}
