import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LogOut, Shield, Settings, ShoppingBag, LogIn, CheckCircle } from "lucide-react";
import { SettingsModal } from "../components/SettingsModal";
import { gameApi } from "../api/gameApi";
import { handleLogout } from "../App";

interface MainMenuProps {
  onStartGame: (difficulty: 'easy' | 'medium' | 'hard') => void;
  onOpenShop: () => void;
  playerXP: number;
  isLoggedIn: boolean;
}

export function MainMenu({ onStartGame, onOpenShop, playerXP, isLoggedIn }: MainMenuProps) {
  const { t, i18n } = useTranslation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Nowy stan do kontrolowania animacji logowania
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);

  // Nasłuchujemy zmiany statusu logowania
  useEffect(() => {
    if (isLoggedIn) {
      setShowLoginSuccess(true);
      // Ukryj powiadomienie po 3 sekundach
      const timer = setTimeout(() => {
        setShowLoginSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn]);

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
      
      {/* Animacja sukcesu logowania (Powiadomienie Toast) */}
      <div 
        className={`absolute top-10 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ease-out flex items-center justify-center
          ${showLoginSuccess ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-10 scale-95 pointer-events-none'}`}
      >
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 border-2 border-green-300 text-white px-8 py-4 rounded-full shadow-[0_0_20px_rgba(34,197,94,0.5)] flex items-center gap-3 backdrop-blur-md animate-pulse">
          <CheckCircle className="w-8 h-8" />
          <span className="font-bold text-xl tracking-wide">
            {t('mainMenu.loginSuccess', 'Zalogowano pomyślnie!')}
          </span>
        </div>
      </div>

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
            {t('mainMenu.title')}
          </h1>
          <p className="text-2xl text-blue-300 font-medium">
            {t('mainMenu.subtitle')}
          </p>
          <div className="mt-4 text-yellow-400 text-xl font-bold">
            {t('mainMenu.yourXP', { xp: playerXP })}
          </div>
          <p className="text-lg text-slate-400 mt-2">
            {t('mainMenu.description')}
          </p>
        </div>

        {/* Difficulty Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white text-center mb-6">{t('mainMenu.chooseAdventure')}</h2>
          <div className="flex gap-6">
            <DifficultyButton
              difficulty="easy"
              label={t('mainMenu.easy.label')}
              description={t('mainMenu.easy.description')}
              color="from-green-500 to-green-600"
              onClick={() => onStartGame('easy')}
            />
            <DifficultyButton
              difficulty="medium"
              label={t('mainMenu.medium.label')}
              description={t('mainMenu.medium.description')}
              color="from-yellow-500 to-orange-600"
              onClick={() => onStartGame('medium')}
            />
            <DifficultyButton
              difficulty="hard"
              label={t('mainMenu.hard.label')}
              description={t('mainMenu.hard.description')}
              color="from-red-500 to-red-600"
              onClick={() => onStartGame('hard')}
            />
          </div>
        </div>

        {/* Other buttons */}
        <div className="flex gap-4 mt-8 items-center">
          {!isLoggedIn ? (
            <MenuButton
              icon={<LogIn className="w-5 h-5" />}
              label="Login with Google"
              onClick={() => gameApi.loginWithGoogle()}
              highlight
            />
          ) : (
            <MenuButton
              icon={<ShoppingBag className="w-5 h-5" />}
              label={t('mainMenu.investInYourself')}
              onClick={onOpenShop}
              highlight
            />
          )}
          <MenuButton
            icon={<Shield className="w-5 h-5" />}
            label={t('mainMenu.securityGuide')}
            onClick={() => {}}
          />
          {isLoggedIn && (
            <button
              onClick={handleLogout}
              className="p-3 rounded-lg border-2 border-red-500/30 bg-red-500/10 text-red-400 transition-all hover:bg-red-500/20 hover:border-red-500 hover:scale-110"
              title={t('mainMenu.logout') || 'Logout'}
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <MenuButton
              icon={<Settings className="w-5 h-5" />}
              label={t('mainMenu.settings')}
              onClick={() => setIsSettingsOpen(true)}
            />
            <div className="flex gap-2 ml-2">
              <button
                onClick={() => i18n.changeLanguage('pl')}
                className={`p-2 rounded-lg border-2 transition-all hover:scale-110 ${
                  i18n.language.startsWith('pl')
                    ? 'border-cyan-400 bg-cyan-400/20'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'
                }`}
                title="Polski"
              >
                <span className="text-xl">🇵🇱</span>
              </button>
              <button
                onClick={() => i18n.changeLanguage('en')}
                className={`p-2 rounded-lg border-2 transition-all hover:scale-110 ${
                  i18n.language.startsWith('en')
                    ? 'border-cyan-400 bg-cyan-400/20'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'
                }`}
                title="English"
              >
                <span className="text-xl">🇬🇧</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 text-center text-slate-500">
          <p className="text-sm">{t('mainMenu.footer')}</p>
        </div>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onOpenChange={setIsSettingsOpen} 
      />
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
