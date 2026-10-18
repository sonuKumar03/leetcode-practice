import React, { useState, useRef } from 'react';
import { X, Download, Upload, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportAll: () => Promise<Array<{ id: string; title: string; status: string; is_starred: boolean; notes: string }>>;
  onImportTracking: (data: Array<{ id: string; status: any; is_starred: boolean; notes: string }>) => Promise<void>;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  onExportAll,
  onImportTracking,
}) => {
  useEscapeKey(isOpen, onClose);
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef, isOpen);

  const [importedFile, setImportedFile] = useState<File | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [confirmingImport, setConfirmingImport] = useState(false);
  const [parsedImportData, setParsedImportData] = useState<Array<{ id: string; status: any; is_starred: boolean; notes: string }> | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      setExporting(true);
      setErrorMsg('');
      const tracking = await onExportAll();

      const backupData = {
        exported_at: new Date().toISOString(),
        app: 'LeetCode Practice Tracker',
        tracking,
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leetcode-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccessMsg(`Exported ${tracking.length} items`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImportedFile(e.target.files[0]);
      setConfirmingImport(false);
      setParsedImportData(null);
    }
  };

  const handleImportRequest = async () => {
    if (!importedFile) return;
    try {
      setErrorMsg('');
      const text = await importedFile.text();
      const data = JSON.parse(text);

      if (!data.tracking || !Array.isArray(data.tracking)) {
        throw new Error('Invalid backup file format: missing tracking array.');
      }

      setParsedImportData(data.tracking);
      setConfirmingImport(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to read backup file');
    }
  };

  const handleConfirmImport = async () => {
    if (!parsedImportData) return;
    try {
      setLoading(true);
      setErrorMsg('');
      await onImportTracking(parsedImportData);
      setSuccessMsg(`Restored ${parsedImportData.length} items`);
      setConfirmingImport(false);
      setParsedImportData(null);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to import backup');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelImport = () => {
    setConfirmingImport(false);
    setParsedImportData(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div ref={containerRef} className="bg-elevated border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-text-main transition-colors">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-text-subtle hover:text-text-main p-1 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-base font-bold text-text-main mb-1">
          Backup & Restore Progress
        </h2>
        <p className="text-xs text-text-muted mb-6">
          Download notes, stars, and problem statuses as JSON or restore from an earlier backup.
        </p>

        {successMsg && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs">
            {errorMsg}
          </div>
        )}

        <div className="space-y-4 text-xs">
          {/* Export Section */}
          <div className="p-4 rounded-xl border border-border bg-surface">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-text-main">Export Progress</h3>
                <p className="text-text-muted text-[11px] mt-0.5">Save all tracked data to a .json file</p>
              </div>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl font-semibold text-white bg-brand hover:bg-brand-hover active:scale-95 shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>{exporting ? 'Exporting...' : 'Export JSON'}</span>
              </button>
            </div>
          </div>

          {/* Import Section */}
          <div className="p-4 rounded-xl border border-border bg-surface space-y-3">
            <div>
              <h3 className="font-bold text-text-main">Restore Backup</h3>
              <p className="text-text-muted text-[11px] mt-0.5">Upload a previously exported .json file</p>
            </div>

            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="w-full text-xs text-text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-subtle file:text-brand hover:file:bg-brand/20 cursor-pointer"
            />

            {importedFile && !confirmingImport && (
              <button
                onClick={handleImportRequest}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Restore Now</span>
              </button>
            )}

            {/* Confirmation step */}
            {confirmingImport && parsedImportData && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                <div className="flex items-start space-x-2 text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">This will overwrite your current progress</p>
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                      {parsedImportData.length} items will be restored from the backup file. Existing statuses, stars, and notes will be replaced.
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleCancelImport}
                    className="flex-1 px-3 py-1.5 rounded-lg font-medium text-text-muted hover:text-text-main hover:bg-surface-hover border border-border transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold text-white bg-amber-600 hover:bg-amber-500 active:scale-95 shadow-sm transition disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{loading ? 'Restoring...' : 'Yes, Restore'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
