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
    default: 'bg-surface-hover text-text-muted border-border',
    brand: 'bg-brand-subtle text-brand border-brand/30 font-semibold',
    easy: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold',
    medium: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold',
    hard: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 font-bold',
    todo: 'bg-surface-hover text-text-muted border-border font-semibold',
    inProgress: 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30 font-semibold',
    solved: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30 font-semibold',
    tag: 'bg-surface-hover text-text-muted border-border hover:text-text-main hover:bg-surface-active',
  };

  const interactive = onClick ? 'cursor-pointer hover:border-text-subtle active:scale-95' : '';

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs border font-medium transition-colors ${variantStyles[variant]} ${interactive} ${className}`}
    >
      {icon}
      <span>{children}</span>
    </span>
  );
};
