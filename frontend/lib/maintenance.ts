import { queryOne } from "@/lib/db/client";

function parseBooleanValue(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value !== "string") return false;

  const trimmed = value.trim().toLowerCase();
  if (trimmed === "true" || trimmed === "1") return true;
  if (trimmed === "false" || trimmed === "0") return false;

  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === "boolean") return parsed;
    if (typeof parsed === "number") return parsed === 1;
  } catch {
    // ignore
  }

  return false;
}

export async function isMaintenanceMode(): Promise<boolean> {
  try {
    const setting = await queryOne<{ value: string | null }>(
      `SELECT value FROM settings WHERE key = 'maintenance_mode'`
    );

    if (!setting) return false;
    return parseBooleanValue(setting.value);
  } catch (error) {
    console.error("Maintenance check error:", error);
    return false;
  }
}
