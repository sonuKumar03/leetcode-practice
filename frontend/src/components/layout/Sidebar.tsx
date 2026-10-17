import React, { useState, useEffect } from 'react';
import {
  Code2,
  Star,
  Layers,
  Search,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import type { Tag, Stats } from '../../types';
import { Input } from '../../design-system/components/Input';

interface SidebarProps {
  tags: Tag[];
  selectedTag: string;
  onSelectTag: (tagSlug: string) => void;
  activeView: 'all' | 'starred' | 'in_progress' | 'solved';
  onSelectView: (view: 'all' | 'starred' | 'in_progress' | 'solved') => void;
  stats: Stats | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  tags,
  selectedTag,
  onSelectTag,
  activeView,
  onSelectView,
  stats,
}) => {
  const [categoryType, setCategoryType] = useState<'topics' | 'companies'>('topics');
  const [tagSearch, setTagSearch] = useState('');

  const topicTags = tags.filter((t) => t.type !== 'company');
  const companyTags = tags.filter((t) => t.type === 'company');

  // Auto-switch to company tab if a company tag is selected externally
  useEffect(() => {
    if (selectedTag) {
      const isCompany = companyTags.some((t) => t.slug === selectedTag);
      if (isCompany) {
        setCategoryType('companies');
      }
    }
  }, [selectedTag, companyTags.length]);

  const currentList = categoryType === 'topics' ? topicTags : companyTags;
  const filteredTags = currentList.filter((t) =>
    t.name.toLowerCase().includes(tagSearch.toLowerCase())
  );

  return (
    <aside className="w-64 bg-sidebar border-r border-border flex flex-col h-screen select-none flex-shrink-0 text-text-muted transition-colors">
      {/* Brand Header */}
      <div className="p-4 border-b border-border flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white shadow-sm shadow-brand/20">
          <Code2 className="w-4 h-4" />
        </div>
        <div>
          <span className="font-bold text-sm text-text-main tracking-tight">LeetTracker</span>
        </div>
      </div>

      {/* Top Workspace Views */}
      <div className="p-3 space-y-1 flex-shrink-0">
        <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-text-subtle mb-1">
          Views
        </div>

        <button
          onClick={() => onSelectView('all')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            activeView === 'all' && selectedTag === ''
              ? 'bg-brand-subtle text-brand font-semibold border border-brand/30'
              : 'text-text-muted hover:text-text-main hover:bg-surface-hover'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-brand" />
            <span>All Questions</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-hover text-text-muted font-mono">
            {stats?.total_problems || 4033}
          </span>
        </button>

        <button
          onClick={() => onSelectView('starred')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            activeView === 'starred'
              ? 'bg-brand-subtle text-brand font-semibold border border-brand/30'
              : 'text-text-muted hover:text-text-main hover:bg-surface-hover'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Star className="w-4 h-4 text-amber-500 dark:text-amber-400 fill-amber-400/20" />
            <span>Starred</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-hover text-text-muted font-mono">
            {stats?.starred_problems || 0}
          </span>
        </button>

        <button
          onClick={() => onSelectView('in_progress')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            activeView === 'in_progress'
              ? 'bg-brand-subtle text-brand font-semibold border border-brand/30'
              : 'text-text-muted hover:text-text-main hover:bg-surface-hover'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-sky-500 dark:text-sky-400" />
            <span>In Progress</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-hover text-text-muted font-mono">
            {stats?.in_progress_problems || 0}
          </span>
        </button>

        <button
          onClick={() => onSelectView('solved')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            activeView === 'solved'
              ? 'bg-brand-subtle text-brand font-semibold border border-brand/30'
              : 'text-text-muted hover:text-text-main hover:bg-surface-hover'
          }`}
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span>Solved</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-hover text-emerald-600 dark:text-emerald-400 font-bold font-mono">
            {stats?.solved_problems || 0}
          </span>
        </button>
      </div>

      {/* Categories & Companies Section: Fills 100% of remaining sidebar space */}
      <div className="flex-1 min-h-0 flex flex-col p-3 pt-3 border-t border-border">
        {/* Section Header */}
        <div className="px-1 text-[10px] font-bold uppercase tracking-wider text-text-subtle mb-2 flex items-center justify-between flex-shrink-0">
          <span>Categories</span>
          {selectedTag && (
            <button
              onClick={() => onSelectTag('')}
              className="text-brand hover:underline text-[10px] font-semibold cursor-pointer"
            >
              Clear Filter
            </button>
          )}
        </div>

        {/* Tab Switcher: Topics vs Companies */}
        <div className="flex items-center p-0.5 bg-surface rounded-lg mb-2 flex-shrink-0 text-[11px] font-semibold border border-border">
          <button
            onClick={() => {
              setCategoryType('topics');
              setTagSearch('');
            }}
            className={`flex-1 py-1 rounded-md transition cursor-pointer text-center ${
              categoryType === 'topics'
                ? 'bg-surface-active text-text-main shadow-xs font-bold'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            Topics ({topicTags.length})
          </button>
          <button
            onClick={() => {
              setCategoryType('companies');
              setTagSearch('');
            }}
            className={`flex-1 py-1 rounded-md transition cursor-pointer text-center ${
              categoryType === 'companies'
                ? 'bg-surface-active text-text-main shadow-xs font-bold'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            Companies ({companyTags.length})
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
            icon={<Search className="w-3.5 h-3.5" />}
          />
        </div>

        {/* Scrollable list taking all remaining space down to bottom */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-0.5 pb-2">
          {filteredTags.length === 0 ? (
            <div className="py-6 text-center text-xs text-text-subtle">
              No {categoryType} found
            </div>
          ) : (
            filteredTags.map((t) => {
              const active = selectedTag === t.slug && activeView === 'all';
              return (
                <button
                  key={t.id}
                  onClick={() => onSelectTag(active ? '' : t.slug)}
                  className={`w-full flex items-center justify-between px-2 py-1 rounded-md text-xs transition cursor-pointer ${
                    active
                      ? 'bg-brand-subtle text-brand font-semibold border border-brand/30'
                      : 'text-text-muted hover:text-text-main hover:bg-surface-hover'
                  }`}
                >
                  <span className="truncate text-left">{t.name}</span>
                  <span className="text-[10px] text-text-subtle ml-1.5 flex-shrink-0 font-mono">
                    {t.problem_count}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
};
