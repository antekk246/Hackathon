// frontend/src/views/DifficultySelect.tsx
import type { DifficultyLevel } from '../types';

interface DifficultySelectProps {
    onSelect: (difficulty: DifficultyLevel) => void;
    onBack: () => void;
}

export const DifficultySelect = ({ onSelect, onBack }: DifficultySelectProps) => {
    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '10vh', backgroundColor: '#0a192f', color: 'white' }}>

            <h2 style={{ fontSize: '2.5rem', marginBottom: '50px' }}>Wybierz swój profil inwestycyjny</h2>

            <div style={{ display: 'flex', gap: '20px', maxWidth: '1000px', flexWrap: 'wrap', justifyContent: 'center' }}>

                {/* Poziom Łatwy */}
                <DifficultyCard
                    title="Konto Oszczędnościowe"
                    subtitle="(Łatwy)"
                    description="Zaczynasz z większym kapitałem startowym. Przeciwnicy (wydatki) są mniejsi i bardziej przewidywalni. Idealne do nauki."
                    onClick={() => onSelect('EASY')}
                    color="#27ae60"
                />

                {/* Poziom Średni */}
                <DifficultyCard
                    title="Fundusz Inwestycyjny"
                    subtitle="(Średni)"
                    description="Standardowy start. Rynek bywa kapryśny, a oszuści stosują bardziej zaawansowane sztuczki. Klasyczne wyzwanie."
                    onClick={() => onSelect('MEDIUM')}
                    color="#f39c12"
                />

                {/* Poziom Trudny */}
                <DifficultyCard
                    title="Krypto-Ruletka"
                    subtitle="(Trudny)"
                    description="Zaczynasz z długiem. Przeciwnicy atakują agresywnie, ukryte opłaty czają się wszędzie. Tylko dla weteranów rynku."
                    onClick={() => onSelect('HARD')}
                    color="#c0392b"
                />

            </div>

            <button onClick={onBack} style={{ marginTop: '50px', padding: '10px 20px', backgroundColor: 'transparent', border: '1px solid #8892b0', color: '#8892b0', borderRadius: '5px', cursor: 'pointer' }}>
                Wróć
            </button>
        </div>
    );
};

// Lokalny sub-komponent tylko dla tego widoku
const DifficultyCard = ({ title, subtitle, description, onClick, color }: any) => (
    <div
        onClick={onClick}
        style={{
            width: '280px', padding: '25px', backgroundColor: '#112240', borderTop: `5px solid ${color}`, borderRadius: '8px',
            cursor: 'pointer', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-10px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
        <h3 style={{ margin: '0 0 5px 0', color: 'white' }}>{title}</h3>
        <span style={{ color: color, fontWeight: 'bold', marginBottom: '15px' }}>{subtitle}</span>
        <p style={{ color: '#8892b0', lineHeight: '1.6', margin: 0 }}>{description}</p>
    </div>
);