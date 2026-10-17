import { useState, useEffect, useCallback, useRef } from 'react';
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
  const mainRef = useRef<HTMLElement>(null);

  // Main data state
  const [problems, setProblems] = useState<Problem[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Mutually exclusive view or category
  const [activeView, setActiveView] = useState<'all' | 'starred' | 'in_progress' | 'solved'>('all');
  const [selectedTag, setSelectedTag] = useState<string>('');

  // Top header filters
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

  // Compute effective query filters from activeView and local toggles
  const effectiveStatus = activeView === 'solved' ? 'solved' : activeView === 'in_progress' ? 'in_progress' : status;
  const effectiveStarred = activeView === 'starred' ? true : isStarred;

  // Load canonical tags (cached, only on mount or updates)
  const loadTags = useCallback(async () => {
    try {
      const fetchedTags = await tagsApi.getTags();
      setTags(fetchedTags);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  }, []);

  // Load stats (updates when selectedTag changes)
  const loadStats = useCallback(async () => {
    try {
      const fetchedStats = await tagsApi.getStats(selectedTag || undefined);
      setStats(fetchedStats);
    } catch (err) {
      console.error('Failed to load stats:', err);
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
        status: effectiveStatus,
        is_starred: effectiveStarred || undefined,
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
  }, [selectedTag, search, difficulty, effectiveStatus, effectiveStarred, paidOnly, sortBy, page]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadProblems();
  }, [loadProblems]);

  // Navigation Handlers with smooth scroll reset
  const handleSelectView = (view: 'all' | 'starred' | 'in_progress' | 'solved') => {
    setActiveView(view);
    setSelectedTag('');
    setPage(1);
    mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleSelectTag = (tagSlug: string) => {
    setSelectedTag(tagSlug);
    setActiveView('all');
    setPage(1);
    mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleStatusChange = async (id: string, newStatus: Status) => {
    setProblems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    );
    try {
      await problemsApi.updateTracking(id, { status: newStatus });
      loadStats();
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
      loadStats();
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
    await Promise.all([loadTags(), loadStats(), loadProblems()]);
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
    await Promise.all([loadTags(), loadStats(), loadProblems()]);
  };

  const handlePaidToggle = () => {
    if (paidOnly === undefined) setPaidOnly(false);
    else if (paidOnly === false) setPaidOnly(true);
    else setPaidOnly(undefined);
    setPage(1);
    mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas text-text-main font-sans transition-colors">
      {/* Sidebar: Mutually Exclusive Single Active Item */}
      <Sidebar
        tags={tags}
        selectedTag={selectedTag}
        onSelectTag={handleSelectTag}
        activeView={activeView}
        onSelectView={handleSelectView}
        stats={stats}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-canvas">
        {/* Sticky Toolbar & Progress Header */}
        <TopHeader
          stats={stats}
          activeTag={selectedTag}
          search={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
            mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
          }}
          difficulty={difficulty}
          onDifficultyChange={(val) => {
            setDifficulty(val);
            setPage(1);
            mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
          }}
          status={status}
          onStatusChange={(val) => {
            setStatus(val);
            setPage(1);
            mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
          }}
          isStarred={isStarred}
          onToggleStarred={() => {
            setIsStarred(!isStarred);
            setPage(1);
            mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
          }}
          paidOnly={paidOnly}
          onPaidToggle={handlePaidToggle}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenBackupModal={() => setIsBackupModalOpen(true)}
        />

        {/* Content Table: Always mounted so layout NEVER jumps */}
        <main ref={mainRef} className="flex-1 overflow-y-auto flex flex-col bg-canvas">
          <ProblemTable
            problems={problems}
            total={total}
            page={page}
            totalPages={totalPages}
            loading={loading}
            onPageChange={(newPage) => {
              setPage(newPage);
              mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
            }}
            onStatusChange={handleStatusChange}
            onToggleStar={handleToggleStar}
            onOpenNotes={(prob) => setActiveNotesProblem(prob)}
            onSelectTag={handleSelectTag}
          />
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
