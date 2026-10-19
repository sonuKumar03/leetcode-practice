import React, { useState } from 'react';
import { Star, FileText, ExternalLink, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
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
              <th className="py-3 px-4 w-28">Difficulty</th>
              <th className="py-3 px-4 w-24 hidden sm:table-cell">Frequency</th>
              <th className="py-3 px-4 w-36">Status</th>
              <th className="py-3 px-4 min-w-[220px] hidden lg:table-cell">Algorithm tags</th>
              <th className="py-3 px-4 w-20 text-center hidden md:table-cell">Notes</th>
              <th className="py-3 px-4 w-28 text-right hidden sm:table-cell">Links</th>
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
                const diffVariant =
                  problem.difficulty === 'Easy'
                    ? 'easy'
                    : problem.difficulty === 'Medium'
                    ? 'medium'
                    : problem.difficulty === 'Hard'
                    ? 'hard'
                    : 'default';

                return (
                  <tr
                    key={problem.id}
                    className="hover:bg-surface-hover transition-colors group"
                  >
                    {/* Star */}
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => onToggleStar(problem.id, problem.is_starred)}
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
                        <span className="font-semibold text-text-main text-sm group-hover:text-brand transition">
                          {problem.title}
                        </span>
                        {problem.paid_only && (
                          <span title="Premium Question">
                            <Lock className="w-3.5 h-3.5 text-amber-500 inline" />
                          </span>
                        )}
                        {problem.source === 'custom' && (
                          <Badge variant="brand">Custom</Badge>
                        )}
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

                    {/* Frequency */}
                    <td className="py-2.5 px-4 font-mono text-sm tabular-nums text-text-muted hidden sm:table-cell">
                      {problem.frequency && problem.frequency > 0 ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono text-xs font-semibold ${
                            problem.frequency >= 100
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              : problem.frequency >= 20
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-surface-active text-text-muted'
                          }`}
                          title={`Asked ${problem.frequency} times in real tech interviews`}
                        >
                          {problem.frequency}
                        </span>
                      ) : (
                        <span className="text-text-subtle text-xs">—</span>
                      )}
                    </td>

                    {/* Status Pill */}
                    <td className="py-2.5 px-4">
                      <StatusPill
                        status={problem.status}
                        onStatusChange={(newStatus) => onStatusChange(problem.id, newStatus)}
                      />
                    </td>

                    {/* Tags */}
                    <td className="py-2.5 px-4 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1.5 max-w-md">
                        {algoTags.slice(0, 3).map((tag) => {
                          const isSpecial = tag.toLowerCase().includes('shortest');
                          const slug = tagSlugMap.get(tag) || tag.toLowerCase().replace(/\s+/g, '-');
                          return (
                            <Badge
                              key={tag}
                              variant={isSpecial ? 'medium' : 'tag'}
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
                    <td className="py-2.5 px-4 text-center hidden md:table-cell">
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

                    {/* External Links */}
                    <td className="py-2.5 px-4 text-right whitespace-nowrap hidden sm:table-cell">
                      <div className="flex items-center justify-end space-x-2">
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
                            title="Open in Doocs Wiki"
                            className="text-xs font-semibold text-brand hover:text-brand-hover px-2.5 py-1 rounded-md bg-brand-subtle border border-brand/30 transition focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
                          >
                            Wiki
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
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
