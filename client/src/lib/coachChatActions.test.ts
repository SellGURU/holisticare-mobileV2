import assert from "node:assert/strict";
import test from "node:test";
import {
  applyDeletedPlaceholder,
  canDeleteCoachChatMessage,
  canReactToCoachChatMessage,
  messageDomId,
  replyPreviewTitle,
  toggleReactionSummaries,
} from "./coachChatActions.ts";

test("reply preview names the original sender", () => {
  assert.equal(
    replyPreviewTitle({
      conversation_id: 9,
      message_text: "Need a follow up",
      sender_type: "user",
      deleted: false,
      name: "Coach",
    }),
    "Replying to Coach",
  );
  assert.equal(
    replyPreviewTitle({
      conversation_id: 9,
      message_text: "",
      sender_type: "user",
      deleted: true,
      name: "Coach",
    }),
    "Original message deleted",
  );
});

test("only own undeleted patient messages can be deleted", () => {
  assert.equal(
    canDeleteCoachChatMessage({ sender_type: "user", conversation_id: 3 }),
    false,
  );
  assert.equal(
    canDeleteCoachChatMessage({
      sender_type: "patient",
      deleted: true,
      conversation_id: 3,
    }),
    false,
  );
  assert.equal(
    canDeleteCoachChatMessage({ sender_type: "patient", conversation_id: 3 }),
    true,
  );
});

test("patient cannot react to their own coach-chat message", () => {
  assert.equal(
    canReactToCoachChatMessage({ sender_type: "patient", conversation_id: 3 }),
    false,
  );
  assert.equal(
    canReactToCoachChatMessage({ sender_type: "user", conversation_id: 3 }),
    true,
  );
  assert.equal(
    canReactToCoachChatMessage({
      sender_type: "user",
      deleted: true,
      conversation_id: 3,
    }),
    false,
  );
});

test("deleted placeholder clears the message text", () => {
  const deleted = applyDeletedPlaceholder({
    conversation_id: 4,
    message_text: "secret",
    deleted: false,
  });
  assert.equal(deleted.deleted, true);
  assert.equal(deleted.message_text, "");
});

test("toggle reaction adds, switches, and removes the mine emoji", () => {
  const added = toggleReactionSummaries([], "❤️");
  assert.deepEqual(added, [{ emoji: "❤️", count: 1, mine: true }]);
  const switched = toggleReactionSummaries(added, "👍");
  assert.deepEqual(switched, [{ emoji: "👍", count: 1, mine: true }]);
  const removed = toggleReactionSummaries(switched, "👍");
  assert.deepEqual(removed, []);
});

test("message dom id is stable for jump-to-reply", () => {
  assert.equal(messageDomId(44), "msg-44");
});
