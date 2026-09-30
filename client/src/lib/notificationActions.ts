export const OPEN_HEALTH_REPORT_ACTION = "open_health_report";
export const OPEN_QUESTIONNAIRES_ACTION = "open_questionnaires";
export const OPEN_CHAT_ACTION = "open_chat";

const REPORT_READY_TYPES = new Set(["report_ready", "html_report_ready"]);
const REPORT_READY_TITLE = "health report ready";
const CHAT_MESSAGE_TYPES = new Set(["chat_messages", "chat_message"]);

export function isQuestionnaireNotification(notification: {
  title?: string | null;
  notification_type?: string | null;
  action?: string | null;
}): boolean {
  const action = String(notification.action ?? "").trim();
  if (action === OPEN_QUESTIONNAIRES_ACTION) return true;
  const type = String(notification.notification_type ?? "").trim().toLowerCase();
  if (type === "questionnaire_assigned") return true;
  const title = String(notification.title ?? "").trim().toLowerCase();
  return title.includes("questionnaire");
}

export function isChatNotification(notification: {
  title?: string | null;
  notification_type?: string | null;
  action?: string | null;
  message?: string | null;
}): boolean {
  const action = String(notification.action ?? "").trim();
  if (action === OPEN_CHAT_ACTION) return true;
  const type = String(notification.notification_type ?? "").trim().toLowerCase();
  if (CHAT_MESSAGE_TYPES.has(type)) return true;
  const title = String(notification.title ?? "").trim().toLowerCase();
  if (title.includes("message from your coach")) return true;
  const message = String(notification.message ?? "").trim().toLowerCase();
  return message.includes("open the chat");
}

export function resolveNotificationAction(notification: {
  action?: string | null;
  notification_type?: string | null;
  title?: string | null;
  message?: string | null;
}): string | null {
  if (notification.action) return String(notification.action);
  const type = String(notification.notification_type ?? "")
    .trim()
    .toLowerCase();
  if (REPORT_READY_TYPES.has(type)) return OPEN_HEALTH_REPORT_ACTION;
  const title = String(notification.title ?? "").trim().toLowerCase();
  if (title === REPORT_READY_TITLE) return OPEN_HEALTH_REPORT_ACTION;
  if (isQuestionnaireNotification({
    title: notification.title,
    notification_type: notification.notification_type,
  })) {
    return OPEN_QUESTIONNAIRES_ACTION;
  }
  if (isChatNotification({
    title: notification.title,
    notification_type: notification.notification_type,
    message: notification.message,
  })) {
    return OPEN_CHAT_ACTION;
  }
  return null;
}

export function isQuestionnairePushEvent(event: {
  detail?: {
    data?: Record<string, unknown>;
    title?: string;
    body?: string;
  };
}): boolean {
  const data = event.detail?.data ?? {};
  const action = String(data.action ?? "");
  if (action === OPEN_QUESTIONNAIRES_ACTION) return true;
  const type = String(data.type ?? "").toLowerCase();
  if (type === "questionnaire_assigned") return true;
  const title = String(
    event.detail?.title ?? data.title ?? "",
  ).toLowerCase();
  const body = String(event.detail?.body ?? data.body ?? "").toLowerCase();
  return title.includes("questionnaire") || body.includes("questionnaire");
}

export function isChatPushEvent(event: {
  detail?: {
    data?: Record<string, unknown>;
    title?: string;
    body?: string;
  };
}): boolean {
  const data = event.detail?.data ?? {};
  const action = String(data.action ?? "");
  if (action === OPEN_CHAT_ACTION) return true;
  const type = String(data.type ?? "").toLowerCase();
  if (CHAT_MESSAGE_TYPES.has(type)) return true;
  const title = String(
    event.detail?.title ?? data.title ?? "",
  ).toLowerCase();
  const body = String(event.detail?.body ?? data.body ?? "").toLowerCase();
  return (
    title.includes("message from your coach") ||
    body.includes("open the chat") ||
    body.includes("open the app to read")
  );
}
