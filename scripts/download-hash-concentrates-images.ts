/**
 * Download Hash, Rosin, and Concentrates images from Leafly and web sources
 */
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

// Product image mappings (hash, concentrates, edibles)
const PRODUCT_IMAGE_MAPPING: Record<string, string> = {
  // Hash Premium
  "moroccan-premium-hash": "https://images.leafly.com/products/hash-moroccan.jpg",
  "afghan-black-hash": "https://images.leafly.com/products/hash-afghan-black.jpg",
  "nepalese-temple-ball": "https://images.leafly.com/products/hash-temple-ball.jpg",
  "lebanese-red-hash": "https://images.leafly.com/products/hash-lebanese-red.jpg",

  // Frozen Hash
  "ice-o-lator-premium": "https://images.leafly.com/products/bubble-hash-ice-water.jpg",
  "bubble-hash-og-kush": "https://images.leafly.com/products/bubble-hash-og-kush.jpg",
  "dry-sift-wedding-cake": "https://images.leafly.com/products/dry-sift-hash.jpg",

  // Concentrates / Rosin
  "live-rosin-blue-dream": "https://images.leafly.com/products/live-rosin-badder.jpg",
  "hash-rosin-gmo-cookies": "https://images.leafly.com/products/hash-rosin-diamonds.jpg",
  "live-resin-crumble-mix": "https://leafly-public.imgix.net/products/live-resin-crumble.jpg",
  "shatter-golden-goat": "https://images.leafly.com/products/shatter-golden.jpg",

  // Edibles
  "gummies-premium-mixed-berry": "https://images.leafly.com/products/gummies-mixed-berry.jpg",
  "chocolate-bar-dark-70": "https://images.leafly.com/products/chocolate-bar-dark.jpg",
  "cookies-double-chocolate-chip": "https://images.leafly.com/products/cookies-chocolate-chip.jpg",
};

// Fallback generic images if Leafly URLs don't work
const FALLBACK_IMAGES: Record<string, string> = {
  "hash": "https://images.unsplash.com/photo-1589987607521-d06a5b5e1e39?w=800",
  "rosin": "https://images.unsplash.com/photo-1634141510639-d691d86f47be?w=800",
  "concentrates": "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=800",
  "edibles": "https://images.unsplash.com/photo-1569949381669-ecf31ae8e613?w=800",
};

async function downloadImage(url: string, slug: string, fallbackType?: string): Promise<string> {
  try {
    console.log(`⏳ Downloading ${slug} from ${url}...`);
    const response = await fetch(url);

    if (!response.ok && fallbackType && FALLBACK_IMAGES[fallbackType]) {
      console.log(`⚠️  Primary failed, trying fallback for ${slug}...`);
      const fallbackResponse = await fetch(FALLBACK_IMAGES[fallbackType]);
      if (!fallbackResponse.ok) {
        console.error(`❌ Fallback also failed for ${slug}`);
        return "";
      }
      return await saveImage(fallbackResponse, slug, "jpg");
    }

    if (!response.ok) {
      console.error(`❌ Failed to download ${slug}: ${response.status}`);
      return "";
    }

    const ext = url.endsWith(".png") ? "png" : "jpg";
    return await saveImage(response, slug, ext);
  } catch (error) {
    console.error(`❌ Error downloading ${slug}:`, error);
    return "";
  }
}

async function saveImage(response: Response, slug: string, ext: string): Promise<string> {
  const buffer = await response.arrayBuffer();
  const filename = `${slug}.${ext}`;
  const outputDir = join(process.cwd(), "temp-product-images");

  // Create directory if it doesn't exist
  try {
    mkdirSync(outputDir, { recursive: true });
  } catch (e) {
    // Directory might already exist
  }

  const filepath = join(outputDir, filename);
  writeFileSync(filepath, Buffer.from(buffer));

  console.log(`✅ Saved: ${filename}`);
  return filename;
}

async function main() {
  console.log("🚀 Starting download of hash, concentrates, and edibles images...\n");

  const results: Record<string, string> = {};
  let successCount = 0;

  for (const [slug, url] of Object.entries(PRODUCT_IMAGE_MAPPING)) {
    // Determine fallback type
    let fallbackType: string | undefined;
    if (slug.includes("hash")) fallbackType = "hash";
    else if (slug.includes("rosin") || slug.includes("resin") || slug.includes("shatter")) fallbackType = "concentrates";
    else if (slug.includes("gummies") || slug.includes("chocolate") || slug.includes("cookies")) fallbackType = "edibles";

    const filename = await downloadImage(url, slug, fallbackType);
    if (filename) {
      results[slug] = filename;
      successCount++;
    }

    // Small delay to be nice to servers
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n✅ Downloaded ${successCount}/${Object.keys(PRODUCT_IMAGE_MAPPING).length} images`);
  console.log(`\n📋 Next steps:`);
  console.log(`1. Review images in temp-product-images/`);
  console.log(`2. Upload to R2: wrangler r2 object put demo-app-media/product-media/{filename} --file=temp-product-images/{filename}`);
  console.log(`3. Run additional-products-seed.sql on your database`);
  console.log(`4. Update product images in DB with R2 URLs`);
}

main();
