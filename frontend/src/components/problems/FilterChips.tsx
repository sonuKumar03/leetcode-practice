import React from 'react';
import { X } from 'lucide-react';

interface FilterChipsProps {
  search: string;
  difficulty: string;
  status: string;
  isStarred: boolean;
  paidOnly: boolean | undefined;
  selectedTag: string;
  tagName?: string;
  onClearSearch: () => void;
  onClearDifficulty: () => void;
  onClearStatus: () => void;
  onClearStarred: () => void;
  onClearPaid: () => void;
  onClearTag: () => void;
}

const Chip: React.FC<{ label: string; value: string; onRemove: () => void }> = ({
  label,
  value,
  onRemove,
}) => (
  <span className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg bg-brand-subtle text-brand text-xs font-semibold border border-brand/20 animate-fade-in">
    <span className="text-text-muted font-medium">{label}:</span>
    <span>{value}</span>
    <button
      onClick={onRemove}
      className="p-0.5 rounded hover:bg-brand/20 transition cursor-pointer"
      aria-label={`Remove ${label} filter`}
    >
      <X className="w-3 h-3" />
    </button>
  </span>
);

export const FilterChips: React.FC<FilterChipsProps> = ({
  search,
  difficulty,
  status,
  isStarred,
  paidOnly,
  selectedTag,
  tagName,
  onClearSearch,
  onClearDifficulty,
  onClearStatus,
  onClearStarred,
  onClearPaid,
  onClearTag,
}) => {
  const hasAny =
    search.trim() !== '' ||
    difficulty !== 'All' ||
    status !== 'All' ||
    isStarred ||
    paidOnly !== undefined ||
    selectedTag !== '';

  if (!hasAny) return null;

  return (
    <div className="flex items-center flex-wrap gap-1.5 px-4 sm:px-6 py-2 bg-surface-hover/50 border-b border-border text-xs">
      <span className="text-text-subtle font-medium mr-1">Filters:</span>
      {search.trim() && (
        <Chip label="Search" value={`"${search.trim()}"`} onRemove={onClearSearch} />
      )}
      {difficulty !== 'All' && (
        <Chip label="Difficulty" value={difficulty} onRemove={onClearDifficulty} />
      )}
      {status !== 'All' && (
        <Chip
          label="Status"
          value={status === 'todo' ? 'To Do' : status === 'in_progress' ? 'In Progress' : 'Solved'}
          onRemove={onClearStatus}
        />
      )}
      {isStarred && <Chip label="Filter" value="Starred" onRemove={onClearStarred} />}
      {paidOnly !== undefined && (
        <Chip
          label="Access"
          value={paidOnly ? 'Premium' : 'Free'}
          onRemove={onClearPaid}
        />
      )}
      {selectedTag && (
        <Chip label="Tag" value={tagName || selectedTag} onRemove={onClearTag} />
      )}
    </div>
  );
};
