import { useState, useEffect } from 'react';
import { Zap, Trophy, Shield, Sword, ChevronRight } from 'lucide-react';
import img from "../assets/image.png";

interface Card {
  id: number;
  title: string;
  description: string;
  cost: number;
  type: string;
  effect_value: number;
}

interface BattleState {
  hand: Card[];
  draw: Card[];
  discard: Card[];
  stats: {
    player_hp: number;
    enemy_hp: number;
    enemy_max_hp: number;
    mana: number; // Mapped from DecisionPoints in Go
    player_turn: boolean;
  };
  room_type: string;
}

interface BattleScreenProps {
  onBackToMenu: () => void;
}

export function BattleScreen({ onBackToMenu }: BattleScreenProps) {
  const [battleData, setBattleData] = useState<BattleState | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [isVictory, setIsVictory] = useState(false);

  useEffect(() => {
    fetchBattleState();
  }, []);

  const fetchBattleState = async () => {
    try {
      const response = await fetch('/api/v1/adventures/room/state', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      
      setBattleData(data);

      // Check for victory condition based on Holy Backend logic
      if (data.stats.enemy_hp <= 0) {
        setIsVictory(true);
      }
    } catch (error) {
      console.error("Failed to fetch battle:", error);
    } finally {
      setLoading(false);
    }
  };

  const playCard = async () => {
    if (selectedCardId === null) return;
    try {
      // Backend expects /play/:instanceID
      const response = await fetch(`/api/v1/adventures/play/${selectedCardId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        setSelectedCardId(null);
        await fetchBattleState(); // Refresh state to show damage/mana deduction
      }
    } catch (err) {
      console.error("Action failed");
    }
  };

  const endTurn = async () => {
    try {
      const response = await fetch('/api/v1/adventures/end-turn', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) fetchBattleState();
    } catch (err) {
      console.error("End turn failed");
    }
  };

  const handleAdvance = async () => {
    try {
      const response = await fetch('/api/v1/adventures/advance', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        // Refresh to get the new room or return to map
        window.location.reload(); 
      }
    } catch (err) {
      console.error("Advance failed");
    }
  };

  if (loading || !battleData) {
    return (
      <div className="size-full bg-slate-900 flex items-center justify-center">
        <div className="text-cyan-400 animate-pulse font-mono tracking-widest">
          CONNECTING_TO_NEURAL_LINK...
        </div>
      </div>
    );
  }

  const { stats, hand } = battleData;

  return (
    <div className="size-full bg-slate-950 flex flex-col relative overflow-hidden font-mono">
      
      {/* Victory Overlay */}
      {isVictory && (
        <div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center border-4 border-cyan-500/20 m-4 rounded-3xl">
          <Trophy className="w-24 h-24 text-cyan-400 mb-4 animate-bounce" />
          <h2 className="text-5xl font-black text-white mb-2 tracking-tighter">VICTORY</h2>
          <p className="text-cyan-400/60 mb-8 uppercase text-sm">Threat Neutralized. Integrity Maintained.</p>
          <button 
            onClick={handleAdvance}
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-12 py-4 rounded-full font-black text-xl transition-all hover:scale-105 active:scale-95"
          >
            NEXT SECTOR <ChevronRight />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="relative z-10 bg-slate-900/50 border-b border-white/10 px-8 py-4 flex justify-between items-center">
        <button onClick={onBackToMenu} className="text-slate-500 hover:text-white text-xs uppercase tracking-widest transition-colors">
          [ Terminate_Run ]
        </button>
        
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-blue-400 font-bold uppercase">Buffer Capacity</span>
            <div className="flex items-center gap-2 text-white font-black text-2xl">
              <Zap className="w-5 h-5 text-yellow-400" fill="currentColor" />
              {stats.mana}
            </div>
          </div>
        </div>
      </div>

      {/* Main Stage */}
      <div className="flex-1 flex items-center justify-around px-20">
        {/* Player Section */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative group">
            <div className="absolute -inset-4 bg-green-500/10 rounded-full blur-xl group-hover:bg-green-500/20 transition-all" />
            <img src={img} className="w-72 h-72 object-contain relative z-10 drop-shadow-2xl" />
          </div>
          <StatBox label="User_System" current={stats.player_hp} max={900} color="bg-green-500" />
        </div>

        <div className="text-6xl font-black text-white/5 select-none tracking-tighter">VERSUS</div>

        {/* Enemy Section */}
        <div className="flex flex-col items-center gap-6">
          <div className="w-72 h-72 bg-slate-900 rounded-3xl border-2 border-red-500/30 flex items-center justify-center text-8xl shadow-inner relative overflow-hidden">
            <div className="absolute inset-0 bg-red-500/5 animate-pulse" />
            <span className={isVictory ? "grayscale opacity-20" : "drop-shadow-lg"}>
              {isVictory ? '💀' : '👾'}
            </span>
          </div>
          <StatBox label="Malware_Node" current={stats.enemy_hp} max={stats.enemy_max_hp} color="bg-red-500" />
        </div>
      </div>

      {/* Control Deck */}
      <div className="bg-slate-900/80 border-t border-white/5 p-8 backdrop-blur-xl">
        <div className="flex justify-center gap-6 mb-8 h-64 items-end">
          {hand.length > 0 ? (
            hand.map((card) => (
              <BattleCard
                key={card.id}
                card={card}
                isSelected={selectedCardId === card.id}
                onSelect={() => setSelectedCardId(card.id)}
                disabled={!stats.player_turn || stats.mana < card.cost || isVictory}
              />
            ))
          ) : (
            <div className="text-slate-600 italic text-sm mb-12 uppercase tracking-widest">Hand Empty - Cycle Required</div>
          )}
        </div>

        <div className="flex justify-center items-center gap-12">
          <div className="text-xs text-slate-500 uppercase tracking-widest">
            {stats.player_turn ? ">> Your Turn" : ">> Processing..."}
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={playCard}
              disabled={selectedCardId === null || isVictory}
              className="bg-white text-slate-950 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-600 px-12 py-4 rounded-xl font-black transition-all hover:-translate-y-1 active:translate-y-0 shadow-lg uppercase tracking-tighter"
            >
              Execute Selection
            </button>
            <button 
              onClick={endTurn}
              disabled={!stats.player_turn || isVictory}
              className="border-2 border-slate-700 text-slate-400 hover:border-white hover:text-white disabled:opacity-30 px-8 py-4 rounded-xl font-bold transition-all uppercase text-sm"
            >
              End Cycle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Visual Components
function StatBox({ label, current, max, color }: { label: string, current: number, max: number, color: string }) {
  const percent = Math.max(0, (current / max) * 100);
  return (
    <div className="w-72">
      <div className="flex justify-between items-end mb-2">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
        <span className="text-white font-mono text-sm">{current} / {max}</span>
      </div>
      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5">
        <div className={`${color} h-full transition-all duration-700 ease-out`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function BattleCard({ card, isSelected, onSelect, disabled }: any) {
  const getVisuals = (type: string) => {
    switch(type.toLowerCase()) {
      case 'attack': return { border: 'border-red-500/50', bg: 'from-red-500/20', icon: <Sword size={14}/> };
      case 'block': return { border: 'border-blue-500/50', bg: 'from-blue-500/20', icon: <Shield size={14}/> };
      default: return { border: 'border-purple-500/50', bg: 'from-purple-500/20', icon: <Zap size={14}/> };
    }
  };

  const theme = getVisuals(card.type);

  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={`
        relative w-44 h-60 bg-slate-900 rounded-2xl border-2 transition-all duration-300 flex flex-col p-4 text-left group
        ${isSelected ? 'border-white -translate-y-8 scale-110 z-20 shadow-2xl bg-slate-800' : `${theme.border} hover:border-white/40 z-10`}
        ${disabled ? 'opacity-30 grayscale cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${theme.bg} text-white`}>
          {theme.icon}
        </div>
        <div className="bg-slate-800 px-2 py-1 rounded border border-white/10 text-[10px] font-black text-white">
          {card.cost} AP
        </div>
      </div>
      
      <div className="flex-1">
        <h3 className="text-white font-black text-xs uppercase leading-tight mb-1">{card.title}</h3>
        <p className="text-slate-500 text-[10px] leading-relaxed line-clamp-3">{card.description}</p>
      </div>

      <div className="pt-4 border-t border-white/5 flex justify-between items-center">
        <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">{card.type}</span>
        <span className="text-white text-[10px] font-bold">VAL_{card.effect_value}</span>
      </div>
    </button>
  );
}