import {
  DEFAULT_DB,
  ROLES,
  STORAGE_KEY,
  TICKET_STATUSES,
} from "../models/models.js";

function simpleHash(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

class IStorageService {
  async getUsers() {
    throw new Error("Not implemented");
  }

  async createUser(user) {
    throw new Error("Not implemented");
  }

  async getTickets() {
    throw new Error("Not implemented");
  }

  async createTicket(ticket) {
    throw new Error("Not implemented");
  }

  async getMessagesByTicket(ticketId) {
    throw new Error("Not implemented");
  }

  async addMessage(message) {
    throw new Error("Not implemented");
  }

  async updateTicketStatus(ticketId, status) {
    throw new Error("Not implemented");
  }

  async getAllTicketsWithUsers() {
    throw new Error("Not implemented");
  }
}

class LocalStorageService extends IStorageService {
  constructor() {
    super();
    this.ensureInitialized();
  }

  ensureInitialized() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = this.generateSeedData();
      this.writeDb(seeded);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      if (
        !parsed ||
        !Array.isArray(parsed.users) ||
        !Array.isArray(parsed.tickets) ||
        !Array.isArray(parsed.messages)
      ) {
        this.writeDb(this.generateSeedData());
      }
    } catch (_error) {
      this.writeDb(this.generateSeedData());
    }
  }

  readDb() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return JSON.parse(JSON.stringify(DEFAULT_DB));
    }
    try {
      return JSON.parse(raw);
    } catch (_error) {
      const fallback = this.generateSeedData();
      this.writeDb(fallback);
      return fallback;
    }
  }

  writeDb(db) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }

  createId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
  }

  nowIso() {
    return new Date().toISOString();
  }

  generateSeedData() {
    const createdAt = this.nowIso();

    const adminId = this.createId("usr");
    const user1Id = this.createId("usr");
    const user2Id = this.createId("usr");

    const users = [
      {
        id: adminId,
        name: "Секретарь ЛДПР",
        email: "admin@ldpr.ru",
        passwordHash: simpleHash("admin123"),
        phone: "+7 (900) 111-22-33",
        address: "г. Москва, Центральный офис",
        role: ROLES.ADMIN,
        createdAt,
      },
      {
        id: user1Id,
        name: "Иванов Иван Иванович",
        email: "ivanov@mail.ru",
        passwordHash: simpleHash("123456"),
        phone: "+7 (901) 100-20-30",
        address: "г. Тула, ул. Ленина, 10",
        role: ROLES.USER,
        createdAt,
      },
      {
        id: user2Id,
        name: "Петрова Мария Сергеевна",
        email: "petrova@mail.ru",
        passwordHash: simpleHash("123456"),
        phone: "+7 (902) 111-11-11",
        address: "г. Калуга, ул. Гагарина, 15",
        role: ROLES.USER,
        createdAt,
      },
    ];

    const tickets = [
      {
        id: this.createId("tkt"),
        userId: user1Id,
        subject: "question",
        status: TICKET_STATUSES.NEW,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: this.createId("tkt"),
        userId: user1Id,
        subject: "complaint",
        status: TICKET_STATUSES.IN_PROGRESS,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: this.createId("tkt"),
        userId: user2Id,
        subject: "social_help",
        status: TICKET_STATUSES.CLOSED,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: this.createId("tkt"),
        userId: user2Id,
        subject: "suggestion",
        status: TICKET_STATUSES.NEW,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: this.createId("tkt"),
        userId: user1Id,
        subject: "question",
        status: TICKET_STATUSES.IN_PROGRESS,
        createdAt,
        updatedAt: createdAt,
      },
    ];

    const messages = [
      {
        id: this.createId("msg"),
        ticketId: tickets[0].id,
        senderId: user1Id,
        senderRole: ROLES.USER,
        content: "Здравствуйте! Когда будет прием депутата в моем районе?",
        attachment: null,
        createdAt,
      },
      {
        id: this.createId("msg"),
        ticketId: tickets[1].id,
        senderId: user1Id,
        senderRole: ROLES.USER,
        content: "Жалоба на постоянные отключения горячей воды в доме.",
        attachment: "акт_жкх.pdf",
        createdAt,
      },
      {
        id: this.createId("msg"),
        ticketId: tickets[1].id,
        senderId: adminId,
        senderRole: ROLES.ADMIN,
        content: "Принято в работу. Передали обращение в профильный комитет.",
        attachment: null,
        createdAt,
      },
      {
        id: this.createId("msg"),
        ticketId: tickets[2].id,
        senderId: user2Id,
        senderRole: ROLES.USER,
        content: "Нужна помощь в оформлении льготы для пенсионера.",
        attachment: null,
        createdAt,
      },
      {
        id: this.createId("msg"),
        ticketId: tickets[2].id,
        senderId: adminId,
        senderRole: ROLES.ADMIN,
        content: "Вопрос решен, свяжитесь с соцслужбой по направлению.",
        attachment: null,
        createdAt,
      },
    ];

    return { users, tickets, messages };
  }

  async getUsers() {
    return this.readDb().users;
  }

  async createUser(user) {
    const db = this.readDb();
    const newUser = {
      id: this.createId("usr"),
      createdAt: this.nowIso(),
      ...user,
    };
    db.users.push(newUser);
    this.writeDb(db);
    return newUser;
  }

  async getTickets() {
    return this.readDb().tickets;
  }

  async createTicket(ticket) {
    const db = this.readDb();
    const now = this.nowIso();
    const newTicket = {
      id: this.createId("tkt"),
      status: TICKET_STATUSES.NEW,
      createdAt: now,
      updatedAt: now,
      ...ticket,
    };
    db.tickets.push(newTicket);
    this.writeDb(db);
    return newTicket;
  }

  async getMessagesByTicket(ticketId) {
    return this.readDb()
      .messages.filter((message) => message.ticketId === ticketId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async addMessage(message) {
    const db = this.readDb();
    const newMessage = {
      id: this.createId("msg"),
      createdAt: this.nowIso(),
      attachment: null,
      ...message,
    };
    db.messages.push(newMessage);
    this.writeDb(db);
    return newMessage;
  }

  async updateTicketStatus(ticketId, status) {
    const db = this.readDb();
    const ticket = db.tickets.find((item) => item.id === ticketId);
    if (!ticket) {
      throw new Error("Ticket not found");
    }
    ticket.status = status;
    ticket.updatedAt = this.nowIso();
    this.writeDb(db);
    return ticket;
  }

  async getAllTicketsWithUsers() {
    const db = this.readDb();
    return db.tickets
      .map((ticket) => {
        const user = db.users.find((item) => item.id === ticket.userId);
        return {
          ...ticket,
          user,
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

/*
class ApiService extends IStorageService {
  async getUsers() {
    // Здесь будет fetch к /api/users
    // При переходе на бэкенд нужно просто заменить LocalStorageService на ApiService
  }
}
*/

export const storage = new LocalStorageService();
