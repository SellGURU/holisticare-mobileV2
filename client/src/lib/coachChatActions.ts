export const CHAT_REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"] as const;

export type CoachChatReaction = {
  emoji: string;
  count: number;
  mine: boolean;
};

export type CoachReplyPreview = {
  conversation_id: number;
  message_text: string;
  sender_type: string | null;
  deleted: boolean;
  name?: string;
};

export async function copyChatText(text: string): Promise<boolean> {
  const value = String(text || "").trim();
  if (!value || typeof navigator === "undefined" || !navigator.clipboard) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export function messageDomId(conversationId: number): string {
  return `msg-${conversationId}`;
}

export function replyPreviewTitle(preview: CoachReplyPreview): string {
  if (preview.deleted) {
    return "Original message deleted";
  }
  const name = (preview.name || "").trim();
  return name ? `Replying to ${name}` : "Replying to a message";
}

export function canDeleteCoachChatMessage(message: {
  sender_type?: string;
  deleted?: boolean;
  conversation_id?: number;
}): boolean {
  return (
    message.sender_type === "patient" &&
    !message.deleted &&
    Number(message.conversation_id || 0) > 0
  );
}

export function canReactToCoachChatMessage(message: {
  sender_type?: string;
  deleted?: boolean;
  conversation_id?: number;
}): boolean {
  return (
    message.sender_type === "user" &&
    !message.deleted &&
    Number(message.conversation_id || 0) > 0
  );
}

export function applyDeletedPlaceholder<T extends { deleted?: boolean; message_text?: string }>(
  message: T,
): T {
  return {
    ...message,
    deleted: true,
    message_text: "",
  };
}

export function toggleReactionSummaries(
  current: CoachChatReaction[] | undefined,
  emoji: string,
): CoachChatReaction[] {
  const existing = current || [];
  const mine = existing.find((reaction) => reaction.mine);
  let next = existing
    .map((reaction) =>
      reaction.mine
        ? { ...reaction, count: Math.max(0, reaction.count - 1), mine: false }
        : reaction,
    )
    .filter((reaction) => reaction.count > 0);
  if (!mine || mine.emoji !== emoji) {
    const match = next.find((reaction) => reaction.emoji === emoji);
    next = match
      ? next.map((reaction) =>
          reaction.emoji === emoji
            ? { ...reaction, count: reaction.count + 1, mine: true }
            : reaction,
        )
      : [...next, { emoji, count: 1, mine: true }];
  }
  return next;
}
