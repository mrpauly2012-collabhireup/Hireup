interface ProgressBarProps {
  progress: number;
  label?: string;
}

export default function ProgressBar({
  progress,
  label = 'Profile progress',
}: ProgressBarProps) {
  const safeProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-500">
          {label}
        </span>

        <span className="text-[10px] font-mono font-black text-[#10B981]">
          {safeProgress}%
        </span>
      </div>

      <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#34D399] rounded-full transition-all duration-300"
          style={{ width: `${safeProgress}%` }}
        />
      </div>
    </div>
  );
}