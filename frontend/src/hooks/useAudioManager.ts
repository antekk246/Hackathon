import { useEffect, useRef } from 'react';
import type { AppView } from '../types';

export const useAudioManager = (currentView: AppView, isMuted: boolean) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const currentTrackRef = useRef<string | null>(null);

    useEffect(() => {
        // 1. Okreœlamy, jaki utwór powinien graæ w danym widoku
        let trackToPlay: string | null = null;

        if (currentView === 'MENU' || currentView === 'DIFFICULTY') {
            trackToPlay = 'main_menu_theme.mp3';
        } else if (currentView === 'BATTLE') {
            trackToPlay = 'battle_theme01.mp3';
        }

        // 2. Jeœli jest wyciszone, zatrzymujemy wszystko i czyœcimy track
        if (isMuted) {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
                currentTrackRef.current = null;
            }
            return;
        }

        // 3. LOGIKA P£YNNOŒCI: Jeœli utwór ju¿ gra, nie przerywaj go!
        if (trackToPlay && trackToPlay === currentTrackRef.current) {
            return; // Ten sam utwór? Nic nie rób, niech gra dalej.
        }

        // 4. Jeœli track siê zmienia (np. z Menu na Battle), zmieniamy audio
        if (trackToPlay) {
            if (audioRef.current) {
                audioRef.current.pause();
            }

            const audio = new Audio(`/audio/${trackToPlay}`);
            audio.loop = true;
            audio.volume = 0.3;

            audio.play().catch(() => {
                console.log("Czekam na interakcjê...");
            });

            audioRef.current = audio;
            currentTrackRef.current = trackToPlay;
        }

        // Cleanup przy odmontowaniu ca³ego App
        return () => {
            // Nie zatrzymujemy tutaj przy zmianie dependency, 
            // bo useEffect zaraz odpali siê z nowymi danymi
        };
    }, [currentView, isMuted]);
};