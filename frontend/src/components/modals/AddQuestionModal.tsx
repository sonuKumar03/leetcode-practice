import React, { useState } from 'react';
import { X, Plus, Sparkles } from 'lucide-react';
import type { Difficulty, NewProblemPayload } from '../../types';

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
  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [tagsInput, setTagsInput] = useState('k-Shortest Paths, Graph');
  const [leetcodeUrl, setLeetcodeUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

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

      await onSubmit({
        id: id.trim(),
        title: title.trim(),
        difficulty,
        tags,
        leetcode_url: leetcodeUrl.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      onClose();
      setId('');
      setTitle('');
      setNotes('');
      setLeetcodeUrl('');
    } catch (err: any) {
      setError(err.message || 'Failed to add question');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 mb-4">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add New Question</h2>
            <p className="text-xs text-gray-500">Insert custom interview problems or new LeetCode questions</p>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                ID / Number *
              </label>
              <input
                type="text"
                placeholder="e.g. 2046 or c-1"
                value={id}
                onChange={(e) => setId(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="col-span-2">
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Problem Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Find Kth Shortest Route"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                LeetCode / Web URL
              </label>
              <input
                type="url"
                placeholder="https://leetcode.com/problems/..."
                value={leetcodeUrl}
                onChange={(e) => setLeetcodeUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Algorithm Tags (comma-separated)
            </label>
            <input
              type="text"
              placeholder="k-Shortest Paths, Graph, Dijkstra"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Initial Notes or Hints
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Approach outline, recurrence relation, or complexity..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-md shadow-indigo-600/30 transition disabled:opacity-50"
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
