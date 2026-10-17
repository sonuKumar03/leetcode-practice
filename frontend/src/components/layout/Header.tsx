import React from 'react';
import { BookOpen, PlusCircle, Moon, Sun, RefreshCw, DownloadCloud, ExternalLink } from 'lucide-react';

interface HeaderProps {
  isDark: boolean;
  toggleDark: () => void;
  onOpenAddModal: () => void;
  onOpenBackupModal: () => void;
  onRefreshData: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isDark,
  toggleDark,
  onOpenAddModal,
  onOpenBackupModal,
  onRefreshData,
  isRefreshing,
}) => {
  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-lg text-gray-900 dark:text-white leading-tight">
                LeetCode Practice Tracker
              </h1>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                SQLite
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Curated from <span className="font-medium text-gray-700 dark:text-gray-300">leetcode.doocs.org</span> & LeetCode
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <a
            href="https://leetcode.doocs.org/en/tags/#tag:k-shortest-paths"
            target="_blank"
            rel="noreferrer"
            className="hidden md:flex items-center space-x-1.5 text-xs text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition"
          >
            <span>Doocs Wiki</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onRefreshData}
            disabled={isRefreshing}
            title="Refresh question catalog"
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          <button
            onClick={onOpenBackupModal}
            title="Export / Import progress backup"
            className="flex items-center space-x-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 transition"
          >
            <DownloadCloud className="w-4 h-4" />
            <span className="hidden sm:inline">Backup</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center space-x-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 px-3.5 py-2 rounded-lg shadow-sm shadow-indigo-600/30 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Question</span>
          </button>

          <button
            onClick={toggleDark}
            aria-label="Toggle theme"
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-600" />}
          </button>
        </div>
      </div>
    </header>
  );
};
