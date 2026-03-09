import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";
import { validateEnv } from "./env";
import { logger } from "./logger";

// Validate environment on first import
validateEnv();

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  try {
    const dbPath = path.join(process.cwd(), "dev.db");
    const adapter = new PrismaBetterSqlite3({ url: dbPath });
    const client = new PrismaClient({ adapter });
    logger.info("Database connection established");
    return client;
  } catch (error) {
    logger.error("Failed to create database connection", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
