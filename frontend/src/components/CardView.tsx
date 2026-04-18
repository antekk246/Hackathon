// src/components/CardView.tsx
import type { Card } from '../types';

interface CardViewProps {
    card: Card;
    onClick: (id: string) => void;
    disabled?: boolean;
}

export const CardView = ({ card, onClick, disabled }: CardViewProps) => {
    // Determine color based on card type
    const typeColors = {
        ATTACK: '#c0392b',    // Red
        DEFENSE: '#2980b9',   // Blue
        SUPPORT: '#27ae60',   // Green
        STATUS: '#8e44ad'     // Purple
    };

    return (
        <div
            onClick={() => !disabled && onClick(card.id)}
            style={{
                width: '140px',
                height: '200px',
                backgroundColor: '#2c3e50',
                border: `3px solid ${typeColors[card.type]}`,
                borderRadius: '8px',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                color: 'white',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.transform = 'translateY(-10px)' }}
            onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.transform = 'translateY(0)' }}
        >
            <div style={{ fontSize: '10px', color: typeColors[card.type], fontWeight: 'bold' }}>
                {card.type}
            </div>
            <h4 style={{ margin: '5px 0', fontSize: '14px', flex: '0 0 auto' }}>{card.name}</h4>

            <div style={{ flex: '1 1 auto', fontSize: '12px', color: '#bdc3c7', marginTop: '10px' }}>
                {card.description}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold' }}>
                <span>⚡ 1 Action</span>
                {card.value > 0 && <span>Value: {card.value}</span>}
            </div>
        </div>
    );
};