// frontend/src/types/index.ts

// 1. STANY APLIKACJI (Widoki)
export type AppView = 'MENU' | 'DIFFICULTY' | 'MAP' | 'BATTLE';
export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

// 2. MODELE BAZODANOWE (Odpowiedniki z backendu)

export interface User {
    id: number;
    username: string;
    email: string;
    money: number;
    oauth_id?: string;
    createdAt: string;
    updatedAt: string;
    cards?: Card[];
    adventure?: Adventure;
}

export interface CardType {
    id: number;
    name: string; // np. "ATAK", "OBRONA", "WSPARCIE"
}

// To jest to, co backend trzyma w formacie JSON w kolumnie cardAction
export interface CardAction {
    value?: number;         // Wartość ataku/obrony
    drawsCards?: number;    // Ile kart dobiera
    addsActions?: number;   // Ile akcji dodaje
    exhausts?: boolean;     // Czy karta znika po użyciu
}

export interface Card {
    id: number;
    name: string;
    typeId: number;
    type?: CardType;
    description: string;
    upgradeToId?: number;
    upgradeTo?: Card;
    upgradeCost?: number;
    unlockCost?: number;
    cardAction: CardAction; // Backend wyśle tu sparsowany JSON
}

export interface UserCard {
    instanceId: number; // To jest to czego szukaliśmy! (w GORM to było ID tabeli user_cards)
    userId: number;
    cardId: number;
    card: Card; // Tu siedzą dane archetypu
}

export interface BuffContent {
    // Przykładowe statystyki buffów z JSONa
    extraCapital?: number;
    extraCushionPerTurn?: number;
}

export interface Buff {
    id: number;
    buffContent: BuffContent;
}

export interface Adventure {
    id: number;
    name: string;
    userId: number;
    buffs?: Buff[];
}