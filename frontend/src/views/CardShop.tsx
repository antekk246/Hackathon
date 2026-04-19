import { ArrowLeft, Lock, TrendingUp, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { gameApi } from '../api/gameApi';
import type { Card, UserCard, CardType } from '../types/index';
// import { parseBackendTranslation } from '../utils/translationHelper'; // Odkomentuj jeśli używasz

interface CardShopProps {
    onBack: () => void;
    playerXP: number;
    onPurchase: (cost: number) => void;
}

export function CardShop({ onBack, playerXP, onPurchase }: CardShopProps) {
    const { t } = useTranslation();
    
    // ROZDZIELONE STANY ZAZNACZENIA (Bezpieczne!)
    const [selectedInventoryId, setSelectedInventoryId] = useState<number | null>(null);
    const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
    
    const [loading, setLoading] = useState(true);
    const [catalog, setCatalog] = useState<Card[]>([]);
    const [inventory, setInventory] = useState<UserCard[]>([]);

    const loadData = async (showSpinner = true) => {
        try {
            if (showSpinner) setLoading(true);
            const [catalogData, userInventoryData] = await Promise.all([
                gameApi.getAllCards(),
                gameApi.getUserCards()
            ]);

            setCatalog(catalogData);
            setInventory(userInventoryData);
        } catch (error) {
            console.error("Failed to sync shop data:", error);
        } finally {
            if (showSpinner) setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleUpgrade = async (viewCard: any) => {
        if (!viewCard.instanceId) {
            console.warn("Upgrade failed: No instance ID");
            return; 
        }

        const cost = viewCard.upgradeCost || 100;
        
        if (playerXP >= cost) {
            try {
                const response = await gameApi.upgradeCard(viewCard.instanceId);
                console.log("✅ [FRONTEND] Odpowiedź z serwera po upgrade:", response);
                onPurchase(cost);
                await loadData(false);
                setSelectedInventoryId(null); // Odznacza po sukcesie
            } catch (err) { 
                console.warn("Upgrade failed:", err); 
            }
        }
    };

    const handleUnlock = async (viewCard: any) => {
        const cost = viewCard.unlockCost || 100;
        if (playerXP >= cost) {
            try {
                await gameApi.buyCard(viewCard.id);
                onPurchase(cost);
                await loadData(false);
                setSelectedShopId(null);
            } catch (err) { 
                console.warn("Purchase failed:", err); 
            }
        }
    };

    // Zbiór posiadanych ID kart (do blokowania w sklepie)
    const ownedCardsIds = new Set(inventory.map((userCard: UserCard) => userCard.cardId));
    const lockedCards = catalog.filter((shopCard: Card) => !ownedCardsIds.has(shopCard.id));

    // BUDOWANIE DANYCH DLA PANELU SZCZEGÓŁÓW
    let selectedViewData: any = null;
    
    if (selectedInventoryId) {
        // Jeśli kliknięto w talii
        const uc = inventory.find(u => u.instanceId === selectedInventoryId);
        if (uc) {
            selectedViewData = {
                ...uc.card,
                instanceId: uc.instanceId,
                level: uc.level || (uc.card as any).level || 1, // Zabezpieczenie dla poziomu
                owned: true, // Wymuszamy true dla widoków
            };
        }
    } else if (selectedShopId) {
        // Jeśli kliknięto w sklepie
        const c = catalog.find(c => c.id === selectedShopId);
        if (c) {
            selectedViewData = {
                ...c,
                level: 1,
                owned: false,
            };
        }
    }

    return (
        <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 overflow-hidden">
            <style>{`
                .custom-scroll::-webkit-scrollbar { width: 6px; }
                .custom-scroll::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.4); }
                .custom-scroll::-webkit-scrollbar-thumb { background: rgba(34, 211, 238, 0.3); border-radius: 10px; }
                .custom-scroll { scrollbar-width: thin; scrollbar-color: rgba(34, 211, 238, 0.3) rgba(15, 23, 42, 0.4); }
            `}</style>

            <div className="relative z-10 p-6 border-b border-slate-700 bg-slate-950/90 backdrop-blur-md flex justify-between items-center">
                <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all border border-slate-600">
                    <ArrowLeft className="w-5 h-5" /> {t('shop.back')}
                </button>
                <div className="text-center">
                    <h1 className="text-3xl font-black text-cyan-400 italic tracking-tighter uppercase">Finance Shop</h1>
                    <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em]">Baza Danych Zsynchronizowana</p>
                </div>
                <div className="bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-900 px-6 py-2 rounded-xl font-black text-xl shadow-lg shadow-yellow-500/20">
                    {playerXP} XP
                </div>
            </div>

            {loading ? (
                <div className="flex h-full items-center justify-center">
                    <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
                </div>
            ) : (
                <div className="relative z-10 flex h-[calc(100%-96px)]">

                    {/* LEWA KOLUMNA: TWOJA TALIA */}
                    <div className="w-1/3 p-6 border-r border-slate-800 bg-slate-950/40 overflow-y-auto custom-scroll">
                        <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-2">
                            <ShieldCheck className="w-5 h-5 text-green-400" />
                            <h2 className="text-xl font-bold text-white uppercase tracking-tight">Twoja Talia</h2>
                        </div>
                        <div className="space-y-3">
                            {inventory.map((userCard) => (
                                <CardListItem
                                    key={`inventory-${userCard.instanceId}`}
                                    // "Wstrzykujemy" poziom i owned do widoku karty
                                    card={{
                                        ...userCard.card,
                                        level: userCard.level || (userCard.card as any).level || 1,
                                        owned: true
                                    }}
                                    selected={selectedInventoryId === userCard.instanceId}
                                    onSelect={() => {
                                        setSelectedInventoryId(userCard.instanceId);
                                        setSelectedShopId(null); // Resetujemy sklep
                                    }}
                                />
                            ))}
                            {inventory.length === 0 && (
                                <div className="text-slate-500 text-sm italic p-4 text-center">Nie masz kart!?</div>
                            )}
                        </div>
                    </div>

                    {/* PRAWA KOLUMNA: KATALOG / DETALE */}
                    <div className="w-2/3 p-8 overflow-y-auto custom-scroll">
                        {selectedViewData ? (
                            <div className="max-w-2xl mx-auto animate-in slide-in-from-right-4 duration-300">
                                <button 
                                    onClick={() => { setSelectedInventoryId(null); setSelectedShopId(null); }} 
                                    className="mb-6 text-cyan-400 font-bold flex items-center gap-2 hover:text-cyan-300 transition-colors"
                                >
                                    ← Powrót do Sklepu
                                </button>
                                <CardDetailPanel
                                    card={selectedViewData}
                                    playerXP={playerXP}
                                    onUpgrade={() => handleUpgrade(selectedViewData)}
                                    onUnlock={() => handleUnlock(selectedViewData)}
                                />
                            </div>
                        ) : (
                            <div className="animate-in fade-in duration-500">
                                <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-tight italic">Dostępne Inwestycje</h2>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                                    {lockedCards.map(card => (
                                        <LockedCardPreview
                                            key={`shop-${card.id}`}
                                            card={card}
                                            onSelect={() => {
                                                setSelectedShopId(card.id);
                                                setSelectedInventoryId(null); // Resetujemy talię
                                            }}
                                        />
                                    ))}
                                </div>
                                {lockedCards.length === 0 && (
                                    <div className="text-slate-400 text-center py-20 italic font-bold">Wykupiłeś już wszystkie technologie!</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// --- SUB-KOMPONENTY POZOSTAJĄ BEZ ZMIAN ---
// (Tu wklejasz stare funkcje: CardListItem, LockedCardPreview, CardDetailPanel)
function CardListItem({ card, selected, onSelect }: any) {
    const displayName = card.name ? card.name.split('|')[0] : 'Nieznana';
    return (
        <button onClick={onSelect} className={`w-full p-3 rounded-xl transition-all border-2 text-left flex items-center gap-3 ${selected ? 'bg-cyan-500/10 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
            }`}>
            <div className={`w-10 h-14 rounded bg-gradient-to-br ${card.color || 'from-slate-700 to-slate-800'} shrink-0 shadow-inner`} />
            <div className="min-w-0 flex-1">
                <div className="text-white font-bold text-sm truncate uppercase italic">{displayName}</div>
                <div className="text-cyan-500 text-[10px] font-black uppercase tracking-wider">Poziom {card.level}</div>
            </div>
            {!card.upgradeToId && card.owned && <div className="text-[8px] bg-green-500/20 text-green-400 px-1 rounded border border-green-500/30">MAX</div>}
        </button>
    );
}

function LockedCardPreview({ card, onSelect }: any) {
    const displayName = card.name ? card.name.split('|')[0] : 'Nieznana';
    return (
        <button onClick={onSelect} className="group relative flex flex-col bg-slate-900/40 border-2 border-slate-800 rounded-2xl p-4 hover:border-yellow-500/50 transition-all hover:-translate-y-1">
            <div className="absolute top-3 right-3 z-20 bg-slate-950/80 p-1.5 rounded-full border border-slate-700 shadow-xl">
                <Lock className="w-3 h-3 text-yellow-500" />
            </div>
            <div className={`h-32 rounded-xl bg-gradient-to-br ${card.color || 'from-slate-700 to-slate-800'} mb-4 flex items-center justify-center text-4xl shadow-inner`}>💰</div>
            <div className="text-left">
                <h3 className="text-white font-bold uppercase text-xs mb-1 truncate">{displayName}</h3>
                <div className="flex items-center justify-between mt-3 bg-black/40 p-2 rounded-lg border border-slate-800">
                    <span className="text-yellow-500 font-black text-sm">{card.unlockCost || 100} XP</span>
                </div>
            </div>
        </button>
    );
}

function CardDetailPanel({ card, playerXP, onUpgrade, onUnlock }: any) {
    const displayName = card.name ? card.name.split('|')[0] : 'Nieznana';
    const hasUpgrade = card.upgradeToId !== null && card.upgradeToId !== undefined;
    const cardTypeDisplay = typeof card.type === 'object' && card.type !== null ? card.type.name : card.type;

    return (
        <div className="bg-slate-800/80 backdrop-blur-xl rounded-3xl p-8 border-2 border-slate-700 shadow-2xl">
            <div className={`w-full h-64 rounded-2xl bg-gradient-to-br ${card.color || 'from-slate-700 to-slate-800'} mb-8 flex items-center justify-center shadow-[inset_0_0_40px_rgba(0,0,0,0.5)]`}>
                <div className="text-center text-white">
                    <div className="text-8xl mb-4 drop-shadow-2xl">📱</div>
                    <div className="text-4xl font-black uppercase tracking-tighter italic">{displayName}</div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                        <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Typ</span>
                        <span className="text-cyan-400 font-bold uppercase text-xs">{cardTypeDisplay || 'FINANSE'}</span>
                    </div>
                    <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                        <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Status</span>
                        <span className="text-white font-bold uppercase text-xs">LVL {card.level}</span>
                    </div>
                </div>

                <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800">
                    <div className="text-slate-500 text-[10px] uppercase font-bold mb-2 tracking-widest">Możliwości Karty</div>
                    <div className="text-white text-lg leading-relaxed">{card.description}</div>
                </div>

                {card.owned ? (
                    <div className="flex flex-col gap-4">
                        {hasUpgrade ? (
                            <button
                                onClick={onUpgrade}
                                disabled={playerXP < (card.upgradeCost || 100)}
                                className="w-full py-5 bg-gradient-to-r from-green-600 to-emerald-600 disabled:from-slate-800 disabled:to-slate-900 text-white rounded-2xl font-black text-xl shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-3 border-t border-green-400/30"
                            >
                                <TrendingUp className="w-6 h-6" />
                                ULEPSZ ZA {card.upgradeCost || 100} XP
                            </button>
                        ) : (
                            <div className="w-full py-5 bg-slate-800/50 text-slate-500 rounded-2xl font-black text-xl flex items-center justify-center gap-3 border border-slate-700 italic uppercase">
                                <CheckCircle2 className="w-6 h-6 text-green-500" />
                                Poziom Maksymalny
                            </div>
                        )}
                    </div>
                ) : (
                    <button
                        onClick={onUnlock}
                        disabled={playerXP < (card.unlockCost || 100)}
                        className="w-full py-5 bg-gradient-to-r from-yellow-500 to-orange-600 disabled:from-slate-800 disabled:to-slate-900 text-white rounded-2xl font-black text-xl shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-3 border-t border-yellow-400/30"
                    >
                        <Lock className="w-6 h-6" />
                        ODBLOKUJ ZA {card.unlockCost || 100} XP
                    </button>
                )}
            </div>
        </div>
    );
}