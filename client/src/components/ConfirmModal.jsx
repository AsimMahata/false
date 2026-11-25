import React from 'react';
import { AlertCircle, Trash2, ArrowRightLeft, X } from 'lucide-react';

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary', // 'primary' | 'danger' | 'purple'
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  const getIcon = () => {
    if (confirmVariant === 'danger') {
      return (
        <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
          <Trash2 className="w-5 h-5" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
        <ArrowRightLeft className="w-5 h-5" />
      </div>
    );
  };

  const getConfirmButtonClass = () => {
    if (confirmVariant === 'danger') {
      return 'bg-rose-600 hover:bg-rose-700 text-white';
    }
    return 'bg-gray-900 dark:bg-emerald-600 hover:bg-black dark:hover:bg-emerald-700 text-white';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-gray-200 dark:border-gray-800 transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {getIcon()}
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                {title}
              </h3>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 text-xs text-gray-600 dark:text-gray-300 leading-relaxed pl-13">
          {message}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer ${getConfirmButtonClass()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
