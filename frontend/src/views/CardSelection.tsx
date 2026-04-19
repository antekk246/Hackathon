import { ArrowLeft, Plus, X, Zap, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { gameApi } from '../api/gameApi';
import { parseBackendTranslation } from '../utils/translationHelper';

interface Card {
    id: number;
    type: string | { id: number; name: string;[key: string]: any };
    title?: string;
    titleKey?: string;
    name?: string; // pole z bazy
    description?: string;
    descriptionKey?: string;
    color: string;
    owned: boolean;
    level: number;
}

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
    const [dbCards, setDbCards] = useState<Card[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCards, setSelectedCards] = useState<Card[]>([]);
    const [selectedCardDetail, setSelectedCardDetail] = useState<number | null>(null);

    useEffect(() => {
        const fetchFreshCards = async () => {
            try {
                setLoading(true);
                const data = await gameApi.getUserCards();
                setDbCards(data);
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
                    <div className="w-1/2 p-6 border-r border-slate-700 overflow-y-auto custom-scroll">
                        <h2 className="text-2xl font-bold text-white mb-4 italic uppercase">{t('selection.yourCards')}</h2>
                        <div className="space-y-3">
                            {dbCards.map(card => (
                                <AvailableCardItem
                                    key={card.id}
                                    card={card}
                                    isSelected={selectedCards.some(c => c.id === card.id)}
                                    isSelectable={canAddMore || selectedCards.some(c => c.id === card.id)}
                                    onSelect={() => handleAddCard(card)}
                                    lang={i18n.language}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="w-1/2 p-6 overflow-y-auto custom-scroll bg-slate-950/30">
                        <h2 className="text-2xl font-bold text-white mb-4 italic uppercase">{t('selection.adventureCards')}</h2>
                        {selectedCards.length === 0 ? (
                            <div className="h-64 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-2xl">
                                <Zap className="w-12 h-12 mb-3 opacity-20" />
                                <p className="font-bold">WYBIERZ KARTY NA WYPRAWĘ</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {selectedCards.map(card => (
                                    <SelectedCardItem
                                        key={card.id}
                                        card={card}
                                        onRemove={() => handleRemoveCard(card.id)}
                                        lang={i18n.language}
                                    />
                                ))}
                                <button
                                    onClick={handleConfirm}
                                    className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-black text-xl hover:scale-[1.02] transition-transform shadow-lg shadow-cyan-500/20"
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

// --- KOMPONENTY POMOCNICZE (MUSZĄ BYĆ W TYM PLIKU) ---

function AvailableCardItem({ card, isSelected, isSelectable, onSelect, lang }: any) {
    const [namePL, nameEN] = (card.name || "").split('|');
    const displayName = lang === 'pl' ? namePL : (nameEN || namePL);

    return (
        <button
            onClick={onSelect}
            disabled={!isSelectable && !isSelected}
            className={`w-full text-left p-4 rounded-xl transition-all border-2 flex items-center justify-between group ${isSelected
                    ? 'bg-cyan-500/10 border-cyan-400 shadow-lg'
                    : 'bg-slate-800/40 border-slate-800 hover:border-slate-600'
                } ${!isSelectable && !isSelected ? 'opacity-30' : ''}`}
        >
            <div>
                <div className="text-white font-bold text-lg uppercase italic">{displayName || card.title}</div>
                <div className="text-slate-400 text-xs italic">{card.description}</div>
                <div className="text-yellow-500 text-[10px] font-black mt-1">POZIOM {card.level}</div>
            </div>
            <div className={`p-2 rounded-lg ${isSelected ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                {isSelected ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
        </button>
    );
}

function SelectedCardItem({ card, onRemove, lang }: any) {
    const [namePL, nameEN] = (card.name || "").split('|');
    const displayName = lang === 'pl' ? namePL : (nameEN || namePL);

    return (
        <button
            onClick={onRemove}
            className="w-full text-left p-4 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/50 hover:border-red-500/50 transition-all group"
        >
            <div className="flex items-center justify-between">
                <div className="text-white font-bold uppercase italic">{displayName || card.title}</div>
                <div className="p-1 rounded bg-red-500/20 text-red-400 group-hover:bg-red-500 group-hover:text-white transition-all">
                    <X className="w-4 h-4" />
                </div>
            </div>
        </button>
    );
}

function CardDetailModal({ card, onClose }: any) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-slate-900 border-2 border-cyan-400 p-8 rounded-3xl max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
                <div className="text-center">
                    <div className="text-6xl mb-4">📱</div>
                    <h3 className="text-2xl font-bold text-white mb-2 uppercase italic">{card.name}</h3>
                    <p className="text-slate-400 text-sm mb-6">{card.description}</p>
                    <button onClick={onClose} className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold">ZAMKNIJ</button>
                </div>
            </div>
        </div>
    );
}