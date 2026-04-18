import { useState, useEffect } from 'react';
import type { AppView, DifficultyLevel, Card } from './types'; 
import { MainMenu } from './views/MainMenu';
import { GameLevel } from './views/GameLevel';
import { Tutorial } from './views/Tutorial';
import { CardShop } from './views/CardShop';
import { CardSelection } from './views/CardSelection';
import { gameApi } from './api/gameApi';

export default function App() {
  const [gameState, setGameState] = useState<'menu' | 'game' | 'shop' | 'selection'>('menu');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);
  const [playerXP, setPlayerXP] = useState(500);
  const [userCards, setUserCards] = useState<Card[]>([]);

  useEffect(() => {
    // 1. Sprawdź czy wróciliśmy z Google Login z tokenem w URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      window.history.replaceState({}, document.title, "/"); // Wyczyść URL
    }

    const seen = localStorage.getItem('hasSeenTutorial');
    if (seen === 'true') {
      setHasSeenTutorial(true);
    }

    // Pobierz karty użytkownika jeśli jest zalogowany
    if (localStorage.getItem('token')) {
        gameApi.getUserCards().then(setUserCards).catch(console.error);
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
      setShowTutorial(false);
      setHasSeenTutorial(true);
      localStorage.setItem('hasSeenTutorial', 'true');
      setGameState('selection');
    } else {
      setTutorialStep(tutorialStep + 1);
    }
  };

  const handleTutorialClose = () => {
    setShowTutorial(false);
    setHasSeenTutorial(true);
    localStorage.setItem('hasSeenTutorial', 'true');
    setGameState('selection');
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
      {gameState === 'menu' && (
        <MainMenu
          onStartGame={handleStartGame}
          onOpenShop={() => setGameState('shop')}
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