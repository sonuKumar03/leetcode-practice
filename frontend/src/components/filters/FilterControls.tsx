import React from 'react';
import { Search, SlidersHorizontal, Star, Lock } from 'lucide-react';
import type { Difficulty, Status } from '../../types';

interface FilterControlsProps {
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
}

export const FilterControls: React.FC<FilterControlsProps> = ({
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
}) => {
  const difficulties: ('All' | Difficulty)[] = ['All', 'Easy', 'Medium', 'Hard'];
  const statuses: ('All' | Status)[] = ['All', 'todo', 'in_progress', 'solved'];

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 mb-6 shadow-sm space-y-3">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search problems by ID or title..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
        </div>

        {/* Sort Select */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 text-xs text-gray-500 dark:text-gray-400">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sort:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="text-xs font-medium py-2 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="id_asc">Problem ID (1 → N)</option>
            <option value="id_desc">Problem ID (N → 1)</option>
            <option value="difficulty_asc">Difficulty (Easy → Hard)</option>
            <option value="difficulty_desc">Difficulty (Hard → Easy)</option>
            <option value="title_asc">Title (A → Z)</option>
          </select>
        </div>
      </div>

      {/* Filter Badges Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-gray-800 text-xs">
        {/* Difficulty Selector */}
        <div className="flex items-center space-x-1">
          <span className="text-gray-400 font-medium mr-1.5">Difficulty:</span>
          {difficulties.map((d) => {
            const active = difficulty === d;
            return (
              <button
                key={d}
                onClick={() => onDifficultyChange(d)}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  active
                    ? d === 'Easy'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold'
                      : d === 'Medium'
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold'
                      : d === 'Hard'
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold'
                      : 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-bold'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>

        {/* Status Selector */}
        <div className="flex items-center space-x-1">
          <span className="text-gray-400 font-medium mr-1.5">Status:</span>
          {statuses.map((s) => {
            const active = status === s;
            const labelMap: Record<string, string> = {
              All: 'All',
              todo: 'To Do',
              in_progress: 'In Progress',
              solved: 'Solved',
            };
            return (
              <button
                key={s}
                onClick={() => onStatusChange(s)}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  active
                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {labelMap[s]}
              </button>
            );
          })}
        </div>

        {/* Toggles: Starred & Paid */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleStarred}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg border font-medium transition ${
              isStarred
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-400 text-amber-500' : ''}`} />
            <span>Starred</span>
          </button>

          <button
            onClick={onPaidToggle}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg border font-medium transition ${
              paidOnly === false
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                : paidOnly === true
                ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{paidOnly === false ? 'Free Only' : paidOnly === true ? 'Locked Only' : 'All Access'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
