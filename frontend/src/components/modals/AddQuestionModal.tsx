import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import type { Difficulty, NewProblemPayload } from '../../types';
import { problemsApi } from '../../api/problemsApi';

interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewProblemPayload) => Promise<void>;
}

export const AddQuestionModal: React.FC<AddQuestionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  useEscapeKey(isOpen, onClose);
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef, isOpen);
  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [tagsInput, setTagsInput] = useState('');
  const [companyTagsInput, setCompanyTagsInput] = useState('');
  const [leetcodeUrl, setLeetcodeUrl] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [autofilling, setAutofilling] = useState(false);
  const [autofillSuccess, setAutofillSuccess] = useState('');
  const [error, setError] = useState('');

  const debounceTimer = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      setId('');
      setTitle('');
      setDifficulty('Medium');
      setTagsInput('');
      setCompanyTagsInput('');
      setLeetcodeUrl('');
      setNotes('');
      setError('');
      setAutofillSuccess('');
    }
  }, [isOpen]);

  const triggerAutofill = async (query: string) => {
    const q = query.trim();
    if (!q) return;

    try {
      setAutofilling(true);
      setError('');
      setAutofillSuccess('');

      const data = await problemsApi.lookupMetadata(q);
      if (data) {
        if (data.id) setId(data.id);
        if (data.title) setTitle(data.title);
        if (data.difficulty) setDifficulty(data.difficulty as Difficulty);
        if (data.leetcode_url) setLeetcodeUrl(data.leetcode_url);
        if (data.tags && data.tags.length > 0) {
          setTagsInput(data.tags.join(', '));
        }
        if (data.company_tags && data.company_tags.length > 0) {
          setCompanyTagsInput(data.company_tags.join(', '));
        }

        const tagCount = data.tags ? data.tags.length : 0;
        const companyCount = data.company_tags ? data.company_tags.length : 0;
        setAutofillSuccess(
          `Auto-filled metadata (${tagCount} algorithm labels, ${companyCount} companies)`
        );
      }
    } catch {
      // If query is custom/not found in public catalog, silent fail so user can still manually input
    } finally {
      setAutofilling(false);
    }
  };

  const handleIdChange = (val: string) => {
    setId(val);
    clearTimeout(debounceTimer.current);
    const trimmed = val.trim();
    if (trimmed.length > 0 && /^\d+$/.test(trimmed)) {
      debounceTimer.current = setTimeout(() => {
        triggerAutofill(trimmed);
      }, 450);
    }
  };

  const handleUrlChange = (val: string) => {
    setLeetcodeUrl(val);
    clearTimeout(debounceTimer.current);
    const trimmed = val.trim();
    if (trimmed.includes('leetcode.com/problems/')) {
      debounceTimer.current = setTimeout(() => {
        triggerAutofill(trimmed);
      }, 300);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim() || !title.trim()) {
      setError('Please provide a Problem ID and Title.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const companyTags = companyTagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await onSubmit({
        id: id.trim(),
        title: title.trim(),
        difficulty,
        tags,
        company_tags: companyTags,
        leetcode_url: leetcodeUrl.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add question');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div ref={containerRef} className="bg-elevated border border-border rounded-2xl w-full max-w-lg p-6 shadow-2xl relative text-text-main transition-colors">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-text-subtle hover:text-text-main p-1 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="p-2 rounded-xl bg-brand-subtle text-brand border border-brand/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-main">Add New Question</h2>
            <p className="text-sm text-text-muted">
              Enter an ID or LeetCode URL to auto-fill title, tags, and hiring companies
            </p>
          </div>
        </div>

        {/* Autofill Status Banner */}
        {autofillSuccess && (
          <div className="p-3 mb-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-sm flex items-center space-x-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
            <span>{autofillSuccess}</span>
          </div>
        )}

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-sm">
          {/* Row 1: ID with instant Auto-fill button */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block font-semibold text-text-main mb-1">
                ID / Number *
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. 2045"
                  value={id}
                  onChange={(e) => handleIdChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text-main focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
                />
                {autofilling && (
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand pointer-events-none">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  </div>
                )}
              </div>
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-text-main">
                  Problem Title *
                </label>
                {id.trim() && (
                  <button
                    type="button"
                    onClick={() => triggerAutofill(id)}
                    disabled={autofilling}
                    className="text-xs text-brand hover:underline flex items-center space-x-1 cursor-pointer font-semibold"
                  >
                    <Sparkles className="w-3 h-3 mr-0.5" />
                    <span>{autofilling ? 'Fetching...' : 'Auto-fill'}</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                placeholder="e.g. Second Minimum Time to Reach Destination"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text-main focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
              />
            </div>
          </div>

          {/* Row 2: Difficulty & URL */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-text-main mb-1">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text-main focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors cursor-pointer"
              >
                <option value="Easy" className="bg-surface text-text-main">Easy</option>
                <option value="Medium" className="bg-surface text-text-main">Medium</option>
                <option value="Hard" className="bg-surface text-text-main">Hard</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-text-main mb-1">
                LeetCode / Web URL
              </label>
              <input
                type="url"
                placeholder="https://leetcode.com/problems/..."
                value={leetcodeUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text-main focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
              />
            </div>
          </div>

          {/* Row 3: Algorithm Tags */}
          <div>
            <label className="block font-semibold text-text-main mb-1">
              Algorithm Labels (comma-separated)
            </label>
            <input
              type="text"
              placeholder="Graph, Breadth-First Search, Shortest Path"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text-main focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
            />
          </div>

          {/* Row 4: Company Tags */}
          <div>
            <label className="block font-semibold text-text-main mb-1">
              Company Tags (comma-separated)
            </label>
            <input
              type="text"
              placeholder="Google, Amazon, Meta / Facebook, Microsoft, Apple"
              value={companyTagsInput}
              onChange={(e) => setCompanyTagsInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text-main focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
            />
          </div>

          {/* Row 5: Notes */}
          <div>
            <label className="block font-semibold text-text-main mb-1">
              Initial Notes or Hints
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Approach outline, recurrence relation, or complexity..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text-main focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors leading-relaxed"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end space-x-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-medium text-text-muted hover:text-text-main hover:bg-surface-hover transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || autofilling}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl font-semibold text-white bg-brand hover:bg-brand-hover active:scale-95 shadow-md shadow-brand/20 transition disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? 'Adding...' : 'Add to Catalog'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
