// src/types.ts

export type CardType = 'ATAK' | 'OBRONA' | 'WSPARCIE' | 'STATUS';

export interface Card {
    id: string;
    name: string;
    type: CardType;
    description: string;
    value: number;         // Bazowa wartość (np. ile zabiera HP wrogowi, lub ile daje poduszki)
    drawsCards?: number;   // Opcjonalne: czy dobiera karty (np. Szybka Analiza)
    addsActions?: number;  // Opcjonalne: czy dodaje akcje
    exhausts?: boolean;    // Opcjonalne: czy znika po użyciu
}

export interface Enemy {
    id: string;
    name: string;
    maxHp: number;         // Waga problemu
    hp: number;            // Aktualna waga problemu
    intentText: string;    // Zamiar (np. "Chce ukraść 40 PLN")
    intentDamage: number;  // Ile uderzy w następnej turze
}

export interface GameState {
    // Gracz
    capital: number;
    maxCapital: number;
    cushion: number;       // Poduszka finansowa
    actionsLeft: number;   // Twoje "Decyzje" (domyślnie 2)

    // Talia
    deck: Card[];
    hand: Card[];
    discardPile: Card[];

    // Przeciwnik
    enemy: Enemy | null;
}