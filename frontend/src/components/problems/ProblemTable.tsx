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
  onPageChange: (newPage: number) => void;
  onStatusChange: (id: string, newStatus: Status) => void;
  onToggleStar: (id: string, current: boolean) => void;
  onOpenNotes: (problem: Problem) => void;
  onSelectTag: (tag: string) => void;
}

export const ProblemTable: React.FC<ProblemTableProps> = ({
  problems,
  total,
  page,
  totalPages,
  onPageChange,
  onStatusChange,
  onToggleStar,
  onOpenNotes,
  onSelectTag,
}) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-[#090C15] transition-colors">
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-white dark:bg-[#0D111D] border-b border-slate-200 dark:border-[#1C253B] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px] sticky top-0 z-10 transition-colors">
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
          <tbody className="divide-y divide-slate-200/80 dark:divide-[#171F32]">
            {problems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-20 text-center text-slate-400 dark:text-slate-500">
                  <div className="max-w-xs mx-auto space-y-1.5">
                    <p className="font-semibold text-slate-600 dark:text-slate-400 text-sm">No problems found</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
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
                    className="hover:bg-white dark:hover:bg-[#121828] transition-colors group"
                  >
                    {/* Star */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onToggleStar(problem.id, problem.is_starred)}
                        className="text-slate-300 dark:text-slate-600 hover:text-amber-500 dark:hover:text-amber-400 transition cursor-pointer"
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
                    <td className="py-3 px-4 font-mono font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                      {problem.id}
                    </td>

                    {/* Title */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                          {problem.title}
                        </span>
                        {problem.paid_only && (
                          <span title="Premium Question">
                            <Lock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 inline" />
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
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 self-center px-1">
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
                            : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#161F33]'
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
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-[#161F33] transition"
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
                            className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/20 transition"
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
        <div className="py-3 px-6 bg-white dark:bg-[#0D111D] border-t border-slate-200 dark:border-[#1C253B] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 transition-colors">
          <div>
            Showing <span className="font-bold text-slate-900 dark:text-white">{(page - 1) * 50 + 1}</span> to{' '}
            <span className="font-bold text-slate-900 dark:text-white">{Math.min(page * 50, total)}</span> of{' '}
            <span className="font-bold text-slate-900 dark:text-white">{total}</span> questions
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#25324D] bg-white dark:bg-[#141B2B] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-[#1B243B] text-slate-700 dark:text-slate-300 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-700 dark:text-slate-300 px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#25324D] bg-white dark:bg-[#141B2B] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-[#1B243B] text-slate-700 dark:text-slate-300 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
