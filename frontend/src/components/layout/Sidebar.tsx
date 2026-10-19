import React, { useState, useEffect, useMemo } from 'react';
import {
  Code2,
  Star,
  Layers,
  Search,
  CheckCircle2,
  Clock,
  History,
} from 'lucide-react';
import type { Tag, Stats } from '../../types';
import { Input } from '../../design-system/components/Input';

interface SidebarProps {
  tags: Tag[];
  selectedTag: string;
  onSelectTag: (tagSlug: string) => void;
  activeView: 'all' | 'starred' | 'in_progress' | 'solved' | 'recent';
  onSelectView: (view: 'all' | 'starred' | 'in_progress' | 'solved' | 'recent') => void;
  stats: Stats | null;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  tags,
  selectedTag,
  onSelectTag,
  activeView,
  onSelectView,
  stats,
  isOpen,
  onClose,
}) => {
  const [categoryType, setCategoryType] = useState<'topics' | 'companies'>('topics');
  const [tagSearch, setTagSearch] = useState('');

  const topicTags = useMemo(() => tags.filter((t) => t.type !== 'company').sort((a, b) => b.problem_count - a.problem_count), [tags]);
  const companyTags = useMemo(() => tags.filter((t) => t.type === 'company').sort((a, b) => b.problem_count - a.problem_count), [tags]);

  // Auto-switch to company tab if a company tag is selected externally
  useEffect(() => {
    if (selectedTag) {
      const isCompany = companyTags.some((t) => t.slug === selectedTag);
      if (isCompany) {
        setCategoryType('companies');
      }
    }
  }, [selectedTag, companyTags]);

  const currentList = categoryType === 'topics' ? topicTags : companyTags;
  const filteredTags = useMemo(() => {
    const query = tagSearch.trim().toLowerCase();
    if (!query) return currentList;
    return currentList.filter((t) => t.name.toLowerCase().includes(query));
  }, [currentList, tagSearch]);

  return (
    <>
    {isOpen && (
      <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onClose} aria-hidden="true" />
    )}
    <aside
      className={`w-72 bg-sidebar border-r border-border flex flex-col h-screen select-none flex-shrink-0 text-text-muted transition-transform duration-200 fixed inset-y-0 left-0 z-40 lg:static lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-border flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-brand-fg shadow-sm shadow-brand/20">
          <Code2 className="w-4 h-4" />
        </div>
        <div>
          <span className="font-bold text-base text-text-main tracking-tight">LeetTracker</span>
        </div>
      </div>

      {/* Top Workspace Views */}
      <div className="p-3 space-y-1 flex-shrink-0">
        <div className="px-2 text-xs font-semibold text-text-subtle mb-1.5">
          Views
        </div>

        <button
          onClick={() => { onClose(); onSelectView('all'); }}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
            activeView === 'all' && selectedTag === ''
              ? 'bg-brand-subtle text-brand font-semibold border border-brand/30'
              : 'text-text-muted hover:text-text-main hover:bg-surface-hover border border-transparent'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <Layers className="w-4 h-4 text-brand" />
            <span>All Questions</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-surface-hover text-text-muted font-mono">
            {stats?.total_problems ?? 0}
          </span>
        </button>

        <button
          onClick={() => { onClose(); onSelectView('starred'); }}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
            activeView === 'starred'
              ? 'bg-brand-subtle text-brand font-semibold border border-brand/30'
              : 'text-text-muted hover:text-text-main hover:bg-surface-hover border border-transparent'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <Star className="w-4 h-4 text-amber-500 dark:text-amber-400 fill-amber-400/20" />
            <span>Starred</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-surface-hover text-text-muted font-mono">
            {stats?.starred_problems || 0}
          </span>
        </button>

        <button
          onClick={() => { onClose(); onSelectView('in_progress'); }}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
            activeView === 'in_progress'
              ? 'bg-brand-subtle text-brand font-semibold border border-brand/30'
              : 'text-text-muted hover:text-text-main hover:bg-surface-hover border border-transparent'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <Clock className="w-4 h-4 text-sky-500 dark:text-sky-400" />
            <span>In Progress</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-surface-hover text-text-muted font-mono">
            {stats?.in_progress_problems || 0}
          </span>
        </button>

        <button
          onClick={() => { onClose(); onSelectView('solved'); }}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
            activeView === 'solved'
              ? 'bg-brand-subtle text-brand font-semibold border border-brand/30'
              : 'text-text-muted hover:text-text-main hover:bg-surface-hover border border-transparent'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span>Solved</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-surface-hover text-emerald-600 dark:text-emerald-400 font-bold font-mono">
            {stats?.solved_problems || 0}
          </span>
        </button>

        <button
          onClick={() => { onClose(); onSelectView('recent'); }}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
            activeView === 'recent'
              ? 'bg-brand-subtle text-brand font-semibold border border-brand/30'
              : 'text-text-muted hover:text-text-main hover:bg-surface-hover border border-transparent'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <History className="w-4 h-4 text-violet-500 dark:text-violet-400" />
            <span>Recent</span>
          </div>
        </button>
      </div>

      {/* Categories & Companies Section: Fills 100% of remaining sidebar space */}
      <div className="flex-1 min-h-0 flex flex-col p-3 pt-3 border-t border-border">
        {/* Section Header */}
        <div className="px-1 text-xs font-semibold text-text-subtle mb-2 flex items-center justify-between flex-shrink-0">
          <span>Categories</span>
          {selectedTag && (
            <button
              onClick={() => onSelectTag('')}
              className="text-brand hover:underline text-xs font-semibold cursor-pointer"
            >
              Clear Filter
            </button>
          )}
        </div>

        {/* Tab Switcher: Topics vs Companies */}
        <div className="flex items-center p-1 bg-surface-hover/80 dark:bg-surface/80 rounded-xl mb-2.5 flex-shrink-0 text-xs border border-border/50">
          <button
            onClick={() => {
              setCategoryType('topics');
              setTagSearch('');
            }}
            className={`flex-1 flex items-center justify-center py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
              categoryType === 'topics'
                ? 'bg-white dark:bg-surface-active text-text-main shadow-xs font-semibold'
                : 'text-text-muted hover:text-text-main font-medium'
            }`}
          >
            <span>Topics</span>
            <span
              className={`ml-1.5 px-1.5 py-0.5 rounded-md text-[11px] font-mono leading-none transition-colors ${
                categoryType === 'topics'
                  ? 'bg-brand-subtle text-brand font-semibold'
                  : 'bg-black/5 dark:bg-white/10 text-text-muted'
              }`}
            >
              {topicTags.length}
            </span>
          </button>
          <button
            onClick={() => {
              setCategoryType('companies');
              setTagSearch('');
            }}
            className={`flex-1 flex items-center justify-center py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
              categoryType === 'companies'
                ? 'bg-white dark:bg-surface-active text-text-main shadow-xs font-semibold'
                : 'text-text-muted hover:text-text-main font-medium'
            }`}
          >
            <span>Companies</span>
            <span
              className={`ml-1.5 px-1.5 py-0.5 rounded-md text-[11px] font-mono leading-none transition-colors ${
                categoryType === 'companies'
                  ? 'bg-brand-subtle text-brand font-semibold'
                  : 'bg-black/5 dark:bg-white/10 text-text-muted'
              }`}
            >
              {companyTags.length}
            </span>
          </button>
        </div>

        {/* Search within active category list */}
        <div className="mb-2 flex-shrink-0">
          <Input
            placeholder={
              categoryType === 'topics'
                ? `Search ${topicTags.length} topics...`
                : `Search ${companyTags.length} companies...`
            }
            value={tagSearch}
            onChange={(e) => setTagSearch(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>

        {/* Scrollable list taking all remaining space down to bottom */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-0.5 pb-2">
          {filteredTags.length === 0 ? (
            <div className="py-6 text-center text-sm text-text-subtle">
              No {categoryType} found
            </div>
          ) : (
            filteredTags.map((t) => {
              const active = selectedTag === t.slug && activeView === 'all';
              return (
                <button
                  key={t.id}
                  onClick={() => { onClose(); onSelectTag(active ? '' : t.slug); }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[13px] transition cursor-pointer ${
                    active
                      ? 'bg-brand-subtle text-brand font-semibold border border-brand/30'
                      : 'text-text-muted hover:text-text-main hover:bg-surface-hover border border-transparent'
                  }`}
                >
                  <span className="truncate text-left">{t.name}</span>
                  <span className="text-xs text-text-subtle ml-1.5 flex-shrink-0 font-mono">
                    {t.problem_count}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </aside>
    </>
  );
};
