import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  COACH_CHAT_BACKGROUND_POLL_MS,
  COACH_CHAT_LIVE_POLL_MS,
  coachChatRefetchIntervalMs,
  isDocumentVisible,
} from "./coachChatPoll.ts";

describe("coachChatRefetchIntervalMs", () => {
  it("polls every 5s while the chat screen is visible", () => {
    assert.equal(coachChatRefetchIntervalMs(true), COACH_CHAT_LIVE_POLL_MS);
  });

  it("backs off to 15s when the app is in the background", () => {
    assert.equal(
      coachChatRefetchIntervalMs(false),
      COACH_CHAT_BACKGROUND_POLL_MS,
    );
  });
});

describe("isDocumentVisible", () => {
  it("treats hidden as not visible", () => {
    assert.equal(isDocumentVisible("hidden"), false);
    assert.equal(isDocumentVisible("visible"), true);
  });
});
