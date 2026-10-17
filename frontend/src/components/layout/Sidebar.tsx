import React, { useState } from 'react';
import {
  Code2,
  Sparkles,
  Star,
  Clock,
  CheckCircle2,
  Layers,
  Search,
  Plus,
  DownloadCloud,
  ExternalLink,
  Flame,
} from 'lucide-react';
import type { Tag, Stats } from '../../types';

interface SidebarProps {
  tags: Tag[];
  selectedTag: string;
  onSelectTag: (tagSlug: string) => void;
  statusFilter: string;
  onSelectStatus: (status: string) => void;
  isStarredFilter: boolean;
  onToggleStarred: () => void;
  stats: Stats | null;
  onOpenAddModal: () => void;
  onOpenBackupModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  tags,
  selectedTag,
  onSelectTag,
  statusFilter,
  onSelectStatus,
  isStarredFilter,
  onToggleStarred,
  stats,
  onOpenAddModal,
  onOpenBackupModal,
}) => {
  const [tagSearch, setTagSearch] = useState('');

  // Curated spotlight algorithms
  const spotlightTags = [
    { slug: 'k-shortest-paths', name: 'k-Shortest Paths', isFocus: true },
    { slug: 'shortest-path', name: 'Shortest Path' },
    { slug: 'dijkstra', name: 'Dijkstra' },
    { slug: '0-1-bfs', name: '0-1 BFS' },
    { slug: 'bellmanford', name: 'Bellman-Ford' },
    { slug: 'floydwarshall', name: 'Floyd-Warshall' },
    { slug: 'graph', name: 'Graph' },
    { slug: 'dynamic-programming', name: 'Dynamic Programming' },
    { slug: 'breadth-first-search', name: 'Breadth-First Search' },
    { slug: 'depth-first-search', name: 'Depth-First Search' },
    { slug: 'binary-search', name: 'Binary Search' },
    { slug: 'two-pointers', name: 'Two Pointers' },
  ];

  const filteredTags = tags.filter((t) =>
    t.name.toLowerCase().includes(tagSearch.toLowerCase())
  );

  return (
    <aside className="w-72 bg-[#0C101A] border-r border-[#1B2333] flex flex-col h-screen select-none flex-shrink-0 text-slate-300">
      {/* Brand & App Name */}
      <div className="p-4 border-b border-[#1B2333] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-sm text-white tracking-tight">LeetTracker</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Doocs & LeetCode Practice</p>
          </div>
        </div>
      </div>

      {/* Main Nav Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {/* Quick Views */}
        <div className="space-y-1">
          <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Views
          </div>

          <button
            onClick={() => {
              onSelectTag('');
              onSelectStatus('All');
              if (isStarredFilter) onToggleStarred();
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
              selectedTag === '' && statusFilter === 'All' && !isStarredFilter
                ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-[#151C2C]'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>All Problems</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#161E2E] text-slate-400">
              {stats?.total_problems || 4033}
            </span>
          </button>

          {/* Special Focus: k-Shortest Paths */}
          <button
            onClick={() => {
              onSelectTag('k-shortest-paths');
              onSelectStatus('All');
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
              selectedTag === 'k-shortest-paths'
                ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 font-bold border border-amber-500/40 shadow-sm shadow-amber-500/10'
                : 'text-amber-400/90 hover:text-amber-300 hover:bg-amber-500/10'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="font-semibold">k-Shortest Paths</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
              FOCUS
            </span>
          </button>

          {/* Starred */}
          <button
            onClick={onToggleStarred}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
              isStarredFilter
                ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-[#151C2C]'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400/30" />
              <span>Starred</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#161E2E] text-slate-400">
              {stats?.starred_problems || 0}
            </span>
          </button>

          {/* In Progress */}
          <button
            onClick={() => onSelectStatus(statusFilter === 'in_progress' ? 'All' : 'in_progress')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
              statusFilter === 'in_progress'
                ? 'bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/30'
                : 'text-slate-400 hover:text-white hover:bg-[#151C2C]'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>In Progress</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#161E2E] text-slate-400">
              {stats?.in_progress_problems || 0}
            </span>
          </button>

          {/* Solved */}
          <button
            onClick={() => onSelectStatus(statusFilter === 'solved' ? 'All' : 'solved')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
              statusFilter === 'solved'
                ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-[#151C2C]'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Solved</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#161E2E] text-emerald-400/90 font-bold">
              {stats?.solved_problems || 0}
            </span>
          </button>
        </div>

        {/* Curated Categories */}
        <div className="space-y-1">
          <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1">
            <Flame className="w-3 h-3 text-orange-400" />
            <span>Graph & Algorithms</span>
          </div>
          {spotlightTags
            .filter((t) => !t.isFocus)
            .map((item) => {
              const active = selectedTag === item.slug;
              const matchingTag = tags.find((t) => t.slug === item.slug);
              return (
                <button
                  key={item.slug}
                  onClick={() => onSelectTag(active ? '' : item.slug)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
                    active
                      ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-[#151C2C]'
                  }`}
                >
                  <span className="truncate">{item.name}</span>
                  {matchingTag && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#161E2E] text-slate-400">
                      {matchingTag.problem_count}
                    </span>
                  )}
                </button>
              );
            })}
        </div>

        {/* All Tags Searchable List */}
        <div className="space-y-2 pt-2 border-t border-[#1B2333]">
          <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>All Categories</span>
            <span className="text-slate-500">{tags.length}</span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search all 178 tags..."
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-[#131926] border border-[#212C40] rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="max-h-52 overflow-y-auto space-y-0.5 pr-1">
            {filteredTags.map((t) => {
              const active = selectedTag === t.slug;
              return (
                <button
                  key={t.id}
                  onClick={() => onSelectTag(active ? '' : t.slug)}
                  className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs transition ${
                    active
                      ? 'bg-indigo-600/20 text-indigo-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#151C2C]'
                  }`}
                >
                  <span className="truncate text-left">{t.name}</span>
                  <span className="text-[10px] text-slate-500 ml-1.5 flex-shrink-0">
                    {t.problem_count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-[#1B2333] space-y-2 bg-[#090D15]">
        <button
          onClick={onOpenAddModal}
          className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Problem</span>
        </button>

        <div className="flex items-center space-x-2 pt-1 text-xs">
          <button
            onClick={onOpenBackupModal}
            className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-lg bg-[#151C2C] hover:bg-[#1E293B] text-slate-300 transition text-[11px]"
          >
            <DownloadCloud className="w-3.5 h-3.5" />
            <span>Backup</span>
          </button>

          <a
            href="https://leetcode.doocs.org/en/tags/#tag:k-shortest-paths"
            target="_blank"
            rel="noreferrer"
            className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-lg bg-[#151C2C] hover:bg-[#1E293B] text-slate-300 transition text-[11px]"
          >
            <span>Wiki</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </aside>
  );
};
