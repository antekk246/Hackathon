// src/types.ts

export type CardType = 'ATTACK' | 'DEFENSE' | 'SUPPORT' | 'STATUS';

export interface Card {
    id: string;            // Unique ID for the specific instance (e.g., 'cash_1')
    baseId: string;        // General ID (e.g., 'cash')
    name: string;
    type: CardType;
    description: string;
    value: number;
    drawsCards?: number;
    addsActions?: number;
    exhausts?: boolean;
    upgradeTo?: string;    // 'Foreign key' to the baseId of the upgraded card. Optional, as max-level cards won't have it.
}

export interface Enemy {
    id: string;
    name: string;
    maxHp: number;
    hp: number;
    intentText: string;
    intentDamage: number;
}

export interface GameState {
    capital: number;
    maxCapital: number;
    cushion: number;
    actionsLeft: number;
    deck: Card[];
    hand: Card[];
    discardPile: Card[];
    enemy: Enemy | null;
}