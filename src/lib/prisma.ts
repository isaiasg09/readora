// Importing custom PrismaClient singletons resolved automatically by "npx prisma generate" phases.
// Yields fully typed entity models driven directly by underlying schema.prisma definitions.
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

// Extending global namespace mapping tuples to preserve active persistent handles safely.
// Circumvents ephemeral connection churn frequently triggered during local dev hot reload loops.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Instantiating explicit database hardware driver adapters to bridge native SQLite execution bindings.
// Enforces standard better-sqlite3 communication channels optimized for low latency throughput.
const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL,
});

// Reusing global cached instances if hydrated; otherwise spawns distinct native query clients.
// Guarantees single-pool concurrency alignment across the entire Application runtime.
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

// Persist operational singleton pools into host global targets during active debugging cycles.
// Safely bypassed in pure containerized serverless runtimes.
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
