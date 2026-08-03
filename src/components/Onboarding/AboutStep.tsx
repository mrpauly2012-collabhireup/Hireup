interface AboutStepProps {
  onContinue: () => void;
}

export default function AboutStep({
  onContinue,
}: AboutStepProps) {
  return (
    <div className="max-w-xl mx-auto">

      <h2 className="text-4xl font-black text-zinc-900">
        Tell us about yourself.
      </h2>

      <p className="mt-3 text-zinc-500">
        Let's start with the basics.
      </p>

      <div className="mt-10 space-y-5">

        <input
          placeholder="Full Name"
          className="w-full rounded-xl border p-4"
        />

        <input
          placeholder="Phone Number"
          className="w-full rounded-xl border p-4"
        />

        <input
          placeholder="Location"
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