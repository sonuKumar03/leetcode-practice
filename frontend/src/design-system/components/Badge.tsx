import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'brand'
  | 'easy'
  | 'medium'
  | 'hard'
  | 'todo'
  | 'inProgress'
  | 'solved'
  | 'tag';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  icon,
  onClick,
  className = '',
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    default: 'bg-[#151D2C] text-slate-300 border-[#25324D]',
    brand: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    easy: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-bold',
    medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30 font-bold',
    hard: 'bg-rose-500/15 text-rose-400 border-rose-500/30 font-bold',
    todo: 'bg-slate-500/15 text-slate-400 border-slate-500/30 font-semibold',
    inProgress: 'bg-sky-500/15 text-sky-300 border-sky-500/30 font-semibold',
    solved: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-semibold',
    tag: 'bg-[#141B2B] text-slate-400 border-[#25324D] hover:text-white hover:bg-[#1A2337]',
  };

  const interactive = onClick ? 'cursor-pointer hover:border-slate-500 active:scale-95' : '';

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] border font-medium transition-colors ${variantStyles[variant]} ${interactive} ${className}`}
    >
      {icon}
      <span>{children}</span>
    </span>
  );
};
