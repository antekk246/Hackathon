import { useState } from 'react';

// Ustalamy rozmiar mapy
const MAP_WIDTH = 20;
const MAP_HEIGHT = 15;

function App() {
    // Generujemy prostą, pustą mapę składającą się z kropek
    // Na razie to tylko tablica wypełniona kropkami (reprezentującymi podłogę)
    const [map] = useState(() =>
        Array.from({ length: MAP_HEIGHT }, () =>
            Array.from({ length: MAP_WIDTH }, () => '.')
        )
    );

    return (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
            <div>
                <h1 style={{ textAlign: 'center' }}>Mój Roguelike</h1>

                {/* Renderowanie mapy wiersz po wierszu */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${MAP_WIDTH}, 20px)`,
                    gap: '2px'
                }}>
                    {map.map((row, y) =>
                        row.map((tile, x) => (
                            <div
                                key={`${x}-${y}`}
                                style={{
                                    width: '20px',
                                    height: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: '#333'
                                }}
                            >
                                {tile}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;