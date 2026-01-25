import { betterAuth } from "better-auth";
import { Pool } from "pg";

let authInstance: ReturnType<typeof betterAuth> | null = null;
let poolInstance: Pool | null = null;

function getPool() {
  if (poolInstance) return poolInstance;
  const useSsl = process.env.DB_SSL === "true";
  poolInstance = new Pool({
    connectionString:
      process.env.DATABASE_URL ||
      "postgresql://postgres:postgres@localhost:54322/postgres",
    ssl: useSsl ? { rejectUnauthorized: true } : false,
  });
  return poolInstance;
}

export function getAuth() {
  if (authInstance) return authInstance;
  authInstance = betterAuth({
    database: getPool(),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      requireEmailVerification: false, // Set to true in production
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60, // 5 minutes
      },
    },
    trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"],
    advanced: {
      cookiePrefix: "tg-mini-app",
      useSecureCookies: process.env.NODE_ENV === "production",
    },
  });
  return authInstance;
}

export type AuthInstance = ReturnType<typeof betterAuth>;
export type Session = AuthInstance["$Infer"]["Session"];
