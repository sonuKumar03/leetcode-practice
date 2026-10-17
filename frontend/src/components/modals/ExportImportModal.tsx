import React, { useState } from 'react';
import { X, Download, Upload, CheckCircle } from 'lucide-react';
import type { Problem } from '../../types';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  problems: Problem[];
  onImportTracking: (data: Array<{ id: string; status: any; is_starred: boolean; notes: string }>) => Promise<void>;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  problems,
  onImportTracking,
}) => {
  const [importedFile, setImportedFile] = useState<File | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    const backupData = {
      exported_at: new Date().toISOString(),
      app: 'LeetCode Practice Tracker',
      tracking: problems
        .filter((p) => p.status !== 'todo' || p.is_starred || (p.notes && p.notes.length > 0))
        .map((p) => ({
          id: p.id,
          title: p.title,
          status: p.status,
          is_starred: p.is_starred,
          notes: p.notes,
        })),
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leetcode-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImportedFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!importedFile) return;
    try {
      setLoading(true);
      setErrorMsg('');
      const text = await importedFile.text();
      const data = JSON.parse(text);

      if (!data.tracking || !Array.isArray(data.tracking)) {
        throw new Error('Invalid backup file format: missing tracking array.');
      }

      await onImportTracking(data.tracking);
      setSuccessMsg(`Successfully restored ${data.tracking.length} questions progress!`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to import backup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0C101A] border border-[#1B2333] rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-slate-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-500 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-base font-bold text-white mb-1">
          Backup & Restore Progress
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Download notes, stars, and problem statuses as JSON or restore from an earlier backup.
        </p>

        {successMsg && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        <div className="space-y-4 text-xs">
          {/* Export Section */}
          <div className="p-4 rounded-xl border border-[#1E293B] bg-[#111726]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white">Export Progress</h3>
                <p className="text-slate-400 text-[11px] mt-0.5">Save your data to a .json file</p>
              </div>
              <button
                onClick={handleExport}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 shadow-sm transition"
              >
                <Download className="w-4 h-4" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>

          {/* Import Section */}
          <div className="p-4 rounded-xl border border-[#1E293B] bg-[#111726] space-y-3">
            <div>
              <h3 className="font-bold text-white">Restore Backup</h3>
              <p className="text-slate-400 text-[11px] mt-0.5">Upload a previously exported .json file</p>
            </div>

            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/20 file:text-indigo-300 hover:file:bg-indigo-500/30 cursor-pointer"
            />

            {importedFile && (
              <button
                onClick={handleImport}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 shadow-sm transition disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>{loading ? 'Restoring...' : 'Restore Now'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
