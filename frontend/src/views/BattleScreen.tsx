import { useState } from 'react';
import { Shield, Zap, Heart, AlertTriangle } from 'lucide-react';
import img from "../assets/image.png";

interface BattleScreenProps {
  onBackToMenu: () => void;
}

export function BattleScreen({ onBackToMenu }: BattleScreenProps) {
  const [playerHealth, setPlayerHealth] = useState(80);
  const [enemyHealth, setEnemyHealth] = useState(60);
  const [energy, setEnergy] = useState(3);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);

  const cards = [
    {
      id: 1,
      type: 'Block',
      title: 'Verify Sender',
      description: 'Check email address',
      cost: 1,
      effect: '+8 Defense',
      color: 'from-blue-600 to-blue-700',
      icon: '🔍'
    },
    {
      id: 2,
      type: 'Attack',
      title: 'Report Scam',
      description: 'Flag suspicious message',
      cost: 1,
      effect: '12 Damage',
      color: 'from-red-600 to-red-700',
      icon: '🚨'
    },
    {
      id: 3,
      type: 'Skill',
      title: '2FA Shield',
      description: 'Enable two-factor auth',
      cost: 2,
      effect: '+15 Defense',
      color: 'from-green-600 to-green-700',
      icon: '🔐'
    },
    {
      id: 4,
      type: 'Attack',
      title: 'Block Contact',
      description: 'Cut off scammer',
      cost: 2,
      effect: '18 Damage',
      color: 'from-orange-600 to-orange-700',
      icon: '🚫'
    },
    {
      id: 5,
      type: 'Skill',
      title: 'Educate',
      description: 'Share scam awareness',
      cost: 1,
      effect: 'Draw 2 cards',
      color: 'from-purple-600 to-purple-700',
      icon: '📚'
    }
  ];

  return (
    <div className="size-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col relative overflow-hidden">
      {/* Cyber grid background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Top UI Bar */}
      <div className="relative z-10 bg-slate-950/80 backdrop-blur-sm border-b border-slate-700 px-6 py-4 flex justify-between items-center">
        <button
          onClick={onBackToMenu}
          className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          ← Back to Menu
        </button>
        <div className="text-white text-xl font-bold">Level 1: Email Scammer</div>
        <div className="flex gap-6">
          <div className="flex items-center gap-2 bg-blue-900/50 px-4 py-2 rounded-lg">
            <Zap className="w-5 h-5 text-yellow-400" fill="currentColor" />
            <span className="text-white font-bold">{energy}/3 Energy</span>
          </div>
        </div>
      </div>

      {/* Battle Area */}
      <div className="relative z-10 flex-1 flex items-center justify-between px-12 py-8">
        {/* Player Side */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            {/* Player character */}
            <div className="w-80 h-80 relative">
              <img
                src={img}
                alt="Player character"
                className="w-full h-full object-contain drop-shadow-2xl"
              />
            </div>

            {/* Player health bar */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-full">
              <div className="bg-slate-900/90 backdrop-blur-sm rounded-full p-3 border-2 border-green-500 shadow-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="w-4 h-4 text-red-500" fill="currentColor" />
                  <span className="text-white font-bold text-sm">You</span>
                  <span className="text-green-400 font-bold text-sm ml-auto">{playerHealth}/100</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-400 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${playerHealth}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Shield indicator */}
            <div className="absolute top-0 right-0 bg-blue-500 rounded-full p-3 shadow-xl border-2 border-white">
              <Shield className="w-6 h-6 text-white" />
              <span className="absolute -top-2 -right-2 bg-white text-blue-600 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">
                12
              </span>
            </div>
          </div>
        </div>

        {/* VS indicator */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-6xl font-black text-red-500 animate-pulse">VS</div>
          <div className="text-yellow-400 text-2xl">⚡</div>
        </div>

        {/* Enemy Side */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            {/* Enemy character - Phishing Scammer */}
            <div className="w-80 h-80 bg-gradient-to-br from-red-900/50 to-purple-900/50 rounded-2xl border-4 border-red-500 flex flex-col items-center justify-center backdrop-blur-sm shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="relative z-10">
                <div className="text-9xl mb-4 animate-bounce">📧</div>
                <div className="text-white text-2xl font-bold text-center mb-2">Phishing Scammer</div>
                <div className="text-red-300 text-sm text-center px-4">"Click here to claim your prize!"</div>
              </div>

              {/* Danger indicator */}
              <div className="absolute top-4 right-4">
                <AlertTriangle className="w-8 h-8 text-yellow-400 animate-pulse" />
              </div>
            </div>

            {/* Enemy health bar */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-full">
              <div className="bg-slate-900/90 backdrop-blur-sm rounded-full p-3 border-2 border-red-500 shadow-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-bold text-sm">Email Scammer</span>
                  <span className="text-red-400 font-bold text-sm ml-auto">{enemyHealth}/60</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-red-600 to-red-500 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${(enemyHealth / 60) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Enemy intent */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg border-2 border-red-400">
              Next: Attack 15 💥
            </div>
          </div>
        </div>
      </div>

      {/* Cards Area - Phone Screen Style */}
      <div className="relative z-10 bg-gradient-to-t from-slate-950 to-slate-900/50 backdrop-blur-sm border-t border-slate-700 px-8 py-6">
        <div className="flex justify-center gap-4 mb-4">
          <div className="text-white text-sm font-semibold bg-slate-800 px-4 py-2 rounded-lg">
            Choose your defense! 🛡️
          </div>
        </div>
        <div className="flex justify-center gap-4 overflow-x-auto pb-4">
          {cards.map((card) => (
            <BattleCard
              key={card.id}
              card={card}
              isSelected={selectedCard === card.id}
              onSelect={() => setSelectedCard(card.id)}
              disabled={energy < card.cost}
            />
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-4 mt-4">
          <button className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-bold transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={selectedCard === null}>
            Play Card
          </button>
          <button className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-bold transition-all">
            End Turn
          </button>
        </div>
      </div>
    </div>
  );
}

interface BattleCardProps {
  card: any;
  isSelected: boolean;
  onSelect: () => void;
  disabled: boolean;
}

function BattleCard({ card, isSelected, onSelect, disabled }: BattleCardProps) {
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={`
        relative w-40 h-56 rounded-xl border-4 transition-all duration-300 flex flex-col overflow-hidden
        ${isSelected ? 'border-cyan-400 shadow-2xl shadow-cyan-500/50 scale-105 -translate-y-4' : 'border-slate-700'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}
      `}
    >
      <div className={`h-24 bg-gradient-to-br ${card.color} flex items-center justify-center text-4xl`}>
        {card.icon}
      </div>
      <div className="flex-1 bg-slate-800 p-3 flex flex-col justify-between text-left">
        <div>
          <div className="text-[10px] font-bold text-cyan-400 mb-1">{card.type.toUpperCase()}</div>
          <div className="text-white font-bold text-sm leading-tight mb-1">{card.title}</div>
          <div className="text-slate-400 text-[10px] leading-tight">{card.description}</div>
        </div>
        <div className="flex justify-between items-center mt-2">
          <div className="text-yellow-400 font-bold text-xs">{card.effect}</div>
          <div className="bg-slate-950 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-slate-600">
            {card.cost}
          </div>
        </div>
      </div>
    </button>
  );
}
