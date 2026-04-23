import { storage } from "../db/StorageService.js";
import {
  formatDate,
  getStatusClass,
  getStatusLabel,
  getTopicLabel,
  logout,
  requireAuth,
} from "../app.js";
import { ROLES, TICKET_STATUSES, TICKET_TOPICS } from "../models/models.js";

const admin = requireAuth([ROLES.ADMIN]);
if (!admin) {
  throw new Error("Unauthorized");
}

let allRows = [];
let openedTicket = null;

document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("closeAdminTicketModalBtn").addEventListener("click", () => closeModal("adminTicketModal"));
document.getElementById("statusFilter").addEventListener("change", renderTable);
document.getElementById("topicFilter").addEventListener("change", renderTable);
document.getElementById("searchFilter").addEventListener("input", renderTable);

document.getElementById("adminReplyForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!openedTicket) {
    return;
  }
  const content = document.getElementById("adminReplyInput").value.trim();
  const status = document.getElementById("adminStatusSelect").value;
  if (!content) {
    return;
  }

  await storage.addMessage({
    ticketId: openedTicket.id,
    senderId: admin.id,
    senderRole: ROLES.ADMIN,
    content,
    attachment: null,
  });
  await storage.updateTicketStatus(openedTicket.id, status);
  document.getElementById("adminReplyInput").value = "";

  await loadData();
  await openTicketModal(openedTicket.id);
});

function openModal(id) {
  document.getElementById(id).classList.remove("hidden");
}

function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}

function fillFilters() {
  const topicFilter = document.getElementById("topicFilter");
  topicFilter.innerHTML =
    `<option value="all">Все темы</option>` +
    Object.entries(TICKET_TOPICS)
      .map(([value, label]) => `<option value="${value}">${label}</option>`)
      .join("");
}

async function loadData() {
  const tickets = await storage.getAllTicketsWithUsers();
  const messagesByTicket = await Promise.all(
    tickets.map(async (ticket) => {
      const messages = await storage.getMessagesByTicket(ticket.id);
      return { ticketId: ticket.id, firstMessage: messages[0], messages };
    })
  );

  allRows = tickets.map((ticket) => {
    const messageInfo = messagesByTicket.find((m) => m.ticketId === ticket.id);
    return {
      ...ticket,
      firstMessage: messageInfo?.firstMessage,
      messages: messageInfo?.messages || [],
    };
  });
  renderTable();
}

function renderTable() {
  const status = document.getElementById("statusFilter").value;
  const topic = document.getElementById("topicFilter").value;
  const search = document.getElementById("searchFilter").value.trim().toLowerCase();
  const tbody = document.getElementById("ticketsTbody");

  const filtered = allRows.filter((row) => {
    const statusMatch = status === "all" || row.status === status;
    const topicMatch = topic === "all" || row.subject === topic;
    const byName = row.user?.name?.toLowerCase().includes(search);
    const byEmail = row.user?.email?.toLowerCase().includes(search);
    const searchMatch = !search || byName || byEmail;
    return statusMatch && topicMatch && searchMatch;
  });

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-gray-500">Ничего не найдено</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered
    .map(
      (row) => `
      <tr class="border-b">
        <td class="p-3">${formatDate(row.createdAt)}</td>
        <td class="p-3">${row.user?.name || "-"}</td>
        <td class="p-3">${row.user?.email || "-"}</td>
        <td class="p-3">${getTopicLabel(row.subject)}</td>
        <td class="p-3">${(row.firstMessage?.content || "").slice(0, 70)}</td>
        <td class="p-3"><span class="status-pill ${getStatusClass(row.status)}">${getStatusLabel(row.status)}</span></td>
        <td class="p-3"><button class="px-3 py-1 bg-blue-700 text-white rounded hover:bg-blue-800" data-open-ticket="${row.id}">Открыть</button></td>
      </tr>
    `
    )
    .join("");

  tbody.querySelectorAll("[data-open-ticket]").forEach((btn) => {
    btn.addEventListener("click", () => openTicketModal(btn.dataset.openTicket));
  });
}

async function openTicketModal(ticketId) {
  openedTicket = allRows.find((row) => row.id === ticketId);
  if (!openedTicket) {
    return;
  }

  const modalMeta = document.getElementById("adminTicketMeta");
  const chat = document.getElementById("adminChatHistory");
  const statusSelect = document.getElementById("adminStatusSelect");

  modalMeta.innerHTML = `
    <p><strong>Автор:</strong> ${openedTicket.user?.name || "-"}</p>
    <p><strong>Email:</strong> ${openedTicket.user?.email || "-"}</p>
    <p><strong>Телефон:</strong> ${openedTicket.user?.phone || "-"}</p>
    <p><strong>Тема:</strong> ${getTopicLabel(openedTicket.subject)}</p>
    <p><strong>Создано:</strong> ${formatDate(openedTicket.createdAt)}</p>
  `;

  chat.innerHTML = openedTicket.messages
    .map(
      (message) => `
      <div class="chat-bubble ${message.senderRole === ROLES.ADMIN ? "chat-admin" : "chat-user"}">
        <p>${message.content}</p>
        <p class="text-[11px] opacity-70 mt-1">${formatDate(message.createdAt)}</p>
      </div>
    `
    )
    .join("");

  statusSelect.innerHTML = `
    <option value="${TICKET_STATUSES.NEW}">Новое</option>
    <option value="${TICKET_STATUSES.IN_PROGRESS}">В работе</option>
    <option value="${TICKET_STATUSES.CLOSED}">Завершено</option>
  `;
  statusSelect.value = openedTicket.status;
  openModal("adminTicketModal");
}

fillFilters();
loadData();
