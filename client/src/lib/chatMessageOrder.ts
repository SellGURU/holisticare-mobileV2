export function messageTimeMs(msg: {
  timestamp?: number | string | null;
  date?: string | null;
  time?: string | null;
}): number {
  const raw = Number(msg.timestamp);
  if (Number.isFinite(raw) && raw > 0) {
    return raw < 1_000_000_000_000 ? raw * 1000 : raw;
  }
  const datePart = String(msg.date ?? "").trim();
  if (!datePart) return Number.POSITIVE_INFINITY;
  if (datePart.includes("T")) {
    const parsedIso = Date.parse(datePart);
    if (Number.isFinite(parsedIso)) return parsedIso;
  }
  const timePart = String(msg.time ?? "00:00").trim() || "00:00";
  const parsed = Date.parse(`${datePart}T${timePart}`);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

export function formatMessageClock(msg: {
  time?: string | null;
  timestamp?: number | string | null;
  date?: string | null;
}): string {
  const rawTime = String(msg.time ?? "").trim();
  const clockMatch = rawTime.match(/^(\d{1,2}):(\d{2})/);
  if (clockMatch) {
    return `${clockMatch[1].padStart(2, "0")}:${clockMatch[2]}`;
  }
  const ms = messageTimeMs(msg);
  if (!Number.isFinite(ms) || ms === Number.POSITIVE_INFINITY) return "";
  return new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function sortMessagesChronologically<
  T extends {
    timestamp?: number | string | null;
    date?: string | null;
    time?: string | null;
    conversation_id?: number;
  },
>(items: T[]): T[] {
  return [...items].sort((left, right) => {
    const timeDelta = messageTimeMs(left) - messageTimeMs(right);
    if (timeDelta !== 0) return timeDelta;
    return Number(left.conversation_id || 0) - Number(right.conversation_id || 0);
  });
}

type ChatTimeFields = {
  timestamp?: number | string | null;
  date?: string | null;
  time?: string | null;
};

export function calendarDayKey(value: Date | number = new Date()): string {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function messageDayKey(msg: ChatTimeFields): string | null {
  const ms = messageTimeMs(msg);
  if (!Number.isFinite(ms) || ms === Number.POSITIVE_INFINITY) return null;
  return calendarDayKey(ms);
}

export function isSameChatDay(left: ChatTimeFields, right: ChatTimeFields): boolean {
  const leftKey = messageDayKey(left);
  const rightKey = messageDayKey(right);
  return Boolean(leftKey && rightKey && leftKey === rightKey);
}

export function formatChatDayLabel(
  msg: ChatTimeFields,
  now: Date | number = new Date(),
): string {
  const key = messageDayKey(msg);
  if (!key) return "";
  const current = now instanceof Date ? now : new Date(now);
  const todayKey = calendarDayKey(current);
  const yesterday = new Date(current);
  yesterday.setDate(yesterday.getDate() - 1);
  if (key === todayKey) return "Today";
  if (key === calendarDayKey(yesterday)) return "Yesterday";

  const ms = messageTimeMs(msg);
  const date = new Date(ms);
  return date.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(date.getFullYear() !== current.getFullYear() ? { year: "numeric" } : {}),
  });
}
