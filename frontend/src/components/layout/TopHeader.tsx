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
    <header className="bg-header/90 backdrop-blur-md border-b border-border px-6 py-3.5 space-y-3 sticky top-0 z-20 select-none transition-colors">
      {/* Top Level: Focused Title & Global Action Buttons */}
      <div className="flex items-center justify-between gap-4">
        {/* Title & Active Category Indicator */}
        <div className="flex items-center space-x-3">
          <h1 className="text-base font-bold text-text-main tracking-tight">
            {activeTag ? (
              <span className="flex items-center space-x-2">
                <span className="text-text-muted font-medium">Category:</span>
                <span className="text-text-main font-bold">{stats?.tag_name || activeTag}</span>
              </span>
            ) : (
              <span>All Questions</span>
            )}
          </h1>
          <span className="text-sm text-text-subtle font-mono">
            ({stats?.total_problems || 0} total)
          </span>
        </div>

        {/* Essential Actions: Progress Bar + Add Question + Backup + Theme Toggle */}
        <div className="flex items-center space-x-2.5">
          {stats && (
            <div className="hidden lg:flex items-center space-x-3 bg-surface border border-border rounded-xl px-3.5 py-1.5 text-sm">
              <span className="text-text-muted font-medium">Solved:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{stats.solved_problems}</span>
              <span className="text-text-subtle">/</span>
              <span className="text-text-main font-semibold">{stats.total_problems}</span>
              <div className="w-20">
                <ProgressBar value={solvedPct} color="#10B981" />
              </div>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs font-mono">{solvedPct}%</span>
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
                <Moon className="w-3.5 h-3.5 text-brand" />
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
                    : 'text-text-subtle'
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
          <div className="flex items-center bg-surface border border-border rounded-xl px-2.5 py-1.5 text-sm text-text-main">
            <SlidersHorizontal className="w-3.5 h-3.5 text-text-subtle mr-1.5" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-transparent text-text-main text-sm focus:outline-none cursor-pointer"
            >
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
