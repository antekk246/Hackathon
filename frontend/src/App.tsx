import { useState, useEffect } from 'react';
import type { AppView, DifficultyLevel, Card } from './types';
import { MainMenu } from './views/MainMenu';
import { GameLevel } from './views/GameLevel';
import { Tutorial } from './views/Tutorial';
import { CardShop } from './views/CardShop';
import { CardSelection } from './views/CardSelection';
import { gameApi } from './api/gameApi';

// NOWE IMPORTY DŹWIĘKU
import { useAudioManager } from './hooks/useAudioManager';
import { AudioControl } from './components/AudioControl';

export const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
};

export default function App() {
    const [gameState, setGameState] = useState<'menu' | 'game' | 'shop' | 'selection'>('menu');
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
    const [showTutorial, setShowTutorial] = useState(false);
    const [tutorialStep, setTutorialStep] = useState(0);
    const [hasSeenTutorial, setHasSeenTutorial] = useState(false);
    const [playerXP, setPlayerXP] = useState(1);
    const [userCards, setUserCards] = useState<Card[]>([]);

    // NOWY STAN DŹWIĘKU (Domyślnie wyciszony)
    const [isMuted, setIsMuted] = useState(true);

    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

    // MAPOWANIE STANÓW NA WIDOKI DLA AUDIO (Tłumaczenie Twojego gameState na AppView)
    const audioViewMap: Record<string, AppView> = {
        menu: 'MENU',
        game: 'BATTLE',
        shop: 'MENU', // Sklep może mieć muzykę menu
        selection: 'DIFFICULTY'
    };

    // AKTYWACJA AUDIO
    useAudioManager(audioViewMap[gameState], isMuted);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tokenFromUrl = params.get('token');

        const activeToken = tokenFromUrl || localStorage.getItem('token');
        if (tokenFromUrl) {
            localStorage.setItem('token', tokenFromUrl);
            window.history.replaceState({}, document.title, "/");
        }

        if (activeToken) {
            setIsLoggedIn(true);
            
            gameApi.getUserProfile()
                .then(user => {
                    setPlayerXP(user.money);
                })
                .catch(err => {
                    console.error("Błąd ładowania profilu:", err);
                    if (err.message.includes('401')) handleLogout();
                });

            gameApi.getUserCards().then(setUserCards).catch(console.error);
        }

        const seen = localStorage.getItem('hasSeenTutorial');
        if (seen === 'true') {
            setHasSeenTutorial(true);
        }
    }, []);

    const handleStartGame = (selectedDifficulty: 'easy' | 'medium' | 'hard') => {
        const isLoggedIn = !!localStorage.getItem('token');

        if (!isLoggedIn) {
            alert("Proszę zalogować się przez Google, aby rozpocząć przygodę!");
            gameApi.loginWithGoogle();
            return;
        }

        setDifficulty(selectedDifficulty);

        if (!hasSeenTutorial) {
            setShowTutorial(true);
            setTutorialStep(0);
        } else {
            setGameState('selection');
        }
    };

    const handleTutorialNext = () => {
        if (tutorialStep === 7) {
            finishTutorial();
        } else {
            setTutorialStep(tutorialStep + 1);
        }
    };

    const handleTutorialClose = () => {
        finishTutorial();
    };

    const finishTutorial = () => {
        setShowTutorial(false);
        setHasSeenTutorial(true);
        localStorage.setItem('hasSeenTutorial', 'true');
        // Jeśli tutorial był uruchomiony przy starcie gry (z menu), przejdź do wyboru kart.
        // Jeśli był uruchomiony w trakcie gry (game), zostań w grze.
        if (gameState === 'menu') {
            setGameState('selection');
        }
    };

    const handleConfirmSelection = async (selectedCards: Card[]) => {
        try {
            const difficultyMap: Record<string, number> = { easy: 1, medium: 2, hard: 3 };
            const cardIds = selectedCards.map(c => c.id);
            await gameApi.startAdventure(difficultyMap[difficulty], cardIds, true);
            setGameState('game');
        } catch (err) {
            alert("Błąd startu przygody: " + (err as Error).message);
        }
    };

    return (
        <div className="size-full">
            {/* PRZYCISK MUTE/UNMUTE */}
            <AudioControl
                isMuted={isMuted}
                onToggle={() => setIsMuted(!isMuted)}
            />

            {gameState === 'menu' && (
                <MainMenu
                    isLoggedIn={isLoggedIn}
                    onStartGame={handleStartGame}
                    onOpenShop={() => setGameState('shop')}
                    onShowTutorial={() => {
                        setShowTutorial(true);
                        setTutorialStep(0);
                    }}
                    playerXP={playerXP}
                />
            )}
            {gameState === 'selection' && (
                <CardSelection
                    onBack={() => setGameState('menu')}
                    onConfirm={handleConfirmSelection}
                    availableCards={userCards}
                    difficulty={difficulty}
                />
            )}
            {gameState === 'game' && (
                <GameLevel
                    onEndTurn={() => console.log('Turn ended')}
                    onBackToMenu={() => setGameState('menu')}
                    onShowTutorial={() => {
                        setShowTutorial(true);
                        setTutorialStep(0);
                    }}
                    difficulty={difficulty}
                />
            )}
            {gameState === 'shop' && (
                <CardShop
                    onBack={() => setGameState('menu')}
                    playerXP={playerXP}
                    onPurchase={(cost) => setPlayerXP(playerXP - cost)}
                />
            )}
            {showTutorial && (
                <Tutorial
                    currentStep={tutorialStep}
                    onNext={handleTutorialNext}
                    onClose={handleTutorialClose}
                />
            )}
        </div>
    );
}
