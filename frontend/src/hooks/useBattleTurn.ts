import { useState, useCallback } from 'react';

interface BattleCard {
  id: number;
  type: string;
  title: string;
  color: string;
  icon?: string;
}

interface TurnState {
  state: 'idle' | 'playing' | 'animating' | 'drawing';
  selectedCard: BattleCard | null;
  playingCard: BattleCard | null;
  cardsInHand: BattleCard[];
  damage: number | null;
}

const MOCK_CARDS: BattleCard[] = [
  {
    id: 1,
    type: 'block',
    title: 'Verify Sender',
    color: 'from-blue-500 to-blue-600',
    icon: '🔍'
  },
  {
    id: 2,
    type: 'report',
    title: 'Report Scam',
    color: 'from-red-500 to-red-600',
    icon: '🚨'
  },
  {
    id: 3,
    type: 'verify',
    title: '2FA Shield',
    color: 'from-green-500 to-green-600',
    icon: '🔐'
  },
  {
    id: 4,
    type: 'ignore',
    title: 'Delete Message',
    color: 'from-gray-500 to-gray-600',
    icon: '🗑️'
  },
  {
    id: 5,
    type: 'block',
    title: 'Block Contact',
    color: 'from-orange-500 to-orange-600',
    icon: '🚫'
  }
];

/**
 * Hook do zarządzania animacjami i logiką turki w walce
 * Całkowicie niezależny od backendu - do testowania frontendu
 * 
 * Gdy endpoint będzie gotowy, zamienić tylko część API na rzeczywiste wywołania
 */
export const useBattleTurn = () => {
  const [turnState, setTurnState] = useState<TurnState>({
    state: 'idle',
    selectedCard: null,
    playingCard: null,
    cardsInHand: MOCK_CARDS,
    damage: null
  });

  const [playerHealth, setPlayerHealth] = useState(80);
  const [enemyHealth, setEnemyHealth] = useState(50);
  const [damageLog, setDamageLog] = useState<Array<{ damage: number; position: 'player' | 'enemy' }>>([]);

  /**
   * Gracz wybiera kartę
   */
  const selectCard = useCallback((cardId: number) => {
    if (turnState.state !== 'idle') return;

    const card = turnState.cardsInHand.find(c => c.id === cardId);
    if (card) {
      setTurnState(prev => ({
        ...prev,
        selectedCard: card
      }));
    }
  }, [turnState.state, turnState.cardsInHand]);

  /**
   * Gracz potwierdza zagranie karty (End Turn button)
   * Sekwencja: playing -> animating -> drawing
   */
  const playCard = useCallback(async () => {
    if (!turnState.selectedCard || turnState.state !== 'idle') return;

    const cardToPlay = turnState.selectedCard;

    // PHASE 1: Playing - card slides out to the right
    setTurnState(prev => ({
      ...prev,
      state: 'playing',
      playingCard: cardToPlay
    }));

    await new Promise(resolve => setTimeout(resolve, 400));

    // PHASE 2: Animating - flip animation, deal damage
    // W rzeczywistości: tu się wywoła backend endpoint
    // Teraz: mock damage
    const mockDamage = Math.floor(Math.random() * 20) + 10;
    setTurnState(prev => ({
      ...prev,
      state: 'animating',
      damage: mockDamage
    }));

    // Damage animation
    setDamageLog(prev => [...prev, { damage: mockDamage, position: 'enemy' }]);
    setEnemyHealth(prev => Math.max(0, prev - mockDamage));

    await new Promise(resolve => setTimeout(resolve, 800));

    // PHASE 3: Drawing - enemy attacks, new cards drawn
    setTurnState(prev => ({
      ...prev,
      state: 'drawing',
      playingCard: null
    }));

    // Mock enemy damage
    const enemyDamage = Math.floor(Math.random() * 15) + 5;
    setDamageLog(prev => [...prev, { damage: enemyDamage, position: 'player' }]);
    setPlayerHealth(prev => Math.max(0, prev - enemyDamage));

    await new Promise(resolve => setTimeout(resolve, 600));

    // PHASE 4: Back to idle - new cards ready to play
    // Po pierwszej turze: 2 karty zamiast 5
    const newCards = MOCK_CARDS.slice(0, 2);
    setTurnState(prev => ({
      ...prev,
      state: 'idle',
      selectedCard: null,
      damage: null,
      cardsInHand: newCards
    }));

    // Wyczyść damage log
    setDamageLog([]);
  }, [turnState.selectedCard, turnState.state]);

  /**
   * Zresetuj turę
   */
  const resetTurn = useCallback(() => {
    setTurnState({
      state: 'idle',
      selectedCard: null,
      playingCard: null,
      cardsInHand: MOCK_CARDS,
      damage: null
    });
  }, []);

  return {
    // State
    turnState,
    playerHealth,
    enemyHealth,
    damageLog,

    // Actions
    selectCard,
    playCard,
    resetTurn,

    // Utils
    isAnimating: turnState.state !== 'idle',
    canSelectCard: turnState.state === 'idle'
  };
};
