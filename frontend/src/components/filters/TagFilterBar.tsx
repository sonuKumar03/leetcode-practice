import React, { useState } from 'react';
import { Tag as TagIcon, Sparkles, ChevronDown } from 'lucide-react';
import type { Tag } from '../../types';

interface TagFilterBarProps {
  tags: Tag[];
  selectedTag: string;
  onSelectTag: (tagSlug: string) => void;
}

export const TagFilterBar: React.FC<TagFilterBarProps> = ({
  tags,
  selectedTag,
  onSelectTag,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTag, setSearchTag] = useState('');

  // Primary highlight tags
  const spotlightTags = [
    { slug: 'k-shortest-paths', label: 'k-Shortest Paths', highlight: true },
    { slug: 'shortest-path', label: 'Shortest Path' },
    { slug: 'dijkstra', label: 'Dijkstra' },
    { slug: '0-1-bfs', label: '0-1 BFS' },
    { slug: 'bellmanford', label: 'Bellman-Ford' },
    { slug: 'floydwarshall', label: 'Floyd-Warshall' },
    { slug: 'graph', label: 'Graph' },
    { slug: 'dynamic-programming', label: 'Dynamic Programming' },
    { slug: 'breadth-first-search', label: 'Breadth-First Search' },
    { slug: 'depth-first-search', label: 'Depth-First Search' },
  ];

  const filteredDropdownTags = tags.filter((t) =>
    t.name.toLowerCase().includes(searchTag.toLowerCase())
  );

  return (
    <div className="mb-6 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          <TagIcon className="w-3.5 h-3.5" />
          <span>Category & Algorithm Tags</span>
        </div>

        {/* All 178 Tags Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition"
          >
            <span>All Tags ({tags.length})</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 z-40 max-h-80 flex flex-col">
              <input
                type="text"
                placeholder="Search all tags..."
                value={searchTag}
                onChange={(e) => setSearchTag(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white mb-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                autoFocus
              />
              <div className="overflow-y-auto flex-1 divide-y divide-gray-100 dark:divide-gray-700/50">
                <button
                  onClick={() => {
                    onSelectTag('');
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg flex items-center justify-between hover:bg-indigo-50 dark:hover:bg-indigo-950/40 ${
                    selectedTag === '' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span>All Tags</span>
                </button>
                {filteredDropdownTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => {
                      onSelectTag(tag.slug);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg flex items-center justify-between hover:bg-indigo-50 dark:hover:bg-indigo-950/40 ${
                      selectedTag === tag.slug ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="truncate mr-2">{tag.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                      {tag.problem_count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => onSelectTag('')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
            selectedTag === ''
              ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-sm'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
          }`}
        >
          All
        </button>

        {spotlightTags.map((t) => {
          const isSelected = selectedTag === t.slug;
          const isSpecial = t.highlight;

          return (
            <button
              key={t.slug}
              onClick={() => onSelectTag(isSelected ? '' : t.slug)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center space-x-1.5 transition-all ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                  : isSpecial
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {isSpecial && <Sparkles className="w-3.5 h-3.5" />}
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
