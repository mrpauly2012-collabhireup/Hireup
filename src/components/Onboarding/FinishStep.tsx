import { useState } from 'react';

interface FinishStepProps {
  onComplete: () => void;
}

export default function FinishStep({
  onComplete,
}: FinishStepProps) {
  const [about, setAbout] = useState('');

  const canComplete = about.trim().length >= 20;

  return (
    <div className="max-w-xl mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#10B981] flex items-center justify-center text-3xl">
        ✓
      </div>

      <h2 className="mt-6 text-4xl font-black text-zinc-900">
        Nearly finished.
      </h2>

      <p className="mt-3 text-zinc-500">
        Tell contractors why they should hire you.
      </p>

      <textarea
        value={about}
        onChange={event => setAbout(event.target.value)}
        rows={6}
        placeholder="Describe your experience, reliability and the type of work you are best at..."
        className="mt-8 w-full resize-none rounded-2xl border border-zinc-200 p-5 outline-none transition focus:border-[#34D399]"
      />

      <div className="mt-2 flex justify-between text-xs text-zinc-400">
        <span>Minimum 20 characters</span>
        <span>{about.length}/500</span>
      </div>

      <button
        type="button"
        onClick={onComplete}
        disabled={!canComplete}
        className="mt-10 w-full rounded-2xl bg-[#10B981] py-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        Complete My Profile
      </button>
    </div>
  );
}