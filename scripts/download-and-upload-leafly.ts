/**
 * Download Leafly images and upload to Cloudflare R2
 */
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

// Mapping of our slugs to Leafly image URLs
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

async function downloadImage(url: string, slug: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to download ${slug}: ${response.status}`);
      return "";
    }

    const buffer = await response.arrayBuffer();
    const ext = url.endsWith(".jpg") ? "jpg" : "png";
    const filename = `${slug}.${ext}`;
    const outputDir = join(process.cwd(), "temp-leafly-images");

    // Create directory if it doesn't exist
    try {
      mkdirSync(outputDir, { recursive: true });
    } catch (e) {
      // Directory might already exist
    }

    const filepath = join(outputDir, filename);
    writeFileSync(filepath, Buffer.from(buffer));

    console.log(`✅ Downloaded: ${filename}`);
    return filename;
  } catch (error) {
    console.error(`❌ Error downloading ${slug}:`, error);
    return "";
  }
}

async function main() {
  console.log("Starting download of Leafly images...\n");

  const results: Record<string, string> = {};

  for (const [slug, url] of Object.entries(STRAIN_IMAGE_MAPPING)) {
    const filename = await downloadImage(url, slug);
    if (filename) {
      results[slug] = filename;
    }
    // Small delay to be nice to Leafly's servers
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n✅ Downloaded ${Object.keys(results).length} images`);
  console.log(`\nNext steps:`);
  console.log(`1. Upload images to R2: wrangler r2 object put demo-app-media/products/{filename} --file=temp-leafly-images/{filename}`);
  console.log(`2. Update database with R2 URLs`);
}

main();
