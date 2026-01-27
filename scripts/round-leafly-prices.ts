/**
 * Round Leafly product prices to nice round numbers
 * Instead of 106.80€, make it 100€ or 110€
 */

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

// Target round prices (in cents) for each quantity tier
const ROUND_PRICES: Record<number, number> = {
  10: 10000,   // 100.00€
  25: 25000,   // 250.00€
  50: 50000,   // 500.00€
  100: 100000, // 1000.00€
};

function generateUpdateSQL(): string {
  const updates: string[] = [];

  // For each quantity tier, update all Leafly products to round price
  for (const [quantity, price] of Object.entries(ROUND_PRICES)) {
    updates.push(`
-- Update ${quantity}g tier to ${price / 100}€
UPDATE pricing_tiers
SET price = ${price}
WHERE quantity_grams = ${quantity}
  AND product_id IN (
    SELECT id FROM products WHERE slug IN (${LEAFLY_SLUGS.map(s => `'${s}'`).join(', ')})
  );`);
  }

  return `
-- Round Leafly product prices
-- Date: ${new Date().toISOString()}

${updates.join('\n')}

-- Verify updates
SELECT p.name, p.slug, pt.quantity_grams, pt.price
FROM products p
JOIN pricing_tiers pt ON p.id = pt.product_id
WHERE p.slug IN (${LEAFLY_SLUGS.map(s => `'${s}'`).join(', ')})
ORDER BY p.name, pt.quantity_grams
LIMIT 20;
`;
}

// Generate SQL
console.log(generateUpdateSQL());
