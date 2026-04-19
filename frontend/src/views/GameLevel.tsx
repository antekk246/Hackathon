import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, Settings, Shield, Sword } from 'lucide-react';
import { motion } from 'framer-motion';
import { SettingsModal } from '../components/SettingsModal';
import { 
  DeckPile,
  DiscardPile
} from '../components/BattleAnimations';
import { useBattleTurn } from '../hooks/useBattleTurn';
import img from "../assets/IDEOLO.png";
import enemy1 from "../assets/enemy1.png";

// Interfaces updated to match Backend Response
interface BackendCard {
  id: number;
  title: string;
  description: string;
  cost: number;
  type: string;
  effect_value: number;
  color?: string; 
  titleKey?: string;
  descriptionKey?: string;
}

interface BattleStats {
  player_hp: number;
  enemy_hp: number;
  enemy_max_hp: number;
  mana: number;
  player_turn: boolean;
}

interface GameLevelProps {
  onEndTurn: () => void;
  onBackToMenu: () => void;
  onShowTutorial: () => void;
  difficulty: 'easy' | 'medium' | 'hard';
}

export function GameLevel({ onBackToMenu, onShowTutorial }: GameLevelProps) {
  const { t } = useTranslation();
  const battle = useBattleTurn();

  // --- Server Driven State ---
  const [hand, setHand] = useState<BackendCard[]>([]);
  const [piles, setPiles] = useState({ drawCount: 0, discardCount: 0 });
  const [stats, setStats] = useState<BattleStats | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // UI States
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEnemyAttacking, setIsEnemyAttacking] = useState(false);
  const [isPlayerAttacking, setIsPlayerAttacking] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // --- Fetch Logic ---
  const fetchBattleState = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/adventures/active', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error("Adventure not found");
      
      const data = await response.json();

      setHand(data.cards || []);
      setStats({
        player_hp: data.player_health || 100,
        enemy_hp: data.enemy_health || 50,
        enemy_max_hp: 100,
        mana: 3,
        player_turn: true
      });
      setPiles({
        drawCount: 5,
        discardCount: 0
      });
    } catch (err) {
      console.error("Failed to sync battle state:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBattleState();
  }, [fetchBattleState]);

  // --- Action: Play Card ---
  const handlePlayCard = async () => {
    if (selectedId === null || !stats?.player_turn || stats.mana < 1 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/v1/cards/${selectedId}/play`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        setIsPlayerAttacking(true);
        await new Promise(r => setTimeout(r, 600));
        setIsPlayerAttacking(false);
        setSelectedId(null);
        await fetchBattleState(); 
      }
    } catch (err) {
      console.error("Card play failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndTurn = async () => {
    if (!stats?.player_turn || isSubmitting) return;

    setIsSubmitting(true);
    try {
      setIsEnemyAttacking(true);
      await new Promise(r => setTimeout(r, 800));
      setIsEnemyAttacking(false);
      await fetchBattleState();
    } catch (err) {
      console.error("End turn failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="size-full bg-slate-950 flex flex-col items-center justify-center font-mono text-cyan-500">
      <div className="animate-pulse text-2xl mb-4">SYNCHRONIZING_SYSTEM...</div>
      <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 2, repeat: Infinity }}
          className="h-full bg-cyan-500"
        />
      </div>
    </div>
  );

  if (!stats) return (
    <div className="size-full bg-slate-950 flex flex-col items-center justify-center">
      <h2 className="text-white text-2xl mb-4">No Active Adventure</h2>
      <button onClick={onBackToMenu} className="px-8 py-3 bg-cyan-600 text-white rounded-full">Back to Menu</button>
    </div>
  );

  return (
    <div className="relative w-full h-full bg-slate-950 text-white overflow-hidden font-sans">
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-40">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900/80 px-4 py-2 rounded-xl border border-yellow-500/50 flex items-center gap-3">
            <Zap className={`w-6 h-6 ${stats.mana > 0 ? 'text-yellow-400' : 'text-slate-600'}`} fill="currentColor" />
            <span className="text-2xl font-black text-white">{stats.mana}</span>
          </div>
        </div>
        
        <button onClick={() => setIsSettingsOpen(true)} className="p-3 bg-slate-900 rounded-full border border-slate-700 hover:border-cyan-400">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      <div className="absolute inset-0 flex items-center justify-around pb-64 px-10">
        <Entity 
          img={img} 
          hp={stats.player_hp} 
          maxHp={900} 
          label={t('gameLevel.you')} 
          isAttacking={isPlayerAttacking} 
          color="cyan" 
        />

        <div className="flex flex-col gap-4 z-50 items-center">
          <button 
            disabled={!selectedId || !stats.player_turn || isSubmitting} 
            onClick={handlePlayCard}
            className="px-10 py-4 bg-green-500 disabled:bg-slate-800 text-slate-950 font-black rounded-full shadow-lg transition-all active:scale-95 uppercase"
          >
            {t('cards.play', 'EXECUTE_PROTOCOL')}
          </button>
          <button 
            onClick={handleEndTurn}
            className="px-8 py-2 bg-slate-900 border border-red-500/30 text-red-500 text-xs font-bold rounded-full hover:bg-red-500/10 transition-colors uppercase"
          >
            {t('gameLevel.endTurn')}
          </button>
        </div>

        <Entity 
          img={enemy1} 
          hp={stats.enemy_hp} 
          maxHp={stats.enemy_max_hp} 
          label={t('gameLevel.scammer')} 
          isAttacking={isEnemyAttacking} 
          color="red" 
        />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-slate-950 to-transparent">
        <div className="flex justify-center items-end gap-2 max-w-5xl mx-auto h-48">
          {hand.map((card, idx) => (
            <CardInstance 
              key={card.id} 
              card={card}
              index={idx}
              total={hand.length}
              isSelected={selectedId === card.id}
              onSelect={() => stats.player_turn && setSelectedId(selectedId === card.id ? null : card.id)}
            />
          ))}
        </div>
      </div>

      <div className="absolute bottom-6 left-6 flex flex-col items-center gap-2">
        <DeckPile cardsRemaining={piles.drawCount} />
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Buffer</span>
      </div>
      <div className="absolute bottom-6 right-6 flex flex-col items-center gap-2">
        <DiscardPile cardsCount={piles.discardCount} />
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Dump</span>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onOpenChange={setIsSettingsOpen} 
        onShowTutorial={onShowTutorial}
      />
    </div>
  );
}

function Entity({ img, hp, maxHp, label, isAttacking, color }: any) {
  const percent = Math.max(0, (hp / maxHp) * 100);
  return (
    <div className="flex flex-col items-center gap-6">
      <motion.div 
        animate={isAttacking ? { x: color === 'cyan' ? 80 : -80, scale: 1.1 } : { x: 0, scale: 1 }}
        className={`w-56 h-72 rounded-3xl border-4 ${color === 'cyan' ? 'border-cyan-500/30' : 'border-red-500/30'} bg-slate-900 shadow-2xl relative flex items-center justify-center`}
      >
        <img src={img} className={`w-full h-full object-contain p-6 ${hp <= 0 ? 'grayscale blur-sm' : ''}`} alt={label} />
      </motion.div>
      <div className="w-64">
        <div className="flex justify-between text-[10px] font-black text-slate-400 mb-1 tracking-tighter uppercase">
          <span>{label}</span>
          <span>{hp} HP</span>
        </div>
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            animate={{ width: `${percent}%` }}
            className={`h-full ${color === 'cyan' ? 'bg-cyan-500' : 'bg-red-500'}`} 
          />
        </div>
      </div>
    </div>
  );
}

function CardInstance({ card, index, total, isSelected, onSelect }: any) {
  const { t } = useTranslation();
  const rotation = (index - (total - 1) / 2) * 4;
  
  return (
    <motion.div
      animate={{ 
        rotate: isSelected ? 0 : rotation,
        y: isSelected ? -80 : 0,
        zIndex: isSelected ? 50 : index
      }}
      onClick={onSelect}
      className={`relative w-32 h-48 rounded-xl border-2 transition-all cursor-pointer bg-slate-900 overflow-hidden
        ${isSelected ? 'border-white' : 'border-slate-700'}`}
    >
      <div className={`h-1/3 p-2 bg-gradient-to-br ${card.type === 'attack' ? 'from-red-600 to-red-900' : 'from-blue-600 to-blue-900'} flex justify-between`}>
        {card.type === 'attack' ? <Sword size={14} /> : <Shield size={14} />}
        <span className="text-[10px] font-bold">CP_{card.cost}</span>
      </div>
      <div className="p-2">
        <div className="text-[10px] font-bold uppercase truncate">
          {card.titleKey ? t(card.titleKey) : card.title}
        </div>
        <div className="text-[8px] text-slate-500 mt-1 line-clamp-3">
          {card.descriptionKey ? t(card.descriptionKey) : card.description}
        </div>
      </div>
      <div className="absolute bottom-2 right-2 text-[10px] font-black text-cyan-400">
        V_{card.effect_value}
      </div>
    </motion.div>
  );
}
