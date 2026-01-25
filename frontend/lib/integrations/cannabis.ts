import { fetchJsonWithRetry } from "./http";

export interface CannabisStrain {
  name: string;
  type?: string | null;
  rating?: number | null;
  effects?: string[] | null;
  flavors?: string[] | null;
  description?: string | null;
}

const cache = new Map<string, { expiresAt: number; value: CannabisStrain[] }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

function buildUrl(baseUrl: string, path: string) {
  const cleanPath = path.replace(/^\//, "");
  return new URL(cleanPath, normalizeBaseUrl(baseUrl)).toString();
}

function normalizeStrain(strain: any): CannabisStrain {
  return {
    name: String(strain?.name || ""),
    type: strain?.type ?? null,
    rating: typeof strain?.rating === "number" ? strain.rating : null,
    effects: Array.isArray(strain?.effects) ? strain.effects : null,
    flavors: Array.isArray(strain?.flavors) ? strain.flavors : null,
    description: strain?.description ?? null,
  };
}

function normalizeStrainList(payload: any): CannabisStrain[] {
  const hasName = (strain: CannabisStrain) => Boolean(strain.name);
  if (!payload) return [];
  if (Array.isArray(payload)) return payload.map(normalizeStrain).filter(hasName);
  if (Array.isArray(payload?.strains)) return payload.strains.map(normalizeStrain).filter(hasName);
  if (Array.isArray(payload?.data)) return payload.data.map(normalizeStrain).filter(hasName);
  if (payload?.name) return [normalizeStrain(payload)].filter(hasName);
  return [];
}

function getCached(key: string) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCached(key: string, value: CannabisStrain[]) {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

export async function getStrainsByName(
  baseUrl: string,
  name: string
): Promise<CannabisStrain[]> {
  const cacheKey = `name:${name.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const url = buildUrl(baseUrl, `getStrainsByName/${encodeURIComponent(name)}`);
  const payload = await fetchJsonWithRetry<any>(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const strains = normalizeStrainList(payload);
  setCached(cacheKey, strains);
  return strains;
}
