import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/guard";
import { fetchWithTimeout } from "@/lib/integrations/http";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/integrations/rate-limiter";

const bodySchema = z.object({
  menu_text: z.string().min(1).max(50000),
});

export interface ParsedProduct {
  name: string;
  variety?: string;
  origin_flag?: string;
  category_suggestion?: string;
  pricing_tiers: { quantity_grams: number; price: number }[];
  tags?: string[];
  confidence: number;
}

interface ParseMenuResponse {
  products: ParsedProduct[];
  warnings?: string[];
}

// Category keywords for AI matching
const CATEGORY_KEYWORDS = {
  "cat-frozen": ["frozen", "gelé", "ice", "glacé"],
  "cat-hash": ["hash", "haschich", "hasch", "résine", "pollen"],
  "cat-indoor": ["indoor", "intérieur"],
  "cat-outdoor": ["outdoor", "extérieur", "greenhouse", "serre"],
  "cat-edibles": ["edible", "gummy", "bonbon", "comestible", "cookie", "brownie"],
  "cat-concentrates": ["wax", "shatter", "rosin", "dab", "concentré", "extract"],
};

function buildSystemPrompt(): string {
  const categoryInfo = Object.entries(CATEGORY_KEYWORDS)
    .map(([slug, keywords]) => `- ${slug}: ${keywords.join(", ")}`)
    .join("\n");

  return `Tu es un expert en parsing de menus de produits cannabis. Tu dois analyser le texte du menu fourni et extraire les produits avec leurs informations structurées.

RÈGLES IMPORTANTES:
1. Extrais chaque produit avec son nom, variété (si différente du nom), drapeau d'origine (emoji), prix par palier
2. Convertis TOUS les prix en centimes (65€ = 6500, 65,50€ = 6550)
3. Détecte les emojis de drapeaux (🇲🇦, 🇫🇷, 🇪🇸, 🇳🇱, etc.) comme origin_flag
4. Déduis la catégorie à partir des mots-clés:
${categoryInfo}
5. Identifie les paliers de quantité (ex: "10g: 65€ / 25g: 150€" → deux paliers)
6. Ajoute des tags pertinents basés sur les caractéristiques mentionnées
7. Attribue un score de confiance (0-1) basé sur la clarté des informations

FORMATS DE PRIX À RECONNAÎTRE:
- "65€" ou "65 €" → 6500
- "65,50€" ou "65.50€" → 6550
- "65" (implicitement euros) → 6500

FORMATS DE QUANTITÉS À RECONNAÎTRE:
- "10g" ou "10 g" ou "10G"
- "25g" ou "25 g"

RÉPONSE: Tu dois UNIQUEMENT retourner un JSON valide avec cette structure exacte:
{
  "products": [
    {
      "name": "Nom du produit",
      "variety": "Variété si différente du nom",
      "origin_flag": "🇲🇦",
      "category_suggestion": "cat-indoor",
      "pricing_tiers": [
        { "quantity_grams": 10, "price": 6500 },
        { "quantity_grams": 25, "price": 15000 }
      ],
      "tags": ["indoor", "premium"],
      "confidence": 0.95
    }
  ],
  "warnings": ["Avertissements optionnels"]
}

Ne retourne AUCUN autre texte, commentaire ou explication. UNIQUEMENT le JSON.`;
}

async function callGroq(
  menuText: string,
  apiKey: string,
  model: string
): Promise<ParseMenuResponse> {
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
            content: `Analyse ce menu et extrais les produits:\n\n${menuText}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 4000,
        response_format: { type: "json_object" },
      }),
    },
    60000 // 60 seconds timeout for larger menus
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
    const parsed = JSON.parse(content) as ParseMenuResponse;

    // Validate and clean up the response
    if (!parsed.products || !Array.isArray(parsed.products)) {
      throw new Error("Invalid response structure: missing products array");
    }

    // Ensure all prices are integers (centimes)
    parsed.products = parsed.products.map((product) => ({
      ...product,
      pricing_tiers: (product.pricing_tiers || []).map((tier) => ({
        quantity_grams: Math.round(tier.quantity_grams),
        price: Math.round(tier.price),
      })),
      confidence: Math.min(1, Math.max(0, product.confidence || 0.5)),
    }));

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
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0] ||
                     request.headers.get("x-real-ip") ||
                     "anonymous";
    const identifier = session.user?.id || clientIp;
    const rateLimitResult = await checkRateLimit(`ai:parse-menu:${identifier}`, 10, 60000);

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

    const { menu_text } = parsed.data;
    const warnings: string[] = [];

    // Check for empty or too short text
    if (menu_text.trim().length < 10) {
      return NextResponse.json(
        { error: "Le texte du menu est trop court" },
        { status: 400 }
      );
    }

    try {
      const result = await callGroq(menu_text, groqApiKey, groqModel);

      if (result.products.length === 0) {
        warnings.push("Aucun produit détecté dans le texte fourni");
      }

      return NextResponse.json(
        {
          products: result.products,
          warnings: [...warnings, ...(result.warnings || [])],
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
        { error: "Échec de l'analyse IA. Réessayez ou vérifiez le format du menu." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Parse menu route error:", error);
    return NextResponse.json(
      { error: "Erreur lors du parsing du menu" },
      { status: 500 }
    );
  }
}
