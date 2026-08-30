import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';

// Supabase Postgres runs in UTC. Pin the session timezone so schedule
// DateTimes don't shift when this Node process runs in a local TZ (e.g. CDT).
const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    options: '-c timezone=UTC',
});

export const prisma = new PrismaClient({ adapter });
