import { X } from 'lucide-react';
import guideImg from "../assets/image-4.png";

interface TutorialProps {
  currentStep: number;
  onNext: () => void;
  onClose: () => void;
}

const tutorialSteps = [
  {
    title: 'Welcome to PKO XP: Gaming!',
    description: 'I\'m your guide. I\'ll teach you how to defend against digital threats!',
    highlight: 'none'
  },
  {
    title: 'Your Character',
    description: 'This is you! You\'re a cyber defender protecting people from online scams.',
    highlight: 'player'
  },
  {
    title: 'The Threat',
    description: 'These are the scammers and digital threats you need to defeat!',
    highlight: 'enemy'
  },
  {
    title: 'Health Bars',
    description: 'Keep your health up! If it reaches zero, you lose. Defeat enemies by reducing their health.',
    highlight: 'health'
  },
  {
    title: 'Decision Cards',
    description: 'These phone screens are your actions. You can play 2 cards per turn to defend yourself!',
    highlight: 'cards'
  },
  {
    title: 'Adventure Progress',
    description: 'Track your progress through the adventure. Complete all encounters to win XP!',
    highlight: 'progress'
  },
  {
    title: 'Earn XP!',
    description: 'Win adventures to earn XP! Use XP to unlock and upgrade cards in "Invest in Yourself".',
    highlight: 'none'
  },
  {
    title: 'Ready to Start!',
    description: 'Use your cards wisely to identify and stop digital threats. Good luck!',
    highlight: 'none'
  }
];

export function Tutorial({ currentStep, onNext, onClose }: TutorialProps) {
  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;
  const totalSteps = tutorialSteps.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Tutorial popup */}
      <div className="relative z-10 bg-gradient-to-br from-slate-800 to-slate-900 border-4 border-cyan-400 rounded-3xl p-8 max-w-2xl mx-4 shadow-2xl shadow-cyan-500/50">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Guide image */}
        <div className="flex gap-6 mb-6">
          <div className="w-32 h-32 rounded-2xl overflow-hidden flex-shrink-0 border-4 border-cyan-400">
            <img src={guideImg} alt="Guide" className="w-full h-full object-cover" />
          </div>

          <div className="flex-1">
            <h2 className="text-3xl font-bold text-cyan-400 mb-3">{step.title}</h2>
            <p className="text-xl text-white leading-relaxed">{step.description}</p>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {tutorialSteps.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? 'bg-cyan-400 w-8'
                  : index < currentStep
                  ? 'bg-cyan-600'
                  : 'bg-slate-600'
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <div className="text-slate-400 text-sm">
            Step {currentStep + 1} of {totalSteps}
          </div>
          <button
            onClick={onNext}
            className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-lg"
          >
            {isLastStep ? 'Start Game!' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
