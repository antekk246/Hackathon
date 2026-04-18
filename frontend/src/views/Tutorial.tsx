import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import guideImg from "../assets/image-4.png";

interface TutorialProps {
  currentStep: number;
  onNext: () => void;
  onClose: () => void;
}

export function Tutorial({ currentStep, onNext, onClose }: TutorialProps) {
  const { t } = useTranslation();
  
  // We use an array of objects to map highlights, but titles/descriptions come from i18n
  const highlights = ['none', 'player', 'enemy', 'health', 'cards', 'progress', 'none', 'none'];
  
  const stepTitle = t(`tutorial.steps.${currentStep}.title`);
  const stepDescription = t(`tutorial.steps.${currentStep}.description`);
  
  const totalSteps = 8;
  const isLastStep = currentStep === totalSteps - 1;

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
            <h2 className="text-3xl font-bold text-cyan-400 mb-3">{stepTitle}</h2>
            <p className="text-xl text-white leading-relaxed">{stepDescription}</p>
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
            {t('tutorial.stepCounter', { current: currentStep + 1, total: totalSteps })}
          </div>
          <button
            onClick={onNext}
            className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-lg"
          >
            {isLastStep ? t('tutorial.start') : t('tutorial.next')}
          </button>
        </div>
      </div>
    </div>
  );
}
