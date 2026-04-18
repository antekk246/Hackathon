// frontend/src/components/AudioControl.tsx
import { Volume2, VolumeX } from 'lucide-react';

interface AudioControlProps {
    isMuted: boolean;
    onToggle: () => void;
}

export const AudioControl = ({ isMuted, onToggle }: AudioControlProps) => {
    return (
        <button
            onClick={onToggle}
            className="fixed bottom-4 right-4 z-[100] p-3 bg-slate-900/80 border border-slate-700 rounded-full text-white hover:bg-slate-800 transition-all shadow-lg"
            title={isMuted ? "W³¹cz muzykê" : "Wycisz"}
        >
            {isMuted ? (
                <VolumeX className="w-6 h-6 text-red-400" />
            ) : (
                <Volume2 className="w-6 h-6 text-green-400" />
            )}
        </button>
    );
};