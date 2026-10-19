import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { ProblemTable } from './components/problems/ProblemTable';
import { FilterChips } from './components/problems/FilterChips';
import { AddQuestionModal } from './components/modals/AddQuestionModal';
import { NotesModal } from './components/modals/NotesModal';
import { ExportImportModal } from './components/modals/ExportImportModal';
import { KeyboardShortcutsModal } from './components/modals/KeyboardShortcutsModal';
import { problemsApi } from './api/problemsApi';
import { tagsApi } from './api/tagsApi';
import { useToast } from './context/ToastContext';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { useDebounce } from './hooks/useDebounce';
import { useUrlParams } from './hooks/useUrlParams';
import type { Problem, Tag, Stats, Status, NewProblemPayload } from './types';

function MainTracker() {
  const mainRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const url = useUrlParams();

  // Main data state
  const [problems, setProblems] = useState<Problem[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Mutually exclusive view or category — initialized from URL
  const validViews = ['all', 'starred', 'in_progress', 'solved', 'recent'] as const;
  const urlView = url.get('view', 'all');
  const [activeView, setActiveView] = useState<'all' | 'starred' | 'in_progress' | 'solved' | 'recent'>(
    (validViews as readonly string[]).includes(urlView) ? urlView as typeof validViews[number] : 'all'
  );
  const [selectedTag, setSelectedTag] = useState<string>(url.get('tag'));

  // Top header filters — initialized from URL
  const [search, setSearch] = useState(url.get('q'));
  const [difficulty, setDifficulty] = useState(url.get('difficulty', 'All'));
  const [status, setStatus] = useState(url.get('status', 'All'));
  const [isStarred, setIsStarred] = useState(url.getBool('starred') === true);
  const [paidOnly, setPaidOnly] = useState<boolean | undefined>(url.getBool('paid'));
  const [searchNotes, setSearchNotes] = useState(false);
  const [sortBy, setSortBy] = useState(() => {
    const fromUrl = url.get('sort');
    if (fromUrl) return fromUrl;
    try { return localStorage.getItem('leettracker_sort') || 'id_asc'; } catch { return 'id_asc'; }
  });
  const [page, setPage] = useState(url.getInt('page', 1));

  const debouncedSearch = useDebounce(search, 300);

  // Sync filter state to URL
  useEffect(() => {
    url.sync({
      q: search || undefined,
      difficulty: difficulty === 'All' ? undefined : difficulty,
      status: status === 'All' ? undefined : status,
      starred: isStarred ? 'true' : undefined,
      paid: paidOnly === true ? 'true' : paidOnly === false ? 'false' : undefined,
      sort: sortBy === 'id_asc' ? undefined : sortBy,
      page: page === 1 ? undefined : String(page),
      tag: selectedTag || undefined,
      view: activeView === 'all' ? undefined : activeView,
    });
  }, [search, difficulty, status, isStarred, paidOnly, sortBy, page, selectedTag, activeView, url]);

  // Modals state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [activeNotesProblem, setActiveNotesProblem] = useState<Problem | null>(null);

  const companyNames = useMemo(
    () => new Set(tags.filter((t) => t.type === 'company').map((t) => t.name)),
    [tags]
  );

  const tagSlugMap = useMemo(
    () => new Map(tags.map((t) => [t.name, t.slug])),
    [tags]
  );

  // Compute effective query filters from activeView and local toggles
  const effectiveStatus = activeView === 'solved' ? 'solved' : activeView === 'in_progress' ? 'in_progress' : status;
  const effectiveStarred = activeView === 'starred' ? true : isStarred;
  const effectiveSort = activeView === 'recent' ? 'recent' : sortBy;

  // Derive the status filter for context-aware tag counts
  const tagStatusFilter = activeView === 'solved' ? 'solved' : activeView === 'in_progress' ? 'in_progress' : undefined;

  // Load canonical tags (re-fetches when view changes to update counts)
  const loadTags = useCallback(async () => {
    try {
      const fetchedTags = await tagsApi.getTags(tagStatusFilter);
      setTags(fetchedTags);
    } catch (err) {
      console.error('Failed to load tags:', err);
      toast({ type: 'error', message: 'Failed to load tags' });
    }
  }, [toast, tagStatusFilter]);

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
        search: debouncedSearch.trim() || undefined,
        search_notes: searchNotes || undefined,
        difficulty,
        status: effectiveStatus,
        is_starred: effectiveStarred || undefined,
        paid_only: paidOnly,
        sort_by: effectiveSort,
        page,
        page_size: 50,
      });
      setProblems(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error('Failed to load problems:', err);
      toast({ type: 'error', message: 'Failed to load problems. Check your connection.' });
    } finally {
      setLoading(false);
    }
  }, [selectedTag, debouncedSearch, searchNotes, difficulty, effectiveStatus, effectiveStarred, paidOnly, effectiveSort, page, toast]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadProblems();
  }, [loadProblems]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag);

      // Escape: blur search input
      if (e.key === 'Escape' && inInput) {
        (e.target as HTMLElement).blur();
        return;
      }

      if (inInput) return;

      switch (e.key) {
        case '/':
          e.preventDefault();
          searchInputRef.current?.focus();
          break;
        case 'n':
          e.preventDefault();
          setIsAddModalOpen(true);
          break;
        case 'j':
          if (page < totalPages) {
            setPage((p) => p + 1);
            mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
          }
          break;
        case 'k':
          if (page > 1) {
            setPage((p) => p - 1);
            mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
          }
          break;
        case '?':
          e.preventDefault();
          setIsShortcutsOpen(true);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [page, totalPages]);

  // Navigation Handlers with smooth scroll reset
  const handleSelectView = (view: 'all' | 'starred' | 'in_progress' | 'solved' | 'recent') => {
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
    const prev = problems.find((p) => p.id === id);
    if (!prev) return;
    const oldStatus = prev.status;

    // Optimistic update
    setProblems((curr) =>
      curr.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    );
    try {
      await problemsApi.updateTracking(id, { status: newStatus });
      loadStats();
    } catch (err) {
      console.error('Failed to update status:', err);
      // Rollback
      setProblems((curr) =>
        curr.map((p) => (p.id === id ? { ...p, status: oldStatus } : p))
      );
      toast({ type: 'error', message: `Failed to update status for #${id}` });
    }
  };

  const handleToggleStar = async (id: string, current: boolean) => {
    const next = !current;
    // Optimistic update
    setProblems((curr) =>
      curr.map((p) => (p.id === id ? { ...p, is_starred: next } : p))
    );
    try {
      await problemsApi.updateTracking(id, { is_starred: next });
      loadStats();
    } catch (err) {
      console.error('Failed to update star:', err);
      // Rollback
      setProblems((curr) =>
        curr.map((p) => (p.id === id ? { ...p, is_starred: current } : p))
      );
      toast({ type: 'error', message: `Failed to ${next ? 'star' : 'unstar'} problem #${id}` });
    }
  };

  const handleSaveNotes = async (id: string, notes: string) => {
    const prev = problems.find((p) => p.id === id);
    const oldNotes = prev?.notes || '';

    // Optimistic update
    setProblems((curr) =>
      curr.map((p) => (p.id === id ? { ...p, notes } : p))
    );
    try {
      await problemsApi.updateTracking(id, { notes });
      toast({ type: 'success', message: 'Notes saved' });
    } catch (err) {
      console.error('Failed to save notes:', err);
      // Rollback
      setProblems((curr) =>
        curr.map((p) => (p.id === id ? { ...p, notes: oldNotes } : p))
      );
      toast({ type: 'error', message: 'Failed to save notes' });
    }
  };

  const handleAddQuestion = async (payload: NewProblemPayload) => {
    await problemsApi.createProblem(payload);
    toast({ type: 'success', message: `Added #${payload.id} ${payload.title}` });
    await Promise.all([loadTags(), loadStats(), loadProblems()]);
  };

  const handleExportAll = async () => {
    const allTracking: Array<{ id: string; title: string; status: string; is_starred: boolean; notes: string }> = [];
    let currentPage = 1;
    let totalPages = 1;

    do {
      const res = await problemsApi.getProblems({
        page: currentPage,
        page_size: 200,
        sort_by: 'id_asc',
      });
      totalPages = res.total_pages;
      for (const p of res.items) {
        if (p.status !== 'todo' || p.is_starred || (p.notes && p.notes.trim().length > 0)) {
          allTracking.push({
            id: p.id,
            title: p.title,
            status: p.status,
            is_starred: p.is_starred,
            notes: p.notes,
          });
        }
      }
      currentPage++;
    } while (currentPage <= totalPages);

    return allTracking;
  };

  const handleImportTracking = async (
    items: Array<{ id: string; status: any; is_starred: boolean; notes: string }>
  ) => {
    await problemsApi.batchUpdateTracking(items);
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
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Workspace */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-canvas">
        {/* Sticky Toolbar & Progress Header */}
        <TopHeader
          stats={stats}
          activeTag={selectedTag}
          filteredTotal={total}
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
          onSortChange={(val) => {
            setSortBy(val);
            try { localStorage.setItem('leettracker_sort', val); } catch {}
          }}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenBackupModal={() => setIsBackupModalOpen(true)}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          searchNotes={searchNotes}
          onToggleSearchNotes={() => setSearchNotes(!searchNotes)}
          searchInputRef={searchInputRef}
          streak={stats?.current_streak}
        />

        {/* Filter Breadcrumb Chips */}
        <FilterChips
          search={search}
          difficulty={difficulty}
          status={status}
          isStarred={isStarred}
          paidOnly={paidOnly}
          selectedTag={selectedTag}
          tagName={stats?.tag_name}
          onClearSearch={() => { setSearch(''); setPage(1); }}
          onClearDifficulty={() => { setDifficulty('All'); setPage(1); }}
          onClearStatus={() => { setStatus('All'); setPage(1); }}
          onClearStarred={() => { setIsStarred(false); setPage(1); }}
          onClearPaid={() => { setPaidOnly(undefined); setPage(1); }}
          onClearTag={() => { setSelectedTag(''); setPage(1); }}
        />

        {/* Content Table: Always mounted so layout NEVER jumps */}
        <main ref={mainRef} className="flex-1 overflow-y-auto flex flex-col bg-canvas">
          <ProblemTable
            problems={problems}
            total={total}
            page={page}
            totalPages={totalPages}
            loading={loading}
            hasActiveFilters={!!(search || difficulty !== 'All' || status !== 'All' || isStarred || paidOnly !== undefined || selectedTag)}
            sortBy={effectiveSort}
            onSortChange={(val) => {
              setSortBy(val);
              setPage(1);
              mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
              try { localStorage.setItem('leettracker_sort', val); } catch {}
            }}
            onPageChange={(newPage) => {
              setPage(newPage);
              mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
            }}
            onStatusChange={handleStatusChange}
            onToggleStar={handleToggleStar}
            onOpenNotes={(prob) => setActiveNotesProblem(prob)}
            onSelectTag={handleSelectTag}
            onClearFilters={() => {
              setSearch('');
              setDifficulty('All');
              setStatus('All');
              setIsStarred(false);
              setPaidOnly(undefined);
              setSelectedTag('');
              setActiveView('all');
              setPage(1);
            }}
            onAddQuestion={() => setIsAddModalOpen(true)}
            companyNames={companyNames}
            tagSlugMap={tagSlugMap}
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
        onExportAll={handleExportAll}
        onImportTracking={handleImportTracking}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}

export function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <MainTracker />;
}

export default App;

