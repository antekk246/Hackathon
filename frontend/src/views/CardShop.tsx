import { ArrowLeft, Plus, X, Zap } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { parseBackendTranslation } from '../utils/translationHelper'; // <-- Import Twojej funkcji

interface Card {
  id: number;
  type: string;
  title?: string;          // <-- Dodane pole z backendu
  titleKey?: string;       // <-- Opcjonalny fallback do JSON
  description?: string;    // <-- Dodane pole z backendu
  descriptionKey?: string; // <-- Opcjonalny fallback do JSON
  color: string;
  owned: boolean;
  level: number;
  unlockCost?: number;
  upgradeCost?: number;
}

type Difficulty = 'easy' | 'medium' | 'hard';

interface CardSelectionProps {
  onBack: () => void;
  onConfirm: (selectedCards: Card[]) => void;
  availableCards: Card[];
  difficulty: Difficulty;
  adventureName?: string;
}

const CARD_LIMITS: Record<Difficulty, number> = {
  easy: 10,
  medium: 12,
  hard: 15,
};

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: 'from-green-500 to-green-600',
  medium: 'from-yellow-500 to-yellow-600',
  hard: 'from-red-500 to-red-600',
};

export function CardSelection({ 
  onBack, 
  onConfirm, 
  availableCards, 
  difficulty,
  adventureName 
}: CardSelectionProps) {
  const { t } = useTranslation();
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [selectedCardDetail, setSelectedCardDetail] = useState<number | null>(null);

  const cardLimit = CARD_LIMITS[difficulty];
  const canAddMore = selectedCards.length < cardLimit;

  const handleAddCard = (card: Card) => {
    if (canAddMore && !selectedCards.find(c => c.id === card.id)) {
      setSelectedCards([...selectedCards, card]);
    }
  };

  const handleRemoveCard = (cardId: number) => {
    setSelectedCards(selectedCards.filter(c => c.id !== cardId));
  };

  const handleConfirm = () => {
    if (selectedCards.length > 0) {
      onConfirm(selectedCards);
    }
  };

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
            {t('selection.back')}
          </button>
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-cyan-400">
              {adventureName || t('selection.title')}
            </h1>
            <div className={`inline-block mt-2 px-4 py-1 bg-gradient-to-r ${DIFFICULTY_COLORS[difficulty]} text-white rounded-full text-sm font-bold`}>
              {t('selection.difficultyPrefix', { level: t(`mainMenu.${difficulty}.label`) })}
            </div>
          </div>
          <div className="bg-blue-500 text-white px-6 py-2 rounded-lg font-bold text-lg">
            {t('selection.cardsCount', { current: selectedCards.length, max: cardLimit })}
          </div>
        </div>
      </div>

      <div className="relative z-10 flex h-[calc(100%-88px)]">
        {/* Left side - Available cards */}
        <div className="w-1/2 p-6 border-r border-slate-700 overflow-y-auto">
          <h2 className="text-2xl font-bold text-white mb-4">{t('selection.yourCards')}</h2>
          <div className="space-y-3">
            {availableCards.map(card => (
              <AvailableCardItem
                key={card.id}
                card={card}
                isSelected={selectedCards.some(c => c.id === card.id)}
                isSelectable={canAddMore || selectedCards.some(c => c.id === card.id)}
                onSelect={() => handleAddCard(card)}
                onDetails={() => setSelectedCardDetail(card.id)}
              />
            ))}
            {availableCards.length === 0 && (
               <div className="text-slate-400 p-4">{t('selection.noCardsAvailable', 'Nie masz jeszcze żadnych kart.')}</div>
            )}
          </div>
        </div>

        {/* Right side - Selected cards for adventure */}
        <div className="w-1/2 p-6 overflow-y-auto">
          <h2 className="text-2xl font-bold text-white mb-4">
            {t('selection.adventureCards')}
          </h2>

          {selectedCards.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-600 rounded-xl">
              <Zap className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-lg">{t('selection.noCards')}</p>
              <p className="text-sm">{t('selection.noCardsDesc')}</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-6">
                {selectedCards.map(card => (
                  <SelectedCardItem
                    key={card.id}
                    card={card}
                    onRemove={() => handleRemoveCard(card.id)}
                    onDetails={() => setSelectedCardDetail(card.id)}
                  />
                ))}
              </div>

              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600 mb-6">
                <div className="text-sm text-slate-400 mb-2">{t('selection.slotsFilled')}</div>
                <div className="w-full bg-slate-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(selectedCards.length / cardLimit) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-slate-400 mt-2">{t('selection.slotsCounter', { current: selectedCards.length, max: cardLimit })}</div>
              </div>

              <button
                onClick={handleConfirm}
                disabled={selectedCards.length === 0}
                className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-xl font-bold text-xl hover:scale-105 transition-transform disabled:scale-100 disabled:cursor-not-allowed"
              >
                {t('selection.confirm')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Card Detail Modal */}
      {selectedCardDetail !== null && (
        <CardDetailModal
          card={availableCards.find(c => c.id === selectedCardDetail)!}
          onClose={() => setSelectedCardDetail(null)}
        />
      )}
    </div>
  );
}

interface AvailableCardItemProps {
  card: Card;
  isSelected: boolean;
  isSelectable: boolean;
  onSelect: () => void;
  onDetails: () => void;
}

function AvailableCardItem({ 
  card, 
  isSelected, 
  isSelectable,
  onSelect, 
  onDetails 
}: AvailableCardItemProps) {
  const { t } = useTranslation();

  return (
    <div
      className={`p-4 rounded-xl transition-all duration-300 ${
        isSelected
          ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-2 border-cyan-400'
          : 'bg-slate-800/50 border-2 border-slate-700 hover:border-slate-600'
      } ${!isSelectable && !isSelected ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center justify-between">
        <button
          onClick={onDetails}
          className="flex-1 text-left"
        >
          {/* Użycie bezpośrednio funkcji parseBackendTranslation */}
          <div className="text-white font-bold text-lg hover:text-cyan-400 transition-colors">
            {parseBackendTranslation(card.title) || (card.titleKey ? t(card.titleKey) : '')}
          </div>
          <div className="text-slate-400 text-sm">
            {parseBackendTranslation(card.description) || (card.descriptionKey ? t(card.descriptionKey) : '')}
          </div>
          <div className="text-yellow-400 text-xs mt-1">{t('shop.level', { level: card.level })}</div>
        </button>
        <button
          onClick={onSelect}
          disabled={!isSelectable && !isSelected}
          className={`ml-3 p-2 rounded-lg transition-all ${
            isSelected
              ? 'bg-cyan-500 text-white'
              : isSelectable
              ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          {isSelected ? (
            <X className="w-5 h-5" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}

interface SelectedCardItemProps {
  card: Card;
  onRemove: () => void;
  onDetails: () => void;
}

function SelectedCardItem({ card, onRemove, onDetails }: SelectedCardItemProps) {
  const { t } = useTranslation();

  return (
    <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/20 to-cyan-500/20 border-2 border-green-500 hover:border-green-400 transition-all">
      <div className="flex items-center justify-between">
        <button
          onClick={onDetails}
          className="flex-1 text-left"
        >
          {/* Użycie bezpośrednio funkcji parseBackendTranslation */}
          <div className="text-white font-bold text-lg hover:text-green-300 transition-colors">
            {parseBackendTranslation(card.title) || (card.titleKey ? t(card.titleKey) : '')}
          </div>
          <div className="text-slate-300 text-sm">
            {parseBackendTranslation(card.description) || (card.descriptionKey ? t(card.descriptionKey) : '')}
          </div>
        </button>
        <button
          onClick={onRemove}
          className="ml-3 p-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

interface CardDetailModalProps {
  card: Card;
  onClose: () => void;
}

function CardDetailModal({ card, onClose }: CardDetailModalProps) {
  const { t } = useTranslation();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 rounded-2xl p-8 border-2 border-cyan-400 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`w-full h-48 rounded-xl bg-gradient-to-br ${card.color || 'from-slate-500 to-slate-600'} mb-6 flex items-center justify-center`}>
          <div className="text-6xl">📱</div>
        </div>

        {/* Użycie bezpośrednio funkcji parseBackendTranslation */}
        <h3 className="text-2xl font-bold text-white mb-2">
          {parseBackendTranslation(card.title) || (card.titleKey ? t(card.titleKey) : '')}
        </h3>
        <p className="text-slate-300 mb-4">
          {parseBackendTranslation(card.description) || (card.descriptionKey ? t(card.descriptionKey) : '')}
        </p>

        <div className="space-y-2 mb-6 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">{t('shop.type')}:</span>
            <span className="text-white font-semibold uppercase">{card.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">{t('shop.currentLevel')}:</span>
            <span className="text-yellow-400 font-semibold">{t('shop.level', { level: card.level })}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          {t('settings.close')}
        </button>
      </div>
    </div>
  );
}