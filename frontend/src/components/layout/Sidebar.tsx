import React, { useState } from 'react';
import {
  Code2,
  Star,
  Layers,
  Search,
  CheckCircle2,
  Clock,
  Database,
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
  const [tagSearch, setTagSearch] = useState('');

  const filteredTags = tags.filter((t) =>
    t.name.toLowerCase().includes(tagSearch.toLowerCase())
  );

  return (
    <aside className="w-64 bg-white dark:bg-[#0A0D18] border-r border-slate-200 dark:border-[#1B2338] flex flex-col h-screen select-none flex-shrink-0 text-slate-600 dark:text-slate-300 transition-colors">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-200 dark:border-[#1B2338] flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/30">
          <Code2 className="w-4 h-4" />
        </div>
        <div>
          <span className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">LeetTracker</span>
        </div>
      </div>

      {/* Top Workspace Views */}
      <div className="p-3 space-y-1 flex-shrink-0">
        <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
          Views
        </div>

        <button
          onClick={() => onSelectView('all')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            activeView === 'all' && selectedTag === ''
              ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#141B2B]'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <span>All Questions</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#131A2A] text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-transparent font-mono">
            {stats?.total_problems || 4033}
          </span>
        </button>

        <button
          onClick={() => onSelectView('starred')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            activeView === 'starred'
              ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#141B2B]'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Star className="w-4 h-4 text-amber-500 dark:text-amber-400 fill-amber-400/20" />
            <span>Starred</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#131A2A] text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-transparent font-mono">
            {stats?.starred_problems || 0}
          </span>
        </button>

        <button
          onClick={() => onSelectView('in_progress')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            activeView === 'in_progress'
              ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#141B2B]'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-sky-500 dark:text-sky-400" />
            <span>In Progress</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#131A2A] text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-transparent font-mono">
            {stats?.in_progress_problems || 0}
          </span>
        </button>

        <button
          onClick={() => onSelectView('solved')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            activeView === 'solved'
              ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#141B2B]'
          }`}
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span>Solved</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#131A2A] text-emerald-600 dark:text-emerald-400 font-bold font-mono">
            {stats?.solved_problems || 0}
          </span>
        </button>
      </div>

      {/* Tags Section: Fills 100% of remaining sidebar space */}
      <div className="flex-1 min-h-0 flex flex-col p-3 pt-3 border-t border-slate-200 dark:border-[#1B2338]">
        <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 flex items-center justify-between flex-shrink-0">
          <span>Categories ({tags.length})</span>
          {selectedTag && (
            <button
              onClick={() => onSelectTag('')}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 text-[10px] font-semibold cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        <div className="mb-2 flex-shrink-0">
          <Input
            placeholder="Search all 178 tags..."
            value={tagSearch}
            onChange={(e) => setTagSearch(e.target.value)}
            icon={<Search className="w-3.5 h-3.5" />}
          />
        </div>

        {/* Scrollable list taking all remaining space */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-0.5">
          {filteredTags.map((t) => {
            const active = selectedTag === t.slug && activeView === 'all';
            return (
              <button
                key={t.id}
                onClick={() => onSelectTag(active ? '' : t.slug)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                  active
                    ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#141B2B]'
                }`}
              >
                <span className="truncate text-left">{t.name}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1.5 flex-shrink-0 font-mono">
                  {t.problem_count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Info Strip */}
      <div className="p-3 border-t border-slate-200 dark:border-[#1B2338] bg-slate-50 dark:bg-[#070A13] flex items-center justify-between text-[11px] text-slate-500 flex-shrink-0">
        <div className="flex items-center space-x-1.5">
          <Database className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span>Local SQLite Catalog</span>
        </div>
        <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">v1.0</span>
      </div>
    </aside>
  );
};
