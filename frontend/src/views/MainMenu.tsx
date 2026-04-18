// frontend/src/views/MainMenu.tsx

interface MainMenuProps {
    onStartGame: () => void;
}

export const MainMenu = ({ onStartGame }: MainMenuProps) => {
    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#0a192f', // Bankowy granat
            color: 'white',
            textAlign: 'center'
        }}>
            <h1 style={{
                fontSize: '4rem',
                marginBottom: '10px',
                background: '-webkit-linear-gradient(#0052cc, #00d2ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
            }}>
                PKO BP
            </h1>
            <h2 style={{ fontSize: '2.5rem', marginTop: '0', color: '#ccd6f6', letterSpacing: '4px' }}>
                XP: GAMING
            </h2>

            <p style={{ maxWidth: '600px', color: '#8892b0', margin: '30px 0' }}>
                Zbuduj swój kapitał, pokonaj oszustów i przetrwaj w bezlitosnym świecie finansów.
            </p>

            <button
                onClick={onStartGame}
                style={{
                    padding: '15px 40px',
                    fontSize: '1.5rem',
                    backgroundColor: '#0052cc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    transition: 'transform 0.2s, backgroundColor 0.2s',
                    boxShadow: '0 4px 15px rgba(0, 82, 204, 0.4)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                Nowa Gra
            </button>
        </div>
    );
};