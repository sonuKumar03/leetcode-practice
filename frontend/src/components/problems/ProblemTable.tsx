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
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Hard':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080B11]">
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#0C101A] border-b border-[#1B2333] text-slate-400 font-bold uppercase tracking-wider text-[11px] sticky top-0 z-10">
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
          <tbody className="divide-y divide-[#171F2F]">
            {problems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-20 text-center text-slate-500">
                  <div className="max-w-xs mx-auto space-y-2">
                    <p className="font-semibold text-slate-400 text-sm">No problems found</p>
                    <p className="text-xs text-slate-500">
                      Try clearing filters, searching for a different keyword, or selecting another category.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              problems.map((problem) => {
                const hasNotes = problem.notes && problem.notes.trim().length > 0;
                return (
                  <tr
                    key={problem.id}
                    className="hover:bg-[#111726] transition-colors group"
                  >
                    {/* Star */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onToggleStar(problem.id, problem.is_starred)}
                        className="text-slate-600 hover:text-amber-400 transition"
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
                    <td className="py-3 px-4 font-mono font-semibold text-slate-400 tabular-nums">
                      {problem.id}
                    </td>

                    {/* Title */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-200 group-hover:text-indigo-400 transition">
                          {problem.title}
                        </span>
                        {problem.paid_only && (
                          <span title="Premium Question">
                            <Lock className="w-3.5 h-3.5 text-amber-400 inline" />
                          </span>
                        )}
                        {problem.source === 'custom' && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
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
                            <button
                              key={tag}
                              onClick={() => onSelectTag(tag.toLowerCase().replace(/\s+/g, '-'))}
                              className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                                isSpecial
                                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
                                  : 'bg-[#151D2C] text-slate-400 border border-[#212C3F] hover:text-white hover:bg-[#1E293B]'
                              }`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                        {problem.tags.length > 3 && (
                          <span className="text-[10px] text-slate-500 self-center px-1">
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
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                            : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-[#161E2E]'
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
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-[#161E2E] transition"
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
                            className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition"
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
        <div className="py-3 px-6 bg-[#0C101A] border-t border-[#1B2333] flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <span className="font-bold text-white">{(page - 1) * 50 + 1}</span> to{' '}
            <span className="font-bold text-white">{Math.min(page * 50, total)}</span> of{' '}
            <span className="font-bold text-white">{total}</span> questions
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-[#212C40] bg-[#131926] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1C2538] text-slate-300 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-300 px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-[#212C40] bg-[#131926] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1C2538] text-slate-300 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
