import { PrismaLibSql } from '@prisma/adapter-libsql';

import { PrismaClient } from '../generated/prisma/client';

const url = process.env.DATABASE_URL ?? 'file:./db/emitsignal.db';

const adapter = new PrismaLibSql({ url });

export const prisma = new PrismaClient({ adapter });
