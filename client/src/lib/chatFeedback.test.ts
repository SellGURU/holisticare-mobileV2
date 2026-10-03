import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  chatFeedbackPayload,
  normalizeChatFeedback,
  reactionsFromMessages,
} from "./chatFeedback.ts";

describe("chat feedback mapping", () => {
  it("normalizes like and dislike values from the server", () => {
    assert.equal(normalizeChatFeedback("like"), "liked");
    assert.equal(normalizeChatFeedback("liked"), "liked");
    assert.equal(normalizeChatFeedback("dislike"), "disliked");
    assert.equal(normalizeChatFeedback("disliked"), "disliked");
    assert.equal(normalizeChatFeedback(null), null);
  });

  it("sends the API payload the backend expects", () => {
    assert.equal(chatFeedbackPayload("liked"), "like");
    assert.equal(chatFeedbackPayload("disliked"), "dislike");
    assert.equal(chatFeedbackPayload(null), null);
  });

  it("rebuilds reactions from cached message feedback", () => {
    assert.deepEqual(
      reactionsFromMessages([
        { conversation_id: 11, feedback: "like" },
        { conversation_id: 12, feedback: "dislike" },
        { conversation_id: 13, feedback: null },
      ]),
      { 11: "liked", 12: "disliked" },
    );
  });
});
