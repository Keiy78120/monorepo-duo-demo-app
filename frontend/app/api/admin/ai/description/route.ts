import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/guard";
import { getStrainsByName, type CannabisStrain } from "@/lib/integrations/cannabis";
import {
  buildDescriptionPrompt,
  generateGroqDescription,
} from "@/lib/integrations/groq";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/integrations/rate-limiter";

const bodySchema = z.object({
  strain_name: z.string().min(1).max(120),
  existing_description: z.string().max(5000).optional().nullable(),
});

function buildFallback(strainName: string) {
  return `Découvre ${strainName}, une variété soigneusement sélectionnée pour ses arômes distinctifs et son caractère premium. Ses notes aromatiques et ses effets équilibrés en font un choix apprécié des amateurs exigeants. À déguster avec modération pour profiter pleinement de son profil unique.`;
}

function getContext() {
  const lengthValue = Number.parseInt(
    process.env.APP_DESCRIPTION_LENGTH || "120",
    10
  );
  return {
    tone: process.env.APP_TONE || "professionnel et premium",
    targetAudience: process.env.APP_TARGET_AUDIENCE || "consommateurs avertis",
    descriptionLength: Number.isFinite(lengthValue) ? lengthValue : 120,
    keywords: (process.env.APP_KEYWORDS || "qualité, effets, terroir")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
    avoid: (process.env.APP_AVOID || "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
  };
}

function pickBestStrain(strains: CannabisStrain[], name: string) {
  if (strains.length === 0) return null;
  const exact = strains.find(
    (strain) => strain.name.toLowerCase() === name.toLowerCase()
  );
  return exact || strains[0];
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
    const rateLimitResult = await checkRateLimit(`ai:${identifier}`, 10, 60000);

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

    const cannabisBaseUrl = process.env.CANNABIS_API_URL;
    const groqApiKey = process.env.GROQ_API_KEY;
    const groqModel = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

    if (!cannabisBaseUrl) {
      return NextResponse.json(
        { error: "Missing CANNABIS_API_URL" },
        { status: 500 }
      );
    }

    if (!groqApiKey) {
      return NextResponse.json(
        { error: "Missing GROQ_API_KEY" },
        { status: 500 }
      );
    }

    const { strain_name, existing_description } = parsed.data;
    const warnings: string[] = [];

    let strain: CannabisStrain | null = null;
    try {
      const strains = await getStrainsByName(cannabisBaseUrl, strain_name);
      strain = pickBestStrain(strains, strain_name);
    } catch (error) {
      console.error("Cannabis API error:", error);
      warnings.push("Cannabis API indisponible ou variété introuvable.");
    }

    const fallbackStrain: CannabisStrain = strain || {
      name: strain_name,
      type: null,
      rating: null,
      effects: null,
      flavors: null,
      description: null,
    };

    let description = "";
    let source: "groq" | "cannabis" | "template" = "groq";

    try {
      const prompt = buildDescriptionPrompt(
        fallbackStrain,
        getContext(),
        existing_description
      );

      description = await generateGroqDescription(prompt, {
        apiKey: groqApiKey,
        model: groqModel,
      });
    } catch (error) {
      console.error("Groq generation error:", error);
      if (fallbackStrain.description) {
        description = fallbackStrain.description;
        source = "cannabis";
      } else {
        description = buildFallback(strain_name);
        source = "template";
      }
    }

    return NextResponse.json(
      {
        description,
        source,
        strain: strain || null,
        warnings: warnings.length > 0 ? warnings : undefined,
      },
      {
        headers: {
          ...getRateLimitHeaders(rateLimitResult),
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
          "CDN-Cache-Control": "max-age=86400",
          "Vary": "Accept-Encoding",
        },
      }
    );
  } catch (error) {
    console.error("AI description route error:", error);
    return NextResponse.json(
      { error: "Failed to generate description" },
      { status: 500 }
    );
  }
}
