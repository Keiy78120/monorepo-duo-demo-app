import { fetchWithTimeout } from "./http";
import type { CannabisStrain } from "./cannabis";

export interface GroqOptions {
  apiKey: string;
  model: string;
  timeoutMs?: number;
}

export interface DescriptionContext {
  tone: string;
  targetAudience: string;
  descriptionLength: number;
  keywords: string[];
  avoid: string[];
}

function formatList(items: string[] | null | undefined) {
  if (!items || items.length === 0) return "-";
  return items.join(", ");
}

export function buildDescriptionPrompt(
  strain: CannabisStrain,
  context: DescriptionContext,
  existingDescription?: string | null
) {
  const base = `Contexte: Variété ${strain.name}, type ${strain.type || "-"}, effets: ${formatList(
    strain.effects || []
  )}, saveurs: ${formatList(strain.flavors || [])}, rating: ${
    typeof strain.rating === "number" ? `${strain.rating}/5` : "-"
  }.`;

  const guidance = `Génère une description produit attractive et informative pour cette variété de cannabis.
La description doit:
- Être engageante et professionnelle
- Mettre en avant les effets et saveurs
- Faire environ ${context.descriptionLength} mots
- Cibler des ${context.targetAudience}
- Ton: ${context.tone}
- Inclure si possible: ${context.keywords.join(", ") || "aucun"}
- Éviter: ${context.avoid.join(", ") || "aucun"}`;

  const existing = existingDescription
    ? `\n\nDescription actuelle (à améliorer, pas copier): ${existingDescription}`
    : "";

  return `${base}\n\n${guidance}${existing}`;
}

export async function generateGroqDescription(
  prompt: string,
  { apiKey, model, timeoutMs = 30000 }: GroqOptions
): Promise<string> {
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
            content:
              "Tu es un rédacteur spécialisé dans les descriptions premium de variétés de cannabis.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 400,
      }),
    },
    timeoutMs
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

  const payload = (await response.json()) as any;
  const content = payload?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Groq response missing content");
  }

  return content.trim();
}
