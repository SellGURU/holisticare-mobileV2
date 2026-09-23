import React, { useEffect, useRef, useState } from "react";
import { Bot, User, ChevronDown, Check } from "lucide-react";

type ChatMode = "ai" | "coach";

export default function SimpleModeSelect({
  activeMode,
  setActiveMode,
  disabled = false,
  hideAi = false,
}: {
  activeMode: ChatMode;
  setActiveMode: (mode: ChatMode) => void;
  disabled?: boolean;
  hideAi?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const optionsRef = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      const focused = document.activeElement;
      const idx = optionsRef.current.findIndex((el) => el === focused);
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        optionsRef.current[Math.min(idx + 1, optionsRef.current.length - 1)]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        optionsRef.current[Math.max(idx - 1, 0)]?.focus();
      } else if (e.key === "Enter" && idx >= 0) {
        e.preventDefault();
        optionsRef.current[idx]?.click();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const allItems: { value: ChatMode; title: string; desc: string }[] = [
    { value: "coach", title: "Health Coach", desc: "Expert guidance from your clinic" },
    { value: "ai", title: "AI Copilot", desc: "Not diagnosis or definitive treatment" },
  ];

  const items = hideAi ? allItems.filter((it) => it.value !== "ai") : allItems;
  const activeItem = items.find((it) => it.value === activeMode) ?? items[0];

  const iconFor = (mode: ChatMode) =>
    mode === "ai" ? (
      <Bot className="h-4 w-4 text-white" />
    ) : (
      <User className="h-4 w-4 text-white" />
    );

  const iconBgFor = (mode: ChatMode) =>
    mode === "ai"
      ? "bg-gradient-to-br from-blue-500 to-indigo-600"
      : "bg-gradient-to-br from-emerald-500 to-teal-600";

  if (hideAi || disabled || items.length === 1) {
    return (
      <div className="mb-3 flex items-center gap-2.5 rounded-2xl bg-white/90 px-3 py-2.5 shadow-sm dark:bg-gray-800/90">
        <span
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${iconBgFor("coach")}`}
        >
          {iconFor("coach")}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {activeItem.title}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {activeItem.desc}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative mb-3 w-full">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[52px] w-full items-center gap-3 rounded-2xl border border-gray-200/60 bg-white/90 px-3 py-2.5 shadow-sm transition-colors hover:bg-gray-50/80 dark:border-gray-700/60 dark:bg-gray-800/90 dark:hover:bg-gray-800"
      >
        <span
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${iconBgFor(activeMode)}`}
        >
          {iconFor(activeMode)}
        </span>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {activeItem.title}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {activeItem.desc}
          </p>
        </div>
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select chat mode"
          className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-lg dark:border-gray-700/60 dark:bg-gray-800"
        >
          {items.map((it, i) => (
            <div
              key={it.value}
              role="option"
              aria-selected={activeMode === it.value}
              tabIndex={0}
              ref={(el) => {
                optionsRef.current[i] = el;
              }}
              onClick={() => {
                setActiveMode(it.value);
                setOpen(false);
                triggerRef.current?.focus();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setActiveMode(it.value);
                  setOpen(false);
                  triggerRef.current?.focus();
                }
              }}
              className={`flex cursor-pointer items-center gap-3 px-3 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                activeMode === it.value
                  ? "bg-blue-50/80 dark:bg-blue-900/20"
                  : ""
              } ${i > 0 ? "border-t border-gray-100 dark:border-gray-700/50" : ""}`}
            >
              <span
                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${iconBgFor(it.value)}`}
              >
                {iconFor(it.value)}
              </span>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {it.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {it.desc}
                </p>
              </div>
              {activeMode === it.value && (
                <Check className="h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
