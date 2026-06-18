export const TILE_SIZE = 26;
export const GRID_SIZE = 24;
export const TANK_SIZE = 24;
export const BULLET_SIZE = 6;
export const BASE_PLAYER_SPEED = 1.8;
export const BASE_ENEMY_SPEED = 0.9;
export const BULLET_SPEED = 7;
export const PLAYER_LIVES = 5;
export const PLAYER_HP = 3;
export const LLM_API_URL = 'https://battlecityllmserver.onrender.com/generate';

export const DIRECTIONS = Object.freeze({
    UP: 0, RIGHT: 1, DOWN: 2, LEFT: 3
});

export const EVENTS = Object.freeze({
    GAME_OVER: 'game:over',
    LEVEL_COMPLETE: 'level:complete',
    ENEMY_KILLED: 'enemy:killed',
    BONUS_COLLECTED: 'bonus:collected',
    BASE_DESTROYED: 'base:destroyed',
    PLAYER_HIT: 'player:hit',
    PLAYER_RESPAWN: 'player:respawn',
    COMMENT_REQUESTED: 'comment:requested'
});