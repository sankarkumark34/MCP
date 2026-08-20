# WhatsApp Automation Platform

A full-stack WhatsApp automation console: schedule, manage and monitor WhatsApp
notification jobs through a React admin console, a NestJS REST API, an MCP tool
layer, and a reliable scheduler with idempotency and retries.

> Built from the Product Proposal & Technical Specification v2.1 (August 2026).

## Stack

| Layer    | Technology |
|----------|------------|
| Frontend | React 18, TypeScript, Vite, Redux Toolkit, RTK Query, React Router |
| Backend  | NestJS 10, TypeScript, TypeORM, PostgreSQL (SQLite for local dev) |
| Scheduler| @nestjs/schedule cron with idempotency keys + bounded retries |
| MCP      | @modelcontextprotocol/sdk (stdio server) sharing the same domain services |
| Auth     | JWT (seeded admin user) |

## Quick start

```bash
# 1. Backend
cd apps/api
npm install
cp .env.example .env   # fill in secrets
npm run start:dev      # http://localhost:3000/api/v1

# 2. Frontend
cd apps/web
npm install
npm run dev            # http://localhost:5173
```

Default login: `admin@example.com` / `admin123` (change via env).

## Docker

```bash
docker compose up --build
```

Starts PostgreSQL, the API and the web console.

## MCP server

```bash
cd apps/api
npm run mcp
```

Exposes `list_whatsapp_groups`, `get_group_details`, `send_whatsapp_message`,
`list_schedules`, `create_schedule`, `pause_schedule`, `resume_schedule`,
`get_delivery_history` over stdio. See [docs/MCP.md](docs/MCP.md).

## Documentation

- [docs/API.md](docs/API.md) — REST API reference
- [docs/MCP.md](docs/MCP.md) — MCP tools and client configuration
- [docs/DESIGN_TOKENS.md](docs/DESIGN_TOKENS.md) — UI design tokens
- [docs/E2E.md](docs/E2E.md) — manual end-to-end test procedure

## WhatsApp provider constraint

The platform ships with a **mock provider** by default. Real WhatsApp group
messaging support must be verified for your exact provider/account before
production use — the provider is isolated behind the `WhatsAppProvider`
adapter interface (`apps/api/src/whatsapp/`), so swapping providers does not
require changes to the scheduler, UI or domain services.
