import React from 'react';
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
  onPageChange: (newPage: number) => void;
  onStatusChange: (id: string, newStatus: Status) => void;
  onToggleStar: (id: string, current: boolean) => void;
  onOpenNotes: (problem: Problem) => void;
  onSelectTag: (tag: string) => void;
}

const SkeletonRow: React.FC = () => (
  <tr className="animate-pulse border-b border-border/50">
    <td className="py-3 px-4 text-center">
      <div className="w-4 h-4 rounded bg-surface-active mx-auto" />
    </td>
    <td className="py-3 px-4">
      <div className="w-8 h-4 rounded bg-surface-active font-mono" />
    </td>
    <td className="py-3 px-4">
      <div className="w-56 h-4 rounded bg-surface-active" />
    </td>
    <td className="py-3 px-4">
      <div className="w-16 h-5 rounded-md bg-surface-active" />
    </td>
    <td className="py-3 px-4">
      <div className="w-24 h-6 rounded-lg bg-surface-active" />
    </td>
    <td className="py-3 px-4">
      <div className="flex gap-1.5">
        <div className="w-16 h-5 rounded-md bg-surface-active" />
        <div className="w-20 h-5 rounded-md bg-surface-active" />
      </div>
    </td>
    <td className="py-3 px-4 text-center">
      <div className="w-6 h-6 rounded bg-surface-active mx-auto" />
    </td>
    <td className="py-3 px-4 text-right">
      <div className="w-10 h-5 rounded bg-surface-active ml-auto" />
    </td>
  </tr>
);

export const ProblemTable: React.FC<ProblemTableProps> = ({
  problems,
  total,
  page,
  totalPages,
  loading = false,
  onPageChange,
  onStatusChange,
  onToggleStar,
  onOpenNotes,
  onSelectTag,
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
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-surface border-b border-border text-text-muted font-bold uppercase tracking-wider text-[11px] sticky top-0 z-10 transition-colors">
              <th className="py-3 px-4 w-12 text-center">★</th>
              <th className="py-3 px-4 w-20">#</th>
              <th className="py-3 px-4">Title</th>
              <th className="py-3 px-4 w-28">Difficulty</th>
              <th className="py-3 px-4 w-36">Status</th>
              <th className="py-3 px-4 min-w-[220px]">Algorithm Tags</th>
              <th className="py-3 px-4 w-20 text-center">Notes</th>
              <th className="py-3 px-4 w-28 text-right">Links</th>
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
                <td colSpan={8} className="py-20 text-center text-text-subtle">
                  <div className="max-w-xs mx-auto space-y-1.5">
                    <p className="font-semibold text-text-muted text-sm">No problems found</p>
                    <p className="text-xs text-text-subtle">
                      Try clearing filters, searching for a different keyword, or selecting another category.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              problems.map((problem) => {
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
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onToggleStar(problem.id, problem.is_starred)}
                        className="text-text-subtle hover:text-amber-500 transition cursor-pointer"
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
                    <td className="py-3 px-4 font-mono font-semibold text-text-muted tabular-nums">
                      {problem.id}
                    </td>

                    {/* Title */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-text-main group-hover:text-brand transition">
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
                    </td>

                    {/* Difficulty */}
                    <td className="py-3 px-4">
                      <Badge variant={diffVariant}>{problem.difficulty}</Badge>
                    </td>

                    {/* Status Pill */}
                    <td className="py-3 px-4">
                      <StatusPill
                        status={problem.status}
                        onStatusChange={(newStatus) => onStatusChange(problem.id, newStatus)}
                      />
                    </td>

                    {/* Tags */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1.5 max-w-md">
                        {problem.tags.slice(0, 3).map((tag) => {
                          const isSpecial = tag.toLowerCase().includes('shortest');
                          return (
                            <Badge
                              key={tag}
                              variant={isSpecial ? 'medium' : 'tag'}
                              onClick={() => onSelectTag(tag.toLowerCase().replace(/\s+/g, '-'))}
                            >
                              {tag}
                            </Badge>
                          );
                        })}
                        {problem.tags.length > 3 && (
                          <span className="text-[10px] text-text-subtle self-center px-1">
                            +{problem.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Notes Trigger */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onOpenNotes(problem)}
                        className={`p-1.5 rounded-lg border transition cursor-pointer ${
                          hasNotes
                            ? 'bg-amber-100 dark:bg-amber-500/20 border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300'
                            : 'border-transparent text-text-subtle hover:text-text-main hover:bg-surface-hover'
                        }`}
                        title={hasNotes ? 'View/Edit Notes' : 'Add Notes'}
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </td>

                    {/* External Links */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        {problem.leetcode_url && (
                          <a
                            href={problem.leetcode_url}
                            target="_blank"
                            rel="noreferrer"
                            title="Open on LeetCode"
                            className="p-1.5 rounded-lg text-text-subtle hover:text-brand hover:bg-surface-hover transition"
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
                            className="text-[11px] font-bold text-brand hover:text-brand-hover px-2 py-0.5 rounded bg-brand-subtle border border-brand/30 transition"
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
        <div className="py-3 px-6 bg-surface border-t border-border flex items-center justify-between text-xs text-text-muted transition-colors">
          <div>
            Showing <span className="font-bold text-text-main">{(page - 1) * 50 + 1}</span> to{' '}
            <span className="font-bold text-text-main">{Math.min(page * 50, total)}</span> of{' '}
            <span className="font-bold text-text-main">{total}</span> questions
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-border bg-surface disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-hover text-text-main transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-text-main px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-border bg-surface disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-hover text-text-main transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
