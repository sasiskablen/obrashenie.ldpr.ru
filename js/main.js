(function () {
  const STORAGE_KEY = "ldpr_app_db";
  const SESSION_KEY = "currentUser";
  const THEME_KEY = "ldpr_theme";
  const ROLES = { USER: "user", ADMIN: "admin" };
  const STATUS_LABELS = { new: "Новое", in_progress: "В работе", closed: "Завершено" };
  const STATUS_CLASSES = { new: "status-new", in_progress: "status-progress", closed: "status-closed" };
  const TOPICS = {
    question: "Вопрос депутату",
    complaint: "Жалоба на ЖКХ",
    social_help: "Помощь в соцзащите",
    suggestion: "Общее предложение",
  };

  function simpleHash(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }
  function nowIso() {
    return new Date().toISOString();
  }
  function createId(prefix) {
    return prefix + "_" + Date.now() + "_" + Math.random().toString(16).slice(2, 8);
  }
  function readDb() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_e) {
      return null;
    }
  }
  function writeDb(db) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }
  function ensureSeed() {
    const db = readDb();
    if (db && Array.isArray(db.users) && Array.isArray(db.tickets) && Array.isArray(db.messages)) return;

    const createdAt = nowIso();
    const adminId = createId("usr");
    const user1Id = createId("usr");
    const user2Id = createId("usr");
    const users = [
      { id: adminId, name: "Секретарь ЛДПР", email: "admin@ldpr.ru", passwordHash: simpleHash("admin123"), phone: "+7 (900) 111-22-33", address: "г. Москва", role: ROLES.ADMIN, createdAt },
      { id: user1Id, name: "Иванов Иван Иванович", email: "ivanov@mail.ru", passwordHash: simpleHash("123456"), phone: "+7 (901) 100-20-30", address: "г. Тула", role: ROLES.USER, createdAt },
      { id: user2Id, name: "Петрова Мария Сергеевна", email: "petrova@mail.ru", passwordHash: simpleHash("123456"), phone: "+7 (902) 111-11-11", address: "г. Калуга", role: ROLES.USER, createdAt },
    ];
    const tickets = [
      { id: createId("tkt"), userId: user1Id, subject: "question", status: "new", createdAt, updatedAt: createdAt },
      { id: createId("tkt"), userId: user1Id, subject: "complaint", status: "in_progress", createdAt, updatedAt: createdAt },
      { id: createId("tkt"), userId: user2Id, subject: "social_help", status: "closed", createdAt, updatedAt: createdAt },
      { id: createId("tkt"), userId: user2Id, subject: "suggestion", status: "new", createdAt, updatedAt: createdAt },
      { id: createId("tkt"), userId: user1Id, subject: "question", status: "in_progress", createdAt, updatedAt: createdAt },
    ];
    const messages = [
      { id: createId("msg"), ticketId: tickets[0].id, senderId: user1Id, senderRole: ROLES.USER, content: "Здравствуйте! Когда будет прием депутата в моем районе?", attachment: null, createdAt },
      { id: createId("msg"), ticketId: tickets[1].id, senderId: user1Id, senderRole: ROLES.USER, content: "Жалоба на постоянные отключения горячей воды в доме.", attachment: "акт_жкх.pdf", createdAt },
      { id: createId("msg"), ticketId: tickets[1].id, senderId: adminId, senderRole: ROLES.ADMIN, content: "Принято в работу. Передали обращение в профильный комитет.", attachment: null, createdAt },
    ];
    writeDb({ users, tickets, messages });
  }
  function getSession() {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_e) {
      return null;
    }
  }
  function setSession(user) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id, name: user.name, email: user.email, role: user.role }));
  }
  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    location.href = "index.html";
  }
  function formatDate(iso) {
    return new Date(iso).toLocaleString("ru-RU");
  }
  function applyTheme(theme) {
    document.body.classList.remove("theme-dark", "theme-light");
    document.body.classList.add(theme === "light" ? "theme-light" : "theme-dark");
  }
  function initThemeToggle() {
    const saved = localStorage.getItem(THEME_KEY) || "dark";
    applyTheme(saved);
    if (document.getElementById("themeToggleBtn")) return;
    const btn = document.createElement("button");
    btn.id = "themeToggleBtn";
    btn.className = "theme-toggle-btn";
    btn.type = "button";
    function setLabel(theme) {
      btn.textContent = theme === "light" ? "Темная тема" : "Светлая тема";
    }
    setLabel(saved);
    btn.addEventListener("click", function () {
      const current = document.body.classList.contains("theme-light") ? "light" : "dark";
      const next = current === "light" ? "dark" : "light";
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
      setLabel(next);
    });
    document.body.appendChild(btn);
  }
  function renderAttachmentHtml(attachment) {
    if (!attachment) return "";
    if (typeof attachment === "string") {
      return '<p class="text-xs opacity-80 mt-1">Вложение: ' + attachment + "</p>";
    }
    return '<p class="text-xs opacity-80 mt-1">Вложение: ' + (attachment.name || "Файл") + "</p>";
  }

  function initLoginPage() {
    const form = document.getElementById("loginForm");
    const errorBox = document.getElementById("errorBox");
    if (!form) return;

    const sess = getSession();
    if (sess) location.href = sess.role === ROLES.ADMIN ? "admin-dashboard.html" : "user-dashboard.html";

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      ensureSeed();
      const email = document.getElementById("email").value.trim().toLowerCase();
      const passwordHash = simpleHash(document.getElementById("password").value);
      const db = readDb();
      const user = db.users.find(function (u) {
        return u.email.toLowerCase() === email && u.passwordHash === passwordHash;
      });
      if (!user) {
        errorBox.textContent = "Неверный email или пароль";
        errorBox.classList.remove("hidden");
        return;
      }
      setSession(user);
      location.href = user.role === ROLES.ADMIN ? "admin-dashboard.html" : "user-dashboard.html";
    });
  }

  function initRegisterPage() {
    const form = document.getElementById("registerForm");
    const errorBox = document.getElementById("errorBox");
    if (!form) return;
    ensureSeed();
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      errorBox.classList.add("hidden");
      const db = readDb();
      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const phone = document.getElementById("phone").value.trim();
      const password = document.getElementById("password").value;
      const passwordConfirm = document.getElementById("passwordConfirm").value;
      const address = document.getElementById("address").value.trim();
      if (password.length < 6) {
        errorBox.textContent = "Пароль должен быть не менее 6 символов";
        errorBox.classList.remove("hidden");
        return;
      }
      if (password !== passwordConfirm) {
        errorBox.textContent = "Пароли не совпадают";
        errorBox.classList.remove("hidden");
        return;
      }
      if (db.users.some(function (u) { return u.email.toLowerCase() === email.toLowerCase(); })) {
        errorBox.textContent = "Пользователь с таким email уже существует";
        errorBox.classList.remove("hidden");
        return;
      }
      const user = { id: createId("usr"), name, email, phone, address, role: ROLES.USER, passwordHash: simpleHash(password), createdAt: nowIso() };
      db.users.push(user);
      writeDb(db);
      setSession(user);
      location.href = "user-dashboard.html";
    });
  }

  function requireRole(role) {
    const s = getSession();
    if (!s) {
      location.href = "index.html";
      return null;
    }
    if (s.role !== role) {
      location.href = s.role === ROLES.ADMIN ? "admin-dashboard.html" : "user-dashboard.html";
      return null;
    }
    return s;
  }

  function initUserPage() {
    let currentUser = requireRole(ROLES.USER);
    if (!currentUser) return;
    ensureSeed();
    document.getElementById("logoutBtn").addEventListener("click", logout);
    document.getElementById("userGreeting").textContent = "Здравствуйте, " + currentUser.name;
    const subjectEl = document.getElementById("ticketSubject");
    subjectEl.innerHTML = Object.keys(TOPICS).map(function (k) { return '<option value="' + k + '">' + TOPICS[k] + "</option>"; }).join("");
    let activeTicketId = null;
    let selectedAttachment = null;

    function open(id) { document.getElementById(id).classList.remove("hidden"); }
    function close(id) { document.getElementById(id).classList.add("hidden"); }

    document.getElementById("openCreateTicketModalBtn").addEventListener("click", function () { open("createTicketModal"); });
    document.getElementById("openProfileModalBtn").addEventListener("click", function () {
      const db = readDb();
      const fresh = db.users.find(function (u) { return u.id === currentUser.id; });
      if (fresh) {
        document.getElementById("profileName").value = fresh.name || "";
        document.getElementById("profileEmail").value = fresh.email || "";
        document.getElementById("profilePhone").value = fresh.phone || "";
        document.getElementById("profileAddress").value = fresh.address || "";
      }
      open("profileModal");
    });
    document.getElementById("closeProfileModalBtn").addEventListener("click", function () { close("profileModal"); });
    document.getElementById("closeCreateTicketModalBtn").addEventListener("click", function () { close("createTicketModal"); });
    document.getElementById("closeTicketChatModalBtn").addEventListener("click", function () { close("ticketChatModal"); });
    document.getElementById("attachmentInput").addEventListener("change", function (e) {
      const f = e.target.files[0];
      if (!f) {
        selectedAttachment = null;
        document.getElementById("attachmentName").textContent = "Файл не выбран";
        return;
      }
      selectedAttachment = { name: f.name, type: f.type || "", isImage: Boolean((f.type || "").indexOf("image/") === 0) };
      document.getElementById("attachmentName").textContent = selectedAttachment.isImage
        ? "Изображение: " + selectedAttachment.name
        : "Файл: " + selectedAttachment.name;
    });

    function renderTickets() {
      const db = readDb();
      const list = document.getElementById("ticketsList");
      const own = db.tickets.filter(function (t) { return t.userId === currentUser.id; }).sort(function (a, b) { return b.createdAt.localeCompare(a.createdAt); });
      if (!own.length) {
        list.innerHTML = '<p class="text-gray-500">У вас пока нет обращений.</p>';
        return;
      }
      list.innerHTML = own.map(function (t) {
        const first = db.messages.find(function (m) { return m.ticketId === t.id; });
        return '<button class="w-full text-left bg-white p-4 rounded-xl shadow hover:shadow-md transition" data-ticket-id="' + t.id + '">' +
          '<div class="flex items-center justify-between gap-2"><h3 class="font-semibold text-blue-900">' + TOPICS[t.subject] + '</h3>' +
          '<span class="status-pill ' + STATUS_CLASSES[t.status] + '">' + STATUS_LABELS[t.status] + "</span></div>" +
          '<p class="text-sm text-gray-500 mt-1">' + formatDate(t.createdAt) + "</p>" +
          '<p class="text-gray-700 mt-2">' + ((first && first.content) ? first.content.slice(0, 120) : "Без текста") + "</p></button>";
      }).join("");
      list.querySelectorAll("[data-ticket-id]").forEach(function (btn) {
        btn.addEventListener("click", function () { openChat(btn.getAttribute("data-ticket-id")); });
      });
    }

    function openChat(ticketId) {
      const db = readDb();
      activeTicketId = ticketId;
      const ticket = db.tickets.find(function (t) { return t.id === ticketId; });
      const messages = db.messages.filter(function (m) { return m.ticketId === ticketId; }).sort(function (a, b) { return a.createdAt.localeCompare(b.createdAt); });
      document.getElementById("chatTitle").textContent = TOPICS[ticket.subject] + " • " + STATUS_LABELS[ticket.status];
      document.getElementById("chatMessages").innerHTML = messages.map(function (m) {
        return '<div class="chat-bubble ' + (m.senderRole === ROLES.ADMIN ? "chat-admin" : "chat-user") + '">' +
          "<p>" + m.content + "</p>" +
          renderAttachmentHtml(m.attachment) +
          '<p class="text-[11px] opacity-70 mt-1">' + formatDate(m.createdAt) + "</p></div>";
      }).join("");
      open("ticketChatModal");
    }

    document.getElementById("createTicketForm").addEventListener("submit", function (e) {
      e.preventDefault();
      const db = readDb();
      const content = document.getElementById("ticketMessage").value.trim();
      if (!content) return;
      const now = nowIso();
      const ticket = { id: createId("tkt"), userId: currentUser.id, subject: document.getElementById("ticketSubject").value, status: "new", createdAt: now, updatedAt: now };
      db.tickets.push(ticket);
      db.messages.push({ id: createId("msg"), ticketId: ticket.id, senderId: currentUser.id, senderRole: ROLES.USER, content: content, attachment: selectedAttachment ? selectedAttachment.name : null, createdAt: now });
      writeDb(db);
      e.target.reset();
      selectedAttachment = null;
      document.getElementById("attachmentName").textContent = "Файл не выбран";
      close("createTicketModal");
      renderTickets();
    });

    document.getElementById("sendUserMessageForm").addEventListener("submit", function (e) {
      e.preventDefault();
      if (!activeTicketId) return;
      const input = document.getElementById("userChatInput");
      const content = input.value.trim();
      if (!content) return;
      const db = readDb();
      db.messages.push({ id: createId("msg"), ticketId: activeTicketId, senderId: currentUser.id, senderRole: ROLES.USER, content: content, attachment: null, createdAt: nowIso() });
      writeDb(db);
      input.value = "";
      openChat(activeTicketId);
      renderTickets();
    });
    document.getElementById("profileForm").addEventListener("submit", function (e) {
      e.preventDefault();
      const db = readDb();
      const updated = {
        name: document.getElementById("profileName").value.trim(),
        email: document.getElementById("profileEmail").value.trim(),
        phone: document.getElementById("profilePhone").value.trim(),
        address: document.getElementById("profileAddress").value.trim(),
      };
      const conflict = db.users.find(function (u) {
        return u.id !== currentUser.id && (u.email || "").toLowerCase() === updated.email.toLowerCase();
      });
      if (conflict) {
        alert("Пользователь с таким email уже существует.");
        return;
      }
      const userInDb = db.users.find(function (u) { return u.id === currentUser.id; });
      if (!userInDb) return;
      userInDb.name = updated.name;
      userInDb.email = updated.email;
      userInDb.phone = updated.phone;
      userInDb.address = updated.address;
      writeDb(db);
      currentUser = {
        id: userInDb.id,
        name: userInDb.name,
        email: userInDb.email,
        role: userInDb.role,
      };
      setSession(userInDb);
      document.getElementById("userGreeting").textContent = "Здравствуйте, " + currentUser.name;
      close("profileModal");
      alert("Профиль обновлен.");
    });
    renderTickets();
  }

  function initAdminPage() {
    const admin = requireRole(ROLES.ADMIN);
    if (!admin) return;
    ensureSeed();
    document.getElementById("logoutBtn").addEventListener("click", logout);
    const topicFilter = document.getElementById("topicFilter");
    topicFilter.innerHTML = '<option value="all">Все темы</option>' + Object.keys(TOPICS).map(function (k) { return '<option value="' + k + '">' + TOPICS[k] + "</option>"; }).join("");
    let openedTicketId = null;

    function open(id) { document.getElementById(id).classList.remove("hidden"); }
    function close(id) { document.getElementById(id).classList.add("hidden"); }
    document.getElementById("closeAdminTicketModalBtn").addEventListener("click", function () { close("adminTicketModal"); });

    function getRows() {
      const db = readDb();
      return db.tickets.map(function (t) {
        const user = db.users.find(function (u) { return u.id === t.userId; });
        const messages = db.messages.filter(function (m) { return m.ticketId === t.id; }).sort(function (a, b) { return a.createdAt.localeCompare(b.createdAt); });
        return { ticket: t, user: user, first: messages[0], messages: messages };
      }).sort(function (a, b) { return b.ticket.createdAt.localeCompare(a.ticket.createdAt); });
    }

    function renderTable() {
      const status = document.getElementById("statusFilter").value;
      const topic = document.getElementById("topicFilter").value;
      const search = document.getElementById("searchFilter").value.trim().toLowerCase();
      const rows = getRows().filter(function (r) {
        const sOk = status === "all" || r.ticket.status === status;
        const tOk = topic === "all" || r.ticket.subject === topic;
        const qOk = !search || (r.user && ((r.user.name || "").toLowerCase().includes(search) || (r.user.email || "").toLowerCase().includes(search)));
        return sOk && tOk && qOk;
      });
      const tbody = document.getElementById("ticketsTbody");
      if (!rows.length) {
        tbody.innerHTML = '<td><td colspan="7" class="p-4 text-center text-gray-500">Ничего не найдено</td></tr>';
        return;
      }
      tbody.innerHTML = rows.map(function (r) {
        return "<tr class='border-b'>" +
          "<td class='p-3'>" + formatDate(r.ticket.createdAt) + "</td>" +
          "<td class='p-3'>" + (r.user ? r.user.name : "-") + "</td>" +
          "<td class='p-3'>" + (r.user ? r.user.email : "-") + "</td>" +
          "<td class='p-3'>" + TOPICS[r.ticket.subject] + "</td>" +
          "<td class='p-3'>" + ((r.first && r.first.content) ? r.first.content.slice(0, 70) : "") + "</td>" +
          "<td class='p-3'><span class='status-pill " + STATUS_CLASSES[r.ticket.status] + "'>" + STATUS_LABELS[r.ticket.status] + "</span></td>" +
          "<td class='p-3'><button class='px-3 py-1 bg-blue-700 text-white rounded hover:bg-blue-800' data-open-ticket='" + r.ticket.id + "'>Открыть</button></td>" +
          "</tr>";
      }).join("");
      tbody.querySelectorAll("[data-open-ticket]").forEach(function (btn) {
        btn.addEventListener("click", function () { openTicket(btn.getAttribute("data-open-ticket")); });
      });
    }

    function openTicket(ticketId) {
      const row = getRows().find(function (r) { return r.ticket.id === ticketId; });
      if (!row) return;
      openedTicketId = ticketId;
      document.getElementById("adminTicketMeta").innerHTML =
        "<p><strong>Автор:</strong> " + (row.user ? row.user.name : "-") + "</p>" +
        "<p><strong>Email:</strong> " + (row.user ? row.user.email : "-") + "</p>" +
        "<p><strong>Телефон:</strong> " + (row.user ? row.user.phone : "-") + "</p>" +
        "<p><strong>Тема:</strong> " + TOPICS[row.ticket.subject] + "</p>" +
        "<p><strong>Создано:</strong> " + formatDate(row.ticket.createdAt) + "</p>";
      document.getElementById("adminChatHistory").innerHTML = row.messages.map(function (m) {
        return '<div class="chat-bubble ' + (m.senderRole === ROLES.ADMIN ? "chat-admin" : "chat-user") + '">' +
          "<p>" + m.content + "</p>" +
          renderAttachmentHtml(m.attachment) +
          "<p class='text-[11px] opacity-70 mt-1'>" + formatDate(m.createdAt) + "</p></div>";
      }).join("");
      const st = document.getElementById("adminStatusSelect");
      st.innerHTML = '<option value="new">Новое</option><option value="in_progress">В работе</option><option value="closed">Завершено</option>';
      st.value = row.ticket.status;
      open("adminTicketModal");
    }

    document.getElementById("adminReplyForm").addEventListener("submit", function (e) {
      e.preventDefault();
      if (!openedTicketId) return;
      const content = document.getElementById("adminReplyInput").value.trim();
      if (!content) return;
      const db = readDb();
      db.messages.push({ id: createId("msg"), ticketId: openedTicketId, senderId: admin.id, senderRole: ROLES.ADMIN, content: content, attachment: null, createdAt: nowIso() });
      const ticket = db.tickets.find(function (t) { return t.id === openedTicketId; });
      if (ticket) {
        ticket.status = document.getElementById("adminStatusSelect").value;
        ticket.updatedAt = nowIso();
      }
      writeDb(db);
      document.getElementById("adminReplyInput").value = "";
      renderTable();
      openTicket(openedTicketId);
    });

    document.getElementById("statusFilter").addEventListener("change", renderTable);
    document.getElementById("topicFilter").addEventListener("change", renderTable);
    document.getElementById("searchFilter").addEventListener("input", renderTable);
    renderTable();
  }

  document.addEventListener("DOMContentLoaded", function () {
    ensureSeed();
    initThemeToggle();
    const page = document.body.getAttribute("data-page");
    if (page === "login") initLoginPage();
    if (page === "register") initRegisterPage();
    if (page === "user") initUserPage();
    if (page === "admin") initAdminPage();
  });
})();
