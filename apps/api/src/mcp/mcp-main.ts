/**
 * MCP stdio server entry point.
 *
 * Bootstraps a Nest application context (no HTTP listener) and exposes the
 * platform's messaging/scheduling capabilities as MCP tools. Handlers call
 * the exact same domain services used by the REST controllers — no business
 * logic is duplicated here.
 *
 * Run: npm run mcp   (dev, ts-node)  |  npm run mcp:prod  (built)
 */
// The scheduler must not tick inside an MCP client process, and the
// whatsapp-web linked-device session cannot be shared with the API process —
// MCP sends use the mock provider unless explicitly overridden.
process.env.SCHEDULER_ENABLED = 'false';
process.env.WHATSAPP_PROVIDER = process.env.MCP_WHATSAPP_PROVIDER ?? 'mock';

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { AppModule } from '../app.module';
import { GroupsService } from '../groups/groups.service';
import { SchedulesService } from '../schedules/schedules.service';
import { NotificationService } from '../notifications/notification.service';
import { HistoryService } from '../history/history.service';
import { ExecutionStatus } from '../entities/notification-execution.entity';

function json(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
  };
}

async function main() {
  // stdout belongs to the MCP protocol — silence Nest logging.
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error'],
  });

  const groups = app.get(GroupsService);
  const schedules = app.get(SchedulesService);
  const notifications = app.get(NotificationService);
  const history = app.get(HistoryService);

  const server = new McpServer({
    name: 'whatsapp-automation',
    version: '1.0.0',
  });

  // zod schema generics can overflow TypeScript's instantiation depth through
  // the SDK's tool() typing; runtime validation is unaffected by this cast.
  const tool = server.tool.bind(server) as (
    name: string,
    description: string,
    schema: Record<string, unknown>,
    handler: (args: any) => Promise<unknown>,
  ) => void;

  tool(
    'list_whatsapp_groups',
    'List recipient lists (named groups of individual phone numbers). Messages are fanned out to every contact of a list in parallel.',
    {},
    async () => json(await groups.listGroups()),
  );

  tool(
    'get_group_details',
    'Get details for a recipient list by id, including its member contacts (names and phone numbers).',
    { groupId: z.string().describe('Recipient list id') },
    async ({ groupId }) => json(await groups.getGroup(groupId)),
  );

  tool(
    'add_recipient',
    'Add an individual phone number to a recipient list.',
    {
      groupId: z.string().describe('Recipient list id'),
      name: z.string().min(1).max(120).describe('Contact name'),
      phone: z
        .string()
        .describe('International E.164 phone number, e.g. +919876543210'),
    },
    async ({ groupId, name, phone }) =>
      json(await groups.addContact(groupId, name, phone)),
  );

  tool(
    'remove_recipient',
    'Remove a contact from a recipient list by contact id.',
    {
      groupId: z.string().describe('Recipient list id'),
      contactId: z.string().describe('Contact id (see get_group_details)'),
    },
    async ({ groupId, contactId }) =>
      json(await groups.removeContact(groupId, contactId)),
  );

  tool(
    'send_whatsapp_message',
    'Send a one-off WhatsApp message to every contact of a recipient list immediately, in parallel (with retry handling; recorded in delivery history).',
    {
      groupId: z.string().describe('Target recipient list id'),
      message: z.string().min(1).max(4096).describe('Message text to send'),
    },
    async ({ groupId, message }) => {
      const schedule = await schedules.create({
        name: `MCP ad-hoc send ${new Date().toISOString()}`,
        targetGroupId: groupId,
        message,
        schedule: { frequency: 'daily', time: '00:00', timezone: 'UTC' },
        enabled: false,
      });
      try {
        const execution = await notifications.sendTest(schedule.id);
        return json({
          status: execution.status,
          attemptCount: execution.attemptCount,
          providerMessageId: execution.providerMessageId ?? null,
          errorMessage: execution.errorMessage ?? null,
        });
      } finally {
        await schedules.remove(schedule.id).catch(() => undefined);
      }
    },
  );

  tool(
    'list_schedules',
    'List all notification schedules with group name, next run time and a human-readable summary.',
    {},
    async () => json(await schedules.findAll()),
  );

  tool(
    'create_schedule',
    'Create a scheduled WhatsApp notification job.',
    {
      name: z.string().min(1).max(120),
      targetGroupId: z.string().describe('WhatsApp group id (see list_whatsapp_groups)'),
      message: z.string().min(1).max(4096),
      frequency: z.enum(['daily', 'weekdays', 'weekends', 'weekly']).default('daily'),
      time: z
        .string()
        .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
        .describe('24h HH:mm local time, e.g. 04:30'),
      timezone: z.string().default('Asia/Kolkata').describe('IANA timezone'),
      weekday: z.number().int().min(0).max(6).optional()
        .describe('0=Sunday..6=Saturday, required for weekly frequency'),
      enabled: z.boolean().default(true),
    },
    async (input) =>
      json(
        await schedules.create({
          name: input.name,
          targetGroupId: input.targetGroupId,
          message: input.message,
          schedule: {
            frequency: input.frequency,
            time: input.time,
            timezone: input.timezone,
            weekday: input.weekday,
          },
          enabled: input.enabled,
        }),
      ),
  );

  tool(
    'pause_schedule',
    'Pause (disable) a schedule by id.',
    { scheduleId: z.string() },
    async ({ scheduleId }) => json(await schedules.setEnabled(scheduleId, false)),
  );

  tool(
    'resume_schedule',
    'Resume (enable) a schedule by id.',
    { scheduleId: z.string() },
    async ({ scheduleId }) => json(await schedules.setEnabled(scheduleId, true)),
  );

  tool(
    'get_delivery_history',
    'Get notification execution history (most recent first), optionally filtered by schedule or status.',
    {
      scheduleId: z.string().optional(),
      status: z.enum(['PENDING', 'SENT', 'FAILED', 'RETRIED', 'SKIPPED']).optional(),
      limit: z.number().int().min(1).max(200).default(50),
    },
    async ({ scheduleId, status, limit }) =>
      json(
        await history.find({
          scheduleId,
          status: status as ExecutionStatus | undefined,
          limit,
        }),
      ),
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('WhatsApp Automation MCP server running on stdio\n');
}

main().catch((err) => {
  process.stderr.write(`MCP server failed to start: ${err}\n`);
  process.exit(1);
});
