# REST API Reference

Base URL: `http://localhost:3000/api/v1`

All endpoints except `POST /auth/login` and `GET /health` require a JWT:
`Authorization: Bearer <token>`.

## Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/login` | `{ email, password }` → `{ accessToken, user }` (rate-limited 10/min) |
| GET | `/auth/me` | Current token payload |

## Dashboard

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard` | KPIs, 7-day delivery trend, active automations, recent activity |

## Groups

| Method | Path | Description |
|--------|------|-------------|
| GET | `/groups` | Groups discovered from the provider (`supported` flag per group) |
| GET | `/groups/:id` | One group |

## Schedules

| Method | Path | Description |
|--------|------|-------------|
| GET | `/schedules` | All schedules with `groupName`, `nextRunAt`, `summary` |
| POST | `/schedules` | Create (body below) |
| GET | `/schedules/:id` | One schedule |
| PATCH | `/schedules/:id` | Partial update (same shape as create) |
| DELETE | `/schedules/:id` | Delete |
| POST | `/schedules/:id/test` | Protected manual test send (rate-limited 5/min) |
| POST | `/schedules/:id/pause` | Disable |
| POST | `/schedules/:id/resume` | Enable |

### Create schedule body

```json
{
  "name": "Morning Good Morning Message",
  "targetGroupId": "group-family",
  "message": "Good Morning! Have a productive day! 🌞",
  "schedule": {
    "frequency": "daily",
    "time": "04:30",
    "timezone": "Asia/Kolkata",
    "weekday": 1
  },
  "enabled": true
}
```

- `frequency`: `daily` | `weekdays` | `weekends` | `weekly`
- `time`: 24h `HH:mm` in the schedule's timezone
- `timezone`: any valid IANA timezone (validated server-side)
- `weekday`: 0 (Sunday) – 6 (Saturday), only used for `weekly`

## Templates

| Method | Path | Description |
|--------|------|-------------|
| GET | `/templates` | List templates |
| POST | `/templates` | `{ name, body }` |
| PATCH | `/templates/:id` | Partial update |
| DELETE | `/templates/:id` | Delete |

## History

| Method | Path | Description |
|--------|------|-------------|
| GET | `/history` | Query params: `scheduleId`, `status` (`SENT`/`FAILED`/`RETRIED`/`SKIPPED`/`PENDING`), `limit` (≤200), `offset` |
| GET | `/history/:id` | One execution with schedule name |

## Health & provider

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness (public) |
| GET | `/provider/status` | Provider connection + group-messaging capability |

## AI assist (optional)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/ai/status` | `{ enabled }` — true when `OPENAI_API_KEY` is set |
| POST | `/ai/compose` | `{ prompt, tone? }` → `{ message }` (rate-limited 10/min) |

## Errors

Errors follow NestJS conventions:

```json
{ "statusCode": 400, "message": ["time must be HH:mm (24h)"], "error": "Bad Request" }
```
