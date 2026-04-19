import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, Trophy, Settings, Activity, Shield, Sword } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    Name?: string;
    name?: string;
    CardAction?: string;
    cardAction?: string;
}

interface BattleStats {
    player_hp: number;
    player_shield: number;
    enemy_hp: number;
    enemy_max_hp: number;
    mana: number;
    player_turn: boolean;
}

export function GameLevel({ onBackToMenu }: { onBackToMenu: () => void }) {
    const { t } = useTranslation();
    const battle = useBattleTurn();

    // --- Server Driven State ---
    const [hand, setHand] = useState<BackendCard[]>([]);
    const [piles, setPiles] = useState({ drawCount: 0, discardCount: 0 });
    const [stats, setStats] = useState<BattleStats | null>(null);
    const [roomType, setRoomType] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // UI States
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEnemyAttacking, setIsEnemyAttacking] = useState(false);
    const [isPlayerAttacking, setIsPlayerAttacking] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // --- Fetch Logic: The "Holy Sync" ---
    const fetchBattleState = useCallback(async () => {
        try {
            const response = await fetch('/api/v1/adventures/room/state', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();

            setHand(data.hand || []);
            setPiles({
                drawCount: data.draw?.length || 0,
                discardCount: data.discard?.length || 0
            });
            setStats(data.stats);
            setRoomType(data.room_type);
            setLoading(false);
        } catch (err) {
            console.error("Failed to sync with Holy Backend", err);
        }
    }, []);

    useEffect(() => {
        fetchBattleState();
    }, [fetchBattleState]);

    // --- Action: Play Card ---
    const handlePlayCard = async () => {
        if (selectedId === null || !stats?.player_turn || stats.mana < 1) return;

        const card = hand.find(c => c.id === selectedId);

        try {
            // Trigger local "pre-hit" animation
            setIsPlayerAttacking(true);

            const response = await fetch(`/api/v1/adventures/play/${selectedId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.ok) {
                await battle.playCard(); // Visual hook
                setSelectedId(null);
                await fetchBattleState(); // Sync resulting HP/Mana/Hand from DB
            }
            setIsPlayerAttacking(false);
        } catch (err) {
            alert("Terminal Link Error: Action Denied");
        }
    };

    const handleStartTurn = async () => {
        try {
            const response = await fetch('/api/v1/adventures/start-turn', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.ok) {
                await fetchBattleState();
            }
        } catch (err) {
            console.error("Start turn failed", err);
        }
    };

    // --- Action: End Turn (The Orchestrator) ---
    const handleEndTurn = async () => {
        if (!stats?.player_turn || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/v1/adventures/end-turn', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.ok) {
                // 1. Show enemy attack animation
                setIsEnemyAttacking(true);

                // 2. Local Delay: Let the player feel the hit
                await new Promise(resolve => setTimeout(resolve, 800));

                setIsEnemyAttacking(false);

                // 3. Chain to Start Turn
                await handleStartTurn();
            }
        } catch (err) {
            console.error("End turn failed", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading || !stats) return <div className="size-full bg-slate-950 flex items-center justify-center font-mono text-cyan-500 animate-pulse">SYNCHRONIZING_WITH_VAULT...</div>;

    const isVictory = stats.enemy_hp <= 0;

    return (
        <div className="relative w-full h-full overflow-hidden font-sans bg-slate-950 text-white">

            {/* --- GORGEOUS CYBER BACKGROUND --- */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-indigo-950/20 to-slate-950" />
                {/* Cyber Grid */}
                <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(rgba(34, 211, 238, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.05) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                    transform: 'perspective(1000px) rotateX(60deg) translateY(100px) translateZ(-200px)',
                    transformOrigin: 'bottom center',
                }} />
                {/* Horizon Glow */}
                <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-cyan-900/20 to-transparent" />
            </div>

            {/* 1. Dynamic Header */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-40">
                <div className="flex items-center gap-4">
                    <div className="bg-slate-900/80 px-4 py-2 rounded-xl border border-yellow-500/50 flex items-center gap-3 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                        <Zap className={`w-6 h-6 ${stats.mana > 0 ? 'text-yellow-400' : 'text-slate-600'}`} fill="currentColor" />
                        <span className="text-2xl font-black text-white">{stats.mana}</span>
                    </div>
                    <div className="text-xs font-bold tracking-widest uppercase text-cyan-500 bg-cyan-950/50 px-3 py-1 rounded-full border border-cyan-800/50">
                        {stats.player_turn ? "System_Active" : "Processing_Threat..."}
                    </div>
                </div>
                <button onClick={() => setIsSettingsOpen(true)} className="p-3 bg-slate-900 rounded-full border border-slate-700 hover:border-cyan-400 transition-colors">
                    <Settings className="w-5 h-5" />
                </button>
            </div>

            {/* 2. Battle Stage */}
            <div className="absolute inset-0 flex items-center justify-around pb-48 px-10 z-10">
                <Entity
                    img={img}
                    hp={stats.player_hp}
                    shield={stats.player_shield}
                    maxHp={900}
                    label="USER_INTEGRITY"
                    isAttacking={isPlayerAttacking}
                    color="cyan"
                />

                <div className="flex flex-col gap-6 items-center">
                    {/* GŁÓWNY PRZYCISK ZAGRANIA */}
                    <button
                        disabled={!selectedId || !stats.player_turn || isSubmitting}
                        onClick={handlePlayCard}
                        className="relative px-12 py-5 font-black text-xl rounded-full transition-all active:scale-95 group disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed overflow-hidden w-72 shadow-2xl"
                    >
                        {/* Tło przycisku - zmienia się gdy wybrana jest karta */}
                        <div className={`absolute inset-0 transition-colors duration-300 ${selectedId && stats.player_turn
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 group-hover:from-cyan-400 group-hover:to-blue-500 shadow-[0_0_30px_rgba(34,211,238,0.6)]'
                                : 'bg-slate-800 border-2 border-slate-700'
                            }`} />

                        <span className="relative z-10 flex items-center justify-center gap-3 text-white tracking-widest uppercase">
                            {selectedId && stats.player_turn ? (
                                <>
                                    <Zap className="w-6 h-6 text-yellow-300 animate-pulse" fill="currentColor" />
                                    ZAGRAJ KARTĘ
                                </>
                            ) : (
                                <>WYBIERZ KARTĘ</>
                            )}
                        </span>
                    </button>

                    {/* PRZYCISK ZAKOŃCZENIA TURY */}
                    <button
                        onClick={handleEndTurn}
                        disabled={!stats.player_turn || isSubmitting}
                        className="px-8 py-3 bg-slate-950/80 border-2 border-red-500/50 hover:bg-red-950 hover:border-red-500 text-red-500 font-bold rounded-full transition-all tracking-widest uppercase text-xs disabled:opacity-30 disabled:hover:bg-slate-950/80 disabled:hover:border-red-500/50 flex items-center gap-2 shadow-lg"
                    >
                        <Activity className="w-4 h-4" />
                        ZAKOŃCZ TURĘ
                    </button>
                </div>

                <Entity
                    img={enemy1}
                    hp={stats.enemy_hp}
                    maxHp={stats.enemy_max_hp}
                    label="MALWARE_NODE"
                    isAttacking={isEnemyAttacking}
                    color="red"
                />
            </div>

            {/* 3. Cards UI */}
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent z-20">
                <div className="flex justify-center items-end gap-3 max-w-5xl mx-auto h-48">
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

            {/* 4. Piles Sync */}
            <div className="absolute bottom-8 left-8 flex flex-col items-center gap-2 z-30">
                <DeckPile cardsRemaining={piles.drawCount} />
                <span className="text-[10px] text-cyan-500/70 font-black tracking-widest uppercase bg-slate-950/50 px-2 rounded">Buffer</span>
            </div>
            <div className="absolute bottom-8 right-8 flex flex-col items-center gap-2 z-30">
                <DiscardPile cardsCount={piles.discardCount} />
                <span className="text-[10px] text-red-500/70 font-black tracking-widest uppercase bg-slate-950/50 px-2 rounded">Dump</span>
            </div>

            {/* Victory Overlay */}
            <AnimatePresence>
                {isVictory && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", bounce: 0.5 }}
                        >
                            <Trophy className="w-24 h-24 text-yellow-400 mb-6 drop-shadow-[0_0_30px_rgba(250,204,21,0.5)]" />
                        </motion.div>
                        <h2 className="text-6xl font-black mb-8 italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                            THREAT_NEUTRALIZED
                        </h2>
                        <button onClick={onBackToMenu} className="px-12 py-5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xl rounded-full transition-colors shadow-[0_0_40px_rgba(34,211,238,0.4)]">
                            CONTINUE_ADVENTURE
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <SettingsModal isOpen={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
        </div>
    );
}

// --- Dynamic Sub-components ---

function Entity({ img, hp, maxHp = 1, shield = 0, label, isAttacking, color }: any) {
    const safeMaxHp = maxHp > 0 ? maxHp : 1;
    const hpPercent = Math.max(0, Math.min(100, (hp / safeMaxHp) * 100));

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Box z Postacią */}
            <motion.div
                animate={isAttacking ? { x: color === 'cyan' ? 60 : -60, scale: 1.1 } : { x: 0, scale: 1 }}
                className={`relative w-48 h-64 rounded-2xl border-2 bg-slate-900 shadow-2xl transition-all duration-300
          ${shield > 0 ? 'border-blue-400 shadow-[0_0_30px_rgba(96,165,250,0.3)]' :
                        color === 'cyan' ? 'border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.1)]' : 'border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]'}`}
            >
                <img src={img} className={`w-full h-full object-contain p-4 transition-all duration-500 ${hp <= 0 ? 'grayscale brightness-50 blur-sm' : ''}`} alt={label} />

                {/* Nakładka: Holograficzna Tarcza */}
                {shield > 0 && (
                    <div className="absolute inset-0 bg-blue-400/10 rounded-xl overflow-hidden pointer-events-none">
                        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(96,165,250,0.2)_100%)] bg-[length:100%_4px] opacity-50" />
                    </div>
                )}

                {/* Nakładka: Krytyczne Obrażenia (Low HP) */}
                {hp > 0 && hpPercent <= 25 && (
                    <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(239,68,68,0.6)] rounded-xl pointer-events-none animate-pulse" />
                )}
            </motion.div>

            {/* Box ze Statystykami */}
            <div className="w-56 bg-slate-950/80 p-3 rounded-xl border border-slate-800 backdrop-blur-md relative overflow-hidden shadow-xl">
                <div className="flex justify-between items-end mb-2 relative z-10">
                    <span className={`text-[11px] font-black tracking-widest uppercase ${color === 'cyan' ? 'text-cyan-400' : 'text-red-400'}`}>
                        {label}
                    </span>
                    <div className="text-right flex flex-col">
                        {shield > 0 && (
                            <span className="text-blue-400 text-xs font-black flex items-center justify-end gap-1 mb-0.5">
                                <Shield size={12} fill="currentColor" /> {shield} SHLD
                            </span>
                        )}
                        <span className={`text-sm font-black ${hp <= 0 ? 'text-slate-600' : 'text-white'}`}>
                            {hp} <span className="text-[10px] text-slate-500">/ {safeMaxHp} HP</span>
                        </span>
                    </div>
                </div>

                {/* Paski */}
                <div className="space-y-1 relative z-10">
                    {/* Pasek HP */}
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${hpPercent}%` }}
                            className={`h-full ${color === 'cyan' ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' : 'bg-gradient-to-r from-orange-500 to-red-600'}`}
                        />
                    </div>
                    {/* Pasek Tarczy */}
                    {shield > 0 && (
                        <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                            <div className="h-full bg-blue-400 w-full shadow-[0_0_10px_rgba(96,165,250,1)]" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function CardInstance({ card, index, total, isSelected, onSelect }: any) {
    // Delikatny wachlarz
    const rotation = (index - (total - 1) / 2) * 3;

    const rawName = card.Name || card.name || "System Error";
    const displayName = rawName.split('|')[0];
    const desc = card.Description || card.description || "";

    let action: any = {};
    try {
        const actionStr = card.CardAction || card.cardAction;
        action = typeof actionStr === 'string' ? JSON.parse(actionStr) : (actionStr || {});
    } catch (e) { }

    const cost = action.cost || 1;
    const val = action.value || action.damage || action.dmg || action.block || 0;
    const isAttack = action.action === 'damage' || action.action === 'execute' || action.action === 'multi';

    return (
        <motion.div
            animate={{
                rotate: isSelected ? 0 : rotation,
                y: isSelected ? -40 : 0,
                scale: isSelected ? 1.1 : 1,
                zIndex: isSelected ? 50 : index
            }}
            onClick={onSelect}
            className={`relative w-36 h-52 rounded-2xl border-2 transition-all cursor-pointer bg-slate-900 overflow-hidden shadow-2xl
        ${isSelected ? 'border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.3)]' : 'border-slate-700 hover:border-slate-500 hover:-translate-y-4'}`}
        >
            <div className={`h-[35%] p-3 bg-gradient-to-br ${isAttack ? 'from-red-600 to-red-950' : 'from-blue-600 to-blue-950'} flex justify-between items-start text-white shadow-inner`}>
                {isAttack ? <Sword size={16} /> : <Shield size={16} />}
                <div className="bg-slate-950/50 px-2 py-0.5 rounded font-black text-xs border border-white/20">
                    CP {cost}
                </div>
            </div>
            <div className="p-3">
                <div className="text-xs font-black uppercase leading-tight text-white mb-2">{displayName}</div>
                <div className="text-[9px] text-slate-400 line-clamp-4 leading-relaxed">{desc}</div>
            </div>
            {val > 0 && (
                <div className="absolute bottom-3 right-3 text-xs font-black text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    PWR {val}
                </div>
            )}
        </motion.div>
    );
}