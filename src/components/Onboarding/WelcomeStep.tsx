interface WelcomeStepProps {
  onContinue: () => void;
}

export default function WelcomeStep({
  onContinue,
}: WelcomeStepProps) {
  return (
    <div className="max-w-xl mx-auto">

      <div className="mb-8">
        <span className="inline-flex px-4 py-2 rounded-full bg-[#ECFDF5] text-[#10B981] text-xs font-bold uppercase tracking-wider">
          Welcome to HireUp
        </span>
      </div>

      <h1 className="text-5xl font-black text-zinc-900 leading-tight">
        Let's build your HireUp profile.
      </h1>

      <p className="mt-5 text-lg text-zinc-500 leading-relaxed">
        We'll ask a few quick questions so we can match you with the right jobs.
        Most people finish in under two minutes.
      </p>

      <button
        onClick={onContinue}
        className="mt-12 w-full rounded-2xl bg-[#10B981] py-5 text-lg font-bold text-white transition hover:scale-[1.02]"
      >
        Get Started →
      </button>

    </div>
  );
}