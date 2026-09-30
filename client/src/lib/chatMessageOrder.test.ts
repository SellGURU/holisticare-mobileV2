import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatMessageClock, sortMessagesChronologically } from "./chatMessageOrder.ts";

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
