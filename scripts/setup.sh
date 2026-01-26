#!/bin/bash

# VHash Cloudflare Setup Script
# Run this script to set up all Cloudflare resources

set -e

echo "╔══════════════════════════════════════════════════╗"
echo "║   VHash Cloudflare App Setup                     ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Check if logged in
echo "🔐 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "Please login to Cloudflare:"
    wrangler login
fi

echo ""
echo "📦 Creating D1 Databases..."

# Create production database
echo "  → Creating demo-app-prod database..."
PROD_DB_OUTPUT=$(wrangler d1 create demo-app-prod 2>&1 || true)
if echo "$PROD_DB_OUTPUT" | grep -q "already exists"; then
    echo "  ✓ demo-app-prod already exists"
else
    echo "  ✓ demo-app-prod created"
    echo "$PROD_DB_OUTPUT" | grep "database_id"
fi

# Create staging database
echo "  → Creating demo-app-staging database..."
STAGING_DB_OUTPUT=$(wrangler d1 create demo-app-staging 2>&1 || true)
if echo "$STAGING_DB_OUTPUT" | grep -q "already exists"; then
    echo "  ✓ demo-app-staging already exists"
else
    echo "  ✓ demo-app-staging created"
    echo "$STAGING_DB_OUTPUT" | grep "database_id"
fi

echo ""
echo "🪣 Creating R2 Buckets..."

# Create production bucket
echo "  → Creating demo-app-media bucket..."
if wrangler r2 bucket create demo-app-media 2>&1 | grep -q "already exists"; then
    echo "  ✓ demo-app-media already exists"
else
    echo "  ✓ demo-app-media created"
fi

# Create staging bucket
echo "  → Creating demo-app-media-staging bucket..."
if wrangler r2 bucket create demo-app-media-staging 2>&1 | grep -q "already exists"; then
    echo "  ✓ demo-app-media-staging already exists"
else
    echo "  ✓ demo-app-media-staging created"
fi

echo ""
echo "📄 Creating Pages Project..."
if wrangler pages project create demo-app-cloudflare-app --production-branch main 2>&1 | grep -q "already exists"; then
    echo "  ✓ demo-app-cloudflare-app already exists"
else
    echo "  ✓ demo-app-cloudflare-app created"
fi

echo ""
echo "══════════════════════════════════════════════════════"
echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Update wrangler.toml with your database IDs:"
echo "   wrangler d1 list"
echo ""
echo "2. Apply the schema:"
echo "   wrangler d1 execute demo-app-prod --file=./schema.sql"
echo ""
echo "3. Set secrets:"
echo "   wrangler secret put TELEGRAM_BOT_TOKEN"
echo "   wrangler secret put ADMIN_SESSION_SECRET"
echo "   wrangler secret put ADMIN_TELEGRAM_IDS"
echo ""
echo "4. Install dependencies:"
echo "   npm install"
echo ""
echo "5. Start local development:"
echo "   npm run dev"
echo ""
