// Importa o PrismaClient gerado automaticamente pelo comando "npx prisma generate"
// Esse client é tipado de acordo com o schema.prisma
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

// Cria um tipo estendido do globalThis (objeto global do Node.js)
// para guardar a instância do Prisma sem que o TypeScript reclame
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL,
});

// Reutiliza a instância global se já existir, senão cria uma nova
// evita criar múltiplas conexões com o banco durante o desenvolvimento,
// já que o Next.js reinicia o servidor a cada mudança de código (hot reload)
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

// Em desenvolvimento, salva a instância no objeto global
// Em produção não precisa pois o servidor não reinicia
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
