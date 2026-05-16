// Importing custom PrismaClient singletons resolved automatically by "npx prisma generate" phases.
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../generated/prisma/client";

// Cache key for the global singleton.
const CACHE_KEY = "__prisma_turso__";
const globalStore = globalThis as unknown as Record<string, PrismaClient | undefined>;

function buildPrismaClient(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  console.log("[prisma] Initializing PrismaClient...");
  console.log("[prisma] TURSO_DATABASE_URL:", tursoUrl ? tursoUrl.substring(0, 30) + "..." : "⚠️ UNDEFINED");

  // Prisma v7 API: pass config object directly to PrismaLibSql (no more createClient)
  const adapter = new PrismaLibSql({
    url: tursoUrl || "file:./dev.db",
    authToken: tursoToken,
  });

  return new PrismaClient({ adapter });
}

export const prisma = globalStore[CACHE_KEY] ?? buildPrismaClient();

// Persist operational singleton pools into host global targets during active debugging cycles.
if (process.env.NODE_ENV !== "production") {
  globalStore[CACHE_KEY] = prisma;
}
