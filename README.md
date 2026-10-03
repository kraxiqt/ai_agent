# AI_agent — ассистент для ИТ/ИБ-дайджестов

Веб-приложение: чат с ИИ-помощником, который отвечает по темам информационных технологий и информационной безопасности и умеет собирать **свежие новости из RSS-лент** в структурированный ответ в формате Markdown со ссылками на первоисточники.

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS (zustand, TanStack Query, React Router)
- **Backend:** Python + FastAPI + SQLAlchemy, JWT-авторизация, потоковые ответы модели
- **ИИ:** любой OpenAI-совместимый API (по умолчанию модель `openai/gpt-oss-120b`)

---

## Содержание

1. [Что умеет проект](#что-умеет-проект)
2. [Соответствие ТЗ](#соответствие-тз)
3. [Структура репозитория](#структура-репозитория)
4. [Что нужно установить](#что-нужно-установить)
5. [Быстрый старт](#быстрый-старт)
6. [Установка и запуск: Windows](#windows)
7. [Установка и запуск: macOS](#macos)
8. [Установка и запуск: Linux](#linux)
9. [Запуск через Docker](#запуск-через-docker)
10. [Настройка (.env)](#настройка-env)
11. [API бэкенда](#api-бэкенда)
12. [Частые проблемы](#частые-проблемы)

---

## Что умеет проект

- Регистрация и вход по email и паролю, JWT (access + refresh с ротацией).
- Чат с ИИ. Ответы приходят потоком, частичный ответ сохраняется, если генерацию прервали.
- История диалогов хранится в базе данных, у каждого пользователя своя.
- Кнопки быстрого старта на пустом экране («Новости ИБ», «Новости ИТ»). Бэкенд также понимает запрос «Кратко для менеджеров».
- Новости берутся из RSS-лент (ИБ и ИТ, русскоязычные и англоязычные источники). Модель получает только реальные записи и оформляет их нумерованным списком со ссылками.
- Краткая сводка «для менеджеров»: простым языком, до 250 слов, с блоками «Главное», «Что стоит сделать», «Общий вывод».
- Ответы ассистента отображаются как Markdown (заголовки, списки, таблицы, код, ссылки) и скачиваются кнопкой «Скачать как .md».
- Кнопки лайка и дизлайка, копирование ответа, тёмная и светлая тема, боковая панель с историей диалогов.

## Соответствие ТЗ

Задача: ассистент, который отбирает публикации по ИТ и ИБ и формирует тематический дайджест в Markdown (или DOCX) со ссылками на источники.

| Требование ТЗ | Статус | Как сделано |
| --- | --- | --- |
| Получение материалов из выбранных источников | Реализовано | RSS-ленты в `backend/news_feeds.py`, добавить источник можно одной строкой |
| Группировка по темам | Реализовано | Две темы: «ИБ» и «ИТ» |
| Ссылки на первоисточник в каждом выводе | Реализовано | Ссылка передаётся модели вместе с новостью, в промпте требуется формат `[название](ссылка)` |
| Дайджест в Markdown | Реализовано | Ответ в Markdown, рендер в чате и скачивание `.md` |
| Две аудитории: технические специалисты и менеджмент | Реализовано | Технический список новостей по ИБ/ИТ и краткая сводка для менеджеров. Сводка строится за **последние 7 дней** (`DIGEST_MAX_AGE_DAYS`), а не за месяц |
| Отсутствие дубликатов | Частично | Повторы отсекаются по ссылке. Одна новость из разных источников с разными ссылками не склеивается |
| Обратная связь «релевантно / нерелевантно» | Не завершено | Кнопки лайка и дизлайка есть в интерфейсе, но оценка хранится только во фронтенде. На бэкенде нет эндпоинта, и на отбор новостей оценка не влияет |
| Отбор по заданным параметрам (например, по используемому ПО) | Не завершено | Отбор идёт только по теме ИБ/ИТ и по свежести |
| Формат DOCX/Markdown | Реализовано | Только Markdown |
| Закрытые, но де-факто открытые площадки (мессенджеры, имиджборды) | Не реализовано | Подключены только открытые RSS-ленты |
| Тестовые датасеты организаторов | Не используются | В коде их загрузки нет |
| Формат: веб-приложение или CLI | Реализовано | Веб-приложение |

---

## Структура репозитория

```
.
├── README.md
├── docker-compose.yml       # запуск всего проекта в Docker (база + бэкенд + фронтенд)
├── .env                     # только для Docker, создаётся вручную, в git не коммитится
├── backend/                 # FastAPI
│   ├── main.py              # приложение, CORS, обработка ошибок, /api/auth/*
│   ├── chat.py              # /api/chat/*: потоковый ответ, диалоги, сообщения
│   ├── llm.py               # клиент OpenAI-совместимого API, системный промпт
│   ├── news.py              # загрузка и кэш RSS, подготовка контекста новостей
│   ├── news_feeds.py        # список RSS-лент по темам
│   ├── check_feeds.py       # утилита проверки лент
│   ├── security.py          # хеширование паролей, JWT
│   ├── database.py          # подключение к БД (DATABASE_URL)
│   ├── db_models.py         # таблицы: users, refresh_tokens, conversations, messages
│   ├── models.py            # Pydantic-схемы запросов и ответов
│   ├── requirements.txt     # Python-зависимости (нужны для Docker-образа)
│   └── Dockerfile           # образ бэкенда
└── frontend/                # React + Vite
    ├── src/
    │   ├── app/             # провайдеры, роутер, layouts
    │   ├── entities/        # сущности (пользователь)
    │   ├── features/        # auth, chat
    │   ├── pages/           # страницы
    │   ├── shared/          # api-клиент, UI-кит, утилиты, конфиг
    │   └── widgets/
    ├── Dockerfile           # образ фронтенда: сборка и раздача на порту 80
    ├── mock-auth-server.mjs # мок-бэкенд только для авторизации (по желанию)
    ├── .env.example
    └── vite.config.ts
```

---

## Что нужно установить

| Программа | Версия | Зачем |
| --- | --- | --- |
| Python | 3.11 или новее (разработка велась на 3.13) | бэкенд |
| Node.js (с npm) | 18 или новее, лучше текущая LTS | фронтенд |
| PostgreSQL | любая актуальная | база данных (рекомендуется) |
| Git | любая | получение кода |
| Ключ OpenAI-совместимого API | — | ответы ИИ. По умолчанию [Groq](https://console.groq.com/keys) |

Если запускаете проект через Docker, из этого списка нужны только Git, Docker и ключ API, остальное ставить не надо: см. раздел [Запуск через Docker](#запуск-через-docker).

Без ключа приложение запустится, регистрация и вход будут работать, а в чате появится сообщение «ИИ не настроен: задай LLM_API_KEY в файле .env».

Установка программ:

- **Windows:** `winget install Python.Python.3.13 OpenJS.NodeJS.LTS Git.Git PostgreSQL.PostgreSQL.16`
- **macOS:** `brew install python node git postgresql@16`
- **Ubuntu / Debian:** `sudo apt install python3 python3-venv python3-pip git postgresql`. Node.js из `apt` часто устаревший, поставьте LTS через [nvm](https://github.com/nvm-sh/nvm) или [NodeSource](https://github.com/nodesource/distributions).

---

## Быстрый старт

> **Не хотите ставить Python, Node.js и PostgreSQL?** Запустите всё одной командой через Docker: [Запуск через Docker](#запуск-через-docker).

Приложение состоит из двух частей, для каждой нужен **свой терминал**.

**Терминал 1: бэкенд** (из корня проекта)

```bash
cd backend
uvicorn main:app --reload --port 8000
```

**Терминал 2: фронтенд** (из корня проекта)

```bash
cd frontend
npm run dev -- --host
```

После запуска откройте <http://localhost:5173>. Документация API: <http://localhost:8000/docs>.

> **Важно про тире.** В командах это два обычных дефиса: `--reload`, `--port`, `-- --host`. Если скопировать команду из мессенджера или редактора, который заменяет `--` на длинное тире `—`, она не сработает.

Команды выше работают, когда зависимости уже установлены и (для бэкенда) активировано виртуальное окружение. Первый запуск пошагово описан ниже для каждой системы.

---

## Windows

Команды для PowerShell. Для `cmd` отличается только активация окружения, это отмечено ниже.

### 1. Получите код

```powershell
git clone <адрес-репозитория> ai-chat
cd ai-chat
```

### 2. База данных

Создайте базу (пароль задан при установке PostgreSQL):

```powershell
psql -U postgres -c "CREATE DATABASE ai_agent;"
```

### 3. Бэкенд: окружение и зависимости

```powershell
cd backend
py -m venv .venv
.venv\Scripts\Activate.ps1
```

Если PowerShell ругается на политику выполнения скриптов, один раз выполните `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` и повторите. В `cmd` активация такая: `.venv\Scripts\activate.bat`.

```powershell
pip install fastapi "uvicorn[standard]" sqlalchemy psycopg2-binary python-dotenv pyjwt openai feedparser httpx
```

### 4. Файл `backend\.env`

Создайте файл `backend\.env` (содержимое в разделе [Настройка](#настройка-env)):

```powershell
notepad .env
```

### 5. Фронтенд: зависимости

В новом окне терминала, из корня проекта:

```powershell
cd frontend
npm install
```

### 6. Запуск

| Терминал | Команды |
| --- | --- |
| 1 (бэкенд) | `cd backend`, `.venv\Scripts\Activate.ps1`, `uvicorn main:app --reload --port 8000` |
| 2 (фронтенд) | `cd frontend`, `npm run dev -- --host` |

Остановка: `Ctrl+C` в каждом терминале. При первом запуске брандмауэр Windows может спросить разрешение для Node.js и Python, для работы по локальной сети его нужно дать.

---

## macOS

### 1. Получите код

```bash
git clone <адрес-репозитория> ai-chat
cd ai-chat
```

### 2. База данных

```bash
brew services start postgresql@16
createdb ai_agent
```

### 3. Бэкенд: окружение и зависимости

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install fastapi "uvicorn[standard]" sqlalchemy psycopg2-binary python-dotenv pyjwt openai feedparser httpx
```

### 4. Файл `backend/.env`

```bash
nano .env
```

Содержимое описано в разделе [Настройка](#настройка-env).

### 5. Фронтенд: зависимости

В новой вкладке терминала, из корня проекта:

```bash
cd frontend
npm install
```

### 6. Запуск

| Терминал | Команды |
| --- | --- |
| 1 (бэкенд) | `cd backend`, `source .venv/bin/activate`, `uvicorn main:app --reload --port 8000` |
| 2 (фронтенд) | `cd frontend`, `npm run dev -- --host` |

Остановка: `Ctrl+C`.

---

## Linux

Команды для Ubuntu и Debian, для других дистрибутивов поменяйте менеджер пакетов.

### 1. Получите код

```bash
git clone <адрес-репозитория> ai-chat
cd ai-chat
```

### 2. База данных

```bash
sudo systemctl enable --now postgresql
sudo -u postgres psql -c "CREATE USER ai_agent WITH PASSWORD 'change_me';"
sudo -u postgres psql -c "CREATE DATABASE ai_agent OWNER ai_agent;"
```

### 3. Бэкенд: окружение и зависимости

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install fastapi "uvicorn[standard]" sqlalchemy psycopg2-binary python-dotenv pyjwt openai feedparser httpx
```

Если `psycopg2-binary` не собирается, поставьте `sudo apt install libpq-dev python3-dev`.

### 4. Файл `backend/.env`

```bash
nano .env
```

Содержимое описано в разделе [Настройка](#настройка-env).

### 5. Фронтенд: зависимости

В новом терминале, из корня проекта:

```bash
cd frontend
npm install
```

### 6. Запуск

| Терминал | Команды |
| --- | --- |
| 1 (бэкенд) | `cd backend`, `source .venv/bin/activate`, `uvicorn main:app --reload --port 8000` |
| 2 (фронтенд) | `cd frontend`, `npm run dev -- --host` |

Остановка: `Ctrl+C`.

---

## Запуск через Docker

Самый простой способ: одна команда поднимает базу данных, бэкенд и фронтенд. Python, Node.js и PostgreSQL на компьютере ставить не нужно, всё работает в контейнерах.

Состав описан в `docker-compose.yml` в корне проекта:

| Сервис | Образ | Адрес на вашем компьютере | Назначение |
| --- | --- | --- | --- |
| `db` | `postgres:16-alpine` | снаружи недоступен | PostgreSQL. Данные лежат в томе `pgdata` и сохраняются между перезапусками |
| `backend` | собирается из `backend/Dockerfile` (Python 3.13) | <http://localhost:8000> | FastAPI. Стартует после того, как база прошла проверку готовности |
| `frontend` | собирается из `frontend/Dockerfile` | <http://localhost:5173> | Собранное приложение, внутри контейнера работает на порту 80 |

### Что нужно установить

Git, ключ API модели и Docker с плагином Compose v2:

| Система | Что поставить |
| --- | --- |
| Windows 10 / 11 | Docker Desktop: `winget install Docker.DockerDesktop` или установщик с [docker.com](https://www.docker.com/products/docker-desktop/). Нужен WSL 2, установщик предложит его включить. После установки перезагрузите компьютер и запустите Docker Desktop |
| macOS | Docker Desktop с [docker.com](https://www.docker.com/products/docker-desktop/) (есть версии для Apple Silicon и Intel). После установки запустите приложение |
| Linux | Docker Engine и плагин Compose по [официальной инструкции](https://docs.docker.com/engine/install/). Чтобы не писать `sudo` перед каждой командой, выполните `sudo usermod -aG docker $USER` и перезайдите в систему |

Проверьте, что всё установлено (на Windows и macOS Docker Desktop должен быть запущен, в нём виден статус «Engine running»):

```bash
docker --version
docker compose version
```

Команда пишется через пробел: `docker compose`, а не `docker-compose`.

### Первый запуск

**1. Получите код**

```bash
git clone <адрес-репозитория> ai-chat
cd ai-chat
```

**2. Создайте файл `.env` в корне проекта** (рядом с `docker-compose.yml`, не в `backend`):

```env
# обязательно: пароль базы данных (задаётся при первом создании базы)
POSTGRES_PASSWORD=придумайте_пароль

# обязательно для ответов ИИ
LLM_API_KEY=ваш_ключ

# рекомендуется: фиксированный секрет для подписи токенов
JWT_SECRET=длинная_случайная_строка
```

Создать файл можно так: на Windows `notepad .env` (PowerShell), на macOS и Linux `nano .env`. Остальные переменные бэкенда из раздела [Настройка](#настройка-env) (`LLM_MODEL`, `LLM_BASE_URL` и другие) можно добавлять в этот же файл.

Пароль и секрет удобно сгенерировать без установленного Python, через Docker (команда выведет случайную строку, запустите её дважды, для пароля и для секрета):

```bash
docker run --rm python:3.13-slim python -c "import secrets; print(secrets.token_urlsafe(32))"
```

> **Требования к паролю базы.** Он подставляется в строку подключения, поэтому используйте только буквы, цифры, `-` и `_`. Символы `@ : / # ? %` ломают адрес подключения, а `$` в `.env` Docker Compose воспринимает как переменную.

**3. Соберите и запустите**

```bash
docker compose up -d --build
```

Первая сборка занимает несколько минут: скачиваются образы, ставятся зависимости Python и npm. Флаг `-d` запускает контейнеры в фоне.

**4. Проверьте**

```bash
docker compose ps
```

Все три сервиса должны быть в состоянии `running`, а у `db` в статусе должно быть `healthy`. Затем откройте <http://localhost:5173>, зарегистрируйтесь и напишите сообщение. Документация API: <http://localhost:8000/docs>.

### Повседневные команды

Выполняются из корня проекта.

| Что сделать | Команда |
| --- | --- |
| Посмотреть логи | `docker compose logs -f backend` (вместо `backend` можно `db` или `frontend`; выход: `Ctrl+C`) |
| Остановить, не удаляя контейнеры | `docker compose stop` |
| Запустить снова | `docker compose start` |
| Остановить и удалить контейнеры (данные базы сохранятся) | `docker compose down` |
| Удалить всё вместе с базой (пользователи и диалоги пропадут) | `docker compose down -v` |
| Обновить после `git pull` или правок кода | `docker compose up -d --build` |
| Применить новые значения из `.env` (ключ ИИ, секрет) | `docker compose up -d --force-recreate backend` |
| Сделать резервную копию базы | `docker compose exec -T db pg_dump -U postgres ai_agent > backup.sql` |
| Восстановить базу из копии | `docker compose exec -T db psql -U postgres -d ai_agent < backup.sql` |

В Windows PowerShell символы `>` и `<` для резервных копий работают некорректно (файл получится в другой кодировке, а `<` не поддерживается). Запускайте эти две команды через `cmd`, например: `cmd /c "docker compose exec -T db pg_dump -U postgres ai_agent > backup.sql"`.

### Что нужно знать

- **Один `.env` в корне.** В Docker используется он, а не `backend/.env`. Переменные `DATABASE_URL` и `CORS_ORIGINS` из файла `.env` игнорируются: они заданы прямо в `docker-compose.yml` (база там называется `db`, а не `localhost`, а драйвер подключения `postgresql+psycopg`).
- **Пароль базы действует с первого запуска.** Он записывается в базу при создании тома `pgdata`. Если потом изменить `POSTGRES_PASSWORD`, бэкенд перестанет подключаться (в логах `password authentication failed`). Верните прежний пароль или удалите том командой `docker compose down -v`, но тогда данные пропадут.
- **Адрес бэкенда зашит во фронтенд при сборке.** Он задаётся аргументом `VITE_API_URL` в `docker-compose.yml`. Если его менять, нужна пересборка: `docker compose up -d --build`.
- **Секреты.** Файл `.env` содержит пароль и ключ API, не добавляйте его в git.
- **Для разработчиков.** В `backend/requirements.txt` должен быть драйвер `psycopg[binary]` (в docker-compose используется `postgresql+psycopg`, в отличие от локального запуска, где в инструкциях выше стоит `psycopg2-binary`). Чтобы в образ не попали виртуальное окружение и локальные секреты, создайте `backend/.dockerignore` со строками `.venv`, `__pycache__` и `.env`.

### Открытие с другого устройства или на сервере

По умолчанию всё рассчитано на браузер на том же компьютере, где запущен Docker. Чтобы открыть приложение с другого устройства (например, по адресу `192.168.1.15` или по домену), в `docker-compose.yml` нужно заменить адрес:

1. В сервисе `frontend` в `args`: `VITE_API_URL: http://192.168.1.15:8000/api`.
2. В сервисе `backend` в `environment`: `CORS_ORIGINS: http://localhost:5173,http://192.168.1.15:5173`.
3. Пересоберите: `docker compose up -d --build`.
4. Разрешите входящие подключения на порты 5173 и 8000 в брандмауэре.

Для публикации в интернет поставьте перед приложением обратный прокси с HTTPS (nginx, Caddy и подобные) и не оставляйте порт базы открытым.

---

## Настройка (.env)

### Бэкенд: `backend/.env`

Этот файл нужен при локальном запуске без Docker. В Docker используется `.env` в корне проекта, см. [Запуск через Docker](#запуск-через-docker).

Минимальный рабочий пример:

```env
# обязательно: строка подключения SQLAlchemy
DATABASE_URL=postgresql+psycopg2://postgres:ПАРОЛЬ@localhost:5432/ai_agent

# обязательно для ответов ИИ
LLM_API_KEY=ваш_ключ

# рекомендуется: фиксированный секрет для подписи токенов
JWT_SECRET=длинная_случайная_строка
```

Секрет можно сгенерировать командой `python -c "import secrets; print(secrets.token_urlsafe(32))"`.

Все переменные:

| Переменная | По умолчанию | Описание |
| --- | --- | --- |
| `DATABASE_URL` | — (**обязательна**) | Без неё бэкенд не стартует (`RuntimeError: .env database`). Таблицы создаются автоматически при запуске |
| `LLM_API_KEY` | — | Ключ API модели. Без него чат отвечает ошибкой «ИИ не настроен» |
| `LLM_BASE_URL` | `https://api.groq.com/openai/v1` | Адрес OpenAI-совместимого API |
| `LLM_MODEL` | `openai/gpt-oss-120b` | Название модели |
| `LLM_REASONING_EFFORT` | пусто | `low`, `medium` или `high`. Пусто: параметр не отправляется |
| `LLM_MAX_OUTPUT_TOKENS` | `1500` | Лимит ответа (в него входят «рассуждения» модели) |
| `JWT_SECRET` | случайный при каждом запуске | Если не задан, после каждого перезапуска (в том числе автоматического при `--reload`) выданные access-токены перестают действовать |
| `ACCESS_TTL_SECONDS` | `900` | Срок жизни access-токена, секунды |
| `REFRESH_TTL_DAYS` | `30` | Срок жизни refresh-токена, дни |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Разрешённые адреса фронтенда через запятую |
| `NEWS_CACHE_MINUTES` | `20` | Время кэширования RSS-лент |
| `NEWS_MAX_ITEMS` | `10` | Сколько новостей передавать модели |

Примеры `DATABASE_URL`:

| База | Строка |
| --- | --- |
| PostgreSQL | `postgresql+psycopg2://пользователь:пароль@localhost:5432/ai_agent` |
| SQLite (только чтобы быстро попробовать) | `sqlite:///./app.db` |

Для SQLite каскадное удаление по умолчанию выключено: после удаления диалога его сообщения останутся в таблице. Для реальной работы используйте PostgreSQL.

### Фронтенд: `frontend/.env.local`

Файл необязателен: по умолчанию фронтенд обращается к `http://localhost:8000/api`. Чтобы изменить настройки:

```bash
cp .env.example .env.local        # Windows PowerShell: Copy-Item .env.example .env.local
```

| Переменная | Значение по умолчанию | Описание |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:8000/api` | Адрес API бэкенда |
| `VITE_APP_NAME` | `AI Chat` | Название в шапке и заголовке вкладки |

Файл `.env.local` не попадает в git. Для продакшен-сборки (`npm run build`) используется `VITE_API_URL=/api`, то есть фронтенд и бэкенд должны открываться с одного домена через обратный прокси (nginx и подобные).

### Открытие с другого устройства (`--host`)

Флаг `--host` открывает Vite для локальной сети, в консоли появится строка вида `Network: http://192.168.1.15:5173/`. Чтобы приложение работало с телефона или другого компьютера, на машине с проектом нужно:

1. Запустить бэкенд на всех интерфейсах: `uvicorn main:app --reload --host 0.0.0.0 --port 8000`.
2. В `frontend/.env.local` указать адрес этой машины: `VITE_API_URL=http://192.168.1.15:8000/api`.
3. В `backend/.env` добавить адрес фронтенда в `CORS_ORIGINS`: `CORS_ORIGINS=http://localhost:5173,http://192.168.1.15:5173`.

Если открываете только на самом компьютере, ничего из этого менять не нужно.

---

## API бэкенда

Базовый адрес: `http://localhost:8000/api`. Интерактивная документация (Swagger): `http://localhost:8000/docs`. Ошибки приходят в формате `{"message": "..."}`.

| Метод | Путь | Авторизация | Описание |
| --- | --- | --- | --- |
| POST | `/auth/register` | — | Регистрация (`name`, `email`, `password`), возвращает пользователя и токены |
| POST | `/auth/login` | — | Вход (`email`, `password`) |
| POST | `/auth/refresh` | — | Обмен refresh-токена на новую пару токенов (старый refresh перестаёт действовать) |
| POST | `/auth/logout` | — | Возвращает 204 |
| GET | `/auth/me` | Bearer | Текущий пользователь |
| POST | `/chat/stream` | Bearer | Отправка сообщения (`conversationId`, `content` до 4000 символов), ответ приходит потоком `text/plain` |
| GET | `/chat/conversations` | Bearer | Список диалогов (`page`, `pageSize`) |
| GET | `/chat/conversations/{id}/messages` | Bearer | Сообщения диалога (`page`, `pageSize`) |
| DELETE | `/chat/conversations/{id}` | Bearer | Удаление диалога вместе с сообщениями |

Идентификатор диалога создаёт фронтенд (UUID). Диалог появляется в базе при первом сообщении, название берётся из его первых 60 символов. Чужой диалог выглядит как несуществующий (404).

---

## Частые проблемы

| Симптом | Причина и решение |
| --- | --- |
| `RuntimeError: .env database` при запуске бэкенда | Нет `backend/.env` или в нём не задан `DATABASE_URL`. Файл должен лежать в папке `backend` |
| `ModuleNotFoundError` при запуске `uvicorn` | Не активировано виртуальное окружение или не установлены зависимости. Выполните шаг активации и `pip install ...` |
| `uvicorn` не найден | То же: окружение не активировано. Можно запустить как `python -m uvicorn main:app --reload --port 8000` |
| В чате «ИИ не настроен: задай LLM_API_KEY в файле .env» | В `backend/.env` нет ключа. Добавьте `LLM_API_KEY` и перезапустите бэкенд |
| «Неверный ключ API для ИИ» | Ключ неверный или относится к другому провайдеру. Проверьте `LLM_API_KEY` и `LLM_BASE_URL` |
| «Слишком много запросов к ИИ» | Лимит бесплатного тарифа провайдера. Подождите минуту |
| В браузере ошибка CORS или `Failed to fetch` | Бэкенд не запущен, либо адрес фронтенда не входит в `CORS_ORIGINS`, либо `VITE_API_URL` указывает не туда |
| Постоянно выбрасывает на страницу входа | Не задан `JWT_SECRET` и бэкенд перезапускался. Задайте постоянный секрет |
| Порт 8000 или 5173 занят | Windows: `netstat -ano \| findstr :8000`, затем `taskkill /PID <номер> /F`. macOS и Linux: `lsof -i :8000`, затем `kill <номер>`. Либо запустите на другом порту и поправьте `VITE_API_URL` |
| Порт 8000 занят, но вы ничего не запускали | Возможно, остался запущенным `node mock-auth-server.mjs`. Он использует тот же порт |
| `npm install` падает | Проверьте версию Node.js (`node -v`, нужна 18 или новее) |
| Новости пустые или «временно недоступны» | Ленты не отвечают из вашей сети. Запустите `python check_feeds.py` и проверьте доступ в интернет |
| Docker: `required variable POSTGRES_PASSWORD is missing a value` | В корне проекта (рядом с `docker-compose.yml`) нет файла `.env` или в нём не задан `POSTGRES_PASSWORD` |
| Docker: `Cannot connect to the Docker daemon` или `failed to connect to the docker API` | Docker не запущен. Windows и macOS: откройте Docker Desktop и дождитесь «Engine running». Linux: `sudo systemctl start docker` |
| Docker (Linux): `permission denied while trying to connect to the Docker daemon socket` | Пользователь не в группе `docker`: `sudo usermod -aG docker $USER`, затем выйдите из системы и войдите снова. Или пишите `sudo` перед командами |
| Docker: `docker: 'compose' is not a docker command` | Нет плагина Compose v2. Обновите Docker или установите `docker-compose-plugin` |
| Docker: `port is already allocated` или `address already in use` для 8000 / 5173 | Порт занят другой программой (см. строку про занятый порт выше) или остался локальный запуск. Остановите его, либо поменяйте левое число в `ports` (например, `"8001:8000"`) и тогда обновите `VITE_API_URL` и `CORS_ORIGINS` |
| Docker: бэкенд перезапускается, в логах `password authentication failed` | `POSTGRES_PASSWORD` изменили после первого запуска. Верните старый пароль или выполните `docker compose down -v` (данные базы удалятся) |
| Docker: страница открывается, но ошибка CORS или `Failed to fetch` | Адрес в браузере не совпадает с `CORS_ORIGINS`, либо `VITE_API_URL` указывает не туда. После правки `docker-compose.yml` выполните `docker compose up -d --build` |
| Docker (Windows): `WSL 2 installation is incomplete` или Docker Desktop не стартует | Включите виртуализацию в BIOS, затем выполните в PowerShell от администратора `wsl --install` (или `wsl --update`) и перезагрузите компьютер |

