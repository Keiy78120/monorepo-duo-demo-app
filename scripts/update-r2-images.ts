/**
 * Update products with R2 image URLs
 */

// Successfully uploaded images (using Cloudflare Pages domain)
const CLOUDFLARE_DOMAIN = "https://monorepo-duo-demo.pages.dev";

const R2_IMAGES: Record<string, string> = {
  "blue-dream": `${CLOUDFLARE_DOMAIN}/product-media/products/leafly/blue-dream.jpg`,
  "og-kush": `${CLOUDFLARE_DOMAIN}/product-media/products/leafly/og-kush.png`,
  "gorilla-glue-4": `${CLOUDFLARE_DOMAIN}/product-media/products/leafly/gorilla-glue-4.jpg`,
  "granddaddy-purple": `${CLOUDFLARE_DOMAIN}/product-media/products/leafly/granddaddy-purple.png`,
  "northern-lights": `${CLOUDFLARE_DOMAIN}/product-media/products/leafly/northern-lights.png`,
  "white-widow": `${CLOUDFLARE_DOMAIN}/product-media/products/leafly/white-widow.png`,
  "strawberry-cough": `${CLOUDFLARE_DOMAIN}/product-media/products/leafly/strawberry-cough.png`,
  "bubba-kush": `${CLOUDFLARE_DOMAIN}/product-media/products/leafly/bubba-kush.png`,
  "green-crack": `${CLOUDFLARE_DOMAIN}/product-media/products/leafly/green-crack.png`,
  "pineapple-express": `${CLOUDFLARE_DOMAIN}/product-media/products/leafly/pineapple-express.png`,
};

// Strains without images - rotate through available ones
const MISSING_STRAINS = [
  "girl-scout-cookies",
  "sour-diesel",
  "jack-herer",
  "wedding-cake",
  "gelato",
  "zkittlez",
  "ak-47",
  "purple-haze",
  "amnesia-haze",
  "sunset-sherbet",
  "durban-poison",
  "cherry-pie",
  "super-lemon-haze",
  "tangie",
  "critical-mass",
];

function generateUpdateSQL(): string {
  const updates: string[] = [];
  const availableImages = Object.values(R2_IMAGES);

  // Update strains with real images
  for (const [slug, imagePath] of Object.entries(R2_IMAGES)) {
    const imagesJson = JSON.stringify([imagePath]).replace(/'/g, "''");
    updates.push(`
UPDATE products
SET images = '${imagesJson}'
WHERE slug = '${slug}';`);
  }

  // Update missing strains with rotating images
  MISSING_STRAINS.forEach((slug, index) => {
    const imageIndex = index % availableImages.length;
    const imagePath = availableImages[imageIndex];
    const imagesJson = JSON.stringify([imagePath]).replace(/'/g, "''");

    updates.push(`
UPDATE products
SET images = '${imagesJson}'
WHERE slug = '${slug}';`);
  });

  return `
-- Update Leafly products with R2 CDN images
-- Date: ${new Date().toISOString()}

${updates.join('\n')}

-- Verify updates
SELECT name, slug, images FROM products WHERE slug IN (${[...Object.keys(R2_IMAGES), ...MISSING_STRAINS].map(s => `'${s}'`).join(', ')}) ORDER BY name LIMIT 15;
`;
}

// Generate SQL
console.log(generateUpdateSQL());
