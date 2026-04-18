import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, AlertTriangle, Settings, HelpCircle, Globe, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { SettingsModal } from '../components/SettingsModal';
import { 
  CardPlayAnimation, 
  CardFlipAnimation, 
  DamageAnimation,
  CardTravelingAnimation,
  DeckPile,
  DiscardPile
} from '../components/BattleAnimations';
import { useBattleTurn } from '../hooks/useBattleTurn';
import img from "../assets/IDEOLO.png";
import enemy1 from "../assets/enemy1.png";
import enemy2 from "../assets/enemy2.png"; 
import enemy3 from "../assets/enemy3.png";

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

interface HealthBarProps {
  current: number;
  max: number;
  color: 'blue' | 'red';
  label: string;
}

interface CharacterMediaProps {
  src: string;
  alt: string;
  className?: string;
}

export function GameLevel({ onEndTurn, onBackToMenu, onShowTutorial, difficulty }: GameLevelProps) {
  const { t } = useTranslation();
  
  // Player state
  const [playerHealth, setPlayerHealth] = useState(100);
  const [playerMaxHealth] = useState(100);
  const [prevPlayerHealth, setPrevPlayerHealth] = useState(100);
  const [isPlayerTakingDamage, setIsPlayerTakingDamage] = useState(false);
  const [isPlayerAttacking, setIsPlayerAttacking] = useState(false);
  const [playerMediaSrc] = useState(img);

  // General game state
  const [decisionsLeft, setDecisionsLeft] = useState(2);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [progress, setProgress] = useState(25);
  const [showMenu, setShowMenu] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Enemy state
  const [enemyHealth, setEnemyHealth] = useState(100);
  const [enemyMaxHealth] = useState(100);
  const [prevEnemyHealth, setPrevEnemyHealth] = useState(100);
  const [currentEnemyType, setCurrentEnemyType] = useState<1 | 2 | 3>(1); 
  const [isEnemyTakingDamage, setIsEnemyTakingDamage] = useState(false);
  const [isEnemyAttacking, setIsEnemyAttacking] = useState(false);

  const getEnemyImage = () => {
    switch(currentEnemyType) {
      case 1: return enemy1;
      case 2: return enemy2;
      case 3: return enemy3;
      default: return enemy1;
    }
  };

  const getEnemyName = () => {
    switch(currentEnemyType) {
      case 1: return t('gameLevel.phishingScammer');
      case 2: return t('gameLevel.linkGoblin');
      case 3: return t('gameLevel.scamTornado');
      default: return t('gameLevel.scammer');
    }
  };

  // Enemy damage animation effect
  useEffect(() => {
    if (enemyHealth < prevEnemyHealth && enemyHealth > 0) {
      setIsEnemyTakingDamage(true);
      setTimeout(() => setIsEnemyTakingDamage(false), 300);
    }
    setPrevEnemyHealth(enemyHealth);
  }, [enemyHealth, prevEnemyHealth]);

  // Player damage animation effect
  useEffect(() => {
    if (playerHealth < prevPlayerHealth && playerHealth > 0) {
      setIsPlayerTakingDamage(true);
      setTimeout(() => setIsPlayerTakingDamage(false), 300);
    }
    setPrevPlayerHealth(playerHealth);
  }, [playerHealth, prevPlayerHealth]);

  // Test Functions
  const testPlayerDamage = () => {
    if (enemyHealth === 0) return; 
    setIsEnemyAttacking(true);
    
    setTimeout(() => {
      setPlayerHealth(prev => Math.max(0, prev - 20)); 
    }, 150); 

    setTimeout(() => {
      setIsEnemyAttacking(false);
    }, 300);
  };

  const testEnemyDamage = () => {
    if (playerHealth === 0) return; 
    setIsPlayerAttacking(true);
    
    setTimeout(() => {
      setEnemyHealth(prev => Math.max(0, prev - 25)); 
    }, 150); 

    setTimeout(() => {
      setIsPlayerAttacking(false);
    }, 300);
  };
  const [usedCardsCount, setUsedCardsCount] = useState(0);
  const [showSelectedCards, setShowSelectedCards] = useState(false);

  // Battle turn logic z animacjami
  const battle = useBattleTurn();

  const handlePlayCard = async () => {
    if (selectedCards.length === 0 || battle.isAnimating || (5 - usedCardsCount) === 0) return;

    // PHASE 1: Show selected cards in center
    setShowSelectedCards(true);

    // Wait for cards to appear
    await new Promise(resolve => setTimeout(resolve, 1500));

    // PHASE 2: Hide cards and play turn
    setShowSelectedCards(false);

    // Play the turn
    await battle.playCard();

    // Odnawiaj decisionsLeft i selectedCards co turę
    const cardsPlayed = selectedCards.length;
    setDecisionsLeft(2);
    setSelectedCards([]);
    // Increment used cards count for all played cards
    setUsedCardsCount(prev => prev + cardsPlayed);
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 overflow-hidden">
      {/* Cyberpunk grid background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* --- TEST BUTTONS PANEL (DEBUG) --- */}
      <div className="absolute top-20 left-4 z-50 flex flex-col gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-600 backdrop-blur-sm">
        <span className="text-xs text-slate-400 font-bold flex items-center gap-1 uppercase">
          <Activity className="w-3 h-3" /> {t('gameLevel.debug.animationTest')}
        </span>
        <button 
          onClick={testPlayerDamage}
          className="text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded shadow transition-colors"
          disabled={enemyHealth === 0}
        >
          {t('gameLevel.debug.hitPlayer')}
        </button>
        <button 
          onClick={testEnemyDamage}
          className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded shadow transition-colors"
          disabled={playerHealth === 0}
        >
          {t('gameLevel.debug.hitEnemy')}
        </button>
      </div>

      {/* Top bar - Decisions left only */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
        {/* Decisions left */}
        <div className="flex items-center gap-2 bg-slate-900/80 px-5 py-2 rounded-full border-2 border-yellow-500/50">
          <span className="text-yellow-400 font-bold text-lg">{t('gameLevel.decisions', { current: Math.max(0, Math.min(2, 5 - usedCardsCount) - selectedCards.length), max: Math.min(2, 5 - usedCardsCount) })}</span>
        </div>

        {/* Progress bar - centered */}
        <div className="flex-1 mx-8">
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

      {/* Deck Pile - Left bottom */}
      <DeckPile cardsRemaining={5 - usedCardsCount} />

      {/* Discard Pile - Right bottom */}
      <DiscardPile cardsCount={usedCardsCount} />

      {/* ANIMATIONS LAYER - Top level, not affected by parent positioning */}
      {/* Playing Card Animation - shown when card is being played */}
      {battle.turnState.playingCard && battle.turnState.state === 'playing' && (
        <CardPlayAnimation card={battle.turnState.playingCard} isPlaying={true} />
      )}

      {/* Flip Animation - shown during animating phase */}
      {battle.turnState.state === 'animating' && (
        <CardFlipAnimation />
      )}

      {/* Damage numbers */}
      {battle.damageLog.map((log, idx) => (
        <DamageAnimation key={idx} damage={log.damage} position={log.position} />
      ))}

      {/* Card Traveling Animation */}
      {battle.turnState.playingCard && (battle.turnState.state === 'playing' || battle.turnState.state === 'animating') && (
        <CardTravelingAnimation card={battle.turnState.playingCard} isVisible={true} />
      )}

      {/* Battle area - Player vs Enemy */}
      <div className="absolute top-20 left-0 right-0 bottom-72 flex items-center justify-between px-8">
        
        {/* Player character */}
        <motion.div className="flex flex-col items-center gap-3 relative">
          {playerHealth === 0 && (
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 text-red-500 text-5xl font-black italic drop-shadow-[0_0_20px_rgba(220,38,38,1)] whitespace-nowrap animate-pulse">
               {t('gameLevel.systemFailure')}
             </div>
          )}
          <div 
            className={`
              w-56 h-72 bg-gradient-to-br from-blue-900 to-cyan-900 rounded-2xl 
              flex items-center justify-center border-4 border-cyan-500 shadow-2xl shadow-cyan-500/50 overflow-hidden
              relative z-20 transition-all 
              ${playerHealth === 0 
                ? 'grayscale brightness-50 opacity-0 translate-y-24 rotate-[-45deg] blur-xl duration-[1500ms] ease-out pointer-events-none' 
                : isPlayerTakingDamage 
                  ? 'scale-95 drop-shadow-[0_0_25px_rgba(220,38,38,0.8)] brightness-125 saturate-150 duration-300' 
                  : isPlayerAttacking 
                    ? 'translate-x-24 scale-110 drop-shadow-[0_0_20px_rgba(34,211,238,0.8)] duration-300' 
                    : 'scale-100 duration-300'}
            `}
          >
            {playerMediaSrc && (
              <CharacterMedia
                src={playerMediaSrc}
                alt="Player Character"
                className="w-3/4 h-3/4 object-contain drop-shadow-2xl transition-transform duration-300 hover:scale-105"
              />
            )}
            
            <div className="absolute bottom-2 w-full text-center bg-black/50 py-1">
              <div className="text-sm font-bold text-cyan-300">{t('gameLevel.you')}</div>
            </div>
          </div>
          <HealthBar
            current={battle.playerHealth}
            max={100}
            color="blue"
            label={t('gameLevel.you')}
          />
        </motion.div>

        {/* CENTER: End Turn Button + State Indicator */}
        <div className="flex flex-col items-center gap-4">
          {/* Selected Cards Display - shows chosen cards in center */}
          {showSelectedCards && selectedCards.length > 0 && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="flex gap-4 items-center justify-center"
            >
              {selectedCards.map((cardId) => {
                const card = phoneCardDefinitions.find(c => c.id === cardId);
                return card ? (
                  <motion.div
                    key={cardId}
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-24 h-36 rounded-2xl border-3 border-cyan-400 bg-slate-800 flex flex-col overflow-hidden shadow-2xl shadow-cyan-500/50"
                  >
                    <div className={`h-12 bg-gradient-to-br ${card.color} flex items-center justify-center text-xl font-bold text-white`}>
                      {card.type.toUpperCase()}
                    </div>
                    <div className="flex-1 p-2 flex flex-col justify-center">
                      <div className="text-[8px] font-bold text-cyan-400 mb-1">{card.type.toUpperCase()}</div>
                      <div className="text-white font-bold text-xs text-center">{t(card.titleKey)}</div>
                    </div>
                  </motion.div>
                ) : null;
              })}
            </motion.div>
          )}

          {/* End Turn Button - PRIMARY CTA */}
          {!showSelectedCards && (
            <motion.button
              onClick={handlePlayCard}
              disabled={selectedCards.length === 0 || battle.isAnimating || (5 - usedCardsCount) === 0}
              whileHover={selectedCards.length > 0 && !battle.isAnimating && (5 - usedCardsCount) > 0 ? { scale: 1.05 } : {}}
              whileTap={selectedCards.length > 0 && !battle.isAnimating && (5 - usedCardsCount) > 0 ? { scale: 0.95 } : {}}
              className={`
                px-12 py-4 rounded-full font-bold text-lg transition-all
                ${selectedCards.length === 0 || battle.isAnimating || (5 - usedCardsCount) === 0
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/40 border-2 border-cyan-300/50'
                }
              `}
            >
              {battle.turnState.state === 'idle' ? t('gameLevel.endTurn') : '...'}
            </motion.button>
          )}
        </div>

        {/* VS indicator */}
        <div className="text-4xl font-bold text-cyan-400 opacity-20 transition-opacity duration-500" style={{ opacity: (playerHealth === 0 || enemyHealth === 0) ? 0 : 0.2 }}>
          VS
        </div>

        {/* Enemy */}
        <motion.div className="flex flex-col items-center gap-3 relative">
          {enemyHealth === 0 && (
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 text-cyan-400 text-5xl font-black italic drop-shadow-[0_0_20px_rgba(34,211,238,1)] whitespace-nowrap animate-bounce">
               {t('gameLevel.neutralized')}
             </div>
          )}
          <div className="relative z-20">
            <div 
              className={`
                w-56 h-72 bg-gradient-to-br from-red-900 to-purple-900 rounded-2xl 
                flex items-center justify-center border-4 border-red-500 shadow-2xl shadow-red-500/50 overflow-hidden
                transition-all z-20
                ${enemyHealth === 0 
                  ? 'scale-0 opacity-0 rotate-[360deg] blur-2xl brightness-200 duration-[1500ms] ease-in pointer-events-none' 
                  : isEnemyTakingDamage 
                    ? 'scale-95 brightness-150 saturate-200 hue-rotate-[-45deg] duration-300' 
                    : isEnemyAttacking 
                      ? '-translate-x-24 scale-110 drop-shadow-[0_0_25px_rgba(220,38,38,0.8)] duration-300' 
                      : 'scale-100 duration-300'}
              `}
            >
              <CharacterMedia
                src={getEnemyImage()}
                alt="Enemy"
                className="w-3/4 h-3/4 object-contain drop-shadow-2xl transition-transform duration-300 hover:scale-105" 
              />
              
              <div className="absolute bottom-2 w-full text-center bg-black/50 py-1">
                <div className="text-sm font-bold text-red-300">{getEnemyName()}</div>
              </div>
            </div>

            {enemyHealth > 0 && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-30 transition-opacity">
                {t('gameLevel.nextAttack', { damage: 15 })}
              </div>
            )}
          </div>
          
          <HealthBar
            current={battle.enemyHealth}
            max={90}
            color="red"
            label={t('gameLevel.scammer')}
          />
        </motion.div>
      </div>

      {/* Phone screen cards - Cards selection area */}
      <div className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-950 via-slate-900/95 to-transparent pt-20 transition-opacity duration-700 ${playerHealth === 0 || enemyHealth === 0 ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        
        <div className="flex justify-center items-end gap-2 relative">
          {phoneCardDefinitions.map((card, index) => {
            const totalCards = phoneCardDefinitions.length;
            const middleIndex = (totalCards - 1) / 2;
            const offset = index - middleIndex;
            const rotation = offset * 8;
            const translateY = Math.abs(offset) * 12;

            return (
              <motion.div
                key={card.id}
                animate={{
                  rotate: rotation,
                  y: translateY,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                style={{ originX: 0.5, originY: 1 }}
                className="cursor-pointer"
              >
                <PhoneScreenCard
                  card={card}
                  selected={selectedCards.includes(card.id)}
                  onSelect={() => {
                    if (selectedCards.includes(card.id)) {
                      setSelectedCards(selectedCards.filter(id => id !== card.id));
                    } else if (selectedCards.length < 2 && battle.canSelectCard && (5 - usedCardsCount) > selectedCards.length) {
                      setSelectedCards([...selectedCards, card.id]);
                    }
                  }}
                  disabled={battle.isAnimating || (decisionsLeft === 0 && !selectedCards.includes(card.id)) || (!selectedCards.includes(card.id) && (5 - usedCardsCount) <= selectedCards.length)}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function HealthBar({ current, max, color, label }: HealthBarProps) {
  const percentage = (current / max) * 100;
  const colorClasses = color === 'blue'
    ? 'from-blue-500 to-cyan-500'
    : 'from-red-500 to-orange-500';

  return (
    <div className="w-56 transition-opacity duration-500" style={{ opacity: current === 0 ? 0.3 : 1 }}>
      <div className="flex justify-between mb-1">
        <span className="text-white text-xs font-bold">{label}</span>
        <span className="text-white text-xs font-bold flex items-center gap-1">
          <Heart className={`w-3 h-3 ${current === 0 ? 'text-gray-500' : ''}`} />
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

function CharacterMedia({ src, alt, className }: CharacterMediaProps) {
  const isVideo = src.endsWith('.mp4') || src.endsWith('.webm') || src.endsWith('.mov');

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
    <motion.button
      onClick={onSelect}
      disabled={disabled}
      animate={{ scale: selected ? 1.1 : 1, y: selected ? -20 : 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`
        relative w-32 h-48 rounded-3xl border-4 pointer-events-auto
        ${selected ? 'border-cyan-400 shadow-2xl shadow-cyan-500/50' : 'border-slate-700 hover:border-slate-500'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <div className="absolute inset-2 bg-slate-950 rounded-2xl overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-5 bg-slate-900 rounded-b-2xl z-10" />

        <div className={`absolute inset-0 pt-7 pb-3 px-2 bg-gradient-to-br ${card.color} flex flex-col justify-between`}>
          <div className="text-white text-center">
            <div className="text-[10px] font-bold mb-1 opacity-80">{card.type.toUpperCase()}</div>
            <div className="text-xs font-bold leading-tight">{t(card.titleKey)}</div>
          </div>

          <div className="text-white text-[10px] text-center opacity-90 leading-tight">
            {t(card.descriptionKey)}
          </div>
        </div>

        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-1 bg-slate-600 rounded-full" />
      </div>
    </motion.button>
  );
}