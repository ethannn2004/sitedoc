import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { validateEnv } from "./env";
import { logger } from "./logger";

// Validate environment on first import
validateEnv();

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  try {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    const adapter = new PrismaPg({ connectionString });
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
