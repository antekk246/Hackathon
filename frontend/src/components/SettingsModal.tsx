import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";

interface SettingsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ isOpen, onOpenChange }: SettingsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-2 border-cyan-400 text-white shadow-2xl shadow-cyan-500/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-cyan-400">
            Settings
          </DialogTitle>
        </DialogHeader>
        <div className="py-6 space-y-4">
          <div className="flex flex-col gap-3">
            <Label htmlFor="sound" className="text-blue-300 font-semibold">
              Sound & Music
            </Label>
            <div className="bg-slate-800/80 border-2 border-blue-500/30 rounded-lg p-4 text-slate-300">
              Sound effects and music settings
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="gameplay" className="text-blue-300 font-semibold">
              Gameplay
            </Label>
            <div className="bg-slate-800/80 border-2 border-blue-500/30 rounded-lg p-4 text-slate-300">
              Adjust difficulty and game settings
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
