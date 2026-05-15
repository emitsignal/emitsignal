import { PrismaLibSql } from '@prisma/adapter-libsql';

import { PrismaClient } from '../generated/prisma/client';

const url = process.env.DATABASE_URL ?? 'file:./emitsignal-dev.db';

const adapter = new PrismaLibSql({ url });

export const prisma = new PrismaClient({ adapter });
