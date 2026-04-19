import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Shield, Zap, Settings, HelpCircle, Globe, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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

// 1. ROZBUDOWANY INTERFEJS KARTY O EFEKTY
interface PhoneCard {
  id: number;
  type: 'block' | 'report' | 'verify' | 'ignore';
  titleKey: string;
  descriptionKey: string;
  cost: number;
  color: string;
  damage?: number;
  shield?: number;
  heal?: number;
}

// 2. DEFINICJE KART Z LOGIKĄ EFEKTÓW
const phoneCardDefinitions: PhoneCard[] = [
  { id: 1, type: 'block', titleKey: 'cards.blockSender.title', descriptionKey: 'cards.blockSender.description', cost: 1, color: 'from-blue-500 to-blue-700', shield: 15 },
  { id: 2, type: 'report', titleKey: 'cards.reportScam.title', descriptionKey: 'cards.reportScam.description', cost: 2, color: 'from-red-500 to-red-700', damage: 25 },
  { id: 3, type: 'verify', titleKey: 'cards.verifySource.title', descriptionKey: 'cards.verifySource.description', cost: 1, color: 'from-teal-500 to-teal-700', damage: 5, shield: 10 },
  { id: 4, type: 'ignore', titleKey: 'cards.deleteIgnore.title', descriptionKey: 'cards.deleteIgnore.description', cost: 0, color: 'from-gray-500 to-gray-700', shield: 5 },
  { id: 5, type: 'block', titleKey: 'cards.twoFAShield.title', descriptionKey: 'cards.twoFAShield.description', cost: 2, color: 'from-blue-400 to-blue-600', shield: 25 },
  { id: 6, type: 'verify', titleKey: 'cards.checkLink.title', descriptionKey: 'cards.checkLink.description', cost: 1, color: 'from-teal-400 to-teal-600', heal: 10, damage: 5 },
  { id: 7, type: 'report', titleKey: 'cards.callBank.title', descriptionKey: 'cards.callBank.description', cost: 3, color: 'from-orange-500 to-red-600', damage: 40 },
  { id: 8, type: 'ignore', titleKey: 'cards.spamFolder.title', descriptionKey: 'cards.spamFolder.description', cost: 1, color: 'from-purple-500 to-purple-700', damage: 10, shield: 5 },
  { id: 9, type: 'block', titleKey: 'cards.updateOS.title', descriptionKey: 'cards.updateOS.description', cost: 1, color: 'from-indigo-500 to-indigo-700', shield: 10, heal: 5 },
  { id: 10, type: 'verify', titleKey: 'cards.passwordChange.title', descriptionKey: 'cards.passwordChange.description', cost: 2, color: 'from-cyan-500 to-cyan-700', damage: 15, shield: 15 }
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
  shield?: number;
}

interface CharacterMediaProps {
  src: string;
  alt: string;
  className?: string;
}

// NOWE: Funkcja pomocnicza do odtwarzania dźwięków
const playSound = (type: 'attack' | 'shield' | 'heal' | 'enemyAttack' | 'shuffle' | 'gameOver' | 'victory') => {
  const sounds: Record<string, string> = {
    attack: '/public/audio/attack.mp3',
    shield: '/public/audio/shield.mp3',
    heal: '/public/audio/heal.mp3',
    enemyAttack: '/public/audio/enemy-attack.mp3',
    shuffle: '/public/audio/shuffle.mp3',
    gameOver: '/public/audio/gameOver.mp3',
    victory: '/public/audio/victory.mp3'
  };

  try {
    const audio = new Audio(sounds[type]);
    audio.volume = 0.5; 
    
    if (type === 'shuffle') {
      audio.playbackRate = 1.5;
    }

    audio.play().catch(e => console.warn('Brak pliku audio lub zablokowane przez przeglądarkę:', e));
  } catch (error) {
    console.error('Błąd audio', error);
  }
};


export function GameLevel({ onEndTurn, onBackToMenu, onShowTutorial, difficulty }: GameLevelProps) {
  const { t } = useTranslation();
  
  // Player state
  const [playerHealth, setPlayerHealth] = useState(100);
  const [playerMaxHealth] = useState(100);
  const [playerShield, setPlayerShield] = useState(0); 
  const [prevPlayerHealth, setPrevPlayerHealth] = useState(100);
  const [isPlayerTakingDamage, setIsPlayerTakingDamage] = useState(false);
  const [isPlayerAttacking, setIsPlayerAttacking] = useState(false);
  const [playerMediaSrc] = useState(img);

  // General game state
  const [energy, setEnergy] = useState(3); 
  const [maxEnergy] = useState(3);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [availableCards, setAvailableCards] = useState<PhoneCard[]>(phoneCardDefinitions);
  const [discardedCards, setDiscardedCards] = useState<PhoneCard[]>([]);
  const [showSelectedCards, setShowSelectedCards] = useState(false);

  // Enemy state & Levels
  const [currentEnemyType, setCurrentEnemyType] = useState<1 | 2 | 3>(1); 
  const [enemyHealth, setEnemyHealth] = useState(100);
  const [enemyMaxHealth, setEnemyMaxHealth] = useState(100);
  const [enemyNextAttack] = useState(15); 
  const [prevEnemyHealth, setPrevEnemyHealth] = useState(100);
  const [isEnemyTakingDamage, setIsEnemyTakingDamage] = useState(false);
  const [isEnemyAttacking, setIsEnemyAttacking] = useState(false);

  const [isLevelTransitioning, setIsLevelTransitioning] = useState(false);
  const [isGameWon, setIsGameWon] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false); // NOWE: Stan przegranej

  const progress = Math.min(100, Math.round(((currentEnemyType - 1) * 33.3) + (((enemyMaxHealth - enemyHealth) / enemyMaxHealth) * 33.3)));

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
      case 1: return t('gameLevel.phishingScammer', 'Phishing Scammer');
      case 2: return t('gameLevel.linkGoblin', 'Link Goblin');
      case 3: return t('gameLevel.scamTornado', 'Scam Tornado');
      default: return t('gameLevel.scammer', 'Scammer');
    }
  };

  // NOWE: Logika Game Over
  useEffect(() => {
    if (playerHealth <= 0 && !isGameOver) {
      setIsGameOver(true);
      playSound('gameOver');
    }
  }, [playerHealth, isGameOver]);

  // NOWE: Mechanika dobierania odrzuconych kart, gdy deck jest pusty
  useEffect(() => {
    if (availableCards.length === 0 && discardedCards.length > 0) {
      playSound('shuffle');
      // Przetasuj odrzucone karty
      const shuffled = [...discardedCards].sort(() => Math.random() - 0.5);
      setAvailableCards(shuffled);
      setDiscardedCards([]);
    }
  }, [availableCards.length, discardedCards]);

  useEffect(() => {
    if (enemyHealth < prevEnemyHealth && enemyHealth > 0) {
      setIsEnemyTakingDamage(true);
      setTimeout(() => setIsEnemyTakingDamage(false), 300);
    }
    setPrevEnemyHealth(enemyHealth);
  }, [enemyHealth, prevEnemyHealth]);

  useEffect(() => {
    if (playerHealth < prevPlayerHealth && playerHealth > 0) {
      setIsPlayerTakingDamage(true);
      setTimeout(() => setIsPlayerTakingDamage(false), 300);
    }
    setPrevPlayerHealth(playerHealth);
  }, [playerHealth, prevPlayerHealth]);

  useEffect(() => {
    if (enemyHealth === 0) {
      const timer = setTimeout(() => {
        if (currentEnemyType < 3) {
          setIsLevelTransitioning(true);
          playSound('victory');
          setTimeout(() => {
            setCurrentEnemyType(prev => (prev + 1) as 1 | 2 | 3);
            const newMaxHealth = currentEnemyType === 1 ? 150 : 200; 
            setEnemyMaxHealth(newMaxHealth);
            setEnemyHealth(newMaxHealth);
            setPrevEnemyHealth(newMaxHealth);
            setPlayerHealth(playerMaxHealth); 
            setPlayerShield(0);
            setEnergy(maxEnergy);
            setAvailableCards(phoneCardDefinitions); 
            setDiscardedCards([]);
            
            setTimeout(() => {
              setIsLevelTransitioning(false);
            }, 1000);
          }, 1500); 
        } else {
          setIsGameWon(true);
          playSound('victory');
        }
      }, 2000); 
      return () => clearTimeout(timer);
    }
  }, [enemyHealth, currentEnemyType, playerMaxHealth, maxEnergy]);

  const battle = useBattleTurn();

  // NOWE: Restart gry po przegranej
  const handleRestartLevel = () => {
    setIsGameOver(false);
    setPlayerHealth(playerMaxHealth);
    setPlayerShield(0);
    setEnemyHealth(enemyMaxHealth);
    setPrevEnemyHealth(enemyMaxHealth);
    setPrevPlayerHealth(playerMaxHealth);
    setEnergy(maxEnergy);
    setAvailableCards([...phoneCardDefinitions].sort(() => Math.random() - 0.5)); // Wymieszane na start
    setDiscardedCards([]);
    setSelectedCards([]);
  };

  const handlePlayCard = async () => {
    if (selectedCards.length === 0 || battle.isAnimating) return;
    const playedCardId = selectedCards[0];
    const playedCard = availableCards.find(c => c.id === playedCardId);

    if (!playedCard || energy < playedCard.cost) return; 

    setEnergy(prev => prev - playedCard.cost);

    setShowSelectedCards(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setShowSelectedCards(false);

    setIsPlayerAttacking(true);
    setTimeout(() => setIsPlayerAttacking(false), 300);

    // Zaaplikuj efekty karty i odegraj dźwięki
    if (playedCard.damage) {
      setEnemyHealth(prev => Math.max(0, prev - playedCard.damage!));
      playSound('attack');
    }
    if (playedCard.shield) {
      setPlayerShield(prev => prev + playedCard.shield!);
      playSound('shield');
    }
    if (playedCard.heal) {
      setPlayerHealth(prev => Math.min(playerMaxHealth, prev + playedCard.heal!));
      playSound('heal');
    }

    await battle.playCard();

    // Odrzuć kartę
    setAvailableCards(prev => prev.filter(c => c.id !== playedCardId));
    setDiscardedCards(prev => [...prev, playedCard]);
    setSelectedCards([]);
  };

  const handleEndTurnClick = () => {
    setSelectedCards([]);
    if (enemyHealth === 0) return;

    setIsEnemyAttacking(true);
    
    setTimeout(() => {
      playSound('enemyAttack'); // Dźwięk ataku wroga
      setPlayerShield(currentShield => {
        if (currentShield >= enemyNextAttack) {
          return currentShield - enemyNextAttack; 
        } else {
          const remainingDamage = enemyNextAttack - currentShield;
          setPlayerHealth(prev => Math.max(0, prev - remainingDamage)); 
          return 0; 
        }
      });
      setIsEnemyAttacking(false);

      setTimeout(() => {
        setEnergy(maxEnergy);
        setPlayerShield(0); 
      }, 500);

    }, 300);
  };

  const selectedCardObj = availableCards.find(c => c.id === selectedCards[0]);
  const canPlaySelectedCard = selectedCardObj ? energy >= selectedCardObj.cost : false;

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* TOP HEADER MENU */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
        
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-slate-900/80 px-5 py-2 rounded-full border-2 border-yellow-500/50">
            <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <span className="text-yellow-400 font-bold text-lg">{energy}/{maxEnergy}</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/80 px-5 py-2 rounded-full border-2 border-blue-500/50">
            <span className="text-blue-400 font-bold text-lg">{t('gameLevel.cardsInHand', 'Karty')}: {availableCards.length}</span>
          </div>
        </div>

        <div className="flex-1 mx-8 hidden md:block">
          <div className="w-full bg-slate-900/80 px-6 py-3 rounded-full border-2 border-cyan-500/50">
            <div className="flex items-center gap-3">
              <span className="text-white font-bold text-sm whitespace-nowrap">{t('gameLevel.adventureProgress', 'Postęp')} (Lvl {currentEnemyType}/3)</span>
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
  onClick={() => { onShowTutorial(); setShowMenu(false); }}
  className="w-full px-6 py-3 text-left text-white hover:bg-slate-800 transition-colors flex items-center gap-2"
>
  <HelpCircle className="w-5 h-5" />
  <span>{t('gameLevel.guide')}</span>
</button>
              <button
                onClick={() => { setIsSettingsOpen(true); setShowMenu(false); }}
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

      <SettingsModal isOpen={isSettingsOpen} onOpenChange={setIsSettingsOpen} />

      <DeckPile cardsRemaining={availableCards.length} />
      <DiscardPile cardsCount={discardedCards.length} />

      {battle.turnState.playingCard && battle.turnState.state === 'playing' && (
        <CardPlayAnimation card={battle.turnState.playingCard} isPlaying={true} />
      )}
      {battle.turnState.state === 'animating' && (
        <CardFlipAnimation />
      )}
      {battle.damageLog.map((log, idx) => (
        <DamageAnimation key={idx} damage={log.damage} position={log.position} />
      ))}
      {battle.turnState.playingCard && (battle.turnState.state === 'playing' || battle.turnState.state === 'animating') && (
        <CardTravelingAnimation card={battle.turnState.playingCard} isVisible={true} />
      )}

      {/* CHARACTERS & BUTTONS */}
      <div className="absolute top-20 left-0 right-0 bottom-72 flex items-center justify-center gap-12 md:gap-24 px-8">
        
        {/* PLAYER CARD */}
        <motion.div className="flex flex-col items-center gap-3 relative">
          {playerHealth === 0 && (
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 text-red-500 text-5xl font-black italic drop-shadow-[0_0_20px_rgba(220,38,38,1)] whitespace-nowrap animate-pulse pointer-events-none">
               {t('gameLevel.systemFailure', 'SYSTEM FAILURE')}
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
            {playerShield > 0 && (
               <div className="absolute inset-0 border-8 border-blue-400 rounded-xl opacity-70 animate-pulse pointer-events-none z-30 shadow-[inset_0_0_20px_rgba(96,165,250,0.8)]" />
            )}

            {playerMediaSrc && (
              <CharacterMedia
                src={playerMediaSrc}
                alt="Player Character"
                className="w-3/4 h-3/4 object-contain drop-shadow-2xl transition-transform duration-300 hover:scale-105 relative z-10"
              />
            )}
            <div className="absolute bottom-2 w-full text-center bg-black/50 py-1 z-10">
              <div className="text-sm font-bold text-cyan-300">{t('gameLevel.you', 'TY')}</div>
            </div>
          </div>
          <HealthBar current={playerHealth} max={playerMaxHealth} shield={playerShield} color="blue" label={t('gameLevel.you', 'TY')} />
        </motion.div>

        {/* CENTER: PLAY & END TURN BUTTONS */}
        <div className="flex flex-col items-center gap-4 z-30">
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
                    className="w-24 h-36 rounded-2xl border-3 border-cyan-400 bg-slate-800 flex flex-col overflow-hidden shadow-2xl shadow-cyan-500/50"
                  >
                    <div className={`h-12 bg-gradient-to-br ${card.color} flex items-center justify-center text-xl font-bold text-white`}>
                      {card.type.toUpperCase()}
                    </div>
                    <div className="flex-1 p-2 flex flex-col justify-center">
                      <div className="text-white font-bold text-xs text-center">{t(card.titleKey)}</div>
                    </div>
                  </motion.div>
                ) : null;
              })}
            </motion.div>
          )}

          {!showSelectedCards && (
            <div className="flex flex-col gap-3 mt-4">
              <motion.button
                onClick={handlePlayCard}
                disabled={selectedCards.length === 0 || battle.isAnimating || availableCards.length === 0 || enemyHealth === 0 || !canPlaySelectedCard || isGameOver}
                whileHover={selectedCards.length > 0 && !battle.isAnimating && enemyHealth > 0 && canPlaySelectedCard && !isGameOver ? { scale: 1.05 } : {}}
                whileTap={selectedCards.length > 0 && !battle.isAnimating && enemyHealth > 0 && canPlaySelectedCard && !isGameOver ? { scale: 0.95 } : {}}
                className={`
                  px-12 py-4 rounded-full font-bold text-lg transition-all min-w-[200px]
                  ${selectedCards.length === 0 || battle.isAnimating || availableCards.length === 0 || enemyHealth === 0 || !canPlaySelectedCard || isGameOver
                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white shadow-lg shadow-green-500/40 border-2 border-green-300/50'
                  }
                `}
              >
                {!canPlaySelectedCard && selectedCards.length > 0 ? t('gameLevel.noEnergy', 'BRAK ENERGII') : t('gameLevel.playCard', 'ZAGRAJ KARTĘ')}
              </motion.button>

              <motion.button
                onClick={handleEndTurnClick}
                disabled={battle.isAnimating || enemyHealth === 0 || isGameOver}
                whileHover={!battle.isAnimating && enemyHealth > 0 && !isGameOver ? { scale: 1.05 } : {}}
                whileTap={!battle.isAnimating && enemyHealth > 0 && !isGameOver ? { scale: 0.95 } : {}}
                className={`
                  px-8 py-3 rounded-full font-bold text-sm transition-all min-w-[200px]
                  ${battle.isAnimating || enemyHealth === 0 || isGameOver
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-800 hover:bg-slate-700 text-red-400 border border-red-500/50'
                  }
                `}
              >
                {t('gameLevel.endTurn', 'ZAKOŃCZ TURĘ')}
              </motion.button>
            </div>
          )}
        </div>
       
        {/* ENEMY CARD */}
        <motion.div className="flex flex-col items-center gap-3 relative">
          {enemyHealth === 0 && (
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 text-cyan-400 text-5xl font-black italic drop-shadow-[0_0_20px_rgba(34,211,238,1)] whitespace-nowrap animate-bounce">
               {t('gameLevel.neutralized', 'NEUTRALIZED')}
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

            {enemyHealth > 0 && !isGameOver && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-30 transition-opacity flex items-center gap-1">
                ⚔️ {enemyNextAttack} HP
              </div>
            )}
          </div>
          
          <HealthBar current={enemyHealth} max={enemyMaxHealth} color="red" label={getEnemyName()} />
        </motion.div>
      </div>

      {/* HAND/CARDS AREA */}
      <div className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-950 via-slate-900/95 to-transparent pt-20 transition-opacity duration-700 ${playerHealth === 0 || enemyHealth === 0 ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        <div className="flex justify-center items-end gap-2 relative">
          {availableCards.map((card, index) => {
            const totalCards = availableCards.length;
            const middleIndex = (totalCards - 1) / 2;
            const offset = index - middleIndex;
            const rotation = offset * 8;
            const translateY = Math.abs(offset) * 12;

            return (
              <motion.div
                key={`${card.id}-${index}`} // Dodano lepszy key dla duplikatów
                animate={{ rotate: rotation, y: translateY }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                style={{ originX: 0.5, originY: 1 }}
                className="cursor-pointer"
              >
                <PhoneScreenCard
                  card={card}
                  selected={selectedCards.includes(card.id)}
                  canAfford={energy >= card.cost}
                  onSelect={() => {
                    if (selectedCards.includes(card.id)) setSelectedCards([]); 
                    else setSelectedCards([card.id]); 
                  }}
                  disabled={battle.isAnimating || isGameOver}
                />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* EKRANY NAKŁADKOWE (OVERLAYS) */}
      <AnimatePresence>
        {isLevelTransitioning && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(10px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/80"
          >
            <motion.h2 
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-6 tracking-widest uppercase text-center"
            >
              {t('gameLevel.levelCleared', 'ZAGROŻENIE UNIESZKODLIWIONE')}
            </motion.h2>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NOWE: EKRAN GAME OVER */}
      <AnimatePresence>
        {isGameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-red-950/95 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              className="flex flex-col items-center gap-6"
            >
              <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-800 drop-shadow-[0_0_30px_rgba(220,38,38,0.8)]">
                {t('gameLevel.gameOverTitle', 'PRZEGRANA!')}
              </h1>
              <p className="text-red-200 text-xl font-bold">{t('gameLevel.gameOverDesc', 'Twoje systemy zostały przejęte.')}</p>
              
              <div className="flex gap-4 mt-8">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRestartLevel}
                  className="px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 rounded-full font-bold text-white shadow-[0_0_20px_rgba(220,38,38,0.5)] border-2 border-red-400/50"
                >
                  {t('gameLevel.tryAgain', 'SPRÓBUJ PONOWNIE')}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onBackToMenu}
                  className="px-8 py-4 bg-slate-800 rounded-full font-bold text-white border-2 border-slate-600 hover:bg-slate-700"
                >
                  {t('gameLevel.backToMenu', 'MENU GŁÓWNE')}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EKRAN WYGRANEJ */}
      <AnimatePresence>
        {isGameWon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              className="flex flex-col items-center gap-6"
            >
              <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 drop-shadow-[0_0_30px_rgba(52,211,153,0.5)]">
                {t('gameLevel.victoryTitle', 'ZWYCIĘSTWO!')}
              </h1>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onBackToMenu}
                className="mt-8 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.5)] border-2 border-cyan-300/50"
              >
                {t('gameLevel.finishGame', 'ZAKOŃCZ GRĘ')}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// 5. UPDATE PASKA ZDROWIA
function HealthBar({ current, max, color, label, shield = 0 }: HealthBarProps) {
  const percentage = (current / max) * 100;
  const colorClasses = color === 'blue' ? 'from-blue-500 to-cyan-500' : 'from-red-500 to-orange-500';

  return (
    <div className="w-56 transition-opacity duration-500" style={{ opacity: current === 0 ? 0.3 : 1 }}>
      <div className="flex justify-between mb-1">
        <span className="text-white text-xs font-bold">{label}</span>
        <div className="flex items-center gap-3">
          {shield > 0 && (
            <span className="text-blue-300 text-xs font-bold flex items-center gap-1">
              <Shield className="w-3 h-3 fill-blue-400" /> {shield}
            </span>
          )}
          <span className="text-white text-xs font-bold flex items-center gap-1">
            <Heart className={`w-3 h-3 ${current === 0 ? 'text-gray-500' : ''}`} />
            {Math.max(0, current)}/{max}
          </span>
        </div>
      </div>
      <div className="w-full h-4 bg-slate-800 rounded-full border-2 border-slate-600 overflow-hidden relative">
        <div
          className={`absolute top-0 left-0 h-full bg-gradient-to-r ${colorClasses} transition-all duration-500 shadow-lg`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function CharacterMedia({ src, alt, className }: CharacterMediaProps) {
  const isVideo = src.endsWith('.mp4') || src.endsWith('.webm') || src.endsWith('.mov');
  if (isVideo) return <video src={src} className={className} autoPlay loop muted playsInline />;
  return <img src={src} alt={alt} className={className} />;
}

// 6. KARTA WYŚWIETLA KOSZT I SWOJE EFEKTY WIZUALNIE
interface PhoneScreenCardProps {
  card: PhoneCard;
  selected: boolean;
  canAfford: boolean;
  onSelect: () => void;
  disabled: boolean;
}

function PhoneScreenCard({ card, selected, canAfford, onSelect, disabled }: PhoneScreenCardProps) {
  const { t } = useTranslation();
  return (
    <motion.button
      onClick={onSelect}
      disabled={disabled}
      animate={{ scale: selected ? 1.1 : 1, y: selected ? -20 : 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`
        relative w-32 h-48 rounded-3xl border-4 pointer-events-auto
        ${selected ? 'border-cyan-400 shadow-2xl shadow-cyan-500/50 z-50' : 'border-slate-700 hover:border-slate-500'}
        ${disabled || (!canAfford && !selected) ? 'opacity-50 cursor-not-allowed grayscale-[30%]' : 'cursor-pointer'}
      `}
    >
      <div className="absolute inset-2 bg-slate-950 rounded-2xl overflow-hidden">
        
        {/* Wskaźnik kosztu w prawym górnym rogu */}
        <div className={`absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border border-slate-900 z-20 ${canAfford ? 'bg-yellow-400 text-black shadow-[0_0_10px_rgba(250,204,21,0.8)]' : 'bg-slate-600 text-slate-300'}`}>
          {card.cost}
        </div>

        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-5 bg-slate-900 rounded-b-2xl z-10" />
        
        <div className={`absolute inset-0 pt-7 pb-3 px-2 bg-gradient-to-br ${card.color} flex flex-col justify-between`}>
          <div className="text-white text-center">
            <div className="text-[10px] font-bold mb-1 opacity-80">{card.type.toUpperCase()}</div>
            <div className="text-xs font-bold leading-tight">{t(card.titleKey)}</div>
            
            {/* Ikony efektów karty */}
            <div className="flex gap-2 justify-center mt-2 bg-black/30 rounded-full py-1">
              {card.damage && <span className="text-red-300 text-[10px] font-bold">⚔️ {card.damage}</span>}
              {card.shield && <span className="text-blue-300 text-[10px] font-bold">🛡️ {card.shield}</span>}
              {card.heal && <span className="text-green-300 text-[10px] font-bold">💚 {card.heal}</span>}
            </div>

          </div>
          <div className="text-white text-[10px] text-center opacity-90 leading-tight line-clamp-3">
            {t(card.descriptionKey)}
          </div>
        </div>
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-1 bg-slate-600 rounded-full" />
      </div>
    </motion.button>
  );
}