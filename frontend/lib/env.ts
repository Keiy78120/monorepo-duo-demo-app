import { z } from "zod";

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_STORAGE_BUCKET: z.string().min(1).optional(),

  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().min(1),

  // Better Auth
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url(),

  // Cannabis API + Groq (optional until feature is used)
  CANNABIS_API_URL: z.string().url().optional(),
  GROQ_API_KEY: z.string().min(1).optional(),
  GROQ_MODEL: z.string().min(1).optional(),
  APP_TONE: z.string().optional(),
  APP_TARGET_AUDIENCE: z.string().optional(),
  APP_DESCRIPTION_LENGTH: z.string().optional(),
  APP_KEYWORDS: z.string().optional(),
  APP_AVOID: z.string().optional(),

  // Emergency / Nuke (optional)
  ENABLE_EMERGENCY_NUKE: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),
  GITHUB_REPO_OWNER: z.string().optional(),
  GITHUB_REPO_NAME: z.string().optional(),
  VERCEL_TOKEN: z.string().optional(),
  VERCEL_PROJECT_ID: z.string().optional(),
  VERCEL_TEAM_ID: z.string().optional(),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

// Server-side environment validation
export function getServerEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }

  return parsed.data;
}

// Client-side environment validation
export function getClientEnv() {
  const clientEnv = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  };

  const parsed = clientEnvSchema.safeParse(clientEnv);

  if (!parsed.success) {
    console.error("Invalid client environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid client environment variables");
  }

  return parsed.data;
}

// Type-safe env access
export const env = {
  get supabaseUrl() {
    return process.env.NEXT_PUBLIC_SUPABASE_URL!;
  },
  get supabaseAnonKey() {
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  },
  get supabaseServiceKey() {
    return process.env.SUPABASE_SERVICE_ROLE_KEY!;
  },
  get telegramBotToken() {
    return process.env.TELEGRAM_BOT_TOKEN!;
  },
  get betterAuthSecret() {
    return process.env.BETTER_AUTH_SECRET!;
  },
  get betterAuthUrl() {
    return process.env.BETTER_AUTH_URL!;
  },
  get appUrl() {
    return process.env.NEXT_PUBLIC_APP_URL!;
  },
};
