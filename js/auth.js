import { storage } from "./db/StorageService.js";
import { ROLES } from "./models/models.js";

const SESSION_KEY = "currentUser";

export function simpleHash(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

export function setSession(user) {
  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
}

export function getSessionUser() {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (_error) {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export async function login(email, password) {
  const users = await storage.getUsers();
  const passwordHash = simpleHash(password);
  const user = users.find(
    (item) =>
      item.email.toLowerCase() === email.toLowerCase().trim() &&
      item.passwordHash === passwordHash
  );
  if (!user) {
    throw new Error("Неверный email или пароль");
  }
  setSession(user);
  return user;
}

export async function register(payload) {
  const users = await storage.getUsers();
  const existing = users.find(
    (item) => item.email.toLowerCase() === payload.email.toLowerCase().trim()
  );
  if (existing) {
    throw new Error("Пользователь с таким email уже существует");
  }

  if (payload.password.length < 6) {
    throw new Error("Пароль должен быть не менее 6 символов");
  }

  const user = await storage.createUser({
    name: payload.name.trim(),
    email: payload.email.trim(),
    phone: payload.phone.trim(),
    address: payload.address.trim(),
    passwordHash: simpleHash(payload.password),
    role: ROLES.USER,
  });

  setSession(user);
  return user;
}

export function redirectAfterLogin(user) {
  if (user.role === ROLES.ADMIN) {
    window.location.href = "admin-dashboard.html";
  } else {
    window.location.href = "user-dashboard.html";
  }
}
