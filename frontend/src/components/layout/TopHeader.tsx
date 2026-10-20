import React, { useState, useRef, useEffect } from 'react';
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

  Keyboard,
  Check,
  ChevronDown,
  MoreHorizontal,
  FileText,
  LogOut,
} from 'lucide-react';
import type { Stats } from '../../types';
import { Button } from '../../design-system/components/Button';
import { SegmentedControl } from '../../design-system/components/SegmentedControl';
import type { SegmentOption } from '../../design-system/components/SegmentedControl';
import { ProgressBar } from '../../design-system/components/ProgressBar';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

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
  onOpenShortcuts: () => void;
  searchNotes?: boolean;
  onToggleSearchNotes?: () => void;
  searchInputRef?: React.Ref<HTMLInputElement>;
}

const sortOptions = [
  { value: 'frequency_desc', label: 'Frequency (High → Low)' },
  { value: 'frequency_asc', label: 'Frequency (Low → High)' },
  { value: 'id_asc', label: 'ID (1 → N)' },
  { value: 'id_desc', label: 'ID (N → 1)' },
  { value: 'difficulty_asc', label: 'Difficulty (Easy → Hard)' },
  { value: 'difficulty_desc', label: 'Difficulty (Hard → Easy)' },
  { value: 'status_asc', label: 'Status (To Do → Solved)' },
  { value: 'status_desc', label: 'Status (Solved → To Do)' },
  { value: 'title_asc', label: 'Title (A → Z)' },
];

const SortDropdown: React.FC<{ value: string; onChange: (val: string) => void }> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const activeLabel = sortOptions.find((o) => o.value === value)?.label || value;

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 bg-surface border border-border rounded-xl px-2.5 py-1.5 text-sm text-text-main min-w-[220px] hover:bg-surface-hover transition cursor-pointer"
        aria-label="Sort questions"
        aria-expanded={open}
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-text-subtle" />
        <span className="flex-1 text-left truncate">{activeLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-text-subtle transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-64 bg-elevated border border-border rounded-xl shadow-xl py-1 animate-fade-in">
          {sortOptions.map((opt) => {
            const isActive = opt.value === value;
            return (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition cursor-pointer ${
                  isActive
                    ? 'text-brand font-semibold bg-brand-subtle'
                    : 'text-text-muted hover:text-text-main hover:bg-surface-hover'
                }`}
              >
                <Check className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-brand' : 'invisible'}`} />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const OverflowMenu: React.FC<{
  theme: string;
  onToggleTheme: () => void;
  onOpenAddModal: () => void;
  onOpenBackupModal: () => void;
  onOpenShortcuts: () => void;
}> = ({ theme, onToggleTheme, onOpenAddModal, onOpenBackupModal, onOpenShortcuts }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const items = [
    { icon: Plus, label: 'Add Question', action: onOpenAddModal },
    { icon: DownloadCloud, label: 'Backup & Import', action: onOpenBackupModal },
    { icon: Keyboard, label: 'Keyboard Shortcuts', action: onOpenShortcuts, hint: '?' },
    { icon: theme === 'dark' ? Moon : Sun, label: theme === 'dark' ? 'Light Mode' : 'Dark Mode', action: onToggleTheme },
  ];

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-surface text-text-muted hover:text-text-main hover:bg-surface-hover transition cursor-pointer"
        aria-label="More actions"
        aria-expanded={open}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-56 bg-elevated border border-border rounded-xl shadow-xl py-1 animate-fade-in">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => { item.action(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition cursor-pointer text-text-muted hover:text-text-main hover:bg-surface-hover"
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.hint && (
                <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-active border border-border text-text-subtle">
                  {item.hint}
                </kbd>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ProfileMenu: React.FC<{ user: { email: string }; onLogout: () => void }> = ({ user, onLogout }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative flex-shrink-0 pl-2 border-l border-border">
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full bg-brand/20 text-brand font-semibold text-xs flex items-center justify-center uppercase select-none border border-brand/30 hover:border-brand/60 transition cursor-pointer"
        aria-label="User menu"
        aria-expanded={open}
      >
        {user.email.charAt(0)}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-60 bg-elevated border border-border rounded-xl shadow-xl py-1 animate-fade-in">
          <div className="px-3 py-2.5 border-b border-border">
            <p className="text-xs text-text-subtle">Signed in as</p>
            <p className="text-sm text-text-main font-medium truncate">{user.email}</p>
          </div>
          <button
            onClick={() => { onLogout(); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};

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
  onOpenShortcuts,
  searchNotes = false,
  onToggleSearchNotes,
  searchInputRef,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

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
                  <span className="text-text-subtle/40">·</span>
                  <span className="text-amber-600 dark:text-amber-400" title="Medium">{stats.medium_solved}/{stats.medium_total} M</span>
                  <span className="text-text-subtle/40">·</span>
                  <span className="text-rose-600 dark:text-rose-400" title="Hard">{stats.hard_solved}/{stats.hard_total} H</span>
                </div>
              </div>
            </>
          )}

          {/* Overflow Menu: Add Question, Backup, Shortcuts, Theme, Logout */}
          <OverflowMenu
            theme={theme}
            onToggleTheme={toggleTheme}
            onOpenAddModal={onOpenAddModal}
            onOpenBackupModal={onOpenBackupModal}
            onOpenShortcuts={onOpenShortcuts}
          />

          {/* User Profile Avatar with Dropdown */}
          {user && <ProfileMenu user={user} onLogout={logout} />}
        </div>
      </div>

      {/* Filter Row: Search & Segmented Controls */}
      <div className="flex flex-col 2xl:flex-row 2xl:items-center gap-3">
        {/* Search Input */}
        <div className="w-full 2xl:max-w-xs flex-shrink-0">
          <div className="relative w-full">
            {/* Search icon */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle pointer-events-none">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              ref={searchInputRef}
              placeholder={searchNotes ? "Search titles + notes... (/)" : "Search by ID or title... (/)"}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full py-2 pl-9 pr-20 text-sm bg-surface border border-border rounded-xl text-text-main placeholder-text-subtle focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
            />
            {/* Notes toggle inside the input */}
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 group flex items-center">
              <button
                role="switch"
                onClick={onToggleSearchNotes}
                aria-checked={searchNotes}
                aria-label="Toggle notes search"
                className={`relative w-14 h-7 rounded-full transition-colors duration-200 cursor-pointer ${
                  searchNotes ? 'bg-brand/30' : 'bg-surface-active'
                }`}
              >
                <span
                  className={`absolute top-0.5 flex items-center justify-center w-6 h-6 rounded-full shadow-sm transition-all duration-200 ${
                    searchNotes
                      ? 'left-[30px] bg-brand text-white'
                      : 'left-0.5 bg-elevated text-text-muted'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                </span>
              </button>
              <div className="absolute bottom-full right-0 mb-2 px-2.5 py-1.5 text-xs rounded-lg bg-elevated border border-border shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 text-text-main z-50">
                {searchNotes ? 'Searching titles + notes' : 'Include notes in search'}
                <div className="absolute top-full right-3 -mt-px border-4 border-transparent border-t-border" />
              </div>
            </div>
          </div>
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
          <SortDropdown value={sortBy} onChange={onSortChange} />
        </div>
      </div>
    </header>
  );
};
