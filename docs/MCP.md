# MCP Server

The MCP server exposes the platform's messaging and scheduling capabilities as
tools over stdio. Handlers call the **same NestJS domain services** used by the
REST controllers (`SchedulesService`, `GroupsService`, `NotificationService`,
`HistoryService`) — no business logic is duplicated.

## Running

```bash
cd apps/api
npm run mcp        # dev (ts-node)
npm run build && npm run mcp:prod   # built
```

The scheduler is automatically disabled inside the MCP process so cron ticks
only run in the API server.

## Client configuration (Claude Desktop / Claude Code)

```json
{
  "mcpServers": {
    "whatsapp-automation": {
      "command": "node",
      "args": ["C:/path/to/MCP/apps/api/dist/mcp/mcp-main.js"]
    }
  }
}
```

## Tools

| Tool | Input | Description |
|------|-------|-------------|
| `list_whatsapp_groups` | — | Recipient lists (named sets of individual numbers) |
| `get_group_details` | `groupId` | One list including member contacts |
| `add_recipient` | `groupId`, `name`, `phone` | Add an E.164 phone number to a list |
| `remove_recipient` | `groupId`, `contactId` | Remove a contact from a list |
| `send_whatsapp_message` | `groupId`, `message` | Immediate parallel send to every contact; retried on transient failure |
| `list_schedules` | — | All schedules with next run + summary |
| `create_schedule` | `name`, `targetGroupId`, `message`, `frequency`, `time`, `timezone`, `weekday?`, `enabled` | Create a job (default tz `Asia/Kolkata`) |
| `pause_schedule` | `scheduleId` | Disable a job |
| `resume_schedule` | `scheduleId` | Enable a job |
| `get_delivery_history` | `scheduleId?`, `status?`, `limit?` | Execution history, newest first |

All tools return JSON in a text content block.

## Example prompts

- "List my WhatsApp groups and create a daily 04:30 Asia/Kolkata good-morning
  schedule for the Family Circle group."
- "Pause the Morning Message schedule."
- "Show me the last 20 failed deliveries."
