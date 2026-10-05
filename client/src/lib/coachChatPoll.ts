export const COACH_CHAT_LIVE_POLL_MS = 5_000;
export const COACH_CHAT_BACKGROUND_POLL_MS = 15_000;

export function isDocumentVisible(
  visibilityState: string | undefined = typeof document === "undefined"
    ? undefined
    : document.visibilityState,
): boolean {
  return visibilityState !== "hidden";
}

export function coachChatRefetchIntervalMs(visible: boolean): number {
  return visible ? COACH_CHAT_LIVE_POLL_MS : COACH_CHAT_BACKGROUND_POLL_MS;
}
