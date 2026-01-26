/**
 * Centralized Branding Configuration
 *
 * This file centralizes all client-specific branding variables,
 * making it easy to customize the app for different clients.
 *
 * All values can be overridden via environment variables.
 */

export const BRANDING = {
  // App Information
  appName: process.env.NEXT_PUBLIC_APP_NAME || "YX Mini App",
  clientName: process.env.NEXT_PUBLIC_CLIENT_NAME || "Demo Client",

  // Telegram Bot
  botUsername: process.env.NEXT_PUBLIC_BOT_USERNAME || "yx_bot_app",

  // Visual Identity
  primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || "#8B5CF6",
  accentColor: process.env.NEXT_PUBLIC_ACCENT_COLOR || "#EC4899",
  logo: process.env.NEXT_PUBLIC_LOGO_URL || "/logo.png",

  // Contact & Support
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@example.com",
  supportUrl: process.env.NEXT_PUBLIC_SUPPORT_URL || undefined,

  // Features Flags (can be used to enable/disable features per client)
  features: {
    advancedMode: process.env.NEXT_PUBLIC_FEATURE_ADVANCED !== "false",
    simpleMode: process.env.NEXT_PUBLIC_FEATURE_SIMPLE !== "false",
    reviews: process.env.NEXT_PUBLIC_FEATURE_REVIEWS !== "false",
    drivers: process.env.NEXT_PUBLIC_FEATURE_DRIVERS !== "false",
  },
} as const;

/**
 * Get branding value with fallback
 */
export function getBranding<K extends keyof typeof BRANDING>(
  key: K,
  fallback?: typeof BRANDING[K]
): typeof BRANDING[K] {
  return BRANDING[key] ?? fallback ?? BRANDING[key];
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof BRANDING.features): boolean {
  return BRANDING.features[feature];
}
