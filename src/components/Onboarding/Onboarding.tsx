import { useState } from 'react';
import ProgressBar from './ProgressBar';
import WelcomeStep from './WelcomeStep';
import AboutStep from './AboutStep';
import TradeStep from './TradeStep';
import WorkStep from './WorkStep';
import EquipmentStep from './EquipmentStep';
import QualificationsStep from './QualificationsStep';
import LicencesStep from './LicencesStep';
import FinishStep from './FinishStep';

interface OnboardingProps {
  onComplete: () => void;
}

const totalSteps = 8;

export default function Onboarding({
  onComplete,
}: OnboardingProps) {
  const [step, setStep] = useState(0);

  const progress = Math.round((step / (totalSteps - 1)) * 100);

  const goForward = () => {
    setStep(current =>
      Math.min(current + 1, totalSteps - 1)
    );
  };

  const goBack = () => {
    setStep(current => Math.max(current - 1, 0));
  };

  return (
    <div className="min-h-screen bg-zinc-50 px-5 py-8">
      <div className="mx-auto max-w-5xl">
        {step > 0 && (
          <div className="mb-10">
            <ProgressBar
              progress={progress}
              label="Profile completion"
            />

            <button
              type="button"
              onClick={goBack}
              className="mt-5 text-sm font-bold text-zinc-500 hover:text-zinc-900"
            >
              ← Back
            </button>
          </div>
        )}

        <div className="rounded-3xl border border-zinc-200 bg-white px-6 py-10 shadow-sm sm:px-12 sm:py-14">
          {step === 0 && (
            <WelcomeStep onContinue={goForward} />
          )}

          {step === 1 && (
            <AboutStep onContinue={goForward} />
          )}

          {step === 2 && (
            <TradeStep onContinue={goForward} />
          )}

          {step === 3 && (
            <WorkStep onContinue={goForward} />
          )}

          {step === 4 && (
            <EquipmentStep onContinue={goForward} />
          )}

          {step === 5 && (
            <QualificationsStep onContinue={goForward} />
          )}

          {step === 6 && (
            <LicencesStep onContinue={goForward} />
          )}

          {step === 7 && (
            <FinishStep onComplete={onComplete} />
          )}
        </div>
      </div>
    </div>
  );
}