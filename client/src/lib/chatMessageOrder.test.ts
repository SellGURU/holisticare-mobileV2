import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatChatDayLabel,
  formatMessageClock,
  isSameChatDay,
  messageDayKey,
  sortMessagesChronologically,
} from "./chatMessageOrder.ts";

describe("sortMessagesChronologically", () => {
  it("orders by timestamp and keeps optimistic messages last when time is missing", () => {
    const ordered = sortMessagesChronologically([
      { conversation_id: 0, message: "why" },
      { conversation_id: 9, timestamp: 1_000, message: "later" },
      {
        conversation_id: 3,
        date: "2026-09-30",
        time: "09:15",
        message: "hi",
      },
      { conversation_id: 8, timestamp: 500, message: "earlier" },
    ]);
    assert.deepEqual(
      ordered.map((item) => item.message),
      ["earlier", "later", "hi", "why"],
    );
  });

  it("does not use random conversation ids when timestamps exist", () => {
    const ordered = sortMessagesChronologically([
      { conversation_id: 999, timestamp: 200, text: "second" },
      { conversation_id: 1, timestamp: 100, text: "first" },
    ]);
    assert.deepEqual(
      ordered.map((item) => item.text),
      ["first", "second"],
    );
  });
});

describe("formatMessageClock", () => {
  it("keeps HH:mm on every message even when time is missing from the payload", () => {
    assert.equal(formatMessageClock({ time: "9:15" }), "09:15");
    assert.equal(
      formatMessageClock({ timestamp: Date.parse("2026-09-30T09:34:00") }),
      new Date(Date.parse("2026-09-30T09:34:00")).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    );
  });
});

describe("chat day grouping", () => {
  const now = new Date(2026, 9, 3, 12, 0, 0);

  it("labels today, yesterday, and older dates", () => {
    assert.equal(
      formatChatDayLabel(
        { timestamp: new Date(2026, 9, 3, 8, 15, 0).getTime() },
        now,
      ),
      "Today",
    );
    assert.equal(
      formatChatDayLabel(
        { timestamp: new Date(2026, 9, 2, 18, 40, 0).getTime() },
        now,
      ),
      "Yesterday",
    );
    assert.equal(
      formatChatDayLabel(
        { timestamp: new Date(2026, 8, 30, 9, 15, 0).getTime() },
        now,
      ),
      new Date(2026, 8, 30, 9, 15, 0).toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    );
  });

  it("includes the year for older-year messages", () => {
    const label = formatChatDayLabel(
      { timestamp: new Date(2025, 11, 20, 10, 0, 0).getTime() },
      now,
    );
    assert.match(label, /2025/);
  });

  it("treats ISO timestamps and date+time as the same local day", () => {
    const local = new Date(2026, 9, 2, 18, 0, 0);
    const iso = { date: local.toISOString() };
    const parts = {
      date: "2026-10-02",
      time: "18:00",
    };
    assert.equal(messageDayKey(iso), messageDayKey({ timestamp: local.getTime() }));
    assert.equal(isSameChatDay(parts, { timestamp: local.getTime() }), true);
    assert.equal(
      isSameChatDay(
        { timestamp: new Date(2026, 9, 2, 23, 50, 0).getTime() },
        { timestamp: new Date(2026, 9, 3, 0, 10, 0).getTime() },
      ),
      false,
    );
  });
});
