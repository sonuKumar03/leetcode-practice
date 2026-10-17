import React, { useState, useEffect } from 'react';
import { X, Save, FileText, ExternalLink } from 'lucide-react';
import type { Problem } from '../../types';

interface NotesModalProps {
  problem: Problem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveNotes: (id: string, notes: string) => Promise<void>;
}

export const NotesModal: React.FC<NotesModalProps> = ({
  problem,
  isOpen,
  onClose,
  onSaveNotes,
}) => {
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (problem) {
      setNotes(problem.notes || '');
    }
  }, [problem]);

  if (!isOpen || !problem) return null;

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSaveNotes(problem.id, notes);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-[#0C101A] border border-slate-200 dark:border-[#1B2333] rounded-2xl w-full max-w-xl p-6 shadow-2xl relative flex flex-col max-h-[90vh] text-slate-800 dark:text-slate-200 transition-colors">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 mt-1">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-[#151D2C] font-bold text-slate-700 dark:text-slate-300">
                #{problem.id}
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {problem.title}
              </h2>
            </div>
            <div className="flex items-center space-x-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{problem.difficulty}</span>
              <span>•</span>
              {problem.leetcode_url && (
                <a
                  href={problem.leetcode_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
                >
                  <span>Open on LeetCode</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Text Area */}
        <div className="flex-1 flex flex-col mb-4">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Personal Solution Notes & Code Snippets:
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Write your intuition, time/space complexity, edge cases, or code snippet..."
            className="flex-1 min-h-[220px] w-full p-3 text-xs font-mono rounded-xl border border-slate-200 dark:border-[#212C3F] bg-slate-50 dark:bg-[#111726] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 resize-none leading-relaxed transition-colors"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-[#1B2333] text-xs">
          <span className="text-slate-400 dark:text-slate-500">Saved directly to SQLite database</span>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#151C2C] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl font-semibold text-white bg-amber-600 hover:bg-amber-500 active:scale-95 shadow-md shadow-amber-600/30 transition disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Notes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
