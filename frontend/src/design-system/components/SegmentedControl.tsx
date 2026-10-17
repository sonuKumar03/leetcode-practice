export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  badge?: number | string;
  variant?: 'default' | 'easy' | 'medium' | 'hard';
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (val: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
}: SegmentedControlProps<T>) {
  return (
    <div
      className={`inline-flex items-center bg-surface border border-border rounded-xl p-1 gap-0.5 select-none ${className}`}
    >
      {options.map((option) => {
        const isActive = value === option.value;

        let activeStyle = 'bg-brand text-white shadow-sm';
        if (option.variant === 'easy') {
          activeStyle = 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40';
        } else if (option.variant === 'medium') {
          activeStyle = 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40';
        } else if (option.variant === 'hard') {
          activeStyle = 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/40';
        }

        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isActive
                ? activeStyle
                : 'text-text-muted hover:text-text-main hover:bg-surface-hover'
            }`}
          >
            <span>{option.label}</span>
            {option.badge !== undefined && (
              <span className="ml-1.5 text-[10px] opacity-70 font-mono">
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
