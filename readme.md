# Phase 2: Code Understanding

## 1. Project Architecture

### High-level architecture

This repository is a full-stack crypto trading platform organized as a monorepo:

- `frontend/`: Next.js 16 application for the user/admin interface.
- `backend/`: Node.js + TypeScript backend with file-based API handlers, Sequelize models, Redis helpers, and exchange integrations.
- `scripts/`: operational scripts for maintenance, key generation, updates, and deployment helpers.
- `maintenance/`: maintenance-mode static site/server.
- `initial.sql`: database bootstrap/schema dump.
- `ecosystem/`: blockchain wallet and ecosystem-related assets/configuration.

At runtime, the system works like this:

1. The browser loads the Next.js frontend.
2. Frontend pages/components call backend APIs through `frontend/lib/api.ts` or direct `fetch(...)`.
3. Backend route handlers under `backend/api/**` read/write Sequelize models from `backend/models/**`.
4. Some backend flows also use Redis for cache/rate-limit/ban state and external exchange providers through `ccxt`/exchange manager utilities.
5. Real-time updates are delivered through WebSocket endpoints and consumed by frontend WebSocket services/providers.

### Folder structure

#### Root

- `package.json`: workspace scripts for dev, build, seed, test, PM2 start, maintenance.
- `pnpm-workspace.yaml`: workspace linking for frontend/backend.
- `initial.sql`: full SQL schema snapshot.
- `production*.config.js`: PM2 process configs.

#### Frontend (`frontend/`)

- `app/`: Next.js App Router pages and route-level UI.
- `components/`: reusable UI and feature components.
- `provider/`: app-wide providers such as theme and WebSocket bootstrapping.
- `store/`: Zustand stores for client-side state.
- `services/`: long-lived frontend services, especially WebSocket and market data services.
- `hooks/`: reusable stateful logic.
- `lib/`: API helper, retry logic, notification utilities, websocket manager, etc.
- `context/`: React context wrappers where needed.
- `i18n/`: localization setup and loaders.
- `public/`: static assets including chart assets, blockchain icons, service workers.

#### Backend (`backend/`)

- `index.ts`: backend bootstrap; loads env vars and starts the server.
- `api/`: file-based backend endpoints.
- `models/`: Sequelize models grouped by business domain.
- `seeders/`: initial seed data.
- `types/`: generated/shared model typings.
- `ecosystem/`, `email/`, `scripts/`: domain helpers and tooling.
- `dist/`: compiled backend output.

### API flow

The visible exchange module follows a consistent backend flow:

1. Frontend calls an endpoint such as `/api/exchange/market` or `/api/exchange/order`.
2. The route file in `backend/api/...` receives a `Handler` object with `user`, `query`, `body`, and request metadata.
3. The handler validates inputs and auth requirements through route metadata and local logic.
4. The handler reads/writes Sequelize models through `models.*`.
5. Shared utilities handle exchange ban state, sanitization, or schema shaping.
6. For trading actions, the backend calls an external provider through `ExchangeManager`.
7. The response is returned to the frontend.
8. If the route has a WebSocket companion, live order/market updates are pushed through a matching `.ws.ts` handler.

#### Example: order creation flow

`POST /api/exchange/order`

1. Check authenticated user.
2. Check temporary exchange ban status stored in Redis.
3. Load market metadata from `exchangeMarket`.
4. Validate amount, minimum cost, and precision.
5. Load or create user wallets.
6. Submit the order through the exchange provider.
7. Fetch the created order back from the provider.
8. Persist order data into `exchangeOrder`.
9. Update wallet balances.
10. Register the order for live WebSocket tracking.

### State management

The frontend uses a layered state model:

#### 1. Provider initialization

`frontend/provider/providers.tsx` is the main bootstrap wrapper.

It:

- initializes theme handling with `next-themes`
- seeds the user store from SSR/profile data
- seeds config/settings/extensions into the config store
- conditionally starts WebSocket handling when a logged-in user exists
- mounts notifications/toast and global error handling

#### 2. Zustand stores

Main visible stores:

- `frontend/store/user.ts`
  - authenticated user profile
  - API keys
  - auth actions like login/logout/register/reset password
  - permission/KYC/security/profile-completion helpers
- `frontend/store/config.ts`
  - site settings
  - enabled extensions
  - navigation/side menu state derived from config
- `frontend/store/index.ts`
  - theme UI state like radius/navbar/footer/RTL/sidebar
- `frontend/store/notification-store.ts`
  - notifications cache
  - unread statistics
  - optimistic read/unread/delete actions
  - persisted notification sound preference

#### 3. Service-level state

Some state is intentionally kept outside React components:

- `frontend/services/market-service.ts`
  - caches spot/futures/ecosystem market lists
  - deduplicates in-flight fetches
  - exposes subscriber callbacks
- `frontend/services/orders-ws.ts`
  - manages order stream subscriptions by market type
  - caches last order payloads
  - reconnects and re-subscribes as needed

#### 4. WebSocket state

`frontend/provider/websocket.provider.tsx` keeps a user-scoped WebSocket manager in context and forwards notification stream events into the notification store.

## 2. Key Components

### Frontend components/services to understand first

- `frontend/provider/providers.tsx`
  - main application bootstrap
- `frontend/lib/api.ts`
  - shared HTTP client wrapper used across the app
- `frontend/store/user.ts`
  - central auth/user state
- `frontend/store/config.ts`
  - settings/extensions/menu state
- `frontend/store/notification-store.ts`
  - notification cache and actions
- `frontend/provider/websocket.provider.tsx`
  - authenticated real-time connection bootstrap
- `frontend/services/market-service.ts`
  - shared market data fetch/cache layer
- `frontend/services/orders-ws.ts`
  - order-specific WebSocket subscription manager

### Backend components/services to understand first

- `backend/index.ts`
  - backend startup entrypoint
- `backend/models/init.ts`
  - recursively loads all Sequelize models and wires associations
- `backend/api/exchange/utils.ts`
  - shared exchange route helpers, especially Redis-backed ban handling
- `backend/api/exchange/order/index.post.ts`
  - best single example of validation -> DB -> provider -> wallet update flow
- `backend/api/exchange/order/index.ws.ts`
  - real-time order tracking loop

## 3. Database Schema

### Schema organization

The database is large and domain-driven. `backend/models/init.ts` recursively loads models from these major groups:

- `access/`: auth, roles, permissions, providers, 2FA
- `blog/`: authors, posts, comments, categories, tags
- `content/`: pages, sliders
- `exchange/`: spot/binary trading entities
- `finance/`: wallets, transactions, gateways, currencies
- `investment/`: investment plans and subscriptions
- `kyc/`: KYC levels, applications, verification services/results
- `system/`: settings, notifications, extensions, API keys, announcements
- `ext/*`: optional feature modules such as NFT, P2P, ecosystem, gateway, copy-trading, staking, forex, ICO, ecommerce, AI, mail wizard, affiliate, trading bot

### Important core tables

#### User and access

- `user`
  - primary account record
  - fields include `email`, `password`, `roleId`, `status`, `settings`, profile data
- `role`, `permission`, `rolePermission`
  - RBAC model for admin/user permissions
- `api_key`
  - user-scoped API keys with permissions and IP whitelist
- `twoFactor`
  - 2FA/authentication support

#### Trading/exchange

- `exchange_currency`
  - tradable currency master data
  - key fields: `currency`, `name`, `precision`, `price`, `fee`, `status`
- `exchange_market`
  - spot market definitions
  - key fields: `currency`, `pair`, `metadata`, `status`
  - `metadata` stores precision/limits/provider-specific config as JSON
- `exchange_order`
  - persisted user spot orders
  - key fields: `userId`, `referenceId`, `symbol`, `type`, `side`, `price`, `amount`, `filled`, `remaining`, `cost`, `fee`, `status`
- `exchange_watchlist`
  - user watchlist symbols
  - key fields: `userId`, `symbol`
- `binary_market`, `binary_order`
  - binary trading module tables

#### Wallet/finance

- `wallet`
  - per-user balances by wallet type and currency
  - key fields: `userId`, `type`, `currency`, `balance`, `inOrder`, `address`, `status`
- `transaction`
  - financial ledger/activity records
- `deposit_gateway`, `deposit_method`, `withdraw_method`
  - fiat/crypto funding configuration
- `admin_profit`
  - tracks platform profit from financial operations

#### Support and operations

- `support_ticket`
  - ticket/live-chat thread storage
  - stores message arrays in JSON
- `settings`
  - system configuration
- `notification`, `notification_template`
  - in-app/system notification system
- `extension`
  - enabled feature flags/modules

### Exchange schema relationships

The exchange feature visibly depends on these relationships:

- `user` -> `wallet` (one user, many wallets)
- `user` -> `exchangeOrder` (one user, many orders)
- `user` -> `exchangeWatchlist` (one user, many watchlist items)
- `exchangeMarket` supplies market metadata used during order validation
- `wallet` balances are debited/credited when `exchangeOrder` status changes

## 4. API Endpoints

The backend API files visible in this repository snapshot are the exchange endpoints below.

### Market endpoints

- `GET /api/exchange/market`
  - list spot markets
  - supports `?eco=true` to merge ecosystem markets
- `GET /api/exchange/market/:id`
  - fetch a single market
- `WS /api/exchange/market`
  - real-time market stream

### Currency endpoints

- `GET /api/exchange/currency`
  - list currencies
- `GET /api/exchange/currency/:id`
  - fetch a single currency

### Ticker and order book endpoints

- `GET /api/exchange/ticker`
  - list ticker data
- `GET /api/exchange/ticker/:currency/:pair`
  - fetch ticker for one symbol
- `WS /api/exchange/ticker`
  - real-time ticker stream
- `GET /api/exchange/orderbook/:currency/:pair`
  - fetch order book snapshot

### Spot order endpoints

- `GET /api/exchange/order`
  - list user orders
- `POST /api/exchange/order`
  - create order
- `GET /api/exchange/order/:id`
  - fetch order details
- `DELETE /api/exchange/order/:id`
  - cancel/delete order
- `WS /api/exchange/order`
  - real-time order updates for subscribed users

### Binary order endpoints

- `GET /api/exchange/binary/order`
  - list binary orders
- `POST /api/exchange/binary/order`
  - create binary order
- `GET /api/exchange/binary/order/last`
  - fetch latest binary order
- `GET /api/exchange/binary/order/:id`
  - fetch binary order
- `DELETE /api/exchange/binary/order/:id`
  - delete/cancel binary order
- `WS /api/exchange/binary/order`
  - real-time binary order stream

### Watchlist endpoints

- `GET /api/exchange/watchlist`
  - list current user watchlist
- `POST /api/exchange/watchlist`
  - add symbol to watchlist
- `DELETE /api/exchange/watchlist`
  - remove symbol from watchlist

### Chart endpoint

- `GET /api/exchange/chart`
  - chart/candlestick style market data

## 5. Confirmed API/Data Flow Between Frontend and Backend

The visible frontend code consumes the backend in three main ways:

### HTTP

- `frontend/lib/api.ts` builds the backend base URL, adds credentials, parses responses, and standardizes error/success handling.
- Stores and pages call `$fetch(...)` or direct `fetch(...)`.

### WebSocket

- `frontend/provider/websocket.provider.tsx`
  - connects logged-in users to `/api/user?userId=...`
  - forwards notification events into the notification store
- `frontend/services/orders-ws.ts`
  - connects to `/api/exchange/order` for spot order updates
  - also reserves separate connections for ecosystem and futures order streams

### Cached shared service layer

- `frontend/services/market-service.ts`
  - fetches `/api/exchange/market?eco=true`
  - caches and deduplicates requests
  - notifies subscribers instead of refetching per component

## 6. Short Summary

This project is a modular crypto platform with:

- a Next.js frontend
- a TypeScript backend with file-based API routes
- Sequelize models grouped by business domain
- Zustand for client-side state
- Redis for backend caching/control state
- WebSockets for notifications and live trading updates

For onboarding, the best files to read first are:

- `frontend/provider/providers.tsx`
- `frontend/lib/api.ts`
- `frontend/store/user.ts`
- `frontend/store/config.ts`
- `backend/models/init.ts`
- `backend/api/exchange/order/index.post.ts`
- `backend/api/exchange/order/index.ws.ts`

## 7. Scope Note

This document is based on the code visible in the current workspace snapshot. A few backend imports reference server internals outside the files inspected here, so this README focuses on what is directly verifiable from the repository contents, especially the visible exchange/trading flow.
