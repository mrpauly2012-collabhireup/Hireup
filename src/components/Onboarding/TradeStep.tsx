interface TradeStepProps {
  onContinue: () => void;
}

export default function TradeStep({
  onContinue,
}: TradeStepProps) {
  return (
    <div className="max-w-xl mx-auto">

      <h2 className="text-4xl font-black">
        What trade do you do?
      </h2>

      <p className="mt-3 text-zinc-500">
        Select every trade you work in.
      </p>

      <div className="mt-10">

        <input
          placeholder="Search trades..."
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