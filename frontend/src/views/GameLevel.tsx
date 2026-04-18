import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, AlertTriangle, Settings, HelpCircle, Globe } from 'lucide-react';
import { SettingsModal } from '../components/SettingsModal';
import img from "../assets/image-3.png";

interface PhoneCard {
  id: number;
  type: 'block' | 'report' | 'verify' | 'ignore';
  titleKey: string;
  descriptionKey: string;
  cost: number;
  color: string;
}

const phoneCardDefinitions: PhoneCard[] = [
  {
    id: 1,
    type: 'block',
    titleKey: 'cards.blockSender.title',
    descriptionKey: 'cards.blockSender.description',
    cost: 1,
    color: 'from-red-500 to-red-600'
  },
  {
    id: 2,
    type: 'report',
    titleKey: 'cards.reportScam.title',
    descriptionKey: 'cards.reportScam.description',
    cost: 1,
    color: 'from-orange-500 to-orange-600'
  },
  {
    id: 3,
    type: 'verify',
    titleKey: 'cards.verifySource.title',
    descriptionKey: 'cards.verifySource.description',
    cost: 1,
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 4,
    type: 'ignore',
    titleKey: 'cards.deleteIgnore.title',
    descriptionKey: 'cards.deleteIgnore.description',
    cost: 1,
    color: 'from-gray-500 to-gray-600'
  },
  {
    id: 5,
    type: 'block',
    titleKey: 'cards.twoFAShield.title',
    descriptionKey: 'cards.twoFAShield.description',
    cost: 1,
    color: 'from-green-500 to-green-600'
  }
];

interface GameLevelProps {
  onEndTurn: () => void;
  onBackToMenu: () => void;
  onShowTutorial: () => void;
  difficulty: 'easy' | 'medium' | 'hard';
}

export function GameLevel({ onEndTurn, onBackToMenu, onShowTutorial, difficulty }: GameLevelProps) {
  const { t } = useTranslation();
  const [playerHealth, setPlayerHealth] = useState(80);
  const [playerMaxHealth] = useState(100);
  const [decisionsLeft, setDecisionsLeft] = useState(2);
  const [enemyHealth, setEnemyHealth] = useState(50);
  const [enemyMaxHealth] = useState(90);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [progress, setProgress] = useState(25);
  const [showMenu, setShowMenu] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [playerMediaSrc] = useState(img);
  const [enemyMediaSrc] = useState<string | null>(null);

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 overflow-hidden">
      {/* Cyberpunk grid background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
        {/* Decisions left */}
        <div className="flex items-center gap-2 bg-slate-900/80 px-5 py-2 rounded-full border-2 border-yellow-500/50">
          <span className="text-yellow-400 font-bold text-lg">{t('gameLevel.decisions', { current: decisionsLeft, max: 2 })}</span>
        </div>

        {/* Progress bar and End Turn button container */}
        <div className="flex-1 mx-8 flex flex-col items-center gap-3">
          <div className="w-full bg-slate-900/80 px-6 py-3 rounded-full border-2 border-cyan-500/50">
            <div className="flex items-center gap-3">
              <span className="text-white font-bold text-sm whitespace-nowrap">{t('gameLevel.adventureProgress')}</span>
              <div className="flex-1 h-4 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-cyan-400 font-bold text-sm">{progress}%</span>
            </div>
          </div>

          {/* End Turn button */}
          <button
            onClick={onEndTurn}
            className="px-12 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-full shadow-lg shadow-cyan-500/40 transition-all transform hover:scale-105 border-2 border-cyan-300/50 text-lg"
          >
            {t('gameLevel.endTurn')}
          </button>
        </div>

        {/* Settings menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-3 bg-slate-900/80 rounded-full border-2 border-slate-600 hover:border-cyan-400 transition-colors"
          >
            <Settings className="w-6 h-6 text-white" />
          </button>

          {showMenu && (
            <div className="absolute top-full right-0 mt-2 bg-slate-900 border-2 border-cyan-400 rounded-xl overflow-hidden shadow-2xl min-w-[200px]">
              <button
                onClick={() => {
                  onShowTutorial();
                  setShowMenu(false);
                }}
                className="w-full px-6 py-3 text-left text-white hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                <HelpCircle className="w-5 h-5" />
                <span>{t('gameLevel.guide')}</span>
              </button>
              <button
                onClick={() => {
                  setIsSettingsOpen(true);
                  setShowMenu(false);
                }}
                className="w-full px-6 py-3 text-left text-white hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                <Globe className="w-5 h-5" />
                <span>{t('mainMenu.settings')}</span>
              </button>
              <button
                onClick={onBackToMenu}
                className="w-full px-6 py-3 text-left text-white hover:bg-slate-800 transition-colors"
              >
                {t('gameLevel.backToMenu')}
              </button>
            </div>
          )}
        </div>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onOpenChange={setIsSettingsOpen} 
      />

      {/* Battle area */}
      <div className="absolute top-20 left-0 right-0 bottom-72 flex items-center justify-around px-20">
        {/* Player character */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            {playerMediaSrc && (
              <CharacterMedia
                src={playerMediaSrc}
                alt="Player Character"
                className="w-56 h-72 object-contain drop-shadow-2xl"
              />
            )}
          </div>
          <HealthBar
            current={playerHealth}
            max={playerMaxHealth}
            color="blue"
            label={t('gameLevel.you')}
          />
        </div>

        {/* VS indicator */}
        <div className="text-4xl font-bold text-cyan-400 opacity-20">VS</div>

        {/* Enemy */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            {enemyMediaSrc ? (
              <CharacterMedia
                src={enemyMediaSrc}
                alt="Enemy"
                className="w-56 h-72 object-contain drop-shadow-2xl"
              />
            ) : (
              <div className="w-56 h-72 bg-gradient-to-br from-red-900 to-purple-900 rounded-2xl flex items-center justify-center border-4 border-red-500 shadow-2xl shadow-red-500/50">
                <div className="text-center px-4">
                  <AlertTriangle className="w-20 h-20 text-red-400 mx-auto mb-2 animate-pulse" />
                  <div className="text-xl font-bold text-red-300">{t('gameLevel.phishingScammer')}</div>
                  <div className="text-xs text-red-400 mt-1">
                    "{t('gameLevel.phishingQuote')}"
                  </div>
                </div>
              </div>
            )}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
              {t('gameLevel.nextAttack', { damage: 15 })}
            </div>
          </div>
          <HealthBar
            current={enemyHealth}
            max={enemyMaxHealth}
            color="red"
            label={t('gameLevel.scammer')}
          />
        </div>
      </div>

      {/* Phone screen cards */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-950 via-slate-900/95 to-transparent pt-10">
        <div className="text-center text-slate-400 text-xs mb-3 font-semibold">
          {t('gameLevel.chooseDefense', { count: decisionsLeft })}
        </div>
        <div className="flex justify-center items-end gap-1" style={{ perspective: '1000px' }}>
          {phoneCardDefinitions.map((card, index) => {
            const totalCards = phoneCardDefinitions.length;
            const middleIndex = (totalCards - 1) / 2;
            const offset = index - middleIndex;
            const rotation = offset * 8;
            const translateY = Math.abs(offset) * 12;

            return (
              <div
                key={card.id}
                style={{
                  transform: `rotate(${rotation}deg) translateY(${translateY}px)`,
                  transformOrigin: 'bottom center',
                  transition: 'all 0.3s ease'
                }}
              >
                <PhoneScreenCard
                  card={card}
                  selected={selectedCards.includes(card.id)}
                  onSelect={() => {
                    if (selectedCards.includes(card.id)) {
                      setSelectedCards(selectedCards.filter(id => id !== card.id));
                    } else if (selectedCards.length < 2) {
                      setSelectedCards([...selectedCards, card.id]);
                    }
                  }}
                  disabled={decisionsLeft === 0 && !selectedCards.includes(card.id)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface HealthBarProps {
  current: number;
  max: number;
  color: 'blue' | 'red';
  label: string;
}

function HealthBar({ current, max, color, label }: HealthBarProps) {
  const percentage = (current / max) * 100;
  const colorClasses = color === 'blue'
    ? 'from-blue-500 to-cyan-500'
    : 'from-red-500 to-orange-500';

  return (
    <div className="w-56">
      <div className="flex justify-between mb-1">
        <span className="text-white text-xs font-bold">{label}</span>
        <span className="text-white text-xs font-bold flex items-center gap-1">
          <Heart className="w-3 h-3" />
          {current}/{max}
        </span>
      </div>
      <div className="w-full h-4 bg-slate-800 rounded-full border-2 border-slate-600 overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${colorClasses} transition-all duration-500 shadow-lg`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface CharacterMediaProps {
  src: string;
  alt: string;
  className?: string;
}

function CharacterMedia({ src, alt, className }: CharacterMediaProps) {
  const isVideo = src.endsWith('.mp4') || src.endsWith('.webm') || src.endsWith('.mov');
  const isGif = src.endsWith('.gif');

  if (isVideo) {
    return (
      <video
        src={src}
        className={className}
        autoPlay
        loop
        muted
        playsInline
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
    />
  );
}

interface PhoneScreenCardProps {
  card: PhoneCard;
  selected: boolean;
  onSelect: () => void;
  disabled: boolean;
}

function PhoneScreenCard({ card, selected, onSelect, disabled }: PhoneScreenCardProps) {
  const { t } = useTranslation();
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={`
        relative w-32 h-48 rounded-3xl border-4 transition-all duration-300
        ${selected ? 'border-cyan-400 shadow-2xl shadow-cyan-500/50 scale-105' : 'border-slate-700'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}
      `}
      style={{
        transform: selected ? 'translateY(-20px) scale(1.05)' : 'translateY(0)',
      }}
    >
      {/* Phone screen frame */}
      <div className="absolute inset-2 bg-slate-950 rounded-2xl overflow-hidden">
        {/* Phone notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-5 bg-slate-900 rounded-b-2xl" />

        {/* Phone content */}
        <div className={`absolute inset-0 pt-7 pb-3 px-2 bg-gradient-to-br ${card.color} flex flex-col justify-between`}>
          <div className="text-white text-center">
            <div className="text-[10px] font-bold mb-1 opacity-80">{card.type.toUpperCase()}</div>
            <div className="text-xs font-bold leading-tight">{t(card.titleKey)}</div>
          </div>

          <div className="text-white text-[10px] text-center opacity-90 leading-tight">
            {t(card.descriptionKey)}
          </div>
        </div>

        {/* Phone home indicator */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-1 bg-slate-600 rounded-full" />
      </div>
    </button>
  );
}
