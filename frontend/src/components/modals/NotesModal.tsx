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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0C101A] border border-[#1B2333] rounded-2xl w-full max-w-xl p-6 shadow-2xl relative flex flex-col max-h-[90vh] text-slate-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-500 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 mt-1">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#151D2C] font-bold text-slate-300">
                #{problem.id}
              </span>
              <h2 className="text-base font-bold text-white">
                {problem.title}
              </h2>
            </div>
            <div className="flex items-center space-x-2 mt-1 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">{problem.difficulty}</span>
              <span>•</span>
              {problem.leetcode_url && (
                <a
                  href={problem.leetcode_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:underline flex items-center space-x-1"
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
          <label className="text-xs font-semibold text-slate-300 mb-1.5">
            Personal Solution Notes & Code Snippets:
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Write your intuition, time/space complexity, edge cases, or code snippet..."
            className="flex-1 min-h-[220px] w-full p-3 text-xs font-mono rounded-xl border border-[#212C3F] bg-[#111726] text-slate-100 focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-3 border-t border-[#1B2333] text-xs">
          <span className="text-slate-500">Saved directly to SQLite database</span>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-medium text-slate-400 hover:text-white hover:bg-[#151C2C] transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl font-semibold text-white bg-amber-600 hover:bg-amber-500 active:scale-95 shadow-md shadow-amber-600/30 transition disabled:opacity-50"
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
