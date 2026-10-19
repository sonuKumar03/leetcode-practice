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
  Menu,
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
  filteredTotal: number;
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
  onOpenSidebar: () => void;
  searchInputRef?: React.Ref<HTMLInputElement>;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  stats,
  activeTag,
  filteredTotal,
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
  onOpenSidebar,
  searchInputRef,
}) => {
  const { theme, toggleTheme } = useTheme();
  const themeLabel = theme === 'dark' ? 'Dark' : 'Light';

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
    <header className="bg-header/90 backdrop-blur-md border-b border-border px-4 sm:px-6 py-3 space-y-3 sticky top-0 z-20 select-none transition-colors">
      {/* Top Level: Focused Title & Global Action Buttons */}
      <div className="flex items-center justify-between gap-4">
        {/* Title & Active Category Indicator */}
        <div className="flex items-center space-x-3 min-w-0">
          <button
            onClick={onOpenSidebar}
            aria-label="Open navigation"
            className="lg:hidden p-1.5 -ml-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-surface-hover cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold text-text-main tracking-tight truncate whitespace-nowrap">
            {activeTag ? (
              <span className="flex items-center space-x-2">
                <span className="text-text-muted font-medium">Category:</span>
                <span className="text-text-main font-bold">{stats?.tag_name || activeTag}</span>
              </span>
            ) : (
              <span>All Questions</span>
            )}
          </h1>
          <span className="hidden sm:inline whitespace-nowrap text-sm text-text-subtle font-mono">
            ({filteredTotal} total)
          </span>
        </div>

        {/* Essential Actions: Progress Bar + Add Question + Backup + Theme Toggle */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          {stats && (
            <>
              {/* Compact mobile progress */}
              <div className="flex lg:hidden items-center space-x-1.5 bg-surface border border-border rounded-lg px-2 py-1 text-xs">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{stats.solved_problems}</span>
                <span className="text-text-subtle">/</span>
                <span className="text-text-main font-semibold">{stats.total_problems}</span>
              </div>
              {/* Full desktop progress */}
              <div className="hidden lg:flex items-center space-x-3 bg-surface border border-border rounded-xl px-3.5 py-1.5 text-sm">
                <span className="text-text-muted font-medium">Solved:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{stats.solved_problems}</span>
                <span className="text-text-subtle">/</span>
                <span className="text-text-main font-semibold">{stats.total_problems}</span>
                <div className="w-20">
                  <ProgressBar value={solvedPct} />
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs font-mono">{solvedPct}%</span>
                <span className="text-border-muted">|</span>
                <div className="flex items-center gap-2 text-xs font-mono font-semibold">
                  <span className="text-emerald-600 dark:text-emerald-400" title="Easy">{stats.easy_solved}/{stats.easy_total} E</span>
                  <span className="text-amber-600 dark:text-amber-400" title="Medium">{stats.medium_solved}/{stats.medium_total} M</span>
                  <span className="text-rose-600 dark:text-rose-400" title="Hard">{stats.hard_solved}/{stats.hard_total} H</span>
                </div>
              </div>
            </>
          )}

          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={onOpenAddModal}
            aria-label="Add question"
          >
            <span className="hidden sm:inline">Add Question</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={<DownloadCloud className="w-3.5 h-3.5" />}
            onClick={onOpenBackupModal}
            aria-label="Backup"
          >
            <span className="hidden sm:inline">Backup</span>
          </Button>

          {/* Theme Toggle Button: dark <-> light */}
          <Button
            variant="secondary"
            size="sm"
            icon={
              theme === 'dark' ? (
                <Moon className="w-3.5 h-3.5 text-brand" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber-500" />
              )
            }
            onClick={toggleTheme}
            title={`Theme: ${themeLabel} (click to toggle)`}
            aria-label={`Theme: ${themeLabel}. Click to toggle`}
            className="md:w-[84px]"
          >
            <span className="hidden md:inline">{themeLabel}</span>
          </Button>
        </div>
      </div>

      {/* Filter Row: Search & Segmented Controls */}
      <div className="flex flex-col 2xl:flex-row 2xl:items-center gap-3">
        {/* Search Input */}
        <div className="w-full 2xl:max-w-xs flex-shrink-0">
          <Input
            ref={searchInputRef}
            placeholder="Search questions by ID or title... (/)"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            icon={<Search className="w-3.5 h-3.5" />}
          />
        </div>

        {/* Segmented Filters */}
        <div className="flex items-center flex-wrap gap-2">
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
                    : 'text-text-subtle'
                }`}
              />
            }
            onClick={onToggleStarred}
          >
            <span className="whitespace-nowrap">Starred</span>
          </Button>

          {/* Access Filter */}
          <Button
            variant={paidOnly !== undefined ? 'primary' : 'secondary'}
            size="sm"
            icon={<Lock className="w-3.5 h-3.5" />}
            onClick={onPaidToggle}
          >
            <span className="whitespace-nowrap">{paidOnly === false ? 'Free only' : paidOnly === true ? 'Premium only' : 'All access'}</span>
          </Button>

          {/* Sort Menu */}
          <div className="flex items-center flex-shrink-0 bg-surface border border-border rounded-xl px-2.5 py-1.5 text-sm text-text-main">
            <SlidersHorizontal className="w-3.5 h-3.5 text-text-subtle mr-1.5" />
            <select
              aria-label="Sort questions"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-transparent text-text-main text-sm focus:outline-none cursor-pointer"
            >
              <option value="frequency_desc" className="bg-surface text-text-main">Frequency (High → Low)</option>
              <option value="id_asc" className="bg-surface text-text-main">ID (1 → N)</option>
              <option value="id_desc" className="bg-surface text-text-main">ID (N → 1)</option>
              <option value="difficulty_asc" className="bg-surface text-text-main">Difficulty (Easy → Hard)</option>
              <option value="difficulty_desc" className="bg-surface text-text-main">Difficulty (Hard → Easy)</option>
              <option value="title_asc" className="bg-surface text-text-main">Title (A → Z)</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
