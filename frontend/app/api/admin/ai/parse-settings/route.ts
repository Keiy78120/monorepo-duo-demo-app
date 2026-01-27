import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/guard";
import { fetchWithTimeout } from "@/lib/integrations/http";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/integrations/rate-limiter";

const bodySchema = z.object({
  text: z.string().min(1).max(10000),
});

export interface ParsedSettings {
  storeName?: string;
  contact?: {
    hours?: string;
    address?: string;
    phone?: string;
    email?: string;
    telegram?: string;
  };
  freeDeliveryThreshold?: number; // in centimes
  customLinks?: { name: string; url: string }[];
  sections?: { title: string; content: string }[];
  currency?: string;
}

interface ParseSettingsResponse {
  settings: ParsedSettings;
  warnings?: string[];
}

function buildSystemPrompt(): string {
  return `Tu es un assistant expert qui extrait les informations d'une boutique/entreprise à partir d'un texte libre.

OBJECTIF: Analyser le texte fourni et extraire toutes les informations pertinentes pour configurer une boutique en ligne.

RÈGLES D'EXTRACTION:
1. **storeName**: Le nom de la boutique/entreprise
2. **contact.hours**: Horaires d'ouverture (ex: "Lun-Sam 9h-19h", "7j/7 10h-22h")
3. **contact.address**: Adresse physique complète
4. **contact.phone**: Numéro de téléphone (garder le format original)
5. **contact.email**: Adresse email
6. **contact.telegram**: Username Telegram (avec ou sans @)
7. **freeDeliveryThreshold**: Seuil de livraison gratuite EN CENTIMES (50€ = 5000, 35€ = 3500)
8. **currency**: Devise détectée (EUR, USD, etc.) - par défaut EUR
9. **customLinks**: Liens vers réseaux sociaux ou sites externes
   - Détecte: Instagram, Facebook, TikTok, Twitter/X, YouTube, WhatsApp, Site web
   - Format: { "name": "Instagram", "url": "https://instagram.com/..." }
10. **sections**: Sections de contenu "À propos", description, mentions légales, etc.
    - Format: { "title": "À propos", "content": "..." }

RECONNAISSANCE DES RÉSEAUX SOCIAUX:
- @username sur Instagram → { "name": "Instagram", "url": "https://instagram.com/username" }
- @username sur Telegram → contact.telegram
- facebook.com/... → { "name": "Facebook", "url": "..." }
- tiktok.com/@... → { "name": "TikTok", "url": "..." }

CONVERSION DES MONTANTS:
- "50€" ou "50 euros" ou "50EUR" → 5000 (centimes)
- "29,99€" → 2999 (centimes)
- "gratuit dès 40€" → freeDeliveryThreshold: 4000

RÉPONSE: Retourne UNIQUEMENT un JSON valide avec cette structure:
{
  "settings": {
    "storeName": "nom ou null",
    "contact": {
      "hours": "horaires ou null",
      "address": "adresse ou null",
      "phone": "téléphone ou null",
      "email": "email ou null",
      "telegram": "username ou null"
    },
    "freeDeliveryThreshold": nombre_en_centimes_ou_null,
    "currency": "EUR",
    "customLinks": [
      { "name": "Instagram", "url": "https://..." }
    ],
    "sections": [
      { "title": "À propos", "content": "..." }
    ]
  },
  "warnings": ["avertissements optionnels"]
}

IMPORTANT:
- Si une information n'est pas trouvée, utilise null
- Ne devine PAS les informations - extrait uniquement ce qui est explicite
- Retourne UNIQUEMENT le JSON, sans texte supplémentaire`;
}

async function callGroq(
  text: string,
  apiKey: string,
  model: string
): Promise<ParseSettingsResponse> {
  const response = await fetchWithTimeout(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: buildSystemPrompt(),
          },
          {
            role: "user",
            content: `Analyse ce texte et extrait les informations de la boutique:\n\n${text}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
    },
    30000 // 30 seconds timeout
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const error = new Error(`Groq request failed: ${response.status}`) as Error & {
      status?: number;
      body?: string;
    };
    error.status = response.status;
    error.body = body;
    throw error;
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload?.choices?.[0]?.message?.content;

  if (!content || typeof content !== "string") {
    throw new Error("Groq response missing content");
  }

  try {
    const parsed = JSON.parse(content) as ParseSettingsResponse;

    // Validate structure
    if (!parsed.settings || typeof parsed.settings !== "object") {
      throw new Error("Invalid response structure: missing settings object");
    }

    // Ensure freeDeliveryThreshold is a number if present
    if (parsed.settings.freeDeliveryThreshold !== null && parsed.settings.freeDeliveryThreshold !== undefined) {
      parsed.settings.freeDeliveryThreshold = Math.round(Number(parsed.settings.freeDeliveryThreshold) || 0);
    }

    // Clean up customLinks
    if (parsed.settings.customLinks) {
      parsed.settings.customLinks = parsed.settings.customLinks.filter(
        link => link && link.name && link.url
      );
    }

    // Clean up sections
    if (parsed.settings.sections) {
      parsed.settings.sections = parsed.settings.sections.filter(
        section => section && section.title && section.content
      );
    }

    return parsed;
  } catch (parseError) {
    console.error("Failed to parse Groq response:", content);
    throw new Error("Failed to parse AI response as JSON");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting (10 requests per minute)
    const identifier = session.user?.id || request.ip || "anonymous";
    const rateLimitResult = await checkRateLimit(`ai:parse-settings:${identifier}`, 10, 60000);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Trop de requêtes. Réessayez dans quelques instants.",
          reset: new Date(rateLimitResult.reset).toISOString(),
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    const groqModel = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

    if (!groqApiKey) {
      return NextResponse.json(
        { error: "Missing GROQ_API_KEY" },
        { status: 500 }
      );
    }

    const { text } = parsed.data;

    // Check for empty or too short text
    if (text.trim().length < 10) {
      return NextResponse.json(
        { error: "Le texte est trop court" },
        { status: 400 }
      );
    }

    try {
      const result = await callGroq(text, groqApiKey, groqModel);

      return NextResponse.json(
        {
          settings: result.settings,
          warnings: result.warnings || [],
        },
        {
          headers: {
            ...getRateLimitHeaders(rateLimitResult),
            "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
            "CDN-Cache-Control": "max-age=3600",
            "Vary": "Accept-Encoding",
          },
        }
      );
    } catch (groqError) {
      console.error("Groq parsing error:", groqError);
      return NextResponse.json(
        { error: "Échec de l'analyse IA. Réessayez ou vérifiez le texte." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Parse settings route error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'analyse des paramètres" },
      { status: 500 }
    );
  }
}
