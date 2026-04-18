import { ArrowLeft, Lock, TrendingUp, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { gameApi } from '../api/gameApi';
import { parseBackendTranslation } from '../utils/translationHelper'; // <-- Import funkcji

interface Card {
  id: number;
  type: string;
  title?: string;          // <-- Dodane pole z backendu
  titleKey?: string;       // <-- Opcjonalny fallback
  description?: string;    // <-- Dodane pole z backendu
  descriptionKey?: string; // <-- Opcjonalny fallback
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
  const { t } = useTranslation();
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  
  // Dynamic state replacing the hardcoded arrays
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from backend and merge catalog with user's inventory
  const loadData = async () => {
    try {
      setLoading(true);
      const [catalog, userInventory] = await Promise.all([
        gameApi.getAllCards(),
        gameApi.getUserCards()
      ]);

      const mergedCards = catalog.map(baseCard => {
        const ownedInstance = userInventory.find(u => u.id === baseCard.id);
        return ownedInstance 
          ? { ...baseCard, ...ownedInstance, owned: true } 
          : { ...baseCard, owned: false };
      });

      setAllCards(mergedCards);
    } catch (error) {
      console.error("Failed to sync cards:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  const handleUpgrade = async (card: Card) => {
    if (card.upgradeCost && playerXP >= card.upgradeCost) {
      try {
        await gameApi.upgradeCard(card.id);
        onPurchase(card.upgradeCost);
        await loadData(); // Refresh list to get new stats
      } catch (err) {
        console.warn("Backend upgrade failed:", err);
      }
    }
  };

  const handleUnlock = async (card: Card) => {
    if (card.unlockCost && playerXP >= card.unlockCost) {
      try {
        await gameApi.buyCard(card.id);
        onPurchase(card.unlockCost);
        await loadData(); // Refresh list so card moves to "Owned"
      } catch (err) {
        console.warn("Backend unlock failed:", err);
      }
    }
  };

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
            {t('shop.back')}
          </button>
          <h1 className="text-4xl font-bold text-cyan-400">{t('shop.title')}</h1>
          <div className="bg-yellow-500 text-slate-900 px-6 py-2 rounded-lg font-bold text-lg">
            XP: {playerXP}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="relative z-10 flex h-[calc(100%-88px)] items-center justify-center">
           <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
        </div>
      ) : (
        <div className="relative z-10 flex h-[calc(100%-88px)]">
          {/* Left side - Owned cards */}
          <div className="w-1/2 p-6 border-r border-slate-700 overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-4">{t('shop.yourCards')}</h2>
            <div className="space-y-3">
              {ownedCards.map(card => (
                <CardListItem
                  key={card.id}
                  card={card}
                  selected={selectedCard === card.id}
                  onSelect={() => setSelectedCard(card.id)}
                />
              ))}
              {ownedCards.length === 0 && (
                <div className="text-slate-400 p-4">{t('shop.noCardsOwned', 'Brak posiadanych kart.')}</div>
              )}
            </div>
          </div>

          {/* Right side - Detail panel or locked cards */}
          <div className="w-1/2 p-6 overflow-y-auto">
            {selected ? (
              <CardDetailPanel
                card={selected}
                playerXP={playerXP}
                onUpgrade={() => handleUpgrade(selected)}
                onUnlock={() => handleUnlock(selected)}
              />
            ) : (
              <>
                <h2 className="text-2xl font-bold text-white mb-4">{t('shop.unlockNewCards')}</h2>
                <div className="grid grid-cols-2 gap-4">
                  {lockedCards.map(card => (
                    <LockedCardPreview
                      key={card.id}
                      card={card}
                      onSelect={() => setSelectedCard(card.id)}
                    />
                  ))}
                  {lockedCards.length === 0 && (
                     <div className="text-slate-400 col-span-2 p-4">{t('shop.allCardsUnlocked', 'Wszystkie karty zostały odblokowane!')}</div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface CardListItemProps {
  card: Card;
  selected: boolean;
  onSelect: () => void;
}

function CardListItem({ card, selected, onSelect }: CardListItemProps) {
  const { t } = useTranslation();
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
          {/* Przetwarzanie tytułu */}
          <div className="text-white font-bold text-lg">
            {parseBackendTranslation(card.title) || (card.titleKey ? t(card.titleKey) : '')}
          </div>
          {/* Przetwarzanie opisu */}
          <div className="text-slate-400 text-sm">
            {parseBackendTranslation(card.description) || (card.descriptionKey ? t(card.descriptionKey) : '')}
          </div>
          <div className="text-yellow-400 text-xs mt-1">{t('shop.level', { level: card.level })}</div>
        </div>
        <div className={`w-12 h-16 rounded-lg bg-gradient-to-br ${card.color || 'from-slate-500 to-slate-600'}`} />
      </div>
    </button>
  );
}

interface LockedCardPreviewProps {
  card: Card;
  onSelect: () => void;
}

function LockedCardPreview({ card, onSelect }: LockedCardPreviewProps) {
  const { t } = useTranslation();
  return (
    <button
      onClick={onSelect}
      className="relative p-6 rounded-2xl bg-slate-800/50 border-2 border-slate-700 hover:border-yellow-500 transition-all duration-300 group"
    >
      <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
        <Lock className="w-12 h-12 text-yellow-500" />
      </div>
      <div className="relative z-10 opacity-40">
        <div className={`w-full h-32 rounded-lg bg-gradient-to-br ${card.color || 'from-slate-500 to-slate-600'} mb-3`} />
        {/* Przetwarzanie tytułu */}
        <div className="text-white font-bold text-center">
          {parseBackendTranslation(card.title) || (card.titleKey ? t(card.titleKey) : '')}
        </div>
        <div className="text-yellow-500 text-center font-bold text-sm mt-2">{card.unlockCost} XP</div>
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
  const { t } = useTranslation();
  return (
    <div className="bg-slate-800/50 rounded-2xl p-8 border-2 border-cyan-400">
      <div className={`w-full h-64 rounded-2xl bg-gradient-to-br ${card.color || 'from-slate-500 to-slate-600'} mb-6 flex items-center justify-center`}>
        <div className="text-center text-white">
          <div className="text-6xl mb-4">📱</div>
          {/* Przetwarzanie tytułu */}
          <div className="text-3xl font-bold">
            {parseBackendTranslation(card.title) || (card.titleKey ? t(card.titleKey) : '')}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="text-slate-400 text-sm">{t('shop.type')}</div>
          <div className="text-white text-lg font-bold uppercase">{card.type}</div>
        </div>

        <div>
          <div className="text-slate-400 text-sm">{t('shop.description')}</div>
          {/* Przetwarzanie opisu */}
          <div className="text-white text-lg">
            {parseBackendTranslation(card.description) || (card.descriptionKey ? t(card.descriptionKey) : '')}
          </div>
        </div>

        {card.owned ? (
          <>
            <div>
              <div className="text-slate-400 text-sm mb-2">{t('shop.currentLevel')}</div>
              <div className="text-yellow-400 text-2xl font-bold">{t('shop.level', { level: card.level })}</div>
            </div>

            <button
              onClick={onUpgrade}
              disabled={!card.upgradeCost || playerXP < card.upgradeCost}
              className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-xl font-bold text-xl hover:scale-105 transition-transform disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <TrendingUp className="w-6 h-6" />
              {t('shop.upgrade', { cost: card.upgradeCost })}
            </button>
          </>
        ) : (
          <button
            onClick={onUnlock}
            disabled={!card.unlockCost || playerXP < card.unlockCost}
            className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-yellow-500 to-orange-600 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-xl font-bold text-xl hover:scale-105 transition-transform disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Lock className="w-6 h-6" />
            {t('shop.unlock', { cost: card.unlockCost })}
          </button>
        )}
      </div>
    </div>
  );
}