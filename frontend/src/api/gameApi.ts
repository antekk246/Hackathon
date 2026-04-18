// frontend/src/api/gameApi.ts
import type { User, Card, Adventure, DifficultyLevel } from '../types';

// Zakładamy, że używamy proxy z Vite, więc adres uderza w /api
const BASE_URL = '/api';

export const gameApi = {
    // Pobieranie wszystkich dostępnych w grze kart
    getAllCards: async (): Promise<Card[]> => {
        const response = await fetch(`${BASE_URL}/cards`);
        if (!response.ok) throw new Error('Błąd pobierania kart');
        return response.json();
    },

    // Rozpoczęcie nowej przygody
    startNewAdventure: async (userId: number, difficulty: DifficultyLevel): Promise<Adventure> => {
        const response = await fetch(`${BASE_URL}/adventures/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, difficulty }),
        });
        if (!response.ok) throw new Error('Błąd startu przygody');
        return response.json();
    },

    // Przykładowe pobranie danych gracza
    getUserProfile: async (userId: number): Promise<User> => {
        const response = await fetch(`${BASE_URL}/users/${userId}`);
        if (!response.ok) throw new Error('Nie znaleziono użytkownika');
        return response.json();
    }
};