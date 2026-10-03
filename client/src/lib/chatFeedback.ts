export type ChatReaction = "liked" | "disliked" | null;

export function normalizeChatFeedback(
  value?: string | null,
): ChatReaction {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "like" || raw === "liked") return "liked";
  if (raw === "dislike" || raw === "disliked") return "disliked";
  return null;
}

export function chatFeedbackPayload(
  reaction: ChatReaction,
): "like" | "dislike" | null {
  if (reaction === "liked") return "like";
  if (reaction === "disliked") return "dislike";
  return null;
}

export function reactionsFromMessages(
  messages: Array<{ conversation_id?: number; feedback?: string | null }>,
): Record<number, ChatReaction> {
  const feedbackState: Record<number, ChatReaction> = {};
  messages.forEach((msg) => {
    const reaction = normalizeChatFeedback(msg.feedback);
    if (reaction != null && msg.conversation_id != null) {
      feedbackState[msg.conversation_id] = reaction;
    }
  });
  return feedbackState;
}
