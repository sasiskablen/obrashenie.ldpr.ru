# Архитектура интернет-приемной ЛДПР

## Текущая реализация (Phase 1)
- Хранение: `localStorage` (ключ `ldpr_app_db`)
- Запуск: статический HTML/JS через `index.html`
- Плюсы: не требует сервера, легко демонстрировать комиссии

## План миграции на производственную БД (Phase 2)
1. Развернуть PostgreSQL
2. Создать таблицы `users`, `tickets`, `messages`
3. Реализовать `ApiService` с `fetch`-запросами
4. Заменить `LocalStorageService` на `ApiService` в `StorageService.js`
5. Добавить JWT-аутентификацию на бэкенде

## Диаграмма компонентов
```text
[index.html / register.html / user-dashboard.html / admin-dashboard.html]
                 |                (ES modules)
                 v
          [auth.js, app.js, dashboards]
                 |
                 v
      [IStorageService interface contract]
                 |
      +----------+-----------+
      |                      |
[LocalStorageService]   [ApiService future]
      |                      |
      v                      v
 localStorage           REST API -> PostgreSQL
```

## Почему миграция простая
- Вся бизнес-логика дашбордов и авторизации работает через `storage`-объект.
- При смене реализации хранилища достаточно изменить только экспорт сервиса.
- UI и сценарии пользователя/администратора остаются неизменными.
