import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { keys: ['/'], description: 'Focus search' },
  { keys: ['n'], description: 'Add new question' },
  { keys: ['j'], description: 'Next page' },
  { keys: ['k'], description: 'Previous page' },
  { keys: ['?'], description: 'Show keyboard shortcuts' },
  { keys: ['Esc'], description: 'Close modal / blur input' },
];

const Key: React.FC<{ children: string }> = ({ children }) => (
  <kbd className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-md bg-surface-active border border-border text-text-main text-xs font-mono font-bold shadow-sm">
    {children}
  </kbd>
);

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEscapeKey(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-elevated border border-border rounded-2xl w-full max-w-sm p-5 shadow-2xl text-text-main transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-subtle text-brand border border-brand/30">
              <Keyboard className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="text-text-subtle hover:text-text-main p-1 rounded-lg transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          {shortcuts.map((s) => (
            <div
              key={s.description}
              className="flex items-center justify-between py-2 px-1 rounded-lg"
            >
              <span className="text-sm text-text-muted">{s.description}</span>
              <div className="flex gap-1">
                {s.keys.map((k) => (
                  <Key key={k}>{k}</Key>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-border text-center">
          <span className="text-xs text-text-subtle">
            Shortcuts work when no input is focused
          </span>
        </div>
      </div>
    </div>
  );
};
