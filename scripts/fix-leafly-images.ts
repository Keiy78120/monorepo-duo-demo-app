/**
 * Fix Leafly images with valid placeholder or real cannabis images
 * Using a single high-quality cannabis image for all strains initially
 */

// Valid Unsplash cannabis/plant images (tested and working)
const VALID_CANNABIS_IMAGES = [
  "https://images.unsplash.com/photo-1603909444785-76cc99a3bdf3", // Cannabis plant close-up
  "https://images.unsplash.com/photo-1605606420457-c9e4b1d65848", // Cannabis buds
  "https://images.unsplash.com/photo-1589654312430-1cb9dc09c9a5", // Green cannabis
  "https://images.unsplash.com/photo-1598270419540-e1dc43c8c4c6", // Cannabis leaves
  "https://images.unsplash.com/photo-1608475860878-538e951f7444", // Purple cannabis
  "https://images.unsplash.com/photo-1606923829579-0cb981a83e2e", // Dense buds
  "https://images.unsplash.com/photo-1612011329832-c19a5f98fa19", // Trichomes
  "https://images.unsplash.com/photo-1591088398332-8a7791972843", // Indoor grow
];

// Leafly strain slugs
const LEAFLY_SLUGS = [
  "blue-dream",
  "og-kush",
  "gorilla-glue-4",
  "girl-scout-cookies",
  "sour-diesel",
  "granddaddy-purple",
  "northern-lights",
  "jack-herer",
  "wedding-cake",
  "white-widow",
  "gelato",
  "zkittlez",
  "ak-47",
  "strawberry-cough",
  "purple-haze",
  "bubba-kush",
  "green-crack",
  "pineapple-express",
  "amnesia-haze",
  "sunset-sherbet",
  "durban-poison",
  "cherry-pie",
  "super-lemon-haze",
  "tangie",
  "critical-mass",
];

function getImageForStrain(slug: string, index: number): string {
  // Rotate through valid images
  const imageIndex = index % VALID_CANNABIS_IMAGES.length;
  return VALID_CANNABIS_IMAGES[imageIndex];
}

function generateUpdateSQL(): string {
  const updates: string[] = [];

  LEAFLY_SLUGS.forEach((slug, index) => {
    const imageUrl = getImageForStrain(slug, index);
    const imagesJson = JSON.stringify([imageUrl]).replace(/'/g, "''");

    updates.push(`
UPDATE products
SET images = '${imagesJson}'
WHERE slug = '${slug}';`);
  });

  return `
-- Fix Leafly products with valid cannabis images
-- Date: ${new Date().toISOString()}

${updates.join('\n')}

-- Verify updates
SELECT name, slug, images FROM products WHERE slug IN (${LEAFLY_SLUGS.map(s => `'${s}'`).join(', ')}) LIMIT 10;
`;
}

// Generate SQL
console.log(generateUpdateSQL());
