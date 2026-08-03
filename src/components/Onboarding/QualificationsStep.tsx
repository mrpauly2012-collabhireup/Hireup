import { useState } from 'react';

interface QualificationsStepProps {
  onContinue: () => void;
}

const qualificationOptions = [
  'CSCS',
  'NVQ Level 2',
  'NVQ Level 3',
  'SMSTS',
  'SSSTS',
  'First Aid',
  'PASMA',
  'IPAF',
];

export default function QualificationsStep({
  onContinue,
}: QualificationsStepProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleQualification = (qualification: string) => {
    setSelected(current =>
      current.includes(qualification)
        ? current.filter(item => item !== qualification)
        : [...current, qualification]
    );
  };

  return (
    <div className="max-w-xl mx-auto">
      <span className="text-xs font-bold uppercase tracking-wider text-[#10B981]">
        Optional
      </span>

      <h2 className="mt-3 text-4xl font-black text-zinc-900">
        Add your qualifications.
      </h2>

      <p className="mt-3 text-zinc-500">
        Select any qualifications you currently hold.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        {qualificationOptions.map(qualification => {
          const isSelected = selected.includes(qualification);

          return (
            <button
              key={qualification}
              type="button"
              onClick={() => toggleQualification(qualification)}
              className={`rounded-full border px-5 py-3 text-sm font-bold transition ${
                isSelected
                  ? 'border-[#34D399] bg-[#34D399] text-zinc-950'
                  : 'border-zinc-200 bg-white text-zinc-600'
              }`}
            >
              {isSelected && '✓ '}
              {qualification}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="mt-10 w-full rounded-2xl bg-[#10B981] py-4 font-bold text-white"
      >
        {selected.length > 0 ? 'Continue →' : 'Skip for now →'}
      </button>
    </div>
  );
}