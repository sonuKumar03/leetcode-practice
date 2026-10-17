import React from 'react';
import { Star, FileText, ExternalLink, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Problem, Status } from '../../types';
import { StatusPill } from './StatusPill';

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
  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Medium':
        return 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'Hard':
        return 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden mb-8">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50/80 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
              <th className="py-3 px-4 w-12 text-center">★</th>
              <th className="py-3 px-4 w-20">#</th>
              <th className="py-3 px-4">Title</th>
              <th className="py-3 px-4 w-28">Difficulty</th>
              <th className="py-3 px-4 w-36">Status</th>
              <th className="py-3 px-4 min-w-[200px]">Tags</th>
              <th className="py-3 px-4 w-24 text-center">Notes</th>
              <th className="py-3 px-4 w-28 text-right">Links</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {problems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400 dark:text-gray-500">
                  No problems found matching your current filters.
                </td>
              </tr>
            ) : (
              problems.map((problem) => {
                const hasNotes = problem.notes && problem.notes.trim().length > 0;
                return (
                  <tr
                    key={problem.id}
                    className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors group"
                  >
                    {/* Star */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onToggleStar(problem.id, problem.is_starred)}
                        className="text-gray-300 dark:text-gray-600 hover:text-amber-400 transition"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            problem.is_starred ? 'fill-amber-400 text-amber-500' : ''
                          }`}
                        />
                      </button>
                    </td>

                    {/* Problem ID */}
                    <td className="py-3 px-4 font-mono font-medium text-gray-600 dark:text-gray-400">
                      {problem.id}
                    </td>

                    {/* Title */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                          {problem.title}
                        </span>
                        {problem.paid_only && (
                          <span title="Premium Problem">
                            <Lock className="w-3.5 h-3.5 text-amber-500 inline" />
                          </span>
                        )}
                        {problem.source === 'custom' && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                            Custom
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Difficulty */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getDifficultyBadge(
                          problem.difficulty
                        )}`}
                      >
                        {problem.difficulty}
                      </span>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3 px-4">
                      <StatusPill
                        status={problem.status}
                        onStatusChange={(newStatus) => onStatusChange(problem.id, newStatus)}
                      />
                    </td>

                    {/* Tags */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-sm">
                        {problem.tags.slice(0, 3).map((tag) => (
                          <button
                            key={tag}
                            onClick={() => onSelectTag(tag.toLowerCase().replace(/\s+/g, '-'))}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                              tag.toLowerCase().includes('shortest')
                                ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                        {problem.tags.length > 3 && (
                          <span className="text-[10px] text-gray-400 self-center">
                            +{problem.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Notes Button */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onOpenNotes(problem)}
                        className={`p-1.5 rounded-lg border transition ${
                          hasNotes
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400'
                            : 'border-transparent text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300'
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
                            title="Open in LeetCode"
                            className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition"
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
                            className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
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

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="py-3 px-4 bg-gray-50/50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div>
            Showing <span className="font-semibold text-gray-900 dark:text-white">{(page - 1) * 50 + 1}</span> to{' '}
            <span className="font-semibold text-gray-900 dark:text-white">
              {Math.min(page * 50, total)}
            </span>{' '}
            of <span className="font-semibold text-gray-900 dark:text-white">{total}</span> problems
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
