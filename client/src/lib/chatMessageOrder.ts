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
