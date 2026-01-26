#!/bin/bash

# =============================================================================
# CLIENT SETUP SCRIPT
# Interactive script to configure a new client instance
# =============================================================================

set -e

echo "======================================"
echo "  📦 Client Setup - Monorepo Duo Demo"
echo "======================================"
echo ""

# Check if .env.local already exists
if [ -f ".env.local" ]; then
  echo "⚠️  .env.local already exists!"
  read -p "Do you want to overwrite it? (y/N): " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Setup cancelled."
    exit 0
  fi
fi

echo "Let's configure your client instance..."
echo ""

# Client Name
read -p "📝 Client name (e.g., 'Acme Corp'): " CLIENT_NAME
CLIENT_NAME=${CLIENT_NAME:-"Demo Client"}

# App Name
read -p "🏷️  App name (e.g., 'Acme Shop'): " APP_NAME
APP_NAME=${APP_NAME:-"YX Mini App"}

# Telegram Bot Token
echo ""
echo "🤖 Telegram Bot Configuration"
echo "   Get your token from @BotFather on Telegram"
read -p "   Bot Token: " BOT_TOKEN

# Bot Username
read -p "   Bot Username (without @): " BOT_USERNAME

# Admin Telegram ID
echo ""
echo "👤 Admin Access"
echo "   Find your Telegram ID via @userinfobot"
read -p "   Your Telegram User ID: " ADMIN_ID

# Optional: Branding Colors
echo ""
read -p "🎨 Customize colors? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  read -p "   Primary color (hex, e.g., #8B5CF6): " PRIMARY_COLOR
  read -p "   Accent color (hex, e.g., #EC4899): " ACCENT_COLOR
else
  PRIMARY_COLOR=""
  ACCENT_COLOR=""
fi

# Generate .env.local
echo ""
echo "📄 Generating .env.local..."

cat > .env.local << EOF
# =============================================================================
# CLIENT CONFIGURATION
# Generated on $(date)
# =============================================================================

# CLIENT BRANDING
NEXT_PUBLIC_APP_NAME="$APP_NAME"
NEXT_PUBLIC_CLIENT_NAME="$CLIENT_NAME"

# TELEGRAM BOT
TELEGRAM_BOT_TOKEN="$BOT_TOKEN"
NEXT_PUBLIC_BOT_USERNAME="$BOT_USERNAME"

# ADMIN ACCESS
ADMIN_TELEGRAM_IDS="$ADMIN_ID"

# DATABASE (Update with your Cloudflare D1 credentials)
# DATABASE_ID="your-d1-database-id"
# CLOUDFLARE_ACCOUNT_ID="your-cloudflare-account-id"
# CLOUDFLARE_API_TOKEN="your-cloudflare-api-token"
EOF

# Add branding colors if provided
if [ -n "$PRIMARY_COLOR" ]; then
  echo "" >> .env.local
  echo "# BRANDING COLORS" >> .env.local
  echo "NEXT_PUBLIC_PRIMARY_COLOR=\"$PRIMARY_COLOR\"" >> .env.local
  echo "NEXT_PUBLIC_ACCENT_COLOR=\"$ACCENT_COLOR\"" >> .env.local
fi

echo ""
echo "✅ Configuration complete!"
echo ""
echo "Next steps:"
echo "1. Review .env.local and add database credentials if needed"
echo "2. Run 'npm install' to install dependencies"
echo "3. Run 'cd frontend && npm run dev' to start development server"
echo "4. Deploy to Vercel with 'vercel --prod'"
echo ""
echo "For detailed instructions, see SETUP-CLIENT.md"
echo ""
