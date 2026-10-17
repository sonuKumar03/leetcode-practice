import React from 'react';
import {
  Search,
  SlidersHorizontal,
  Star,
  Lock,
  Plus,
  DownloadCloud,
  Sun,
  Moon,
} from 'lucide-react';
import type { Stats } from '../../types';
import { Button } from '../../design-system/components/Button';
import { Input } from '../../design-system/components/Input';
import { SegmentedControl } from '../../design-system/components/SegmentedControl';
import type { SegmentOption } from '../../design-system/components/SegmentedControl';
import { ProgressBar } from '../../design-system/components/ProgressBar';
import { useTheme } from '../../context/ThemeContext';

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
  onOpenAddModal: () => void;
  onOpenBackupModal: () => void;
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
  onOpenAddModal,
  onOpenBackupModal,
}) => {
  const { theme, toggleTheme } = useTheme();

  const difficultyOptions: SegmentOption<string>[] = [
    { value: 'All', label: 'All' },
    { value: 'Easy', label: 'Easy', variant: 'easy' },
    { value: 'Medium', label: 'Medium', variant: 'medium' },
    { value: 'Hard', label: 'Hard', variant: 'hard' },
  ];

  const statusOptions: SegmentOption<string>[] = [
    { value: 'All', label: 'All' },
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'solved', label: 'Solved' },
  ];

  const solvedPct = stats ? stats.completion_percentage : 0;

  return (
    <header className="bg-white dark:bg-[#0C101B] border-b border-slate-200 dark:border-[#1B2438] px-6 py-3.5 space-y-3 sticky top-0 z-20 select-none transition-colors">
      {/* Top Level: Focused Title & Global Action Buttons */}
      <div className="flex items-center justify-between gap-4">
        {/* Title & Active Category Indicator */}
        <div className="flex items-center space-x-3">
          <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            {activeTag ? (
              <span className="flex items-center space-x-2">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Category:</span>
                <span className="text-slate-900 dark:text-white font-bold">{stats?.tag_name || activeTag}</span>
              </span>
            ) : (
              <span>All Questions</span>
            )}
          </h1>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            ({stats?.total_problems || 0} total)
          </span>
        </div>

        {/* Essential Actions: Progress Bar + Add Question + Backup + Theme Toggle */}
        <div className="flex items-center space-x-2.5">
          {stats && (
            <div className="hidden lg:flex items-center space-x-3 bg-slate-50 dark:bg-[#111728] border border-slate-200 dark:border-[#212C42] rounded-xl px-3 py-1.5 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Solved:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{stats.solved_problems}</span>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="text-slate-700 dark:text-slate-300">{stats.total_problems}</span>
              <div className="w-20">
                <ProgressBar value={solvedPct} color="#10B981" />
              </div>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">{solvedPct}%</span>
            </div>
          )}

          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={onOpenAddModal}
          >
            Add Question
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={<DownloadCloud className="w-3.5 h-3.5" />}
            onClick={onOpenBackupModal}
          >
            Backup
          </Button>

          {/* Theme Toggle Button */}
          <Button
            variant="secondary"
            size="sm"
            icon={
              theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
              )
            }
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? 'Light' : 'Dark'}
          </Button>
        </div>
      </div>

      {/* Filter Row: Search & Segmented Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Search Input */}
        <div className="flex-1 min-w-[220px] max-w-sm">
          <Input
            placeholder="Search questions by ID or title... (/)"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            icon={<Search className="w-3.5 h-3.5" />}
          />
        </div>

        {/* Segmented Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Difficulty Segment */}
          <SegmentedControl
            options={difficultyOptions}
            value={difficulty}
            onChange={onDifficultyChange}
          />

          {/* Status Segment */}
          <SegmentedControl
            options={statusOptions}
            value={status}
            onChange={onStatusChange}
          />

          {/* Starred Filter */}
          <Button
            variant={isStarred ? 'primary' : 'secondary'}
            size="sm"
            icon={
              <Star
                className={`w-3.5 h-3.5 ${
                  isStarred
                    ? 'fill-amber-300 text-amber-300'
                    : 'text-slate-400'
                }`}
              />
            }
            onClick={onToggleStarred}
          >
            Starred
          </Button>

          {/* Access Filter */}
          <Button
            variant={paidOnly !== undefined ? 'primary' : 'secondary'}
            size="sm"
            icon={<Lock className="w-3.5 h-3.5" />}
            onClick={onPaidToggle}
          >
            {paidOnly === false ? 'Free' : paidOnly === true ? 'Locked' : 'Access'}
          </Button>

          {/* Sort Menu */}
          <div className="flex items-center bg-slate-50 dark:bg-[#111728] border border-slate-200 dark:border-[#212C42] rounded-xl px-2 py-1 text-xs text-slate-700 dark:text-slate-300">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 mr-1.5" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-transparent text-slate-700 dark:text-slate-300 text-xs focus:outline-none cursor-pointer"
            >
              <option value="id_asc" className="bg-white dark:bg-[#111728] text-slate-900 dark:text-slate-100">ID (1 → N)</option>
              <option value="id_desc" className="bg-white dark:bg-[#111728] text-slate-900 dark:text-slate-100">ID (N → 1)</option>
              <option value="difficulty_asc" className="bg-white dark:bg-[#111728] text-slate-900 dark:text-slate-100">Difficulty (Easy → Hard)</option>
              <option value="difficulty_desc" className="bg-white dark:bg-[#111728] text-slate-900 dark:text-slate-100">Difficulty (Hard → Easy)</option>
              <option value="title_asc" className="bg-white dark:bg-[#111728] text-slate-900 dark:text-slate-100">Title (A → Z)</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
