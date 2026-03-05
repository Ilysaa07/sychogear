import { ReactNode } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  isDestructive?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
  isDestructive = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[60]" onClick={!isLoading ? onClose : undefined} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-brand-950 border border-white/10 p-6 z-[60] shadow-xl fade-in rounded-lg">
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <div className="text-sm text-brand-400 mb-6 space-y-2 whitespace-pre-wrap">{message}</div>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm text-brand-400 hover:text-white disabled:opacity-50 transition-colors bg-transparent"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium rounded disabled:opacity-50 transition-colors ${
              isDestructive 
                ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/30" 
                : "btn-primary"
            }`}
          >
            {isLoading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </>
  );
}
