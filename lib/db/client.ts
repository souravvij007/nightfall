import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 connects through a driver adapter. We use node-postgres (`pg`) against the
// local Prisma Postgres server (see .env / `npx prisma dev`).
const connectionString = process.env.DATABASE_URL;

function createClient() {
  // Pool tuning: the local Prisma Postgres proxy closes idle connections aggressively, which
  // otherwise surfaces as intermittent `DriverAdapterError: ConnectionClosed` on a stale pooled
  // connection. Evict idle connections quickly (before the proxy does) and keep sockets alive.
  const adapter = new PrismaPg({
    connectionString,
    max: 10,
    idleTimeoutMillis: 10_000,
    keepAlive: true,
  });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

// Reuse a single PrismaClient across Next.js dev HMR reloads to avoid exhausting
// database connections. In production a fresh instance per server process is fine.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
