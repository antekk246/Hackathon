// src/App.tsx
import { useGameEngine } from './hooks/useGameEngine';
import { CardView } from './components/CardView';

function App() {
    const { gameState, startTurn, playCard } = useGameEngine();

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#121212', color: 'white', padding: '20px', boxSizing: 'border-box' }}>

            {/* HEADER: Player Stats */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                <div style={{ fontSize: '1.2rem' }}>
                    🏦 Capital: {gameState.capital}/{gameState.maxCapital} PLN |
                    🛡️ Cushion: {gameState.cushion} PLN |
                    ⚡ Actions: {gameState.actionsLeft}
                </div>
                <div>
                    Deck: {gameState.deck.length} | Discard: {gameState.discardPile.length}
                </div>
            </div>

            {/* CENTER: Battle Arena */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                {/* Player Avatar */}
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem' }}>🧑‍🎓</div>
                    <h3>You (Client)</h3>
                </div>

                {/* Enemy Avatar */}
                {gameState.enemy && (
                    <div style={{ textAlign: 'center', color: '#ff4444' }}>
                        <div style={{ fontSize: '4rem' }}>🦹‍♂️</div>
                        <h3>{gameState.enemy.name}</h3>
                        <p>Weight: {gameState.enemy.hp} / {gameState.enemy.maxHp} PLN</p>
                        <p style={{ fontSize: '0.9rem', color: '#aaa' }}>Intent: {gameState.enemy.intentText}</p>
                    </div>
                )}
            </div>

            {/* BOTTOM: Hand and Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>

                {/* Actions Menu */}
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={startTurn}
                        style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#e67e22', color: 'white', border: 'none', borderRadius: '5px' }}
                    >
                        Start Turn / Draw Cards
                    </button>
                </div>

                {/* Cards in Hand */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', height: '220px' }}>
                    {gameState.hand.map(card => (
                        <CardView
                            key={card.id}
                            card={card}
                            onClick={playCard}
                            disabled={gameState.actionsLeft <= 0}
                        />
                    ))}
                    {gameState.hand.length === 0 && (
                        <div style={{ alignSelf: 'center', color: '#7f8c8d' }}>
                            Click "Start Turn" to draw cards!
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

export default App;