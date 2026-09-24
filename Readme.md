# Bazaar

Commerce platform with one NestJS API, a background worker, an Expo store app, and a Next.js storefront that includes the admin console.

Money is stored as integer paise. Prices, stock, and payment state are decided on the server. Clients never send the amount to charge.

## Layout

- `apps/api` — NestJS API (`/api/v1`, `/admin/v1`) and the worker process that drains the transactional outbox
- `apps/web` — Next.js storefront `(store)` and admin `(admin)`. The browser talks to the API through same-origin proxy routes so auth cookies stay first-party
- `apps/mobile` — Expo SDK 57 app. Sessions live in Secure Store. Guest carts live in a TanStack Store persisted with Async Storage
- `packages/contracts` — Zod schemas shared by the API and both clients
- `packages/tokens` — color, type, and spacing tokens used by Tailwind and NativeWind

Interactive clients use TanStack Query for server state, TanStack Form for account and catalog forms, and TanStack Store for the guest cart. Admin order and product queues use TanStack Table. Search boxes debounce with TanStack Pacer. Routing stays on Next.js App Router and Expo Router.

## Local setup

Requirements: Node 22, pnpm 10, and PostgreSQL 16. Docker Compose can start Postgres, the API, and the worker when Docker is available.

```bash
pnpm install
cp .env.example .env
cp .env apps/api/.env
```

Create the database named in `DATABASE_URL`, then migrate and seed:

```bash
pnpm --filter @bazaar/api exec prisma migrate deploy
pnpm --filter @bazaar/api seed
```

The seed creates an admin user, `admin@bazaar.local` / `change-me-admin-password`, and a small catalog. Product photos are loaded from the image URLs stored on each product. The running app does not call FakeStore.

## Run

```bash
pnpm --filter @bazaar/api dev
pnpm --filter @bazaar/api dev:worker
pnpm --filter @bazaar/web dev
pnpm --filter @bazaar/mobile dev
```

The API listens on port 8000. The worker listens on 8001 for health checks and processes outbox rows plus expired stock reservations. The site is http://localhost:3000. OpenAPI is at http://localhost:8000/docs.

`PAYMENTS_DRIVER=fake` creates a provider order id without calling Razorpay. Checkout still reserves stock and leaves the order `payment_pending` until a signed `payment.captured` webhook is posted to `/webhooks/razorpay`. Set `PAYMENTS_DRIVER=razorpay` with test keys to open Razorpay Checkout. The fake driver is rejected when `NODE_ENV=production`.

The mobile Razorpay sheet needs a development build. Expo Go cannot load `react-native-razorpay`.

```bash
pnpm --filter @bazaar/mobile prebuild
```

Generated `apps/mobile/android` and `apps/mobile/ios` directories are gitignored.

## Tests

```bash
pnpm --filter @bazaar/api test
pnpm --filter @bazaar/api test:integration
pnpm typecheck
pnpm lint
```

Integration tests expect PostgreSQL at `DATABASE_URL`, or `postgresql://theatulgupta@localhost:5432/bazaar_test` when that variable is unset. CI provides its own database.
