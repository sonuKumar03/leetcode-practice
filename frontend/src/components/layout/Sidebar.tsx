import React, { useState } from 'react';
import {
  Code2,
  Star,
  Layers,
  Search,
  Flame,
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
  const [tagSearch, setTagSearch] = useState('');

  // Curated spotlight algorithms
  const spotlightTags = [
    { slug: 'k-shortest-paths', name: 'k-Shortest Paths' },
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
    <aside className="w-64 bg-[#0A0D18] border-r border-[#1B2338] flex flex-col h-screen select-none flex-shrink-0 text-slate-300">
      {/* Brand */}
      <div className="p-4 border-b border-[#1B2338] flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/30">
          <Code2 className="w-4 h-4" />
        </div>
        <span className="font-bold text-sm text-white tracking-tight">LeetTracker</span>
      </div>

      {/* Main Nav Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {/* Practice Lists (Single Mutually-Exclusive Active State) */}
        <div className="space-y-1">
          <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            My Workspace
          </div>

          <button
            onClick={() => onSelectView('all')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeView === 'all' && selectedTag === ''
                ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-[#141B2B]'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>All Questions</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#131A2A] text-slate-400">
              {stats?.total_problems || 4033}
            </span>
          </button>

          <button
            onClick={() => onSelectView('starred')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeView === 'starred'
                ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-[#141B2B]'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              <span>Starred</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#131A2A] text-slate-400">
              {stats?.starred_problems || 0}
            </span>
          </button>

          <button
            onClick={() => onSelectView('in_progress')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeView === 'in_progress'
                ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-[#141B2B]'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>In Progress</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#131A2A] text-slate-400">
              {stats?.in_progress_problems || 0}
            </span>
          </button>

          <button
            onClick={() => onSelectView('solved')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeView === 'solved'
                ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-[#141B2B]'
            }`}
          >
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Solved</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#131A2A] text-emerald-400 font-bold">
              {stats?.solved_problems || 0}
            </span>
          </button>
        </div>

        {/* Categories Section */}
        <div className="space-y-1">
          <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center space-x-1">
            <Flame className="w-3 h-3 text-orange-400" />
            <span>Key Algorithms</span>
          </div>

          {spotlightTags.map((item) => {
            const active = selectedTag === item.slug && activeView === 'all';
            const matchingTag = tags.find((t) => t.slug === item.slug);
            return (
              <button
                key={item.slug}
                onClick={() => onSelectTag(active ? '' : item.slug)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                  active
                    ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-[#141B2B]'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <span className="truncate">{item.name}</span>
                </div>
                {matchingTag && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#131A2A] text-slate-400 ml-1.5 flex-shrink-0">
                    {matchingTag.problem_count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search All Tags */}
        <div className="space-y-2 pt-2 border-t border-[#1B2338]">
          <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>All Tags ({tags.length})</span>
          </div>

          <Input
            placeholder="Search tags..."
            value={tagSearch}
            onChange={(e) => setTagSearch(e.target.value)}
            icon={<Search className="w-3 h-3" />}
          />

          <div className="max-h-56 overflow-y-auto space-y-0.5 pr-1">
            {filteredTags.map((t) => {
              const active = selectedTag === t.slug && activeView === 'all';
              return (
                <button
                  key={t.id}
                  onClick={() => onSelectTag(active ? '' : t.slug)}
                  className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs transition cursor-pointer ${
                    active
                      ? 'bg-indigo-600/20 text-indigo-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#141B2B]'
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
    </aside>
  );
};
