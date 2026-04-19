import { ArrowLeft, Plus, X, Zap, Loader2, FastForward, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { gameApi } from '../api/gameApi';
// Pamiętaj o imporcie nowych typów!
import type { Card, UserCard } from '../types/index'; 

type Difficulty = 'easy' | 'medium' | 'hard';

interface CardSelectionProps {
    onBack: () => void;
    onConfirm: (selectedCards: Card[]) => void;
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
    difficulty,
    adventureName
}: CardSelectionProps) {
    const { t, i18n } = useTranslation();
    
    const [inventory, setInventory] = useState<UserCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCards, setSelectedCards] = useState<UserCard[]>([]);

    useEffect(() => {
        const fetchFreshCards = async () => {
            try {
                setLoading(true);
                const data = await gameApi.getUserCards();
                setInventory(data);
            } catch (error) {
                console.error("Failed to fetch user cards:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFreshCards();
    }, []);

    const cardLimit = CARD_LIMITS[difficulty];
    const canAddMore = selectedCards.length < cardLimit;

    const handleAddCard = (userCard: UserCard) => {
        if (canAddMore && !selectedCards.find(c => c.instanceId === userCard.instanceId)) {
            setSelectedCards([...selectedCards, userCard]);
        }
    };

    const handleRemoveCard = (instanceId: number) => {
        setSelectedCards(selectedCards.filter(c => c.instanceId !== instanceId));
    };

    const handleQuickSelect = () => {
        const sortedInventory = [...inventory].sort((a, b) => {
            const levelA = a.level || a.card?.level || 1;
            const levelB = b.level || b.card?.level || 1;
            return levelB - levelA; 
        });

        const bestCards = sortedInventory.slice(0, cardLimit);
        setSelectedCards(bestCards);
    };

    const handleConfirm = () => {
        if (selectedCards.length > 0) {
            const archetypes = selectedCards.map((userCard: UserCard) => userCard.card);
            onConfirm(archetypes);
        }
    };

    return (
        <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
            <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)',
                    backgroundSize: '50px 50px'
                }} />
            </div>

            <div className="relative z-10 p-6 border-b border-slate-700 bg-slate-950/80 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                    <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5" /> {t('selection.back')}
                    </button>
                    <div className="text-center flex-1">
                        <h1 className="text-4xl font-bold text-cyan-400">{adventureName || t('selection.title')}</h1>
                        <div className={`inline-block mt-2 px-4 py-1 bg-gradient-to-r ${DIFFICULTY_COLORS[difficulty]} text-white rounded-full text-sm font-bold`}>
                            {t('selection.difficultyPrefix', { level: t(`mainMenu.${difficulty}.label`) })}
                        </div>
                    </div>
                    <div className="bg-blue-500 text-white px-6 py-2 rounded-lg font-bold text-lg">
                        {selectedCards.length} / {cardLimit}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="relative z-10 flex h-[calc(100%-100px)] items-center justify-center flex-col gap-4">
                    <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
                    <p className="text-cyan-400 font-bold uppercase tracking-widest italic">Synchronizacja Twojej Talii...</p>
                </div>
            ) : (
                <div className="relative z-10 flex h-[calc(100%-100px)]">
                    {/* LEWA KOLUMNA: TWOJE KARTY */}
                    <div className="w-1/2 p-6 border-r border-slate-700 overflow-y-auto custom-scroll">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white italic uppercase">{t('selection.yourCards')}</h2>
                            
                            {/* PRZYCISK SZYBKIEGO WYBORU - NEONOWY STYL */}
                            <button 
                                onClick={handleQuickSelect}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-900 border-2 border-yellow-500/50 hover:bg-yellow-500/20 hover:border-yellow-400 text-yellow-500 font-black text-xs tracking-widest italic uppercase rounded-xl transition-all shadow-[0_0_15px_rgba(234,179,8,0.15)] hover:shadow-[0_0_25px_rgba(234,179,8,0.4)]"
                            >
                                <FastForward className="w-4 h-4" /> 
                                SZYBKI WYBÓR
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            {inventory.map(userCard => {
                                const isSelected = selectedCards.some(c => c.instanceId === userCard.instanceId);
                                return (
                                    <AvailableCardItem
                                        key={`avail-${userCard.instanceId}`}
                                        userCard={userCard}
                                        isSelected={isSelected}
                                        isSelectable={canAddMore || isSelected}
                                        onSelect={() => {
                                            if (isSelected) {
                                                handleRemoveCard(userCard.instanceId);
                                            } else {
                                                handleAddCard(userCard);
                                            }
                                        }}
                                        lang={i18n.language}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    {/* PRAWA KOLUMNA: KARTY NA WYPRAWĘ */}
                    <div className="w-1/2 p-6 overflow-y-auto custom-scroll bg-slate-950/30">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white italic uppercase">{t('selection.adventureCards')}</h2>
                            
                            {/* PRZYCISK WYCZYŚĆ - NEONOWY STYL */}
                            {selectedCards.length > 0 && (
                                <button 
                                    onClick={() => setSelectedCards([])}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 border-2 border-red-500/50 hover:bg-red-500/20 hover:border-red-400 text-red-500 font-black text-xs tracking-widest italic uppercase rounded-xl transition-all shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:shadow-[0_0_25px_rgba(239,68,68,0.4)]"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    WYCZYŚĆ
                                </button>
                            )}
                        </div>
                        {selectedCards.length === 0 ? (
                            <div className="h-64 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-2xl">
                                <Zap className="w-12 h-12 mb-3 opacity-20" />
                                <p className="font-bold tracking-widest uppercase italic text-sm">WYBIERZ KARTY NA WYPRAWĘ</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {selectedCards.map(userCard => (
                                    <SelectedCardItem
                                        key={`sel-${userCard.instanceId}`}
                                        userCard={userCard}
                                        onRemove={() => handleRemoveCard(userCard.instanceId)}
                                        lang={i18n.language}
                                    />
                                ))}
                                <button
                                    onClick={handleConfirm}
                                    className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-black text-xl italic tracking-widest hover:scale-[1.02] transition-transform shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:shadow-[0_0_40px_rgba(34,211,238,0.5)] border border-cyan-400/50"
                                >
                                    ROZPOCZNIJ PRZYGODĘ
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// --- KOMPONENTY POMOCNICZE ---

function AvailableCardItem({ userCard, isSelected, isSelectable, onSelect, lang }: any) {
    const card = userCard.card;
    const [namePL, nameEN] = (card?.name || "").split('|');
    const displayName = lang === 'pl' ? namePL : (nameEN || namePL);

    return (
        <button
            onClick={onSelect}
            disabled={!isSelectable && !isSelected}
            className={`w-full text-left p-4 rounded-xl transition-all border-2 flex items-center justify-between group ${isSelected
                    ? 'bg-cyan-500/10 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                    : 'bg-slate-800/40 border-slate-800 hover:border-slate-600'
                } ${!isSelectable && !isSelected ? 'opacity-30' : ''}`}
        >
            <div>
                <div className="text-white font-bold text-lg uppercase italic">{displayName || card?.title}</div>
                <div className="text-slate-400 text-xs italic">{card?.description}</div>
                <div className="text-yellow-500 text-[10px] tracking-widest font-black mt-1">POZIOM {userCard.level || card?.level || 1}</div>
            </div>
            <div className={`p-2 rounded-lg transition-colors ${isSelected ? 'bg-cyan-500 text-white shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'bg-slate-700 text-slate-400 group-hover:bg-slate-600 group-hover:text-white'}`}>
                {isSelected ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
        </button>
    );
}

function SelectedCardItem({ userCard, onRemove, lang }: any) {
    const card = userCard.card;
    const [namePL, nameEN] = (card?.name || "").split('|');
    const displayName = lang === 'pl' ? namePL : (nameEN || namePL);

    return (
        <button
            onClick={onRemove}
            className="w-full text-left p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-2 border-cyan-500/30 hover:border-red-500/50 transition-all group shadow-[0_0_10px_rgba(34,211,238,0.1)] hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
        >
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-white font-bold uppercase italic">{displayName || card?.title}</div>
                    <div className="text-cyan-500 text-[10px] tracking-widest font-black mt-1">POZIOM {userCard.level || card?.level || 1}</div>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 border border-slate-700 group-hover:bg-red-500/20 group-hover:border-red-500/50 group-hover:text-red-400 transition-all">
                    <Trash2 className="w-4 h-4" />
                </div>
            </div>
        </button>
    );
}