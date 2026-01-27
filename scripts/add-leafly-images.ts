/**
 * Add Unsplash images to Leafly products
 * Uses curated cannabis/plant images from Unsplash
 */

// Mapping of strain names to Unsplash image IDs (high-quality cannabis/plant images)
const STRAIN_IMAGES: Record<string, string> = {
  "blue-dream": "BdTtvBRhOng", // Purple/blue cannabis
  "og-kush": "qQGAQMbURhg", // Green cannabis
  "gorilla-glue-4": "8wTPqxlnKM4", // Dense buds
  "girl-scout-cookies": "jXd2FSvcRr8", // Trichome close-up
  "sour-diesel": "4_jhDO54BYg", // Sativa leaves
  "granddaddy-purple": "HS5CLnQbCOc", // Purple cannabis
  "northern-lights": "gTs2w7bu3Qo", // Indoor grow
  "jack-herer": "ZHvM3XIOHoE", // Green plant
  "wedding-cake": "0p2U3GwpJ4g", // Frosty buds
  "white-widow": "EwKXn5CapA4", // White trichomes
  "gelato": "iAftdIcgpFc", // Colorful buds
  "zkittlez": "jp4DjZ7cH1k", // Fruity colors
  "ak-47": "5jctAMjz21A", // Classic buds
  "strawberry-cough": "2bUcpxh7Muc", // Red/pink hues
  "purple-haze": "vnVsYxZZ72k", // Purple plant
  "bubba-kush": "Fpvbkqe6mE", // Dark green
  "green-crack": "I-LxG9QL_S8", // Bright green
  "pineapple-express": "zepnJQycr4U", // Tropical look
  "amnesia-haze": "gpjvRZyavXc", // Hazy look
  "sunset-sherbet": "qJ0zGkrE1Zg", // Orange tones
  "durban-poison": "m82uh_vamhg", // Pure sativa
  "cherry-pie": "TrhLCn1abMU", // Cherry tones
  "super-lemon-haze": "lUaaKCUANVI", // Lemon yellow
  "tangie": "lUaaKCUANVI", // Orange hues
  "critical-mass": "8wTPqxlnKM4", // Dense buds
};

// Fallback image if specific strain image not found
const FALLBACK_IMAGE = "BdTtvBRhOng";

function getUnsplashUrl(imageId: string, width = 800, height = 800): string {
  return `https://images.unsplash.com/photo-${imageId}?w=${width}&h=${height}&fit=crop&auto=format&q=80`;
}

function generateUpdateSQL(): string {
  const updates: string[] = [];

  Object.entries(STRAIN_IMAGES).forEach(([slug, imageId]) => {
    const imageUrl = getUnsplashUrl(imageId);
    const imagesJson = JSON.stringify([imageUrl]).replace(/'/g, "''");

    updates.push(`
UPDATE products
SET images = '${imagesJson}', updated_at = datetime('now')
WHERE slug = '${slug}';`);
  });

  return `
-- Update Leafly products with Unsplash images
-- Date: ${new Date().toISOString()}

${updates.join('\n')}

-- Verify updates
SELECT name, slug, images FROM products WHERE slug IN (${Object.keys(STRAIN_IMAGES).map(s => `'${s}'`).join(', ')});
`;
}

// Generate SQL
console.log(generateUpdateSQL());
