interface WorkStepProps {
  onContinue: () => void;
}

export default function WorkStep({
  onContinue,
}: WorkStepProps) {
  return (
    <div className="max-w-xl mx-auto">

      <h2 className="text-4xl font-black">
        What work are you looking for?
      </h2>

      <p className="mt-3 text-zinc-500">
        This helps us match you with better jobs.
      </p>

      <div className="mt-10 space-y-5">

        <input
          placeholder="Day Rate (£)"
          className="w-full rounded-xl border p-4"
        />

        <input
          placeholder="Travel Distance"
          className="w-full rounded-xl border p-4"
        />

      </div>

      <button
        onClick={onContinue}
        className="mt-10 w-full rounded-2xl bg-[#10B981] py-4 font-bold text-white"
      >
        Continue →
      </button>

    </div>
  );
}