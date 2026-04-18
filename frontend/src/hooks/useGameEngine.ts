// src/hooks/useGameEngine.ts
import { useState, useCallback } from 'react';
import type { GameState, Enemy, Card } from '../types';
import { getInitialDeck } from '../data/cards';
import { shuffleArray } from '../utils/helpers';

const INITIAL_ENEMY: Enemy = {
    id: 'sub_1',
    name: 'Forgotten Subscription',
    maxHp: 120,
    hp: 120,
    intentText: 'Will automatically withdraw 15 PLN',
    intentDamage: 15
};

export const useGameEngine = () => {
    const [gameState, setGameState] = useState<GameState>({
        capital: 900,
        maxCapital: 1000,
        cushion: 0,
        actionsLeft: 2,
        deck: shuffleArray(getInitialDeck()), // Shuffle deck at the very beginning
        hand: [],
        discardPile: [],
        enemy: INITIAL_ENEMY
    });

    // Action: Start a new turn
    const startTurn = useCallback(() => {
        setGameState(prev => {
            // 1. Move remaining hand to discard pile
            let currentDiscard = [...prev.discardPile, ...prev.hand];
            let currentDeck = [...prev.deck];
            const newHand: Card[] = [];

            // 2. Draw 4 cards
            const DRAW_AMOUNT = 4;
            for (let i = 0; i < DRAW_AMOUNT; i++) {
                // If deck is empty, shuffle discard pile into deck
                if (currentDeck.length === 0) {
                    if (currentDiscard.length === 0) break; // No cards left anywhere!
                    currentDeck = shuffleArray(currentDiscard);
                    currentDiscard = [];
                }

                // Pop from the end of the array (acts as the "top" of the deck)
                const drawnCard = currentDeck.pop();
                if (drawnCard) {
                    newHand.push(drawnCard);
                }
            }

            // 3. Reset turn stats and apply new state
            return {
                ...prev,
                hand: newHand,
                deck: currentDeck,
                discardPile: currentDiscard,
                actionsLeft: 2,
                cushion: 0 // Cushion resets every turn unless a specific card says otherwise
            };
        });
    }, []);

    const playCard = useCallback((cardId: string) => {
        // TODO: Implement later
        console.log(`Playing card ${cardId}...`);
    }, []);

    const endTurn = useCallback(() => {
        // TODO: Implement enemy damage later
        console.log('Ending turn...');
    }, []);

    return {
        gameState,
        startTurn,
        playCard,
        endTurn
    };
};