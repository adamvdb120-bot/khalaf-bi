"use client";

import { useEffect } from "react";
import { X, Sparkles } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Slide-in zijpaneel vanaf rechts voor de AI-chat.
 * Blijft altijd in de DOM zodat de chat-state bewaard blijft bij sluiten/openen.
 */
export default function ChatSidePanel({ open, onClose, children }: Props) {
  // Esc om te sluiten
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Body scroll lock bij open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!open}
      />

      {/* Paneel */}
      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[460px] md:w-[520px] bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
        role="dialog"
        aria-label="AI-assistent"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-navy-700 to-navy-600 flex items-center justify-center shadow-sm">
              <Sparkles size={15} className="text-gold-400" />
            </div>
            <div>
              <h3 className="font-bold text-navy-700">AI-assistent</h3>
              <p className="text-[11px] text-gray-400">Stel een vraag over je data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Sluiten"
            className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body — bevat de chat */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>
      </aside>
    </>
  );
}
