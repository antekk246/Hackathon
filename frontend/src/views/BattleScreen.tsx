import { useState,useEffect } from 'react';
import { Shield, Zap, Heart, AlertTriangle } from 'lucide-react';
import img from "../assets/image.png";

interface BattleScreenProps {
  onBackToMenu: () => void;
}
interface Card {
  id: number;
  title: string;
  description: string;
  cost: number;
  type: string;
  effect_value: number; // match your backend field names
  color?: string;
  icon?: string;
}

interface BattleState {
  hand: Card[];
  draw: Card[];
  discard: Card[];
  stats: {
    player_hp: number;
    enemy_hp: number;
    enemy_max_hp: number;
    mana: number;
    player_turn: boolean;
  };
  room_type: string;
}
export function BattleScreen({ onBackToMenu }: BattleScreenProps) {
  const [battleData, setBattleData] = useState<BattleState | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);

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
    } catch (error) {
      console.error("Failed to fetch battle:", error);
    } finally {
      setLoading(false);
    }
  };

  const playCard = async () => {
    if (selectedCardId === null) return;
    try {
      // Note: Ensure this route exists in your Go router!
      const response = await fetch(`/api/v1/adventures/play/${selectedCardId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        fetchBattleState();
        setSelectedCardId(null);
      }
    } catch (err) {
      alert("Action failed!");
    }
  };

  if (loading || !battleData) {
    return (
      <div className="size-full bg-slate-900 flex items-center justify-center">
        <div className="text-cyan-400 animate-pulse font-mono">INITIALIZING BATTLE_PROTOCOL...</div>
      </div>
    );
  }

  const { stats, hand } = battleData;

  return (
    <div className="size-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col relative overflow-hidden">
      {/* Top UI Bar */}
      <div className="relative z-10 bg-slate-950/80 backdrop-blur-sm border-b border-slate-700 px-6 py-4 flex justify-between items-center">
        <button onClick={onBackToMenu} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors">
          ← Abandon Run
        </button>
        <div className="text-white text-xl font-bold">Infection Detected</div>
        <div className="flex items-center gap-2 bg-blue-900/50 px-4 py-2 rounded-lg border border-blue-500/30">
          <Zap className="w-5 h-5 text-yellow-400" fill="currentColor" />
          <span className="text-white font-bold">{stats.mana} Energy</span>
        </div>
      </div>

      {/* Battle Area */}
      <div className="relative z-10 flex-1 flex items-center justify-around px-12">
        {/* Player */}
        <div className="flex flex-col items-center gap-4">
          <img src={img} className="w-64 h-64 object-contain drop-shadow-[0_0_20px_rgba(34,197,94,0.3)]" />
          <div className="w-64 bg-slate-900/90 p-3 rounded-xl border-2 border-green-500">
            <div className="flex justify-between text-white text-sm font-bold mb-1">
              <span>System Integrity</span>
              <span>{stats.player_hp}%</span>
            </div>
            <div className="w-full bg-slate-700 h-3 rounded-full overflow-hidden">
              <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${stats.player_hp}%` }} />
            </div>
          </div>
        </div>

        <div className="text-4xl font-black text-red-500/50 italic">VS</div>

        {/* Enemy */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-64 h-64 bg-slate-800 rounded-2xl border-4 border-red-500 flex items-center justify-center text-8xl shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            👾
          </div>
          <div className="w-64 bg-slate-900/90 p-3 rounded-xl border-2 border-red-500">
            <div className="flex justify-between text-white text-sm font-bold mb-1">
              <span>Malware Core</span>
              <span>{stats.enemy_hp} HP</span>
            </div>
            <div className="w-full bg-slate-700 h-3 rounded-full overflow-hidden">
              <div className="bg-red-500 h-full transition-all duration-500" style={{ width: `${(stats.enemy_hp / stats.enemy_max_hp) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Hand Area */}
      <div className="relative z-10 bg-slate-950/90 border-t border-slate-700 p-6">
        <div className="flex justify-center gap-4 mb-6">
          {hand.map((card) => (
            <BattleCard
              key={card.id}
              card={card}
              isSelected={selectedCardId === card.id}
              onSelect={() => setSelectedCardId(card.id)}
              disabled={stats.mana < card.cost || !stats.player_turn}
            />
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex justify-center gap-4">
          <button 
            onClick={playCard}
            disabled={selectedCardId === null}
            className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-10 py-3 rounded-xl font-bold transition-all transform active:scale-95"
          >
            EXECUTE ACTION
          </button>
          <button className="bg-slate-700 hover:bg-slate-600 text-white px-10 py-3 rounded-xl font-bold transition-all">
            END TURN
          </button>
        </div>
      </div>
    </div>
  );
}

function BattleCard({ card, isSelected, onSelect, disabled }: BattleCardProps) {
  // Helper to get visual styles based on card type from backend
  const getStyle = (type: string) => {
    switch(type.toLowerCase()) {
      case 'attack': return { color: 'from-red-600 to-red-900', icon: '🚨' };
      case 'block': return { color: 'from-blue-600 to-blue-900', icon: '🔍' };
      default: return { color: 'from-purple-600 to-purple-900', icon: '✨' };
    }
  };

  const style = getStyle(card.type);

  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={`
        relative w-40 h-56 rounded-xl border-2 transition-all duration-300 flex flex-col overflow-hidden
        ${isSelected ? 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)] -translate-y-6 scale-110 z-20' : 'border-slate-700 z-10'}
        ${disabled ? 'opacity-40 grayscale' : 'hover:border-slate-400'}
      `}
    >
      <div className={`h-20 bg-gradient-to-br ${style.color} flex items-center justify-center text-4xl`}>
        {style.icon}
      </div>
      <div className="flex-1 bg-slate-900 p-3 flex flex-col justify-between text-left">
        <div>
          <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-tighter">{card.type}</div>
          <div className="text-white font-bold text-xs leading-tight">{card.title}</div>
          <div className="text-slate-500 text-[10px] mt-1 line-clamp-2">{card.description}</div>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-yellow-400 font-bold text-[10px]">VAL: {card.effect_value}</div>
          <div className="bg-slate-800 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-slate-600">
            {card.cost}
          </div>
        </div>
      </div>
    </button>
  );
}