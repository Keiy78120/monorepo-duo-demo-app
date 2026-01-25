/**
 * Groq AI Integration for Cloudflare Workers
 */

export interface GroqOptions {
  apiKey: string;
  model?: string;
  timeoutMs?: number;
}

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqCompletionOptions extends GroqOptions {
  messages: GroqMessage[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface GroqResponse {
  id: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const DEFAULT_TIMEOUT = 30000;

/**
 * Call Groq API with timeout support
 */
export async function callGroq(options: GroqCompletionOptions): Promise<string> {
  const {
    apiKey,
    model = DEFAULT_MODEL,
    messages,
    temperature = 0.7,
    maxTokens = 1000,
    jsonMode = false,
    timeoutMs = DEFAULT_TIMEOUT,
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        ...(jsonMode && { response_format: { type: 'json_object' } }),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(`Groq API error: ${response.status} - ${errorBody}`);
    }

    const data = await response.json() as GroqResponse;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Groq response missing content');
    }

    return content.trim();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Groq API timeout');
    }
    throw error;
  }
}

// ============================================================================
// DESCRIPTION GENERATION
// ============================================================================

export interface DescriptionContext {
  tone?: string;
  targetAudience?: string;
  descriptionLength?: number;
  keywords?: string[];
  avoid?: string[];
}

export interface StrainInfo {
  name: string;
  type?: string | null;
  rating?: number | null;
  effects?: string[] | null;
  flavors?: string[] | null;
  description?: string | null;
}

function formatList(items: string[] | null | undefined): string {
  if (!items || items.length === 0) return '-';
  return items.join(', ');
}

export function buildDescriptionPrompt(
  strain: StrainInfo,
  context: DescriptionContext,
  existingDescription?: string | null
): string {
  const base = `Contexte: Variété ${strain.name}, type ${strain.type || '-'}, effets: ${formatList(strain.effects)}, saveurs: ${formatList(strain.flavors)}, rating: ${typeof strain.rating === 'number' ? `${strain.rating}/5` : '-'}.`;

  const guidance = `Génère une description produit attractive et informative pour cette variété de cannabis.
La description doit:
- Être engageante et professionnelle
- Mettre en avant les effets et saveurs
- Faire environ ${context.descriptionLength || 120} mots
- Cibler des ${context.targetAudience || 'consommateurs avertis'}
- Ton: ${context.tone || 'professionnel et premium'}
- Inclure si possible: ${(context.keywords || []).join(', ') || 'aucun'}
- Éviter: ${(context.avoid || []).join(', ') || 'aucun'}`;

  const existing = existingDescription
    ? `\n\nDescription actuelle (à améliorer, pas copier): ${existingDescription}`
    : '';

  return `${base}\n\n${guidance}${existing}`;
}

export async function generateDescription(
  strainName: string,
  apiKey: string,
  model?: string,
  existingDescription?: string | null
): Promise<{ description: string; source: 'groq' | 'template' }> {
  const strain: StrainInfo = { name: strainName };
  const context: DescriptionContext = {
    tone: 'professionnel et premium',
    targetAudience: 'consommateurs avertis',
    descriptionLength: 120,
    keywords: ['qualité', 'effets', 'terroir'],
    avoid: [],
  };

  try {
    const prompt = buildDescriptionPrompt(strain, context, existingDescription);

    const description = await callGroq({
      apiKey,
      model: model || DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: 'Tu es un rédacteur spécialisé dans les descriptions premium de variétés de cannabis.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      maxTokens: 400,
    });

    return { description, source: 'groq' };
  } catch (error) {
    console.error('Groq description generation failed:', error);
    // Fallback template
    const fallback = `Découvre ${strainName}, une variété soigneusement sélectionnée pour ses arômes distinctifs et son caractère premium. Ses notes aromatiques et ses effets équilibrés en font un choix apprécié des amateurs exigeants. À déguster avec modération pour profiter pleinement de son profil unique.`;
    return { description: fallback, source: 'template' };
  }
}

// ============================================================================
// MENU PARSING
// ============================================================================

export interface ParsedProduct {
  name: string;
  variety?: string;
  origin_flag?: string;
  category_suggestion?: string;
  pricing_tiers: { quantity_grams: number; price: number }[];
  tags?: string[];
  confidence: number;
}

export interface ParseMenuResult {
  products: ParsedProduct[];
  warnings?: string[];
}

const CATEGORY_KEYWORDS = {
  'cat-frozen': ['frozen', 'gelé', 'ice', 'glacé'],
  'cat-hash': ['hash', 'haschich', 'hasch', 'résine', 'pollen'],
  'cat-indoor': ['indoor', 'intérieur'],
  'cat-outdoor': ['outdoor', 'extérieur', 'greenhouse', 'serre'],
  'cat-edibles': ['edible', 'gummy', 'bonbon', 'comestible', 'cookie', 'brownie'],
  'cat-concentrates': ['wax', 'shatter', 'rosin', 'dab', 'concentré', 'extract'],
};

function buildMenuParsingPrompt(): string {
  const categoryInfo = Object.entries(CATEGORY_KEYWORDS)
    .map(([slug, keywords]) => `- ${slug}: ${keywords.join(', ')}`)
    .join('\n');

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

export async function parseMenu(
  menuText: string,
  apiKey: string,
  model?: string
): Promise<ParseMenuResult> {
  const content = await callGroq({
    apiKey,
    model: model || DEFAULT_MODEL,
    messages: [
      {
        role: 'system',
        content: buildMenuParsingPrompt(),
      },
      {
        role: 'user',
        content: `Analyse ce menu et extrais les produits:\n\n${menuText}`,
      },
    ],
    temperature: 0.1,
    maxTokens: 4000,
    jsonMode: true,
    timeoutMs: 60000,
  });

  try {
    const parsed = JSON.parse(content) as ParseMenuResult;

    if (!parsed.products || !Array.isArray(parsed.products)) {
      throw new Error('Invalid response structure: missing products array');
    }

    // Clean up and validate
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
    console.error('Failed to parse Groq response:', content);
    throw new Error('Failed to parse AI response as JSON');
  }
}

// ============================================================================
// SETTINGS PARSING
// ============================================================================

export interface ParsedSettings {
  storeName?: string | null;
  contact?: {
    hours?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    telegram?: string | null;
  };
  freeDeliveryThreshold?: number | null; // in centimes
  customLinks?: { name: string; url: string }[];
  sections?: { title: string; content: string }[];
  currency?: string;
}

export interface ParseSettingsResult {
  settings: ParsedSettings;
  warnings?: string[];
}

function buildSettingsParsingPrompt(): string {
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

export async function parseSettings(
  text: string,
  apiKey: string,
  model?: string
): Promise<ParseSettingsResult> {
  const content = await callGroq({
    apiKey,
    model: model || DEFAULT_MODEL,
    messages: [
      {
        role: 'system',
        content: buildSettingsParsingPrompt(),
      },
      {
        role: 'user',
        content: `Analyse ce texte et extrait les informations de la boutique:\n\n${text}`,
      },
    ],
    temperature: 0.1,
    maxTokens: 2000,
    jsonMode: true,
    timeoutMs: 30000,
  });

  try {
    const parsed = JSON.parse(content) as ParseSettingsResult;

    // Validate structure
    if (!parsed.settings || typeof parsed.settings !== 'object') {
      throw new Error('Invalid response structure: missing settings object');
    }

    // Ensure freeDeliveryThreshold is a number if present
    if (parsed.settings.freeDeliveryThreshold !== null && parsed.settings.freeDeliveryThreshold !== undefined) {
      parsed.settings.freeDeliveryThreshold = Math.round(Number(parsed.settings.freeDeliveryThreshold) || 0);
    }

    // Clean up customLinks
    if (parsed.settings.customLinks) {
      parsed.settings.customLinks = parsed.settings.customLinks.filter(
        (link) => link && link.name && link.url
      );
    }

    // Clean up sections
    if (parsed.settings.sections) {
      parsed.settings.sections = parsed.settings.sections.filter(
        (section) => section && section.title && section.content
      );
    }

    return parsed;
  } catch (parseError) {
    console.error('Failed to parse Groq response:', content);
    throw new Error('Failed to parse AI response as JSON');
  }
}
