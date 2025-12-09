/**
 * Database Client
 * 
 * Centralized Prisma client export to avoid circular dependencies
 * 
 * @author AgentNexus Team
 */

import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
