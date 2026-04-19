import { ArrowLeft, Lock, TrendingUp, Loader2, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { gameApi } from '../api/gameApi';
import { parseBackendTranslation } from '../utils/translationHelper';

interface Card {
    id: number;
    type: string | { id: number; name: string;[key: string]: any };
    title?: string;
    titleKey?: string;
    description?: string;
    descriptionKey?: string;
    color: string;
    owned: boolean;
    level: number;
    unlockCost?: number;
    upgradeCost?: number;
}

interface CardShopProps {
    onBack: () => void;
    playerXP: number;
    onPurchase: (cost: number) => void;
}

export function CardShop({ onBack, playerXP, onPurchase }: CardShopProps) {
    const { t } = useTranslation();
    const [selectedCard, setSelectedCard] = useState<number | null>(null);
    const [allCards, setAllCards] = useState<Card[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            setLoading(true);
            const [catalog, userInventory] = await Promise.all([
                gameApi.getAllCards(),
                gameApi.getUserCards()
            ]);

            const mergedCards = catalog.map(baseCard => {
                const ownedInstance = userInventory.find(u => u.id === baseCard.id);
                return ownedInstance
                    ? { ...baseCard, ...ownedInstance, owned: true }
                    : { ...baseCard, owned: false };
            });

            setAllCards(mergedCards);
        } catch (error) {
            console.error("Failed to sync cards:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleUpgrade = async (card: Card) => {
        if (card.upgradeCost && playerXP >= card.upgradeCost) {
            try {
                await gameApi.upgradeCard(card.id);
                onPurchase(card.upgradeCost);
                await loadData();
            } catch (err) { console.warn("Backend upgrade failed:", err); }
        }
    };

    const handleUnlock = async (card: Card) => {
        if (card.unlockCost && playerXP >= card.unlockCost) {
            try {
                await gameApi.buyCard(card.id);
                onPurchase(card.unlockCost);
                await loadData();
            } catch (err) { console.warn("Backend unlock failed:", err); }
        }
    };

    const ownedCards = allCards.filter(c => c.owned);
    const lockedCards = allCards.filter(c => !c.owned);
    const selected = allCards.find(c => c.id === selectedCard);

    return (
        <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
            {/* Wstrzyknięte style dla scrollbara */}
            <style>{`
        .custom-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.4);
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: rgba(34, 211, 238, 0.3);
          border-radius: 10px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 211, 238, 0.6);
        }
        .custom-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(34, 211, 238, 0.3) rgba(15, 23, 42, 0.4);
        }
      `}</style>

            {/* Background Grid */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)',
                    backgroundSize: '50px 50px'
                }} />
            </div>

            {/* Header */}
            <div className="relative z-10 p-6 border-b border-slate-700 bg-slate-950/80 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                    <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5" /> {t('shop.back')}
                    </button>
                    <h1 className="text-4xl font-bold text-cyan-400">{t('shop.title')}</h1>
                    <div className="bg-yellow-500 text-slate-900 px-6 py-2 rounded-lg font-bold text-lg shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                        XP: {playerXP}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="relative z-10 flex h-[calc(100%-100px)] items-center justify-center">
                    <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
                </div>
            ) : (
                <div className="relative z-10 flex h-[calc(100%-100px)]">

                    {/* LEWA KOLUMNA (Twoje Karty) - 1/3 */}
                    <div className="w-1/3 p-6 border-r border-slate-700 overflow-y-auto custom-scroll">
                        <div className="flex items-center gap-2 mb-4 text-white">
                            <ShieldCheck className="w-6 h-6 text-green-400" />
                            <h2 className="text-2xl font-bold">{t('shop.yourCards')}</h2>
                        </div>
                        <div className="space-y-3">
                            {ownedCards.map(card => (
                                <CardListItem
                                    key={card.id}
                                    card={card}
                                    selected={selectedCard === card.id && card.owned}
                                    onSelect={() => setSelectedCard(card.id)}
                                />
                            ))}
                            {ownedCards.length === 0 && (
                                <div className="text-slate-400 p-4 italic">{t('shop.noCardsOwned', 'Brak posiadanych kart.')}</div>
                            )}
                        </div>
                    </div>

                    {/* PRAWA KOLUMNA (Sklep lub Detale) - 2/3 */}
                    <div className="w-2/3 p-6 overflow-y-auto custom-scroll">
                        {selected ? (
                            <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
                                <button onClick={() => setSelectedCard(null)} className="mb-4 text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1">
                                    ← {t('shop.backToStore', 'Back to Store')}
                                </button>
                                <CardDetailPanel
                                    card={selected}
                                    playerXP={playerXP}
                                    onUpgrade={() => handleUpgrade(selected)}
                                    onUnlock={() => handleUnlock(selected)}
                                />
                            </div>
                        ) : (
                            <>
                                <h2 className="text-2xl font-bold text-white mb-4">{t('shop.unlockNewCards')}</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    {lockedCards.map(card => (
                                        <LockedCardPreview
                                            key={card.id}
                                            card={card}
                                            onSelect={() => setSelectedCard(card.id)}
                                        />
                                    ))}
                                    {lockedCards.length === 0 && (
                                        <div className="text-slate-400 col-span-2 p-4 text-center border border-dashed border-slate-700 rounded-xl">
                                            {t('shop.allCardsUnlocked', 'Wszystkie karty zostały odblokowane!')}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// --- POD-KOMPONENTY ---

function CardListItem({ card, selected, onSelect }: { card: Card; selected: boolean; onSelect: () => void }) {
    const { t } = useTranslation();
    return (
        <button
            onClick={onSelect}
            className={`w-full p-3 rounded-xl transition-all border-2 text-left flex items-center gap-3 ${selected
                    ? 'bg-cyan-500/10 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                    : 'bg-slate-800/40 border-slate-800 hover:border-slate-600'
                }`}
        >
            <div className={`w-10 h-14 rounded bg-gradient-to-br ${card.color || 'from-slate-700 to-slate-800'} shrink-0`} />
            <div className="min-w-0">
                <div className="text-white font-bold text-sm truncate uppercase">
                    {parseBackendTranslation(card.title) || card.title}
                </div>
                <div className="text-yellow-500 text-[10px] font-black uppercase tracking-wider">Level {card.level}</div>
            </div>
        </button>
    );
}

function LockedCardPreview({ card, onSelect }: { card: Card; onSelect: () => void }) {
    const { t } = useTranslation();
    return (
        <button
            onClick={onSelect}
            className="group relative flex flex-col bg-slate-900/50 border-2 border-slate-800 rounded-2xl p-4 hover:border-yellow-500 transition-all hover:-translate-y-1 overflow-hidden"
        >
            <div className="absolute inset-0 bg-black/40 z-10 group-hover:bg-black/20 transition-colors" />
            <div className="absolute top-2 right-2 z-20 bg-slate-950/80 p-1.5 rounded-full border border-slate-700">
                <Lock className="w-4 h-4 text-yellow-500" />
            </div>

            <div className={`h-32 rounded-xl bg-gradient-to-br ${card.color || 'from-slate-700 to-slate-800'} mb-4 flex items-center justify-center text-4xl z-0 shadow-inner`}>
                💰
            </div>

            <div className="text-left relative z-20">
                <h3 className="text-white font-bold uppercase text-sm mb-1 truncate">
                    {parseBackendTranslation(card.title) || card.title}
                </h3>
                <p className="text-slate-400 text-xs line-clamp-2 mb-3 h-8 leading-tight">
                    {parseBackendTranslation(card.description) || card.description}
                </p>
                <div className="flex items-center justify-between mt-auto bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Odblokuj</span>
                    <span className="text-yellow-500 font-black">{card.unlockCost || 100} XP</span>
                </div>
            </div>
        </button>
    );
}

function CardDetailPanel({ card, playerXP, onUpgrade, onUnlock }: { card: Card; playerXP: number; onUpgrade: () => void; onUnlock: () => void }) {
    const { t } = useTranslation();
    const cardTypeDisplay = typeof card.type === 'object' && card.type !== null ? card.type.name : card.type;

    return (
        <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-8 border-2 border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.15)]">
            <div className={`w-full h-64 rounded-2xl bg-gradient-to-br ${card.color || 'from-slate-500 to-slate-600'} mb-6 flex items-center justify-center shadow-lg relative overflow-hidden group`}>
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="text-center text-white relative z-10">
                    <div className="text-7xl mb-4 drop-shadow-2xl">📱</div>
                    <div className="text-3xl font-bold tracking-tight uppercase">
                        {parseBackendTranslation(card.title) || card.title}
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-700">
                        <div className="text-slate-500 text-[10px] uppercase font-bold mb-1">{t('shop.type')}</div>
                        <div className="text-cyan-400 text-sm font-black uppercase">{cardTypeDisplay}</div>
                    </div>
                    <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-700">
                        <div className="text-slate-500 text-[10px] uppercase font-bold mb-1">Poziom</div>
                        <div className="text-yellow-500 text-sm font-black uppercase">Level {card.level}</div>
                    </div>
                </div>

                <div className="text-left">
                    <div className="text-slate-500 text-[10px] uppercase font-bold mb-1">{t('shop.description')}</div>
                    <div className="text-white text-lg bg-slate-900/30 p-4 rounded-xl border border-slate-700/50">
                        {parseBackendTranslation(card.description) || card.description}
                    </div>
                </div>

                {card.owned ? (
                    <button
                        onClick={onUpgrade}
                        disabled={!card.upgradeCost || playerXP < card.upgradeCost}
                        className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 disabled:from-slate-700 disabled:to-slate-800 text-white rounded-xl font-bold text-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 shadow-lg shadow-green-900/20"
                    >
                        <TrendingUp className="w-6 h-6" />
                        {t('shop.upgrade', { cost: card.upgradeCost || 100 })} XP
                    </button>
                ) : (
                    <button
                        onClick={onUnlock}
                        disabled={!card.unlockCost || playerXP < card.unlockCost}
                        className="w-full px-6 py-4 bg-gradient-to-r from-yellow-500 to-orange-600 disabled:from-slate-700 disabled:to-slate-800 text-white rounded-xl font-bold text-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 shadow-lg shadow-yellow-900/20"
                    >
                        <Lock className="w-6 h-6" />
                        {t('shop.unlock', { cost: card.unlockCost || 100 })} XP
                    </button>
                )}
            </div>
        </div>
    );
}