import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/layout/Header';
import { StatsCards } from './components/dashboard/StatsCards';
import { TagFilterBar } from './components/filters/TagFilterBar';
import { FilterControls } from './components/filters/FilterControls';
import { ProblemTable } from './components/problems/ProblemTable';
import { AddQuestionModal } from './components/modals/AddQuestionModal';
import { NotesModal } from './components/modals/NotesModal';
import { ExportImportModal } from './components/modals/ExportImportModal';
import { problemsApi } from './api/problemsApi';
import { tagsApi } from './api/tagsApi';
import type { Problem, Tag, Stats, Status, NewProblemPayload } from './types';

export function App() {
  // Theme state
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Main data state
  const [problems, setProblems] = useState<Problem[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter & Pagination State
  // Default to 'k-shortest-paths' as requested by the user!
  const [selectedTag, setSelectedTag] = useState<string>('k-shortest-paths');
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('All');
  const [status, setStatus] = useState('All');
  const [isStarred, setIsStarred] = useState(false);
  const [paidOnly, setPaidOnly] = useState<boolean | undefined>(undefined);
  const [sortBy, setSortBy] = useState('id_asc');
  const [page, setPage] = useState(1);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [activeNotesProblem, setActiveNotesProblem] = useState<Problem | null>(null);

  // Load Tags & Stats
  const loadMetadata = useCallback(async () => {
    try {
      const [fetchedTags, fetchedStats] = await Promise.all([
        tagsApi.getTags(),
        tagsApi.getStats(selectedTag || undefined),
      ]);
      setTags(fetchedTags);
      setStats(fetchedStats);
    } catch (err) {
      console.error('Failed to load tags or stats:', err);
    }
  }, [selectedTag]);

  // Load Problems
  const loadProblems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await problemsApi.getProblems({
        tag: selectedTag || undefined,
        search: search.trim() || undefined,
        difficulty,
        status,
        is_starred: isStarred || undefined,
        paid_only: paidOnly,
        sort_by: sortBy,
        page,
        page_size: 50,
      });
      setProblems(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error('Failed to load problems:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedTag, search, difficulty, status, isStarred, paidOnly, sortBy, page]);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  useEffect(() => {
    loadProblems();
  }, [loadProblems]);

  // Handle Tag Selection
  const handleSelectTag = (tagSlug: string) => {
    setSelectedTag(tagSlug);
    setPage(1);
  };

  // Status Change
  const handleStatusChange = async (id: string, newStatus: Status) => {
    setProblems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    );
    try {
      await problemsApi.updateTracking(id, { status: newStatus });
      const updatedStats = await tagsApi.getStats(selectedTag || undefined);
      setStats(updatedStats);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Toggle Star
  const handleToggleStar = async (id: string, current: boolean) => {
    const next = !current;
    setProblems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_starred: next } : p))
    );
    try {
      await problemsApi.updateTracking(id, { is_starred: next });
      const updatedStats = await tagsApi.getStats(selectedTag || undefined);
      setStats(updatedStats);
    } catch (err) {
      console.error('Failed to update star:', err);
    }
  };

  // Save Notes
  const handleSaveNotes = async (id: string, notes: string) => {
    setProblems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, notes } : p))
    );
    try {
      await problemsApi.updateTracking(id, { notes });
    } catch (err) {
      console.error('Failed to save notes:', err);
    }
  };

  // Add Question
  const handleAddQuestion = async (payload: NewProblemPayload) => {
    await problemsApi.createProblem(payload);
    await Promise.all([loadMetadata(), loadProblems()]);
  };

  // Import Tracking
  const handleImportTracking = async (
    items: Array<{ id: string; status: any; is_starred: boolean; notes: string }>
  ) => {
    for (const item of items) {
      await problemsApi.updateTracking(item.id, {
        status: item.status,
        is_starred: item.is_starred,
        notes: item.notes,
      });
    }
    await Promise.all([loadMetadata(), loadProblems()]);
  };

  // Refresh data trigger
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await Promise.all([loadMetadata(), loadProblems()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePaidToggle = () => {
    if (paidOnly === undefined) setPaidOnly(false); // Free only
    else if (paidOnly === false) setPaidOnly(true); // Locked only
    else setPaidOnly(undefined); // All
  };

  return (
    <div className="min-h-screen bg-gray-50/60 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
      <Header
        isDark={isDark}
        toggleDark={() => setIsDark(!isDark)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onRefreshData={handleRefresh}
        isRefreshing={isRefreshing}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">
        {/* Progress & Metric Cards */}
        <StatsCards stats={stats} activeTag={selectedTag} />

        {/* Algorithm Tag Bar */}
        <TagFilterBar
          tags={tags}
          selectedTag={selectedTag}
          onSelectTag={handleSelectTag}
        />

        {/* Filters & Search */}
        <FilterControls
          search={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          difficulty={difficulty}
          onDifficultyChange={(val) => {
            setDifficulty(val);
            setPage(1);
          }}
          status={status}
          onStatusChange={(val) => {
            setStatus(val);
            setPage(1);
          }}
          isStarred={isStarred}
          onToggleStarred={() => {
            setIsStarred(!isStarred);
            setPage(1);
          }}
          paidOnly={paidOnly}
          onPaidToggle={handlePaidToggle}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        {/* Problem List Table */}
        {loading ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center shadow-sm">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-3" />
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Loading problems...</p>
          </div>
        ) : (
          <ProblemTable
            problems={problems}
            total={total}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            onStatusChange={handleStatusChange}
            onToggleStar={handleToggleStar}
            onOpenNotes={(prob) => setActiveNotesProblem(prob)}
            onSelectTag={handleSelectTag}
          />
        )}
      </main>

      {/* Modals */}
      <AddQuestionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddQuestion}
      />

      <NotesModal
        problem={activeNotesProblem}
        isOpen={activeNotesProblem !== null}
        onClose={() => setActiveNotesProblem(null)}
        onSaveNotes={handleSaveNotes}
      />

      <ExportImportModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        problems={problems}
        onImportTracking={handleImportTracking}
      />
    </div>
  );
}

export default App;
