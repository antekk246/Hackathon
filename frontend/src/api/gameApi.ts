// frontend/src/api/gameApi.ts
import type { User, Card, Adventure, DifficultyLevel, Room } from '../types';

const BASE_URL = '/api/v1';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
};

export const gameApi = {
    // AUTH
    loginWithGoogle: () => {
        window.location.href = `${BASE_URL}/auth/google/login`;
    },

    // CARDS
    getAllCards: async (): Promise<Card[]> => {
        const response = await fetch(`${BASE_URL}/cards/`, { headers: getHeaders() });
        if (!response.ok) throw new Error('Błąd pobierania wszystkich kart');
        return response.json();
    },

    getUserCards: async (): Promise<Card[]> => {
        const response = await fetch(`${BASE_URL}/cards/user`, { headers: getHeaders() });
        if (!response.ok) throw new Error('Błąd pobierania kart użytkownika');
        return response.json();
    },

    upgradeCard: async (cardId: number): Promise<Card> => {
        const response = await fetch(`${BASE_URL}/cards/${cardId}/upgrade`, {
            method: 'POST',
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Błąd ulepszania karty');
        return response.json();
    },

    buyCard: async (cardId: number): Promise<Card> => {
        const response = await fetch(`${BASE_URL}/cards/${cardId}/buy`, {
            method: 'POST',
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Błąd zakupu karty');
        return response.json();
    },

    // ADVENTURES
    startAdventure: async (difficulty: number, cardIds: number[], force: boolean = false): Promise<Adventure> => {
        const response = await fetch(`${BASE_URL}/adventures`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ difficulty, cardIds, force }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Błąd startu przygody');
        }
        return response.json();
    },

    getActiveAdventure: async (): Promise<Adventure> => {
        const response = await fetch(`${BASE_URL}/adventures/active`, { headers: getHeaders() });
        if (!response.ok) throw new Error('Błąd pobierania aktywnej przygody');
        return response.json();
    },

    endAdventure: async (): Promise<{ message: string }> => {
        const response = await fetch(`${BASE_URL}/adventures/end`, {
            method: 'POST',
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Błąd kończenia przygody');
        return response.json();
    },

    getCurrentRoom: async (): Promise<Room> => {
        const response = await fetch(`${BASE_URL}/adventures/room`, { headers: getHeaders() });
        if (!response.ok) throw new Error('Błąd pobierania danych pokoju');
        return response.json();
    },

    advanceRoom: async (): Promise<{ status: string; room?: Room; message?: string }> => {
        const response = await fetch(`${BASE_URL}/adventures/advance`, {
            method: 'POST',
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Błąd przejścia do kolejnego pokoju');
        return response.json();
    },
};
