import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { queryKeys } from "./keys.ts";

describe("queryKeys", () => {
  it("keeps tab caches on stable keys", () => {
    assert.deepEqual(queryKeys.biomarkers, ["biomarkers"]);
    assert.deepEqual(queryKeys.clientInformation, ["client-information"]);
    assert.deepEqual(queryKeys.chatMessages("ai"), ["chat-messages", "ai"]);
    assert.deepEqual(queryKeys.chatMessages("coach"), ["chat-messages", "coach"]);
  });
});
