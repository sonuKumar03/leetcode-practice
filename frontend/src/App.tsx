import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { ProblemTable } from './components/problems/ProblemTable';
import { AddQuestionModal } from './components/modals/AddQuestionModal';
import { NotesModal } from './components/modals/NotesModal';
import { ExportImportModal } from './components/modals/ExportImportModal';
import { problemsApi } from './api/problemsApi';
import { tagsApi } from './api/tagsApi';
import type { Problem, Tag, Stats, Status, NewProblemPayload } from './types';

export function App() {
  // Main data state
  const [problems, setProblems] = useState<Problem[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters state
  const [selectedTag, setSelectedTag] = useState<string>('');
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

  // Load Metadata (Tags & Stats)
  const loadMetadata = useCallback(async () => {
    try {
      const [fetchedTags, fetchedStats] = await Promise.all([
        tagsApi.getTags(),
        tagsApi.getStats(selectedTag || undefined),
      ]);
      setTags(fetchedTags);
      setStats(fetchedStats);
    } catch (err) {
      console.error('Failed to load metadata:', err);
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

  // Handlers
  const handleSelectTag = (tagSlug: string) => {
    setSelectedTag(tagSlug);
    setPage(1);
  };

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

  const handleAddQuestion = async (payload: NewProblemPayload) => {
    await problemsApi.createProblem(payload);
    await Promise.all([loadMetadata(), loadProblems()]);
  };

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

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await Promise.all([loadMetadata(), loadProblems()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePaidToggle = () => {
    if (paidOnly === undefined) setPaidOnly(false);
    else if (paidOnly === false) setPaidOnly(true);
    else setPaidOnly(undefined);
    setPage(1);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#080B11] text-slate-100 font-sans">
      {/* Sidebar: Navigation, Spotlight, Views, Categories */}
      <Sidebar
        tags={tags}
        selectedTag={selectedTag}
        onSelectTag={handleSelectTag}
        statusFilter={status}
        onSelectStatus={(s) => {
          setStatus(s);
          setPage(1);
        }}
        isStarredFilter={isStarred}
        onToggleStarred={() => {
          setIsStarred(!isStarred);
          setPage(1);
        }}
        stats={stats}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#080B11]">
        {/* Sticky Toolbar & Progress Header */}
        <TopHeader
          stats={stats}
          activeTag={selectedTag}
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
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        {/* Content Table */}
        <main className="flex-1 overflow-y-auto flex flex-col bg-[#080B11]">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
              <p className="text-xs text-slate-500 font-medium">Loading problems...</p>
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
      </div>

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
