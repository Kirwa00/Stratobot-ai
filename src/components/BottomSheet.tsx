"use client";

import { useEffect, type ReactNode } from "react";

export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div
        className="relative w-full max-w-[420px] max-h-[85dvh] overflow-y-auto rounded-t-xl border-t border-x border-outline bg-slate shadow-2xl safe-bottom"
        style={{ animation: "sheet-in 200ms ease-out" }}
      >
        <style>{`
          @keyframes sheet-in {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        `}</style>
        <div className="sticky top-0 bg-slate flex items-center justify-between px-4 py-3 border-b border-outline">
          <div className="w-9 h-1 rounded-full bg-outline absolute left-1/2 -translate-x-1/2 top-1.5" />
          <h2 className="font-medium text-chalk text-[15px] pt-1">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="material-symbols-outlined text-chalk/70 p-1 rounded-md hover:bg-slate-high"
          >
            close
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
