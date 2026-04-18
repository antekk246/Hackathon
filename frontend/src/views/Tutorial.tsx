import { X } from 'lucide-react';
import guideImg from "../assets/image-4.png";

interface TutorialProps {
  currentStep: number;
  onNext: () => void;
  onClose: () => void;
}

const TUTORIAL_STEPS = [
  { title: 'Welcome to the Game', description: 'Learn how to protect yourself from cyber threats in this roguelike adventure!' },
  { title: 'Player Health', description: 'This is your health bar. Defeat enemies to earn rewards and level up!' },
  { title: 'Enemy Threats', description: 'Defeat different types of enemies to progress through the adventure.' },
  { title: 'Your Health Points', description: 'Keep your health above zero to survive. Use cards strategically!' },
  { title: 'Play Your Cards', description: 'Select and play cards from your deck to defeat enemies.' },
  { title: 'Track Progress', description: 'Monitor your progress through each level.' },
  { title: 'Upgrade Your Cards', description: 'Visit the card shop to upgrade and unlock new abilities.' },
  { title: 'Ready to Start?', description: 'You\'re all set! Click Start to begin your adventure.' }
];

export function Tutorial({ currentStep, onNext, onClose }: TutorialProps) {
  const totalSteps = TUTORIAL_STEPS.length;
  const isLastStep = currentStep === totalSteps - 1;
  const step = TUTORIAL_STEPS[currentStep] || TUTORIAL_STEPS[0];

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
          {[...Array(totalSteps)].map((_, index) => (
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
            {isLastStep ? 'Start Game' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
