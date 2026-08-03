import { useState } from 'react';

interface EquipmentStepProps {
  onContinue: () => void;
}

const equipmentOptions = [
  'Driving Licence',
  'Own Vehicle',
  'Own Tools',
  'Own PPE',
];

export default function EquipmentStep({
  onContinue,
}: EquipmentStepProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleOption = (option: string) => {
    setSelected(current =>
      current.includes(option)
        ? current.filter(item => item !== option)
        : [...current, option]
    );
  };

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-4xl font-black text-zinc-900">
        What can you bring to site?
      </h2>

      <p className="mt-3 text-zinc-500">
        Tap each option that applies to you.
      </p>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {equipmentOptions.map(option => {
          const isSelected = selected.includes(option);

          return (
            <button
              key={option}
              type="button"
              onClick={() => toggleOption(option)}
              className={`rounded-2xl border p-5 text-left font-bold transition ${
                isSelected
                  ? 'border-[#34D399] bg-emerald-50 text-[#10B981]'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400'
              }`}
            >
              <span className="block text-xl mb-2">
                {isSelected ? '✓' : '+'}
              </span>

              {option}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="mt-10 w-full rounded-2xl bg-[#10B981] py-4 font-bold text-white"
      >
        Continue →
      </button>
    </div>
  );
}