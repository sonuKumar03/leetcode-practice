import React from 'react';
import { CheckCircle2, Clock, Star, Target, Sparkles } from 'lucide-react';
import type { Stats } from '../../types';

interface StatsCardsProps {
  stats: Stats | null;
  activeTag: string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, activeTag }) => {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Overall Solved Card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Total Solved
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {stats.solved_problems}
          </span>
          <span className="text-sm text-gray-400">/ {stats.total_problems}</span>
        </div>
        <div className="mt-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, stats.completion_percentage)}%` }}
          />
        </div>
        <div className="mt-2 text-right">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {stats.completion_percentage}% completed
          </span>
        </div>
      </div>

      {/* Active Tag Spotlight Card */}
      <div className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/20 border border-indigo-200/80 dark:border-indigo-800/60 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tag Focus</span>
          </span>
          <span className="px-2 py-0.5 text-[11px] font-semibold bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-md truncate max-w-[120px]">
            {stats.tag_name || activeTag || 'All Problems'}
          </span>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-indigo-950 dark:text-indigo-100">
            {stats.tag_solved !== undefined ? stats.tag_solved : stats.solved_problems}
          </span>
          <span className="text-sm text-indigo-600 dark:text-indigo-400">
            / {stats.tag_total !== undefined ? stats.tag_total : stats.total_problems}
          </span>
        </div>
        <div className="mt-3 w-full bg-indigo-200/60 dark:bg-indigo-900/60 rounded-full h-2 overflow-hidden">
          <div
            className="bg-indigo-600 dark:bg-indigo-400 h-2 rounded-full transition-all duration-500"
            style={{
              width: `${
                stats.tag_total && stats.tag_total > 0
                  ? Math.round(((stats.tag_solved || 0) / stats.tag_total) * 100)
                  : stats.completion_percentage
              }%`,
            }}
          />
        </div>
        <div className="mt-2 text-right text-xs font-semibold text-indigo-700 dark:text-indigo-300">
          {stats.tag_total && stats.tag_total > 0
            ? `${Math.round(((stats.tag_solved || 0) / stats.tag_total) * 100)}% tag master`
            : 'Focus on tagged problems'}
        </div>
      </div>

      {/* Difficulty Breakdown */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Difficulty Distribution
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Easy</span>
            <span className="text-gray-700 dark:text-gray-300 font-medium">{stats.easy_solved} / {stats.easy_total}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-amber-600 dark:text-amber-400">Medium</span>
            <span className="text-gray-700 dark:text-gray-300 font-medium">{stats.medium_solved} / {stats.medium_total}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-rose-600 dark:text-rose-400">Hard</span>
            <span className="text-gray-700 dark:text-gray-300 font-medium">{stats.hard_solved} / {stats.hard_total}</span>
          </div>
        </div>
      </div>

      {/* Activity / Bookmark Card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Workflow Status
          </span>
          <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center space-x-1 text-amber-500 mb-0.5">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold">In Progress</span>
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {stats.in_progress_problems}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center space-x-1 text-amber-400 mb-0.5">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">Starred</span>
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {stats.starred_problems}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
