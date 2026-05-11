// Importa o PrismaClient gerado automaticamente pelo comando "npx prisma generate".
// Esse client é tipado de acordo com o schema.prisma e usa o engine client do Prisma 7.
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

// Cria um tipo estendido do globalThis (objeto global do Node.js)
// para guardar a instância do Prisma sem que o TypeScript reclame.
// Isso evita recriar o client a cada hot reload do Next.js em desenvolvimento.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// O engine client do Prisma precisa de um adapter explícito para conversar com o SQLite.
// Aqui usamos o adapter oficial recomendado para better-sqlite3.
const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL,
});

// Reutiliza a instância global se já existir; caso contrário, cria uma nova.
// Esse padrão mantém a conexão estável durante o desenvolvimento e evita múltiplas instâncias.
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

// Em desenvolvimento, salva a instância no objeto global.
// Em produção não é tão necessário, mas o padrão continua seguro e previsível.
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
