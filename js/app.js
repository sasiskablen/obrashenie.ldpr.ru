import { clearSession, getSessionUser } from "./auth.js";
import { ROLES, STATUS_COLORS, STATUS_LABELS, TICKET_TOPICS } from "./models/models.js";

export function formatDate(iso) {
  return new Date(iso).toLocaleString("ru-RU");
}

export function getTopicLabel(topicKey) {
  return TICKET_TOPICS[topicKey] || topicKey;
}

export function getStatusLabel(statusKey) {
  return STATUS_LABELS[statusKey] || statusKey;
}

export function getStatusClass(statusKey) {
  return STATUS_COLORS[statusKey] || "";
}

export function getCurrentUser() {
  return getSessionUser();
}

export function requireAuth(allowedRoles = []) {
  const user = getSessionUser();
  if (!user) {
    window.location.href = "index.html";
    return null;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    if (user.role === ROLES.ADMIN) {
      window.location.href = "admin-dashboard.html";
    } else {
      window.location.href = "user-dashboard.html";
    }
    return null;
  }
  return user;
}

export function logout() {
  clearSession();
  window.location.href = "index.html";
}
