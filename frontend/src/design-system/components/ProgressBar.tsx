import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100
  color?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  color,
  size = 'sm',
  className = '',
}) => {
  const heightClass = size === 'sm' ? 'h-1.5' : 'h-2.5';
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      className={`w-full bg-surface-active rounded-full overflow-hidden ${heightClass} ${className}`}
    >
      <div
        className={`${heightClass} rounded-full transition-all duration-300 bg-emerald-500`}
        style={{
          width: `${clamped}%`,
          ...(color ? { backgroundColor: color } : {}),
        }}
      />
    </div>
  );
};
