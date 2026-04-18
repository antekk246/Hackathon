import { ArrowLeft, Lock, TrendingUp } from 'lucide-react';
import { useState } from 'react';

interface Card {
  id: number;
  type: string;
  title: string;
  description: string;
  color: string;
  owned: boolean;
  level: number;
  unlockCost?: number;
  upgradeCost?: number;
}

interface CardShopProps {
  onBack: () => void;
  playerXP: number;
  onPurchase: (cost: number) => void;
}

export function CardShop({ onBack, playerXP, onPurchase }: CardShopProps) {
  const [selectedCard, setSelectedCard] = useState<number | null>(null);

  const allCards: Card[] = [
    {
      id: 1,
      type: 'block',
      title: 'Block Sender',
      description: 'Block suspicious contact',
      color: 'from-red-500 to-red-600',
      owned: true,
      level: 1,
      upgradeCost: 50
    },
    {
      id: 2,
      type: 'report',
      title: 'Report Scam',
      description: 'Report to authorities',
      color: 'from-orange-500 to-orange-600',
      owned: true,
      level: 1,
      upgradeCost: 50
    },
    {
      id: 3,
      type: 'verify',
      title: 'Verify Source',
      description: 'Check if legitimate',
      color: 'from-blue-500 to-blue-600',
      owned: true,
      level: 1,
      upgradeCost: 50
    },
    {
      id: 4,
      type: 'ignore',
      title: 'Delete & Ignore',
      description: 'Remove without engaging',
      color: 'from-gray-500 to-gray-600',
      owned: true,
      level: 1,
      upgradeCost: 50
    },
    {
      id: 5,
      type: 'block',
      title: '2FA Shield',
      description: 'Enable authentication',
      color: 'from-green-500 to-green-600',
      owned: true,
      level: 1,
      upgradeCost: 50
    },
    {
      id: 6,
      type: 'power',
      title: 'Strong Password',
      description: 'Create secure password',
      color: 'from-purple-500 to-purple-600',
      owned: false,
      level: 0,
      unlockCost: 100
    },
    {
      id: 7,
      type: 'defense',
      title: 'VPN Shield',
      description: 'Protect your connection',
      color: 'from-indigo-500 to-indigo-600',
      owned: false,
      level: 0,
      unlockCost: 150
    },
    {
      id: 8,
      type: 'attack',
      title: 'Evidence Collect',
      description: 'Gather scam evidence',
      color: 'from-pink-500 to-pink-600',
      owned: false,
      level: 0,
      unlockCost: 120
    }
  ];

  const ownedCards = allCards.filter(c => c.owned);
  const lockedCards = allCards.filter(c => !c.owned);
  const selected = allCards.find(c => c.id === selectedCard);

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Header */}
      <div className="relative z-10 p-6 border-b border-slate-700 bg-slate-950/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-4xl font-bold text-cyan-400">Invest in Yourself</h1>
          <div className="bg-yellow-500 text-slate-900 px-6 py-2 rounded-lg font-bold text-lg">
            XP: {playerXP}
          </div>
        </div>
      </div>

      <div className="relative z-10 flex h-[calc(100%-88px)]">
        {/* Left side - Owned cards */}
        <div className="w-1/2 p-6 border-r border-slate-700 overflow-y-auto">
          <h2 className="text-2xl font-bold text-white mb-4">Your Cards</h2>
          <div className="space-y-3">
            {ownedCards.map(card => (
              <CardListItem
                key={card.id}
                card={card}
                selected={selectedCard === card.id}
                onSelect={() => setSelectedCard(card.id)}
              />
            ))}
          </div>
        </div>

        {/* Right side - Detail panel or locked cards */}
        <div className="w-1/2 p-6 overflow-y-auto">
          {selected ? (
            <CardDetailPanel
              card={selected}
              playerXP={playerXP}
              onUpgrade={() => {
                if (selected.upgradeCost && playerXP >= selected.upgradeCost) {
                  onPurchase(selected.upgradeCost);
                }
              }}
              onUnlock={() => {
                if (selected.unlockCost && playerXP >= selected.unlockCost) {
                  onPurchase(selected.unlockCost);
                }
              }}
            />
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white mb-4">Unlock New Cards</h2>
              <div className="grid grid-cols-2 gap-4">
                {lockedCards.map(card => (
                  <LockedCardPreview
                    key={card.id}
                    card={card}
                    onSelect={() => setSelectedCard(card.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface CardListItemProps {
  card: Card;
  selected: boolean;
  onSelect: () => void;
}

function CardListItem({ card, selected, onSelect }: CardListItemProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full p-4 rounded-xl transition-all duration-300 text-left ${
        selected
          ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-2 border-cyan-400 shadow-lg'
          : 'bg-slate-800/50 border-2 border-slate-700 hover:border-slate-600'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-white font-bold text-lg">{card.title}</div>
          <div className="text-slate-400 text-sm">{card.description}</div>
          <div className="text-yellow-400 text-xs mt-1">Level {card.level}</div>
        </div>
        <div className={`w-12 h-16 rounded-lg bg-gradient-to-br ${card.color}`} />
      </div>
    </button>
  );
}

interface LockedCardPreviewProps {
  card: Card;
  onSelect: () => void;
}

function LockedCardPreview({ card, onSelect }: LockedCardPreviewProps) {
  return (
    <button
      onClick={onSelect}
      className="relative p-6 rounded-2xl bg-slate-800/50 border-2 border-slate-700 hover:border-yellow-500 transition-all duration-300 group"
    >
      <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
        <Lock className="w-12 h-12 text-yellow-500" />
      </div>
      <div className="relative z-10 opacity-40">
        <div className={`w-full h-32 rounded-lg bg-gradient-to-br ${card.color} mb-3`} />
        <div className="text-white font-bold">{card.title}</div>
        <div className="text-yellow-500 text-sm mt-2">{card.unlockCost} XP</div>
      </div>
    </button>
  );
}

interface CardDetailPanelProps {
  card: Card;
  playerXP: number;
  onUpgrade: () => void;
  onUnlock: () => void;
}

function CardDetailPanel({ card, playerXP, onUpgrade, onUnlock }: CardDetailPanelProps) {
  return (
    <div className="bg-slate-800/50 rounded-2xl p-8 border-2 border-cyan-400">
      <div className={`w-full h-64 rounded-2xl bg-gradient-to-br ${card.color} mb-6 flex items-center justify-center`}>
        <div className="text-center text-white">
          <div className="text-6xl mb-4">📱</div>
          <div className="text-3xl font-bold">{card.title}</div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="text-slate-400 text-sm">Type</div>
          <div className="text-white text-lg font-bold uppercase">{card.type}</div>
        </div>

        <div>
          <div className="text-slate-400 text-sm">Description</div>
          <div className="text-white text-lg">{card.description}</div>
        </div>

        {card.owned ? (
          <>
            <div>
              <div className="text-slate-400 text-sm mb-2">Current Level</div>
              <div className="text-yellow-400 text-2xl font-bold">Level {card.level}</div>
            </div>

            <button
              onClick={onUpgrade}
              disabled={!card.upgradeCost || playerXP < card.upgradeCost}
              className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-xl font-bold text-xl hover:scale-105 transition-transform disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <TrendingUp className="w-6 h-6" />
              Upgrade ({card.upgradeCost} XP)
            </button>
          </>
        ) : (
          <button
            onClick={onUnlock}
            disabled={!card.unlockCost || playerXP < card.unlockCost}
            className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-yellow-500 to-orange-600 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-xl font-bold text-xl hover:scale-105 transition-transform disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Lock className="w-6 h-6" />
            Unlock ({card.unlockCost} XP)
          </button>
        )}
      </div>
    </div>
  );
}
