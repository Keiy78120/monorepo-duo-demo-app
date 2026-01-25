import crypto from "crypto";

export type TelegramAdminTokenPayload = {
  sub: string;
  username?: string | null;
  exp: number;
};

function base64UrlEncode(value: Buffer | string) {
  const buffer = typeof value === "string" ? Buffer.from(value) : value;
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + "=".repeat(padLength), "base64").toString("utf8");
}

export function signTelegramAdminToken(
  payload: TelegramAdminTokenPayload,
  secret: string
) {
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest();
  return `${body}.${base64UrlEncode(signature)}`;
}

export function verifyTelegramAdminToken(token: string, secret: string) {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expectedSignature = base64UrlEncode(
    crypto.createHmac("sha256", secret).update(body).digest()
  );
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }
  try {
    const parsed = JSON.parse(base64UrlDecode(body)) as TelegramAdminTokenPayload;
    if (!parsed?.exp || Date.now() > parsed.exp) return null;
    if (!parsed?.sub) return null;
    return parsed;
  } catch {
    return null;
  }
}
