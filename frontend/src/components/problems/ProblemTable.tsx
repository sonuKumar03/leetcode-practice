import React, { useState, useMemo } from 'react';
import { Star, FileText, ExternalLink, Lock, ChevronLeft, ChevronRight, ChevronUp, BookOpen, RotateCcw } from 'lucide-react';
import type { Problem, Status } from '../../types';
import { StatusPill } from './StatusPill';
import { Badge } from '../../design-system/components/Badge';

interface ProblemTableProps {
  problems: Problem[];
  total: number;
  page: number;
  totalPages: number;
  loading?: boolean;
  hasActiveFilters?: boolean;
  sortBy?: string;
  onSortChange?: (sort: string) => void;
  onPageChange: (newPage: number) => void;
  onStatusChange: (id: string, newStatus: Status) => void;
  onToggleStar: (id: string, current: boolean) => void;
  onOpenNotes: (problem: Problem) => void;
  onSelectTag: (tag: string) => void;
  onClearFilters?: () => void;
  onAddQuestion?: () => void;
  companyNames: Set<string>;
  tagSlugMap: Map<string, string>;
}

type SortColumn = 'difficulty' | 'frequency' | 'status';
const sortPairs: Record<SortColumn, [string, string]> = {
  difficulty: ['difficulty_asc', 'difficulty_desc'],
  frequency: ['frequency_desc', 'frequency_asc'],
  status: ['status_asc', 'status_desc'],
};

function getSortState(sortBy: string, column: SortColumn): 'asc' | 'desc' | null {
  const [asc, desc] = sortPairs[column];
  if (sortBy === asc) return 'asc';
  if (sortBy === desc) return 'desc';
  return null;
}

function nextSort(sortBy: string, column: SortColumn): string {
  const [asc, desc] = sortPairs[column];
  if (sortBy === asc) return desc;
  return asc;
}

const SortIndicator: React.FC<{ active: 'asc' | 'desc' | null }> = ({ active }) => {
  if (!active) return <span className="ml-1 text-text-subtle/30 text-[10px]">⇅</span>;
  return (
    <span className="ml-1 text-brand text-[10px] font-bold">
      {active === 'asc' ? '↑' : '↓'}
    </span>
  );
};

function daysSince(dateStr?: string): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

function renderSimpleMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const result: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let codeKey = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        result.push(
          <pre key={`code-${codeKey++}`} className="bg-surface-active border border-border rounded-lg p-3 text-xs font-mono overflow-x-auto my-2">
            <code>{codeLines.join('\n')}</code>
          </pre>
        );
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }
    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }
    if (line.startsWith('# ')) {
      result.push(<div key={i} className="text-sm font-bold text-text-main mt-2 mb-1">{line.slice(2)}</div>);
    } else if (line.startsWith('## ')) {
      result.push(<div key={i} className="text-xs font-bold text-text-main mt-2 mb-1">{line.slice(3)}</div>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      result.push(<div key={i} className="text-xs text-text-muted pl-3 before:content-['•'] before:mr-1.5 before:text-text-subtle">{renderInline(line.slice(2))}</div>);
    } else if (line.trim() === '') {
      result.push(<div key={i} className="h-2" />);
    } else {
      result.push(<div key={i} className="text-xs text-text-muted leading-relaxed">{renderInline(line)}</div>);
    }
  }
  if (inCodeBlock && codeLines.length) {
    result.push(
      <pre key={`code-${codeKey}`} className="bg-surface-active border border-border rounded-lg p-3 text-xs font-mono overflow-x-auto my-2">
        <code>{codeLines.join('\n')}</code>
      </pre>
    );
  }
  return result;
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let lastIndex = 0;
  let match;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const m = match[0];
    if (m.startsWith('`')) {
      parts.push(<code key={key++} className="px-1 py-0.5 rounded bg-surface-active text-brand text-[11px] font-mono">{m.slice(1, -1)}</code>);
    } else if (m.startsWith('**')) {
      parts.push(<strong key={key++} className="font-bold text-text-main">{m.slice(2, -2)}</strong>);
    }
    lastIndex = match.index + m.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

const SkeletonRow: React.FC = () => (
  <tr className="animate-pulse border-b border-border/50">
    <td className="py-2.5 px-4 text-center">
      <div className="w-4 h-4 rounded bg-surface-active mx-auto" />
    </td>
    <td className="py-2.5 px-4">
      <div className="w-8 h-4 rounded bg-surface-active font-mono" />
    </td>
    <td className="py-2.5 px-4">
      <div className="w-56 h-4 rounded bg-surface-active" />
    </td>
    <td className="py-2.5 px-4">
      <div className="w-16 h-5 rounded-md bg-surface-active" />
    </td>
    <td className="py-2.5 px-4 hidden sm:table-cell">
      <div className="w-12 h-5 rounded-md bg-surface-active" />
    </td>
    <td className="py-2.5 px-4">
      <div className="w-24 h-6 rounded-lg bg-surface-active" />
    </td>
    <td className="py-2.5 px-4 hidden lg:table-cell">
      <div className="flex gap-1.5">
        <div className="w-16 h-5 rounded-md bg-surface-active" />
        <div className="w-20 h-5 rounded-md bg-surface-active" />
      </div>
    </td>
    <td className="py-2.5 px-4 text-center hidden md:table-cell">
      <div className="w-6 h-6 rounded bg-surface-active mx-auto" />
    </td>
    <td className="py-2.5 px-4 text-right hidden sm:table-cell">
      <div className="w-10 h-5 rounded bg-surface-active ml-auto" />
    </td>
  </tr>
);

const FrequencyBar: React.FC<{ value: number; max: number }> = ({ value, max }) => {
  const pct = Math.min((value / max) * 100, 100);
  const colorClass =
    value >= 100
      ? 'bg-rose-500/60'
      : value >= 20
      ? 'bg-amber-500/50'
      : 'bg-surface-active';
  return (
    <div className="relative flex items-center gap-2">
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono text-xs font-semibold relative z-10 ${
          value >= 100
            ? 'text-rose-600 dark:text-rose-400'
            : value >= 20
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-text-muted'
        }`}
        title={`Asked ${value} times in real tech interviews`}
      >
        {value}
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-surface-active/50 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const ReviewBadge: React.FC<{ days: number }> = ({ days }) => (
  <span
    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/20"
    title={`Solved ${days} days ago — time to review!`}
  >
    <RotateCcw className="w-2.5 h-2.5" />
    Review
  </span>
);

const PaginationBar: React.FC<{
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (p: number) => void;
}> = ({ page, totalPages, total, onPageChange }) => {
  const [jumpValue, setJumpValue] = useState('');

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseInt(jumpValue, 10);
    if (target >= 1 && target <= totalPages && target !== page) {
      onPageChange(target);
    }
    setJumpValue('');
  };

  return (
    <div className="sticky bottom-0 py-3 px-4 sm:px-6 bg-surface border-t border-border flex items-center justify-between gap-3 text-sm text-text-muted transition-colors">
      <div className="hidden sm:block">
        Showing <span className="font-bold text-text-main">{(page - 1) * 50 + 1}</span> to{' '}
        <span className="font-bold text-text-main">{Math.min(page * 50, total)}</span> of{' '}
        <span className="font-bold text-text-main">{total}</span> questions
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
          disabled={page <= 1}
          className="p-1.5 rounded-lg border border-border bg-surface disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-hover text-text-main transition cursor-pointer focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-semibold text-text-main px-2">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg border border-border bg-surface disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-hover text-text-main transition cursor-pointer focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        {totalPages > 5 && (
          <form onSubmit={handleJump} className="hidden sm:flex items-center space-x-1.5 ml-2">
            <input
              type="number"
              min={1}
              max={totalPages}
              value={jumpValue}
              onChange={(e) => setJumpValue(e.target.value)}
              placeholder="Go to"
              className="w-16 px-2 py-1 text-xs rounded-lg border border-border bg-surface text-text-main focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors tabular-nums"
            />
            <button
              type="submit"
              className="px-2 py-1 text-xs font-semibold rounded-lg bg-brand-subtle text-brand border border-brand/30 hover:bg-brand/20 transition cursor-pointer"
            >
              Go
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export const ProblemTable: React.FC<ProblemTableProps> = ({
  problems,
  total,
  page,
  totalPages,
  loading = false,
  hasActiveFilters = false,
  sortBy = 'id_asc',
  onSortChange,
  onPageChange,
  onStatusChange,
  onToggleStar,
  onOpenNotes,
  onSelectTag,
  onClearFilters,
  onAddQuestion,
  companyNames,
  tagSlugMap,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const maxFrequency = useMemo(() => {
    const freqs = problems.map((p) => p.frequency || 0).filter((f) => f > 0);
    return Math.max(...freqs, 100);
  }, [problems]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-canvas transition-colors relative">
      {/* Sleek top indeterminate loading beam */}
      <div className="h-0.5 w-full bg-transparent overflow-hidden sticky top-0 z-20">
        {loading && (
          <div className="w-full h-full bg-gradient-to-r from-brand/20 via-brand to-brand/20 animate-indeterminate" />
        )}
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-surface border-b border-border text-text-muted font-semibold text-xs sticky top-0 z-10 transition-colors">
              <th className="py-3 px-4 w-12 text-center">★</th>
              <th className="py-3 px-4 w-20">#</th>
              <th className="py-3 px-4 min-w-[180px]">Title</th>
              <th
                className="py-3 px-4 w-28 cursor-pointer hover:text-text-main select-none"
                onClick={() => onSortChange?.(nextSort(sortBy, 'difficulty'))}
                title="Sort by difficulty"
              >
                <span className="inline-flex items-center">
                  Difficulty
                  <SortIndicator active={getSortState(sortBy, 'difficulty')} />
                </span>
              </th>
              <th
                className="py-3 px-4 w-32 hidden sm:table-cell cursor-pointer hover:text-text-main select-none"
                onClick={() => onSortChange?.(nextSort(sortBy, 'frequency'))}
                title="Sort by frequency"
              >
                <span className="inline-flex items-center">
                  Frequency
                  <SortIndicator active={getSortState(sortBy, 'frequency')} />
                </span>
              </th>
              <th
                className="py-3 px-4 w-36 cursor-pointer hover:text-text-main select-none"
                onClick={() => onSortChange?.(nextSort(sortBy, 'status'))}
                title="Sort by status"
              >
                <span className="inline-flex items-center">
                  Status
                  <SortIndicator active={getSortState(sortBy, 'status')} />
                </span>
              </th>
              <th className="py-3 px-4 min-w-[220px] hidden lg:table-cell">Algorithm tags</th>
              <th className="py-3 px-4 w-20 text-center hidden md:table-cell">Notes</th>
              <th className="py-3 px-4 w-20 text-center hidden sm:table-cell">Links</th>
            </tr>
          </thead>
          <tbody
            className={`divide-y divide-border transition-opacity duration-150 ${
              loading && problems.length > 0 ? 'opacity-50 pointer-events-none' : 'opacity-100'
            }`}
          >
            {loading && problems.length === 0 ? (
              Array.from({ length: 12 }).map((_, i) => <SkeletonRow key={i} />)
            ) : problems.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-20 text-center text-text-subtle">
                  <div className="max-w-xs mx-auto space-y-3">
                    <p className="font-semibold text-text-muted text-sm">No problems found</p>
                    <p className="text-xs text-text-subtle">
                      {hasActiveFilters
                        ? 'No problems match the current filters.'
                        : 'Get started by adding your first question.'}
                    </p>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      {hasActiveFilters && onClearFilters && (
                        <button
                          onClick={onClearFilters}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-text-muted hover:text-text-main hover:bg-surface-hover transition cursor-pointer"
                        >
                          Clear all filters
                        </button>
                      )}
                      {onAddQuestion && (
                        <button
                          onClick={onAddQuestion}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand text-brand-fg hover:bg-brand-hover transition cursor-pointer"
                        >
                          Add Question
                        </button>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              problems.map((problem) => {
                const algoTags = problem.tags.filter((t) => !companyNames.has(t));
                const hasNotes = problem.notes && problem.notes.trim().length > 0;
                const isExpanded = expandedId === problem.id;
                const diffVariant =
                  problem.difficulty === 'Easy'
                    ? 'easy'
                    : problem.difficulty === 'Medium'
                    ? 'medium'
                    : problem.difficulty === 'Hard'
                    ? 'hard'
                    : 'default';

                const days = problem.status === 'solved' ? daysSince(problem.updated_at) : null;
                const needsReview = days !== null && days >= 7;

                return (
                  <React.Fragment key={problem.id}>
                    <tr
                      className={`hover:bg-surface-hover transition-colors group cursor-pointer ${isExpanded ? 'bg-surface-hover/50' : ''}`}
                      onClick={() => toggleExpand(problem.id)}
                    >
                      {/* Star */}
                      <td className="py-2.5 px-4 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); onToggleStar(problem.id, problem.is_starred); }}
                          aria-label={problem.is_starred ? `Unstar ${problem.title}` : `Star ${problem.title}`}
                          aria-pressed={problem.is_starred}
                          className="text-text-subtle hover:text-amber-500 transition cursor-pointer focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 rounded"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              problem.is_starred
                                ? 'fill-amber-400 text-amber-400'
                                : 'hover:fill-amber-400/20'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Problem ID */}
                      <td className="py-2.5 px-4 font-mono font-bold text-text-muted text-sm tabular-nums">
                        {problem.id}
                      </td>

                      {/* Title */}
                      <td className="py-2.5 px-4">
                        <div className="flex items-center space-x-2">
                          {problem.leetcode_url ? (
                            <a
                              href={problem.leetcode_url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="font-semibold text-text-main text-sm group-hover:text-brand hover:underline transition"
                            >
                              {problem.title}
                            </a>
                          ) : (
                            <span className="font-semibold text-text-main text-sm">
                              {problem.title}
                            </span>
                          )}
                          {problem.paid_only && (
                            <span title="Premium Question">
                              <Lock className="w-3.5 h-3.5 text-amber-500 inline" />
                            </span>
                          )}
                          {problem.source === 'custom' && (
                            <Badge variant="brand">Custom</Badge>
                          )}
                          {needsReview && <ReviewBadge days={days!} />}
                        </div>
                        {/* Mobile-only inline tags */}
                        {algoTags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1 lg:hidden">
                            {algoTags.slice(0, 2).map((tag) => (
                              <span key={tag} className="text-[11px] text-text-subtle bg-surface-hover px-1.5 py-0.5 rounded">
                                {tag}
                              </span>
                            ))}
                            {algoTags.length > 2 && (
                              <span className="text-[11px] text-text-subtle px-1 font-mono">+{algoTags.length - 2}</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Difficulty */}
                      <td className="py-2.5 px-4">
                        <Badge variant={diffVariant}>{problem.difficulty}</Badge>
                      </td>

                      {/* Frequency with bar */}
                      <td className="py-2.5 px-4 hidden sm:table-cell">
                        {problem.frequency && problem.frequency > 0 ? (
                          <FrequencyBar value={problem.frequency} max={maxFrequency} />
                        ) : (
                          <span className="text-text-subtle text-xs">—</span>
                        )}
                      </td>

                      {/* Status Pill */}
                      <td className="py-2.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <StatusPill
                          status={problem.status}
                          onStatusChange={(newStatus) => onStatusChange(problem.id, newStatus)}
                        />
                      </td>

                      {/* Tags */}
                      <td className="py-2.5 px-4 hidden lg:table-cell" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-wrap gap-1.5 max-w-md">
                          {algoTags.slice(0, 3).map((tag) => {
                            const slug = tagSlugMap.get(tag) || tag.toLowerCase().replace(/\s+/g, '-');
                            return (
                              <Badge
                                key={tag}
                                variant="tag"
                                onClick={() => onSelectTag(slug)}
                              >
                                {tag}
                              </Badge>
                            );
                          })}
                          {algoTags.length > 3 && (
                            <span className="text-xs text-text-subtle self-center px-1 font-mono">
                              +{algoTags.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Notes Trigger */}
                      <td className="py-2.5 px-4 text-center hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onOpenNotes(problem)}
                          className={`p-1.5 rounded-lg border transition cursor-pointer focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 ${
                            hasNotes
                              ? 'bg-amber-100 dark:bg-amber-500/20 border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300'
                              : 'border-transparent text-text-subtle hover:text-text-main hover:bg-surface-hover'
                          }`}
                          title={hasNotes ? 'View/Edit Notes' : 'Add Notes'}
                          aria-label={hasNotes ? `Edit notes for ${problem.title}` : `Add notes for ${problem.title}`}
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </td>

                      {/* External Links - compact icons only */}
                      <td className="py-2.5 px-4 text-center hidden sm:table-cell" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          {problem.leetcode_url && (
                            <a
                              href={problem.leetcode_url}
                              target="_blank"
                              rel="noreferrer"
                              title="Open on LeetCode"
                              className="p-1.5 rounded-lg text-text-subtle hover:text-brand hover:bg-surface-hover transition focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          {problem.doocs_url && (
                            <a
                              href={problem.doocs_url}
                              target="_blank"
                              rel="noreferrer"
                              title="Solution Wiki"
                              className="p-1.5 rounded-lg text-text-subtle hover:text-brand hover:bg-surface-hover transition focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
                            >
                              <BookOpen className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Row Detail */}
                    {isExpanded && (
                      <tr className="bg-surface-hover/30">
                        <td colSpan={9} className="px-4 py-4">
                          <div className="flex flex-col lg:flex-row gap-4 max-w-4xl ml-12">
                            {/* Left: Notes */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-3.5 h-3.5 text-text-subtle" />
                                <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">Notes</span>
                              </div>
                              {hasNotes ? (
                                <div className="bg-surface border border-border rounded-xl p-3 max-h-48 overflow-y-auto">
                                  {renderSimpleMarkdown(problem.notes)}
                                </div>
                              ) : (
                                <button
                                  onClick={() => onOpenNotes(problem)}
                                  className="text-xs text-text-subtle hover:text-brand transition cursor-pointer"
                                >
                                  + Add notes for this problem
                                </button>
                              )}
                            </div>

                            {/* Right: Tags + Meta */}
                            <div className="w-full lg:w-64 flex-shrink-0 space-y-3">
                              {/* All tags */}
                              {algoTags.length > 0 && (
                                <div>
                                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5 block">All Tags</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {algoTags.map((tag) => {
                                      const slug = tagSlugMap.get(tag) || tag.toLowerCase().replace(/\s+/g, '-');
                                      return (
                                        <Badge key={tag} variant="tag" onClick={() => onSelectTag(slug)}>
                                          {tag}
                                        </Badge>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Quick actions */}
                              <div>
                                <span className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5 block">Actions</span>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    onClick={() => onOpenNotes(problem)}
                                    className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-border text-text-muted hover:text-text-main hover:bg-surface-hover transition cursor-pointer"
                                  >
                                    {hasNotes ? 'Edit Notes' : 'Add Notes'}
                                  </button>
                                  {problem.leetcode_url && (
                                    <a
                                      href={problem.leetcode_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-border text-text-muted hover:text-brand hover:bg-surface-hover transition inline-flex items-center gap-1"
                                    >
                                      LeetCode <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                  {problem.doocs_url && (
                                    <a
                                      href={problem.doocs_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-border text-text-muted hover:text-brand hover:bg-surface-hover transition inline-flex items-center gap-1"
                                    >
                                      Wiki <BookOpen className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                              </div>

                              {/* Review status */}
                              {problem.status === 'solved' && problem.updated_at && (
                                <div className="text-xs text-text-subtle">
                                  Solved {daysSince(problem.updated_at)} days ago
                                  {needsReview && (
                                    <span className="text-violet-600 dark:text-violet-400 font-semibold ml-1">— time to review!</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Collapse indicator */}
                          <div className="flex justify-center mt-3">
                            <button
                              onClick={() => setExpandedId(null)}
                              className="text-text-subtle hover:text-text-main transition p-1 cursor-pointer"
                              aria-label="Collapse"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <PaginationBar
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};
