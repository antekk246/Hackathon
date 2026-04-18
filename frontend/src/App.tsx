// frontend/src/App.tsx
import { useState } from 'react';
import type { AppView, DifficultyLevel } from './types';
import { MainMenu } from './views/MainMenu';
import { DifficultySelect } from './views/DifficultySelect';

function App() {
    // Stan przechowujący informację o tym, który ekran wyświetlić
    const [currentView, setCurrentView] = useState<AppView>('MENU');

    // Funkcja, która odpali się po kliknięciu wybranej trudności
    const handleStartGame = async (difficulty: DifficultyLevel) => {
        console.log(`Zaczynamy grę na poziomie: ${difficulty}`);

        // TUTAJ W PRZYSZŁOŚCI POLECI REQUEST DO BACKENDU:
        // np. await api.createNewGame(difficulty);
        // const gameState = await api.getGameState();

        // Na razie tylko udajemy i przenosimy gracza do "Mapy/Walki" (która na razie jest pusta)
        setCurrentView('BATTLE');
    };

    return (
        <>
            {currentView === 'MENU' && (
                <MainMenu onStartGame={() => setCurrentView('DIFFICULTY')} />
            )}

            {currentView === 'DIFFICULTY' && (
                <DifficultySelect
                    onSelect={handleStartGame}
                    onBack={() => setCurrentView('MENU')}
                />
            )}

            {currentView === 'BATTLE' && (
                <div style={{ color: 'white', textAlign: 'center', marginTop: '20vh' }}>
                    <h2>Ładowanie interfejsu walki... (Backend wkrótce dostarczy dane!)</h2>
                    <button onClick={() => setCurrentView('MENU')}>Anuluj</button>
                </div>
            )}
        </>
    );
}

export default App;