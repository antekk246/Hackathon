import { useState, useEffect } from 'react';
import type { AppView, DifficultyLevel } from './types'; // types są w src/types
import { MainMenu } from './views/MainMenu';
import { BattleScreen } from './views/BattleScreen';
import { Tutorial } from './views/Tutorial';
import { CardShop } from './views/CardShop';
export default function App() {
  const [gameState, setGameState] = useState<'menu' | 'game' | 'shop'>('menu');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);
  const [playerXP, setPlayerXP] = useState(500);

  useEffect(() => {
    const seen = localStorage.getItem('hasSeenTutorial');
    if (seen === 'true') {
      setHasSeenTutorial(true);
    }
  }, []);

  const handleStartGame = (selectedDifficulty: 'easy' | 'medium' | 'hard') => {
    setDifficulty(selectedDifficulty);

    if (!hasSeenTutorial) {
      setShowTutorial(true);
      setTutorialStep(0);
    } else {
      setGameState('game');
    }
  };

  const handleTutorialNext = () => {
    if (tutorialStep === 7) {
      setShowTutorial(false);
      setHasSeenTutorial(true);
      localStorage.setItem('hasSeenTutorial', 'true');
      setGameState('game');
    } else {
      setTutorialStep(tutorialStep + 1);
    }
  };

  const handleTutorialClose = () => {
    setShowTutorial(false);
    setHasSeenTutorial(true);
    localStorage.setItem('hasSeenTutorial', 'true');
    setGameState('game');
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
      {gameState === 'game' && (
        <BattleScreen
          onBackToMenu={() => setGameState('menu')}
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