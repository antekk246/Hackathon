// frontend/src/types/index.ts
export type AppView = 'MENU' | 'DIFFICULTY' | 'MAP' | 'BATTLE';

export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

export interface GameStateResponse {
    gameId: string;
    currentCapital: number;
}