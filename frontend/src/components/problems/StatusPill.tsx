import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle2, Clock, Circle } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Status } from '../../types';

interface StatusPillProps {
  status: Status;
  onStatusChange: (newStatus: Status) => void;
}

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
      'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25',
  },
  solved: {
    label: 'Solved',
    icon: CheckCircle2,
    style:
      'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25',
  },
};

const statuses: Status[] = ['todo', 'in_progress', 'solved'];

export const StatusPill: React.FC<StatusPillProps> = ({ status, onStatusChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleSelect = (next: Status) => {
    if (next !== status) {
      if (next === 'solved') {
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 } });
      }
      onStatusChange(next);
    }
    setOpen(false);
  };

  const current = statusConfig[status] || statusConfig.todo;
  const Icon = current.icon;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className={`inline-flex items-center whitespace-nowrap space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition active:scale-95 cursor-pointer ${current.style}`}
      >
        <Icon className="w-3.5 h-3.5" />
        <span>{current.label}</span>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 left-1/2 -translate-x-1/2 bg-surface border border-border rounded-lg shadow-lg py-1 min-w-[130px]">
          {statuses.map((s) => {
            const cfg = statusConfig[s];
            const ItemIcon = cfg.icon;
            const isActive = s === status;
            return (
              <button
                key={s}
                onClick={(e) => { e.stopPropagation(); handleSelect(s); }}
                className={`w-full flex items-center space-x-2 px-3 py-1.5 text-xs font-medium transition hover:bg-surface-hover ${isActive ? 'text-accent' : 'text-text-muted'}`}
              >
                <ItemIcon className="w-3.5 h-3.5" />
                <span>{cfg.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
