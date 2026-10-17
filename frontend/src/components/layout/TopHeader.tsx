import React from 'react';
import { Search, SlidersHorizontal, Star, Lock, Sparkles, RefreshCw } from 'lucide-react';
import type { Stats, Difficulty, Status } from '../../types';

interface TopHeaderProps {
  stats: Stats | null;
  activeTag: string;
  search: string;
  onSearchChange: (val: string) => void;
  difficulty: string;
  onDifficultyChange: (val: string) => void;
  status: string;
  onStatusChange: (val: string) => void;
  isStarred: boolean;
  onToggleStarred: () => void;
  paidOnly: boolean | undefined;
  onPaidToggle: () => void;
  sortBy: string;
  onSortChange: (val: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  stats,
  activeTag,
  search,
  onSearchChange,
  difficulty,
  onDifficultyChange,
  status,
  onStatusChange,
  isStarred,
  onToggleStarred,
  paidOnly,
  onPaidToggle,
  sortBy,
  onSortChange,
  onRefresh,
  isRefreshing,
}) => {
  const difficulties: ('All' | Difficulty)[] = ['All', 'Easy', 'Medium', 'Hard'];
  const statuses: ('All' | Status)[] = ['All', 'todo', 'in_progress', 'solved'];

  const statusLabel: Record<string, string> = {
    All: 'All',
    todo: 'To Do',
    in_progress: 'In Progress',
    solved: 'Solved',
  };

  const solvedPct = stats ? stats.completion_percentage : 0;

  return (
    <header className="bg-[#0C101A] border-b border-[#1B2333] px-6 py-3.5 space-y-3 sticky top-0 z-20 backdrop-blur-md">
      {/* Top Row: Title, Tag badge, and Linear-Style Metrics Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
        {/* Left: Active View Name & Tag Pill */}
        <div className="flex items-center space-x-3">
          <h2 className="text-base font-bold text-white tracking-tight">
            {activeTag ? (
              <span className="flex items-center space-x-2">
                <span>Category:</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 font-semibold text-sm">
                  {stats?.tag_name || activeTag}
                </span>
                {activeTag === 'k-shortest-paths' && (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                    <Sparkles className="w-3 h-3" />
                    <span>Focus Tag</span>
                  </span>
                )}
              </span>
            ) : (
              <span>All LeetCode Catalog</span>
            )}
          </h2>

          <button
            onClick={onRefresh}
            title="Refresh from SQLite"
            disabled={isRefreshing}
            className="p-1 text-slate-400 hover:text-white rounded transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>

        {/* Right: Sleek Segmented Metrics Strip */}
        {stats && (
          <div className="flex items-center space-x-4 bg-[#111726] border border-[#1E293B] rounded-xl px-3.5 py-2 text-xs">
            {/* Total & Solved */}
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 font-medium">Solved:</span>
              <span className="text-white font-bold">{stats.solved_problems}</span>
              <span className="text-slate-500">/</span>
              <span className="text-slate-400">{stats.total_problems}</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[11px]">
                {solvedPct}%
              </span>
            </div>

            {/* Micro Progress Bar */}
            <div className="w-24 bg-[#1C2538] h-1.5 rounded-full overflow-hidden hidden sm:block">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, solvedPct)}%` }}
              />
            </div>

            <div className="h-3 w-[1px] bg-[#1E293B] hidden sm:block" />

            {/* Easy / Med / Hard mini pills */}
            <div className="hidden sm:flex items-center space-x-2 text-[11px]">
              <span className="text-emerald-400 font-semibold">
                E: <span className="text-slate-200">{stats.easy_solved}</span>/{stats.easy_total}
              </span>
              <span className="text-amber-400 font-semibold">
                M: <span className="text-slate-200">{stats.medium_solved}</span>/{stats.medium_total}
              </span>
              <span className="text-rose-400 font-semibold">
                H: <span className="text-slate-200">{stats.hard_solved}</span>/{stats.hard_total}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Row: Unified Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search problems by ID, title, or slug..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#111726] border border-[#202B3E] text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
          />
        </div>

        {/* Filter Controls Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Difficulty Segmented Buttons */}
          <div className="flex items-center bg-[#111726] border border-[#202B3E] rounded-lg p-0.5">
            {difficulties.map((d) => {
              const active = difficulty === d;
              return (
                <button
                  key={d}
                  onClick={() => onDifficultyChange(d)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                    active
                      ? d === 'Easy'
                        ? 'bg-emerald-500/25 text-emerald-300 shadow-sm'
                        : d === 'Medium'
                        ? 'bg-amber-500/25 text-amber-300 shadow-sm'
                        : d === 'Hard'
                        ? 'bg-rose-500/25 text-rose-300 shadow-sm'
                        : 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>

          {/* Status Segmented Buttons */}
          <div className="flex items-center bg-[#111726] border border-[#202B3E] rounded-lg p-0.5">
            {statuses.map((s) => {
              const active = status === s;
              return (
                <button
                  key={s}
                  onClick={() => onStatusChange(s)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                    active
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {statusLabel[s]}
                </button>
              );
            })}
          </div>

          {/* Star Toggle */}
          <button
            onClick={onToggleStarred}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${
              isStarred
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-[#111726] border-[#202B3E] text-slate-400 hover:text-white'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>Starred</span>
          </button>

          {/* Access / Locked Toggle */}
          <button
            onClick={onPaidToggle}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${
              paidOnly === false
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : paidOnly === true
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                : 'bg-[#111726] border-[#202B3E] text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{paidOnly === false ? 'Free' : paidOnly === true ? 'Locked' : 'Access'}</span>
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center bg-[#111726] border border-[#202B3E] rounded-lg px-2 py-1 space-x-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer"
            >
              <option value="id_asc" className="bg-[#111726]"># ID (1 → N)</option>
              <option value="id_desc" className="bg-[#111726]"># ID (N → 1)</option>
              <option value="difficulty_asc" className="bg-[#111726]">Difficulty (Easy → Hard)</option>
              <option value="difficulty_desc" className="bg-[#111726]">Difficulty (Hard → Easy)</option>
              <option value="title_asc" className="bg-[#111726]">Title (A → Z)</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
