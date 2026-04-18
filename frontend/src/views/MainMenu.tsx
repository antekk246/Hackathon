import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Shield, Settings, ShoppingBag } from "lucide-react";

interface MainMenuProps {
  onStartGame: (difficulty: 'easy' | 'medium' | 'hard') => void;
  onOpenShop: () => void;
  playerXP: number;
}

export function MainMenu({ onStartGame, onOpenShop, playerXP }: MainMenuProps) {
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center h-full px-8">
        {/* Title */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-16 h-16 text-cyan-400 animate-pulse" />
          </div>
          <h1 className="text-7xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
            PKO XP: Gaming
          </h1>
          <p className="text-2xl text-blue-300 font-medium">
            Defend Against Digital Threats
          </p>
          <div className="mt-4 text-yellow-400 text-xl font-bold">
            Your XP: {playerXP}
          </div>
          <p className="text-lg text-slate-400 mt-2">
            Learn to spot scams, fake payments, and online dangers
          </p>
        </div>

        {/* Difficulty Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white text-center mb-6">Choose Adventure</h2>
          <div className="flex gap-6">
            <DifficultyButton
              difficulty="easy"
              label="Easy"
              description="Learn the basics"
              color="from-green-500 to-green-600"
              onClick={() => onStartGame('easy')}
            />
            <DifficultyButton
              difficulty="medium"
              label="Medium"
              description="Test your skills"
              color="from-yellow-500 to-orange-600"
              onClick={() => onStartGame('medium')}
            />
            <DifficultyButton
              difficulty="hard"
              label="Hard"
              description="Expert challenge"
              color="from-red-500 to-red-600"
              onClick={() => onStartGame('hard')}
            />
          </div>
        </div>

        {/* Other buttons */}
        <div className="flex gap-4 mt-8">
          <MenuButton
            icon={<ShoppingBag className="w-5 h-5" />}
            label="Invest in Yourself"
            onClick={onOpenShop}
            highlight
          />
          <MenuButton
            icon={<Shield className="w-5 h-5" />}
            label="Security Guide"
            onClick={() => {}}
          />
          <MenuButton
            icon={<Settings className="w-5 h-5" />}
            label="Settings"
            onClick={() => {}}
          />
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 text-center text-slate-500">
          <p className="text-sm">Stay safe online • Know the threats • Protect yourself</p>
        </div>
      </div>
    </div>
  );
}

interface MenuButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  highlight?: boolean;
}

function MenuButton({ icon, label, onClick, highlight }: MenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2 ${
        highlight
          ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white border-2 border-yellow-400 shadow-lg shadow-yellow-500/50'
          : 'bg-slate-800/80 text-blue-300 border-2 border-blue-500/30 hover:border-blue-400'
      }`}
    >
      {icon}
      <span className="font-semibold">{label}</span>
    </button>
  );
}

interface DifficultyButtonProps {
  difficulty: 'easy' | 'medium' | 'hard';
  label: string;
  description: string;
  color: string;
  onClick: () => void;
}

function DifficultyButton({ label, description, color, onClick }: DifficultyButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`group relative w-48 px-6 py-8 rounded-2xl bg-gradient-to-br ${color} text-white shadow-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl`}
    >
      <div className="text-3xl font-bold mb-2">{label}</div>
      <div className="text-sm opacity-90">{description}</div>
      <div className="absolute inset-0 rounded-2xl bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
    </button>
  );
}
