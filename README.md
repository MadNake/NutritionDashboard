# Дашборд питания

Персональный мобильный дашборд: тянет приёмы пищи из базы Notion «Питание» и
показывает, сколько съедено за день/период и **сколько ещё добрать** до дневных
минимумов (калории, белок, клетчатка). Фрейминг — «достаточность», без потолков
и дефицита.

- **Стек:** Vite + React + TypeScript + Tailwind v4 + shadcn/ui (Base UI) + recharts.
- **Хостинг:** Cloudflare Workers — статика (Static Assets) + Worker на `/api/nutrition` как прокси к Notion.
- **Доступ:** закрывается через Cloudflare Access (Zero Trust).
- Обычное онлайн-SPA (без service worker). «Установка» = ярлык из браузера на
  домашний экран телефона.

## Как это устроено

```
Браузер (SPA)  ──GET /api/nutrition?since=YYYY-MM-DD──▶  Worker  ──▶  Notion API
   рисует кольца/карточки/графики          держит NOTION_TOKEN в env, ходит в Notion
```

Фронтенд и Worker живут на **одном origin**, поэтому CORS не нужен, а токен
никогда не попадает в браузер. При загрузке делается **один** запрос за 7 дней
(`since = сегодня − 6`), а переключение Сегодня / 2 / 3 / 7 считается на клиенте —
мгновенно, без новых запросов.

## Переменные окружения

Нужна одна переменная — **`NOTION_TOKEN`**: секрет внутренней интеграции Notion с
правами **только на чтение**. База «Питание» уже расшарена на интеграцию.

- **Локально:** скопируй `.dev.vars.example` → `.dev.vars` и впиши токен.
  `.dev.vars` в `.gitignore` — в репозиторий не попадёт.
- **Прод:** задаётся как секрет Worker (см. «Деплой»). В коде/гите токена быть не должно.

Помимо секрета, в `wrangler.jsonc` есть **не-секретные** `vars` для проверки токена
Cloudflare Access — `ACCESS_JWKS_URL` и `ACCESS_AUD` (см. «Доступ»). Их можно коммитить.

## Локальный запуск

```bash
npm install
cp .dev.vars.example .dev.vars   # и вписать NOTION_TOKEN
npm run dev
```

`npm run dev` поднимает два процесса параллельно:

- **Vite** (`http://localhost:5173`) — сам дашборд с HMR;
- **`wrangler dev --port 8788`** — Worker локально (обрабатывает `/api/*`).

Vite проксирует `/api/*` на `:8788` (см. `vite.config.ts`), так что открывай
**`http://localhost:5173`**. `wrangler` автоматически подхватывает `.dev.vars`.

Прочие команды:

```bash
npm test        # юнит-тесты агрегации и дат (vitest)
npm run build   # tsc + сборка в dist/
npm run lint
```

## Быстрая проверка пути данных (важно)

Юнит-тесты проверяют только агрегацию/даты. Сам путь **Notion → прокси → нормализация**
не проверить без токена. Есть отдельный live-тест, который дёргает реальный Notion и
печатает первые приёмы — прогони его один раз, чтобы убедиться, что запрос
`2025-09-03` и маппинг русских полей рабочие, **до** деплоя:

```powershell
# PowerShell
$env:NOTION_TOKEN="ntn_xxx"; npm test
```
```bash
# bash
NOTION_TOKEN=ntn_xxx npm test
```

Без `NOTION_TOKEN` этот тест помечается как skipped. В выводе посмотри на печатаемые
`meals` — даты, названия и числа БЖУ должны быть осмысленными.

## Деплой на Cloudflare Workers

Деплой через Wrangler (Git-репозиторий не обязателен):

```bash
# задать прод-секрет (один раз; меняется тем же командой)
npx wrangler secret put NOTION_TOKEN

# собрать и задеплоить
npm run deploy            # = npm run build && wrangler deploy
```

После деплоя приложение доступно на
`https://nutrition-dashboard.<твой-сабдомен>.workers.dev`. Имя воркера и роутинг
заданы в `wrangler.jsonc` (`name`, `assets`, `run_worker_first: ["/api/*"]`).
Секрет `NOTION_TOKEN` можно также задать в дашборде: **Workers & Pages →
nutrition-dashboard → Settings → Variables and Secrets**.

## Доступ: Cloudflare Access (Zero Trust)

Чтобы личные данные не были открыты по публичному URL, перед воркером ставится
Access — логин-стена на edge Cloudflare (запрос проверяется ещё до кода воркера).

1. Dashboard → **Workers & Pages → nutrition-dashboard → Settings →
   Domains & Routes** → у **Worker URL** нажми **Enable Cloudflare Access**
   (для `*.workers.dev` это делается в один клик; политика создаётся автоматически).
2. **Zero Trust → Access → Applications** → открой созданное приложение →
   **Policies** → **Allow**, Include → **Emails** → твой email. Метод входа —
   One-time PIN или Google.

Access закрывает весь хост, включая `/api` — прокси тоже под защитой. Ярлык
открывается в обычном браузере и делит cookie-сессию Access с ним, так что
повторных логинов из-за изоляции нет.

Дополнительно (defense-in-depth) сам воркер проверяет подписанный токен Access
`Cf-Access-Jwt-Assertion` — см. [`worker/access.ts`](worker/access.ts). Для этого в
`wrangler.jsonc` заданы не-секретные `vars` **`ACCESS_JWKS_URL`** и **`ACCESS_AUD`**
(значения — из диалога Access app: «JWKs URL» и «Audience (aud)»). На `localhost`
(`wrangler dev`) проверка пропускается, чтобы не ломать локальную разработку.

## Установка ярлыка на телефон

- **iOS Safari:** Поделиться → «На экран „Домой“».
- **Android Chrome:** ⋮ → «Добавить на главный экран».

Иконка ярлыка — `public/favicon.svg` (+ `apple-touch-icon` при наличии).

## Настройка целей

Цели (калории / белок / клетчатка + вес для подсказки белка 1.6×кг) правятся прямо
в приложении (значок ⚙️) и хранятся в `localStorage` устройства. Дефолты-сид — в
[`src/lib/goals.ts`](src/lib/goals.ts).

## Источник данных (Notion)

- API-модель `Notion-Version: 2025-09-03`, эндпоинт
  `POST /v1/data_sources/{DATA_SOURCE_ID}/query`.
- `DATA_SOURCE_ID` базы «Питание» и имена полей зашиты в
  [`worker/index.ts`](worker/index.ts). Имена полей —
  посимвольно русские (`Калории`, `Белок, г`, …), менять нельзя.
- Приложение **только читает** Notion. Никаких записей.
