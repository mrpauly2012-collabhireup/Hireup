import { useState } from 'react';

interface LicencesStepProps {
  onContinue: () => void;
}

const licenceOptions = [
  'Gas Safe',
  'ECS Card',
  'JIB Card',
  'NICEIC',
  'CPCS',
  'NPORS',
  'Forklift Licence',
  'Asbestos Awareness',
];

export default function LicencesStep({
  onContinue,
}: LicencesStepProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleLicence = (licence: string) => {
    setSelected(current =>
      current.includes(licence)
        ? current.filter(item => item !== licence)
        : [...current, licence]
    );
  };

  return (
    <div className="max-w-xl mx-auto">
      <span className="text-xs font-bold uppercase tracking-wider text-[#10B981]">
        Optional
      </span>

      <h2 className="mt-3 text-4xl font-black text-zinc-900">
        Add your licences.
      </h2>

      <p className="mt-3 text-zinc-500">
        These help contractors understand what work you are approved to do.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        {licenceOptions.map(licence => {
          const isSelected = selected.includes(licence);

          return (
            <button
              key={licence}
              type="button"
              onClick={() => toggleLicence(licence)}
              className={`rounded-full border px-5 py-3 text-sm font-bold transition ${
                isSelected
                  ? 'border-[#34D399] bg-[#34D399] text-zinc-950'
                  : 'border-zinc-200 bg-white text-zinc-600'
              }`}
            >
              {isSelected && '✓ '}
              {licence}
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