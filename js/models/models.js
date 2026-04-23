export const STORAGE_KEY = "ldpr_app_db";

export const ROLES = {
  USER: "user",
  ADMIN: "admin",
};

export const TICKET_STATUSES = {
  NEW: "new",
  IN_PROGRESS: "in_progress",
  CLOSED: "closed",
};

export const STATUS_LABELS = {
  [TICKET_STATUSES.NEW]: "Новое",
  [TICKET_STATUSES.IN_PROGRESS]: "В работе",
  [TICKET_STATUSES.CLOSED]: "Завершено",
};

export const STATUS_COLORS = {
  [TICKET_STATUSES.NEW]: "status-new",
  [TICKET_STATUSES.IN_PROGRESS]: "status-progress",
  [TICKET_STATUSES.CLOSED]: "status-closed",
};

export const TICKET_TOPICS = {
  question: "Вопрос депутату",
  complaint: "Жалоба на ЖКХ",
  social_help: "Помощь в соцзащите",
  suggestion: "Общее предложение",
};

export const DEFAULT_DB = {
  users: [],
  tickets: [],
  messages: [],
};
