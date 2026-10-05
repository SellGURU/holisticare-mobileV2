import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Sparkles, User } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type ChatMode = "ai" | "coach";

const ITEMS: {
  value: ChatMode;
  title: string;
  subtitle: string;
  status: string;
}[] = [
  {
    value: "ai",
    title: "Copilot",
    subtitle: "Your personal health copilot",
    status: "Always on",
  },
  {
    value: "coach",
    title: "Health Coach",
    subtitle: "Messages from your clinic",
    status: "Clinic coach",
  },
];

function ModeAvatar({
  mode,
  size = "md",
}: {
  mode: ChatMode;
  size?: "sm" | "md" | "lg";
}) {
  const dim =
    size === "lg" ? "h-12 w-12" : size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const icon = size === "lg" ? "h-6 w-6" : "h-4 w-4";
  return (
    <span
      className={`flex flex-shrink-0 items-center justify-center rounded-full text-white ${dim} ${
        mode === "ai"
          ? "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[0_6px_16px_rgba(79,70,229,0.35)]"
          : "bg-gradient-to-br from-emerald-500 to-teal-600"
      }`}
    >
      {mode === "ai" ? (
        <Sparkles className={icon} />
      ) : (
        <User className={icon} />
      )}
    </span>
  );
}

function CoachPresence({ online }: { online: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 text-[12px] font-medium ${
        online ? "text-[#12B76A]" : "text-gray-400 dark:text-gray-500"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          online ? "bg-[#12B76A]" : "bg-gray-400"
        }`}
      />
      {online ? "Online" : "Offline"}
    </span>
  );
}

export default function SimpleModeSelect({
  activeMode,
  setActiveMode,
  disabled = false,
  hideAi = false,
  coachOnline = null,
}: {
  activeMode: ChatMode;
  setActiveMode: (mode: ChatMode) => void;
  disabled?: boolean;
  hideAi?: boolean;
  coachOnline?: boolean | null;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  const items = hideAi ? ITEMS.filter((it) => it.value !== "ai") : ITEMS;
  const activeItem = items.find((it) => it.value === activeMode) ?? items[0];

  if (hideAi || disabled || items.length === 1) {
    return (
      <div className="flex min-h-12 items-center gap-3 px-1">
        <ModeAvatar mode="coach" />
        <div className="min-w-0">
          <p className="flex min-w-0 items-center gap-2 text-[15px] font-semibold text-gray-900 dark:text-gray-100">
            <span className="truncate">{activeItem.title}</span>
            {activeMode === "coach" && coachOnline != null && (
              <CoachPresence online={coachOnline} />
            )}
          </p>
          <p className="truncate text-[12px] text-gray-500 dark:text-gray-400">
            {activeMode === "coach" && coachOnline != null
              ? coachOnline
                ? "Available now"
                : "Currently away"
              : activeItem.status}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex min-h-12 w-full items-center gap-3 rounded-xl px-1 py-0.5 text-left transition-colors active:bg-black/5 dark:active:bg-white/5"
      >
        <ModeAvatar mode={activeMode} />
        <div className="min-w-0 flex-1">
          <p className="flex min-w-0 items-center gap-2 text-[15px] font-semibold leading-tight text-gray-900 dark:text-gray-100">
            <span className="truncate">{activeItem.title}</span>
            {activeMode === "coach" && coachOnline != null && (
              <CoachPresence online={coachOnline} />
            )}
          </p>
          <p className="truncate text-[12px] leading-tight text-gray-500 dark:text-gray-400">
            {activeMode === "coach" && coachOnline != null
              ? coachOnline
                ? "Available now"
                : "Currently away"
              : activeItem.status}
          </p>
        </div>
        <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-400" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto flex w-full max-w-md flex-col gap-0 rounded-t-3xl border-x-0 border-t p-0 [&>button]:hidden"
        >
          <div className="flex justify-center pb-1 pt-3">
            <span className="h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-600" />
          </div>
          <SheetHeader className="space-y-1 px-5 pb-3 pt-1 text-left">
            <SheetTitle className="text-base font-semibold">
              Switch chat
            </SheetTitle>
            <SheetDescription className="text-xs">
              Choose who you want to talk with
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-2 px-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
            {items.map((it) => {
              const selected = activeMode === it.value;
              return (
                <button
                  key={it.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    setActiveMode(it.value);
                    setOpen(false);
                    triggerRef.current?.focus();
                  }}
                  className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors ${
                    selected
                      ? it.value === "ai"
                        ? "border-blue-200 bg-blue-50 dark:border-blue-800/60 dark:bg-blue-950/40"
                        : "border-emerald-200 bg-emerald-50 dark:border-emerald-800/60 dark:bg-emerald-950/40"
                      : "border-gray-200/80 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-800/80"
                  }`}
                >
                  <ModeAvatar mode={it.value} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-[15px] font-semibold text-gray-900 dark:text-gray-100">
                      <span>{it.title}</span>
                      {it.value === "coach" && coachOnline != null && (
                        <CoachPresence online={coachOnline} />
                      )}
                    </p>
                    <p className="mt-0.5 text-[12px] leading-snug text-gray-500 dark:text-gray-400">
                      {it.subtitle}
                    </p>
                  </div>
                  <span
                    className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                      selected
                        ? it.value === "ai"
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-emerald-600 bg-emerald-600 text-white"
                        : "border-gray-300 dark:border-gray-500"
                    }`}
                  >
                    {selected ? <Check className="h-3.5 w-3.5" /> : null}
                  </span>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export { ModeAvatar };
