import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 dark:bg-black/60 backdrop-blur-sm animate-in fade-in"
        onClick={isLoading ? undefined : onCancel}
      />

      {/* Dialog Content */}
      <div className="relative w-full max-w-md p-6 bg-card border border-border rounded-2xl shadow-2xl glass z-10 animate-in fade-in scale-in duration-200">
        {/* Close Button */}
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer"
        >
          <X className="w-4.5 h-4.5" />
        </button>

        {/* Layout */}
        <div className="flex gap-4 items-start">
          <div
            className={`flex-shrink-0 p-2.5 rounded-xl border ${
              isDestructive
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-foreground mb-1">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-semibold rounded-xl border border-border text-foreground bg-transparent hover:bg-muted disabled:opacity-50 transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-semibold rounded-xl text-white shadow-lg transition-all flex items-center gap-2 cursor-pointer ${
              isDestructive
                ? 'bg-destructive hover:bg-destructive/90 shadow-destructive/20 hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-primary hover:bg-primary/90 shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]'
            } disabled:opacity-50 disabled:scale-100`}
          >
            {isLoading && (
              <span className="w-3.5 h-3.5 border-2 border-t-transparent border-white rounded-full animate-spin" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
