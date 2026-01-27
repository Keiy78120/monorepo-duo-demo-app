/**
 * Leafly Mock Data Generator
 * Generates realistic product data based on popular cannabis strains from Leafly
 *
 * Usage: npx tsx scripts/generate-leafly-data.ts > data/leafly-seed.sql
 */

type LeaflyStrain = {
  name: string;
  type: "Indica" | "Sativa" | "Hybrid";
  description: string;
  effects: string[];
  flavors: string[];
  thc: string;
  cbd: string;
  image?: string;
};

const LEAFLY_STRAINS: LeaflyStrain[] = [
  {
    name: "Blue Dream",
    type: "Hybrid",
    description: "Blue Dream est une variété hybride à dominance sativa avec un arôme doux de baies. Originaire de Californie, elle offre un équilibre parfait entre relaxation corporelle et euphorie cérébrale. Idéale pour soulager la douleur, le stress et la dépression.",
    effects: ["Happy", "Relaxed", "Euphoric", "Uplifted", "Creative"],
    flavors: ["Berry", "Sweet", "Blueberry", "Herbal"],
    thc: "17-24%",
    cbd: "<1%",
  },
  {
    name: "OG Kush",
    type: "Hybrid",
    description: "OG Kush est une variété légendaire avec des arômes terreux de pin et de citron. Cette puissante souche hybride offre une relaxation profonde tout en stimulant l'appétit. Parfaite pour la fin de journée.",
    effects: ["Relaxed", "Happy", "Euphoric", "Sleepy", "Hungry"],
    flavors: ["Earthy", "Pine", "Woody", "Citrus"],
    thc: "20-25%",
    cbd: "<1%",
  },
  {
    name: "Gorilla Glue #4",
    type: "Hybrid",
    description: "Gorilla Glue #4 est connue pour sa puissance exceptionnelle et ses effets relaxants intenses. Avec des arômes de diesel et de terre, cette variété colle au canapé. Gagnante de multiples Cannabis Cup.",
    effects: ["Relaxed", "Sleepy", "Happy", "Euphoric", "Uplifted"],
    flavors: ["Diesel", "Earthy", "Pungent", "Pine"],
    thc: "25-30%",
    cbd: "<1%",
  },
  {
    name: "Girl Scout Cookies",
    type: "Hybrid",
    description: "Girl Scout Cookies (GSC) combine les meilleures qualités de OG Kush et Durban Poison. Saveurs sucrées et terreuses avec des effets puissants et relaxants. Parfaite pour le soulagement de la douleur.",
    effects: ["Happy", "Relaxed", "Euphoric", "Uplifted", "Creative"],
    flavors: ["Sweet", "Earthy", "Pungent", "Mint"],
    thc: "18-28%",
    cbd: "<1%",
  },
  {
    name: "Sour Diesel",
    type: "Sativa",
    description: "Sour Diesel offre une énergie cérébrale puissante avec des arômes piquants de diesel. Cette sativa classique est idéale pour stimuler la créativité et combattre la fatigue. Parfaite pour la journée.",
    effects: ["Energetic", "Uplifted", "Creative", "Euphoric", "Focused"],
    flavors: ["Diesel", "Pungent", "Citrus", "Earthy"],
    thc: "19-25%",
    cbd: "<1%",
  },
  {
    name: "Granddaddy Purple",
    type: "Indica",
    description: "Granddaddy Purple est une indica classique californienne aux magnifiques teintes violettes. Saveurs de raisin et de baies avec des effets profondément relaxants. Excellente pour l'insomnie et le stress.",
    effects: ["Relaxed", "Sleepy", "Happy", "Euphoric", "Hungry"],
    flavors: ["Grape", "Berry", "Sweet", "Earthy"],
    thc: "17-23%",
    cbd: "<1%",
  },
  {
    name: "Northern Lights",
    type: "Indica",
    description: "Northern Lights est une des variétés indica les plus célèbres. Effets relaxants puissants et saveurs douces de pin et de terre. Parfaite pour le sommeil et la relaxation profonde.",
    effects: ["Relaxed", "Sleepy", "Happy", "Euphoric", "Hungry"],
    flavors: ["Sweet", "Earthy", "Pungent", "Pine"],
    thc: "16-21%",
    cbd: "<1%",
  },
  {
    name: "Jack Herer",
    type: "Sativa",
    description: "Jack Herer est une sativa primée portant le nom du célèbre activiste. Arômes de pin et d'épices avec des effets stimulants et créatifs. Excellente pour la concentration et l'énergie.",
    effects: ["Energetic", "Creative", "Uplifted", "Happy", "Focused"],
    flavors: ["Pine", "Spicy", "Woody", "Earthy"],
    thc: "18-24%",
    cbd: "<1%",
  },
  {
    name: "Wedding Cake",
    type: "Hybrid",
    description: "Wedding Cake offre des saveurs sucrées de vanille et de gâteau. Cette hybride puissante procure relaxation et euphorie. Idéale pour le soulagement de la douleur et l'anxiété.",
    effects: ["Relaxed", "Happy", "Euphoric", "Sleepy", "Uplifted"],
    flavors: ["Sweet", "Vanilla", "Earthy", "Peppery"],
    thc: "21-27%",
    cbd: "<1%",
  },
  {
    name: "White Widow",
    type: "Hybrid",
    description: "White Widow est une légende néerlandaise couverte de cristaux blancs. Équilibre parfait entre effets mentaux stimulants et relaxation corporelle. Saveurs terreuses et boisées.",
    effects: ["Energetic", "Euphoric", "Happy", "Creative", "Uplifted"],
    flavors: ["Earthy", "Woody", "Pungent", "Spicy"],
    thc: "18-25%",
    cbd: "<1%",
  },
  {
    name: "Gelato",
    type: "Hybrid",
    description: "Gelato combine Sunset Sherbet et Thin Mint GSC pour créer des saveurs sucrées de dessert. Effets puissants et équilibrés. Parfaite pour la relaxation créative.",
    effects: ["Happy", "Relaxed", "Euphoric", "Uplifted", "Creative"],
    flavors: ["Sweet", "Berry", "Citrus", "Lavender"],
    thc: "20-26%",
    cbd: "<1%",
  },
  {
    name: "Zkittlez",
    type: "Indica",
    description: "Zkittlez offre un festival de saveurs fruitées rappelant les bonbons. Cette indica relaxante procure des effets calmants et heureux. Gagnante de multiples prix.",
    effects: ["Relaxed", "Happy", "Euphoric", "Sleepy", "Focused"],
    flavors: ["Fruity", "Sweet", "Grape", "Berry"],
    thc: "15-23%",
    cbd: "<1%",
  },
  {
    name: "AK-47",
    type: "Hybrid",
    description: "AK-47 est une hybride primée aux effets doux et durables. Saveurs florales et terreuses avec une relaxation mentale claire. Excellente pour la socialisation.",
    effects: ["Relaxed", "Happy", "Uplifted", "Creative", "Euphoric"],
    flavors: ["Earthy", "Sweet", "Pungent", "Floral"],
    thc: "13-20%",
    cbd: "<1%",
  },
  {
    name: "Strawberry Cough",
    type: "Sativa",
    description: "Strawberry Cough offre des arômes de fraise sucrée et des effets énergisants. Cette sativa est parfaite pour la journée, stimulant la créativité et la bonne humeur.",
    effects: ["Energetic", "Happy", "Uplifted", "Euphoric", "Creative"],
    flavors: ["Strawberry", "Sweet", "Berry", "Earthy"],
    thc: "15-20%",
    cbd: "<1%",
  },
  {
    name: "Purple Haze",
    type: "Sativa",
    description: "Purple Haze est une sativa légendaire rendue célèbre par Jimi Hendrix. Effets psychédéliques et créatifs avec des arômes de baies et d'épices. Parfaite pour l'inspiration artistique.",
    effects: ["Energetic", "Creative", "Euphoric", "Happy", "Uplifted"],
    flavors: ["Berry", "Sweet", "Earthy", "Spicy"],
    thc: "17-22%",
    cbd: "<1%",
  },
  {
    name: "Bubba Kush",
    type: "Indica",
    description: "Bubba Kush est une indica puissante aux saveurs de café et de chocolat. Relaxation profonde et sédation. Excellente pour l'insomnie et le stress chronique.",
    effects: ["Relaxed", "Sleepy", "Happy", "Euphoric", "Hungry"],
    flavors: ["Earthy", "Sweet", "Pungent", "Coffee"],
    thc: "14-22%",
    cbd: "<1%",
  },
  {
    name: "Green Crack",
    type: "Sativa",
    description: "Green Crack offre une énergie explosive et une concentration aiguë. Saveurs fruitées de mangue avec des effets stimulants durables. Parfaite pour la productivité.",
    effects: ["Energetic", "Focused", "Happy", "Uplifted", "Creative"],
    flavors: ["Citrus", "Sweet", "Earthy", "Mango"],
    thc: "15-25%",
    cbd: "<1%",
  },
  {
    name: "Pineapple Express",
    type: "Hybrid",
    description: "Pineapple Express combine des saveurs tropicales d'ananas avec des effets énergisants. Cette hybride à dominance sativa est parfaite pour rester actif et créatif.",
    effects: ["Energetic", "Happy", "Uplifted", "Creative", "Euphoric"],
    flavors: ["Pineapple", "Tropical", "Citrus", "Sweet"],
    thc: "16-26%",
    cbd: "<1%",
  },
  {
    name: "Amnesia Haze",
    type: "Sativa",
    description: "Amnesia Haze est une sativa néerlandaise primée aux effets cérébraux puissants. Arômes citronnés et terreux avec une euphorie créative. Gagnante de multiples Cannabis Cup.",
    effects: ["Energetic", "Creative", "Euphoric", "Happy", "Uplifted"],
    flavors: ["Citrus", "Earthy", "Lemon", "Sweet"],
    thc: "20-25%",
    cbd: "<1%",
  },
  {
    name: "Sunset Sherbet",
    type: "Indica",
    description: "Sunset Sherbet offre des saveurs sucrées de dessert avec des notes fruitées. Relaxation corporelle profonde avec une clarté mentale. Parfaite pour la fin de journée.",
    effects: ["Relaxed", "Happy", "Euphoric", "Creative", "Uplifted"],
    flavors: ["Sweet", "Fruity", "Citrus", "Berry"],
    thc: "15-19%",
    cbd: "<1%",
  },
  {
    name: "Durban Poison",
    type: "Sativa",
    description: "Durban Poison est une pure sativa sud-africaine aux effets énergisants clairs. Arômes d'anis et d'épices avec une concentration accrue. Excellente pour la journée.",
    effects: ["Energetic", "Uplifted", "Creative", "Happy", "Focused"],
    flavors: ["Earthy", "Sweet", "Pungent", "Anise"],
    thc: "15-25%",
    cbd: "<1%",
  },
  {
    name: "Cherry Pie",
    type: "Hybrid",
    description: "Cherry Pie combine Granddaddy Purple et Durban Poison. Saveurs sucrées de cerise avec des effets relaxants et heureux. Parfaite pour soulager le stress.",
    effects: ["Relaxed", "Happy", "Euphoric", "Uplifted", "Creative"],
    flavors: ["Cherry", "Sweet", "Earthy", "Berry"],
    thc: "16-24%",
    cbd: "<1%",
  },
  {
    name: "Super Lemon Haze",
    type: "Sativa",
    description: "Super Lemon Haze est une sativa énergisante aux saveurs explosives de citron. Double gagnante de la Cannabis Cup avec des effets stimulants et joyeux.",
    effects: ["Energetic", "Happy", "Uplifted", "Euphoric", "Creative"],
    flavors: ["Lemon", "Citrus", "Sweet", "Earthy"],
    thc: "17-25%",
    cbd: "<1%",
  },
  {
    name: "Tangie",
    type: "Sativa",
    description: "Tangie offre des arômes puissants de mandarine et d'agrumes. Cette sativa énergisante est parfaite pour stimuler la créativité et l'humeur. Gagnante de multiples prix.",
    effects: ["Energetic", "Happy", "Uplifted", "Euphoric", "Creative"],
    flavors: ["Citrus", "Orange", "Sweet", "Tropical"],
    thc: "19-22%",
    cbd: "<1%",
  },
  {
    name: "Critical Mass",
    type: "Indica",
    description: "Critical Mass est une indica puissante connue pour ses rendements massifs. Effets relaxants profonds avec des saveurs terreuses et sucrées. Excellente pour le sommeil.",
    effects: ["Relaxed", "Sleepy", "Happy", "Euphoric", "Hungry"],
    flavors: ["Earthy", "Sweet", "Pungent", "Citrus"],
    thc: "19-22%",
    cbd: "<1%",
  },
];

// Helper functions
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomCountry(): string {
  const countries = ["US", "CA", "ES", "NL", "MA"];
  return countries[Math.floor(Math.random() * countries.length)];
}

function generateFarmName(): string {
  const farms = [
    "Green Valley Farm",
    "Sunset Gardens",
    "Mountain View Cultivation",
    "Pacific Coast Farms",
    "Amsterdam Genetics",
    "Barcelona Select",
    "Emerald Triangle",
    "Rocky Mountain High",
    "California Gardens",
    "Oregon Organic",
  ];
  return farms[Math.floor(Math.random() * farms.length)];
}

function mapTypeToCategory(type: string): string {
  // Using real UUIDs from remote database
  switch (type) {
    case "Indica":
      return "46fb8109-2312-4c40-a652-517e5857f720"; // Flower Indoor
    case "Sativa":
      return "9f402dd1-0e25-41df-97e5-25e97dd3f226"; // Flower Outdoor
    case "Hybrid":
      return "de5b1c2d-22f5-41a8-9d23-677b4ca50225"; // Hash Premium
    default:
      return "46fb8109-2312-4c40-a652-517e5857f720"; // Flower Indoor
  }
}

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function escapeSQL(str: string): string {
  return str.replace(/'/g, "''");
}

function generateProductSQL(strain: LeaflyStrain): { productSQL: string; tiersSQL: string; productId: string } {
  const productId = generateUUID();
  const slug = slugify(strain.name);
  const categoryId = mapTypeToCategory(strain.type);
  const costPerGram = randomInt(400, 800); // 4-8€ cost
  const margin = randomInt(50, 65); // 50-65% margin

  const tags = [...strain.effects, ...strain.flavors, strain.type, strain.thc];
  const description = escapeSQL(strain.description);

  const productSQL = `
INSERT INTO products (
  id, name, slug, variety, description,
  tags, images, category_id,
  farm_label, origin_flag,
  cost_price_per_gram, margin_percentage,
  stock_quantity, is_active
) VALUES (
  '${productId}',
  '${escapeSQL(strain.name)}',
  '${slug}',
  '${escapeSQL(strain.name)}',
  '${description}',
  '${JSON.stringify(tags)}',
  '[]',
  '${categoryId}',
  '${escapeSQL(generateFarmName())}',
  '${randomCountry()}',
  ${costPerGram},
  ${margin},
  ${randomInt(100, 500)},
  1
);`;

  // Generate pricing tiers (10g, 25g, 50g, 100g)
  const tiers = [10, 25, 50, 100];
  const sellingPricePerGram = Math.round(costPerGram * (1 + margin / 100));

  const tiersSQL = tiers
    .map((qty, index) => {
      const tierId = generateUUID();
      const price = sellingPricePerGram * qty;

      return `
INSERT INTO pricing_tiers (
  id, product_id, quantity_grams, price, is_custom_price, sort_order
) VALUES (
  '${tierId}', '${productId}', ${qty}, ${price}, 0, ${index}
);`;
    })
    .join("");

  return { productSQL, tiersSQL, productId };
}

// Main generation
function main() {
  console.log("-- Generated Leafly Mock Data");
  console.log(`-- Date: ${new Date().toISOString()}`);
  console.log(`-- Total strains: ${LEAFLY_STRAINS.length}`);
  console.log("");

  console.log("-- ============================================================================");
  console.log("-- PRODUCTS");
  console.log("-- ============================================================================");

  let allTiersSQL = "";

  LEAFLY_STRAINS.forEach((strain) => {
    const { productSQL, tiersSQL } = generateProductSQL(strain);
    console.log(productSQL);
    allTiersSQL += tiersSQL;
  });

  console.log("");
  console.log("-- ============================================================================");
  console.log("-- PRICING TIERS");
  console.log("-- ============================================================================");
  console.log(allTiersSQL);

  console.log("");
  console.log(`-- Migration complete: ${LEAFLY_STRAINS.length} products and ${LEAFLY_STRAINS.length * 4} pricing tiers inserted.`);
}

main();
