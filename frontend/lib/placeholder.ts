/**
 * Placeholder image as a data URL (SVG)
 * Clean, minimalist SVG placeholder for products without images
 */
export const PLACEHOLDER_IMAGE = `data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3Cg opacity='0.3'%3E%3Ccircle cx='200' cy='180' r='30' fill='%239ca3af'/%3E%3Crect x='160' y='220' width='80' height='8' rx='4' fill='%239ca3af'/%3E%3Crect x='170' y='235' width='60' height='6' rx='3' fill='%239ca3af'/%3E%3C/g%3E%3C/svg%3E`;

/**
 * Check if an image URL is valid and not empty
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url || url.trim() === '') return false;
  if (url === '/placeholder.png') return false;
  if (url === 'placeholder.png') return false;
  return true;
}

/**
 * Get image source with fallback to placeholder
 */
export function getImageSrc(images: string[] | string | null | undefined): string {
  if (!images) return PLACEHOLDER_IMAGE;

  const imageArray = Array.isArray(images) ? images : [images];
  const firstImage = imageArray[0];

  return isValidImageUrl(firstImage) ? firstImage : PLACEHOLDER_IMAGE;
}
