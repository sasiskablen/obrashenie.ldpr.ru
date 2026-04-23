import { storage } from "../db/StorageService.js";
import { getCurrentUser, getStatusClass, getStatusLabel, getTopicLabel, logout, requireAuth, formatDate } from "../app.js";
import { ROLES, TICKET_TOPICS } from "../models/models.js";

let selectedFileName = null;
let activeTicketId = null;

const user = requireAuth([ROLES.USER]);
if (!user) {
  throw new Error("Unauthorized");
}

document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("userGreeting").textContent = `Здравствуйте, ${getCurrentUser().name}`;

document.getElementById("openCreateTicketModalBtn").addEventListener("click", () => {
  openModal("createTicketModal");
});

document.getElementById("closeCreateTicketModalBtn").addEventListener("click", () => {
  closeModal("createTicketModal");
});

document.getElementById("closeTicketChatModalBtn").addEventListener("click", () => {
  closeModal("ticketChatModal");
});

document.getElementById("attachmentInput").addEventListener("change", (event) => {
  const file = event.target.files[0];
  selectedFileName = file ? file.name : null;
  document.getElementById("attachmentName").textContent = selectedFileName
    ? `Файл: ${selectedFileName}`
    : "Файл не выбран";
});

document.getElementById("createTicketForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const subject = document.getElementById("ticketSubject").value;
  const content = document.getElementById("ticketMessage").value.trim();
  if (!content) {
    return;
  }

  const ticket = await storage.createTicket({
    userId: user.id,
    subject,
  });

  await storage.addMessage({
    ticketId: ticket.id,
    senderId: user.id,
    senderRole: ROLES.USER,
    content,
    attachment: selectedFileName,
  });

  event.target.reset();
  selectedFileName = null;
  document.getElementById("attachmentName").textContent = "Файл не выбран";
  closeModal("createTicketModal");
  await renderTickets();
});

document.getElementById("sendUserMessageForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!activeTicketId) {
    return;
  }
  const input = document.getElementById("userChatInput");
  const content = input.value.trim();
  if (!content) {
    return;
  }

  await storage.addMessage({
    ticketId: activeTicketId,
    senderId: user.id,
    senderRole: ROLES.USER,
    content,
    attachment: null,
  });
  input.value = "";
  await openTicketChat(activeTicketId);
  await renderTickets();
});

function openModal(id) {
  document.getElementById(id).classList.remove("hidden");
}

function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}

async function renderTickets() {
  const tickets = await storage.getTickets();
  const messages = (await Promise.all(tickets.map((ticket) => storage.getMessagesByTicket(ticket.id)))).flat();
  const list = document.getElementById("ticketsList");
  const ownTickets = tickets
    .filter((ticket) => ticket.userId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (ownTickets.length === 0) {
    list.innerHTML = `<p class="text-gray-500">У вас пока нет обращений.</p>`;
    return;
  }

  list.innerHTML = ownTickets
    .map((ticket) => {
      const firstMessage = messages.find((message) => message.ticketId === ticket.id);
      return `
      <button class="w-full text-left bg-white p-4 rounded-xl shadow hover:shadow-md transition" data-ticket-id="${ticket.id}">
        <div class="flex items-center justify-between gap-2">
          <h3 class="font-semibold text-blue-900">${getTopicLabel(ticket.subject)}</h3>
          <span class="status-pill ${getStatusClass(ticket.status)}">${getStatusLabel(ticket.status)}</span>
        </div>
        <p class="text-sm text-gray-500 mt-1">${formatDate(ticket.createdAt)}</p>
        <p class="text-gray-700 mt-2">${(firstMessage?.content || "Без текста").slice(0, 120)}</p>
      </button>
    `;
    })
    .join("");

  list.querySelectorAll("[data-ticket-id]").forEach((button) => {
    button.addEventListener("click", () => openTicketChat(button.dataset.ticketId));
  });
}

async function openTicketChat(ticketId) {
  activeTicketId = ticketId;
  const ticket = (await storage.getTickets()).find((item) => item.id === ticketId);
  const messages = await storage.getMessagesByTicket(ticketId);
  const chatTitle = document.getElementById("chatTitle");
  const chatMessages = document.getElementById("chatMessages");

  chatTitle.textContent = `${getTopicLabel(ticket.subject)} • ${getStatusLabel(ticket.status)}`;
  chatMessages.innerHTML = messages
    .map(
      (message) => `
      <div class="chat-bubble ${message.senderRole === ROLES.ADMIN ? "chat-admin" : "chat-user"}">
        <p class="text-sm">${message.content}</p>
        ${
          message.attachment
            ? `<p class="text-xs opacity-80 mt-1">Вложение: ${message.attachment}</p>`
            : ""
        }
        <p class="text-[11px] opacity-70 mt-1">${formatDate(message.createdAt)}</p>
      </div>
    `
    )
    .join("");

  openModal("ticketChatModal");
}

function fillTopics() {
  const select = document.getElementById("ticketSubject");
  select.innerHTML = Object.entries(TICKET_TOPICS)
    .map(([value, label]) => `<option value="${value}">${label}</option>`)
    .join("");
}

fillTopics();
renderTickets();
