import React from 'react';
import { CheckCircle2, Clock, Circle } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Status } from '../../types';

interface StatusPillProps {
  status: Status;
  onStatusChange: (newStatus: Status) => void;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, onStatusChange }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    let next: Status = 'todo';
    if (status === 'todo') next = 'in_progress';
    else if (status === 'in_progress') {
      next = 'solved';
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.8 },
      });
    } else if (status === 'solved') {
      next = 'todo';
    }
    onStatusChange(next);
  };

  const statusConfig = {
    todo: {
      label: 'To Do',
      icon: Circle,
      style:
        'bg-surface-hover text-text-muted hover:text-text-main border border-border hover:border-text-subtle',
    },
    in_progress: {
      label: 'In Progress',
      icon: Clock,
      style:
        'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25',
    },
    solved: {
      label: 'Solved',
      icon: CheckCircle2,
      style:
        'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25',
    },
  };

  const current = statusConfig[status] || statusConfig.todo;
  const Icon = current.icon;

  return (
    <button
      onClick={handleClick}
      title="Click to toggle status: Todo -> In Progress -> Solved"
      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition active:scale-95 cursor-pointer ${current.style}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{current.label}</span>
    </button>
  );
};
