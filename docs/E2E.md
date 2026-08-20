# Manual End-to-End Test Procedure

Prereqs: API running on :3000 (`npm run start:dev` in `apps/api`), console on
:5173 (`npm run dev` in `apps/web`).

## 1. Authentication

1. Open http://localhost:5173 → redirected to `/login`.
2. Wrong password → inline accessible error under the password field.
3. `admin@example.com` / `admin123` → lands on `/dashboard`.
4. Sign out from the top bar → back to `/login`; deep links redirect to login.

## 2. Dashboard

1. KPI cards show Active automations, Sent, Failed, Next run.
2. With no schedules: "Active automations" card shows the create CTA.
3. Delivery trend renders a 7-day chart with a Sent/Failed legend.

## 3. Create the target automation (acceptance scenario)

1. Schedules → "+ New automation".
2. Leave fields empty and save → field-level errors, focus preserved.
3. Fill: name "Morning Good Morning Message", group "Family Circle",
   message "Good Morning! Have a productive day! 🌞",
   frequency Every day, time 04:30, timezone Asia/Kolkata.
4. Verify human-readable summary: "Every day at 04:30 (Asia/Kolkata)".
5. Save → toast, row appears with next run time.
6. Dashboard now shows the automation and next execution.

## 4. Test send, pause/resume

1. Schedules row → "Send test" → success toast (or actionable failure toast —
   the mock provider fails ~10% of attempts transiently; retries are automatic).
2. History shows the execution with `Test` badge, attempts and duration.
3. Pause → badge flips to "Paused", next run disappears from dashboard.
4. Resume → active again.

## 5. Idempotency & retries (backend)

1. Set a schedule time 1–2 minutes ahead; wait for the cron tick.
2. Exactly one execution appears for the day (idempotency key
   `<scheduleId>:<local-date>` is unique).
3. Restart the API within the grace window — still no duplicate execution.
4. With `MOCK_FAILURE_RATE=1`, executions retry up to `MAX_SEND_ATTEMPTS`
   with backoff then record `FAILED` with error code/message.
5. Rate limiting: 6th test send within a minute → HTTP 429.

## 6. Templates & AI

1. Messages → create template with `{{group}}` placeholder → live preview.
2. Edit and delete a template (delete has a confirmation dialog).
3. With `OPENAI_API_KEY` set: "Draft with AI" fills the message field.
   Without: the AI section is hidden and Settings reports it disabled.

## 7. Groups

1. Groups page lists seeded groups; "Company Broadcast" is Unsupported and
   cannot be scheduled (backend also rejects it with 400).

## 8. History

1. Filter by status and automation; paginate.
2. Failed rows show `[CODE] message`.

## 9. Accessibility & rendering QA

1. Tab through the console — visible focus rings everywhere.
2. Dialogs trap Escape, focus the cancel button on open.
3. Long group names/messages wrap without clipping (overflow-wrap).
4. Narrow the window below 768px — sidebar collapses to a top bar; tables
   scroll horizontally inside their container.
5. Enable OS reduced-motion — animations disabled.
