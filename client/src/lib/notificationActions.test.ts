import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isChatNotification,
  isChatPushEvent,
  OPEN_CHAT_ACTION,
  resolveNotificationAction,
} from "./notificationActions.ts";

describe("coach chat notifications", () => {
  it("opens chat from typed and titled coach messages", () => {
    assert.equal(
      resolveNotificationAction({
        notification_type: "chat_messages",
        title: "Anything",
      }),
      OPEN_CHAT_ACTION,
    );
    assert.equal(
      resolveNotificationAction({
        notification_type: "info",
        title: "Message from Your Coach",
      }),
      OPEN_CHAT_ACTION,
    );
    assert.equal(
      isChatNotification({ title: "Message from Your Coach" }),
      true,
    );
  });

  it("opens chat when a coach push is tapped", () => {
    assert.equal(
      isChatPushEvent({
        detail: {
          data: { type: "chat_messages", action: OPEN_CHAT_ACTION },
          title: "Message from Your Coach",
        },
      }),
      true,
    );
    assert.equal(
      isChatPushEvent({
        detail: {
          data: { type: "info" },
          title: "Message from Your Coach",
          body: "You have a new message waiting. Open the app to read it now.",
        },
      }),
      true,
    );
  });

  it("does not treat unrelated notifications as chat", () => {
    assert.equal(
      resolveNotificationAction({ notification_type: "info", title: "Hello" }),
      null,
    );
    assert.equal(
      isChatPushEvent({
        detail: { data: { type: "report_ready" }, title: "Health Report Ready" },
      }),
      false,
    );
  });
});
