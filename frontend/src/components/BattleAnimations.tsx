import { motion } from 'motion/react';
import React from 'react';

interface CardAnimationProps {
  card: {
    id: number;
    type: string;
    title: string;
    color: string;
    icon?: string;
  };
  isPlaying?: boolean;
}

/**
 * Card sliding out to the right when played
 */
export const CardPlayAnimation: React.FC<CardAnimationProps> = ({ card, isPlaying }) => {
  return (
    <motion.div
      initial={{ scale: 1, opacity: 1 }}
      animate={isPlaying ? { x: 500, opacity: 0, scale: 0.8, rotate: 15 } : { x: 0, opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className={`w-40 h-56 rounded-xl border-4 border-slate-700 bg-slate-800 flex flex-col overflow-hidden cursor-pointer hover:scale-105 transition-transform shadow-lg`}
    >
      <div className={`h-24 bg-gradient-to-br ${card.color} flex items-center justify-center text-4xl`}>
        {card.icon || '🎴'}
      </div>
      <div className="flex-1 p-3 flex flex-col justify-between text-left">
        <div>
          <div className="text-[10px] font-bold text-cyan-400 mb-1">{card.type.toUpperCase()}</div>
          <div className="text-white font-bold text-sm leading-tight mb-1">{card.title}</div>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Card flip animation
 */
export const CardFlipAnimation: React.FC = () => {
  return (
    <motion.div
      initial={{ x: -300, opacity: 0, rotateY: 180 }}
      animate={{ x: 0, opacity: 1, rotateY: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{ perspective: 1000 }}
      className="w-40 h-56 rounded-xl border-4 border-blue-500 bg-gradient-to-br from-blue-900 to-purple-900 flex flex-col items-center justify-center shadow-2xl shadow-blue-500/50"
    >
      <div className="text-center">
        <div className="text-5xl mb-2">🔄</div>
        <div className="text-white font-bold text-sm">Card Back</div>
      </div>
    </motion.div>
  );
};

/**
 * Damage animation
 */
interface DamageAnimationProps {
  damage: number;
  position: 'player' | 'enemy';
}

export const DamageAnimation: React.FC<DamageAnimationProps> = ({ damage, position }) => {
  return (
    <motion.div
      initial={{ y: 0, opacity: 1, scale: 1 }}
      animate={{ y: -100, opacity: 0, scale: 1.5 }}
      transition={{ duration: 1, ease: 'easeOut' }}
      className={`fixed z-50 font-bold text-3xl pointer-events-none ${position === 'player' ? 'text-red-500' : 'text-orange-500'}`}
      style={{
        left: position === 'player' ? '25%' : '75%',
        top: '40%'
      }}
    >
      -{damage}
    </motion.div>
  );
};

/**
 * Turn state indicator
 */
interface TurnStateIndicatorProps {
  state: 'idle' | 'playing' | 'animating' | 'drawing' | 'selected';
}

export const TurnStateIndicator: React.FC<TurnStateIndicatorProps> = ({ state }) => {
  const messages = {
    idle: 'Wybierz kartę',
    playing: 'Zagrywam kartę...',
    animating: 'Animacja...',
    drawing: 'Dobieranie kart...',
    selected: 'Wybrano kartę'
  };

  return (
    <motion.div
      animate={{ scale: state !== 'idle' ? 1.1 : 1 }}
      transition={{ duration: 0.3 }}
      className="text-center text-white font-bold text-lg bg-slate-800/50 px-4 py-2 rounded-lg"
    >
      {messages[state]}
    </motion.div>
  );
};

/**
 * Card traveling from player to enemy
 */
interface CardTravelingAnimationProps {
  card: {
    id: number;
    type: string;
    title: string;
    color: string;
    icon?: string;
  };
  isVisible?: boolean;
}

export const CardTravelingAnimation: React.FC<CardTravelingAnimationProps> = ({ card, isVisible = false }) => {
  return (
    <motion.div
      initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
      animate={isVisible ? { x: 200, y: -450, opacity: 1, scale: 0.8 } : { x: 0, y: 0, opacity: 0, scale: 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut', delay: 0.1 }}
      className="fixed z-30 w-32 h-44 rounded-lg border-3 border-cyan-400 bg-slate-800 flex flex-col overflow-hidden shadow-2xl shadow-cyan-500/50"
      style={{ left: '50%', top: '50%', marginLeft: '-64px', marginTop: '-88px' }}
    >
      <div className={`h-16 bg-gradient-to-br ${card.color} flex items-center justify-center text-2xl`}>
        {card.icon}
      </div>
      <div className="flex-1 p-2 flex flex-col justify-center">
        <div className="text-[8px] font-bold text-cyan-400 mb-1">{card.type.toUpperCase()}</div>
        <div className="text-white font-bold text-xs">{card.title}</div>
      </div>
    </motion.div>
  );
};

/**
 * Deck pile indicator (left bottom)
 */
export const DeckPile: React.FC<{ cardsRemaining: number }> = ({ cardsRemaining }) => {
  return (
    <motion.div
      animate={{ scale: cardsRemaining > 0 ? 1 : 0.8 }}
      className="fixed left-6 bottom-6 z-40 pointer-events-none"
    >
      <div className="w-24 h-32 rounded-lg border-2 border-dashed border-blue-400/60 bg-blue-900/40 flex flex-col items-center justify-center shadow-lg shadow-blue-500/20">
        <div className="text-blue-300 font-bold text-sm">DECK</div>
        <div className="text-blue-200 text-2xl font-bold mt-2">{cardsRemaining}</div>
      </div>
    </motion.div>
  );
};

/**
 * Discard pile indicator (right bottom)
 */
export const DiscardPile: React.FC<{ cardsCount: number }> = ({ cardsCount }) => {
  return (
    <motion.div
      animate={{ scale: cardsCount > 0 ? 1 : 0.8 }}
      className="fixed right-6 bottom-6 z-40 pointer-events-none"
    >
      <div className="w-24 h-32 rounded-lg border-2 border-dashed border-orange-400/60 bg-orange-900/40 flex flex-col items-center justify-center shadow-lg shadow-orange-500/20">
        <div className="text-orange-300 font-bold text-sm">USED</div>
        <div className="text-orange-200 text-2xl font-bold mt-2">{cardsCount}</div>
      </div>
    </motion.div>
  );
};
