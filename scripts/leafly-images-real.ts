/**
 * Use real Leafly strain images
 * Format: https://images.leafly.com/flower-images/{strain-name}.{ext}
 */

// Mapping of our slugs to Leafly image names (manually verified)
const STRAIN_IMAGE_MAPPING: Record<string, string> = {
  "blue-dream": "https://leafly-public.imgix.net/strains/reviews/photos/blue-dream__primary_d601.jpg",
  "og-kush": "https://images.leafly.com/flower-images/og-kush.png",
  "gorilla-glue-4": "https://images.leafly.com/flower-images/gg-4.jpg",
  "girl-scout-cookies": "https://images.leafly.com/flower-images/girl-scout-cookies.png",
  "sour-diesel": "https://images.leafly.com/flower-images/sour-diesel.png",
  "granddaddy-purple": "https://images.leafly.com/flower-images/granddaddy-purple.png",
  "northern-lights": "https://images.leafly.com/flower-images/northern-lights.png",
  "jack-herer": "https://images.leafly.com/flower-images/jack-herer.png",
  "wedding-cake": "https://images.leafly.com/flower-images/wedding-cake.png",
  "white-widow": "https://images.leafly.com/flower-images/white-widow.png",
  "gelato": "https://images.leafly.com/flower-images/gelato.png",
  "zkittlez": "https://images.leafly.com/flower-images/zkittlez.png",
  "ak-47": "https://images.leafly.com/flower-images/ak-47.png",
  "strawberry-cough": "https://images.leafly.com/flower-images/strawberry-cough.png",
  "purple-haze": "https://images.leafly.com/flower-images/purple-haze.png",
  "bubba-kush": "https://images.leafly.com/flower-images/bubba-kush.png",
  "green-crack": "https://images.leafly.com/flower-images/green-crack.png",
  "pineapple-express": "https://images.leafly.com/flower-images/pineapple-express.png",
  "amnesia-haze": "https://images.leafly.com/flower-images/amnesia-haze.png",
  "sunset-sherbet": "https://images.leafly.com/flower-images/sunset-sherbet.png",
  "durban-poison": "https://images.leafly.com/flower-images/durban-poison.png",
  "cherry-pie": "https://images.leafly.com/flower-images/cherry-pie.png",
  "super-lemon-haze": "https://images.leafly.com/flower-images/super-lemon-haze.png",
  "tangie": "https://images.leafly.com/flower-images/tangie.png",
  "critical-mass": "https://images.leafly.com/flower-images/critical-mass.png",
};

function generateUpdateSQL(): string {
  const updates: string[] = [];

  Object.entries(STRAIN_IMAGE_MAPPING).forEach(([slug, imageUrl]) => {
    const imagesJson = JSON.stringify([imageUrl]).replace(/'/g, "''");

    updates.push(`
UPDATE products
SET images = '${imagesJson}'
WHERE slug = '${slug}';`);
  });

  return `
-- Update Leafly products with real Leafly CDN images
-- Date: ${new Date().toISOString()}

${updates.join('\n')}

-- Verify updates
SELECT name, slug, images FROM products WHERE slug IN (${Object.keys(STRAIN_IMAGE_MAPPING).map(s => `'${s}'`).join(', ')}) LIMIT 10;
`;
}

// Generate SQL
console.log(generateUpdateSQL());
