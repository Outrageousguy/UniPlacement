import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from "@shared/schema";
import ws from "ws";


neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Increased from 5 to 20 for better concurrency
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 30000,
});

export const db = drizzle(pool, { schema });

export async function retryDb<T>(fn: () => Promise<T>, retries = 3, delayMs = 200): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === retries) throw error;
      const errObj = error as any;
      const code = errObj?.code ?? errObj?.details?.code;
      if (!code || !["ETIMEDOUT", "ECONNRESET", "EPIPE", "ENETDOWN"].includes(code)) {
        // If not a transient error, rethrow immediately
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }
  throw lastError;
}