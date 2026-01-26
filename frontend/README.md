# Telegram Mini App

A premium Telegram Mini App with Apple/VisionOS-inspired dark UI design.

## Features

### User App (Telegram-only)
- **Catalog**: Browse products with category filters and search
- **Cart**: Add/remove items with quantity controls, persistent state
- **Reviews**: View and submit product reviews
- **Info**: Store information and contact details

### Admin Panel (Web-accessible)
- **Dashboard**: Overview stats and recent activity
- **Products**: Full CRUD with image management
- **Reviews**: Moderate customer reviews (approve/reject)
- **Settings**: Manage store configuration

## Tech Stack

- **Framework**: Next.js 16.1.4 (App Router)
- **React**: 19.2.3
- **Styling**: Tailwind CSS 4.1.18
- **Language**: TypeScript 5.9.3
- **State**: Zustand 5.0.10
- **Animation**: Motion 12.29.0 (Framer Motion)
- **Database**: Cloudflare D1 (via API)
- **Auth**: Better Auth 1.4.17
- **UI Components**: shadcn/ui

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- Telegram Bot (from @BotFather)

### Installation

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd telegram-mini-app
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Configure your `.env` file with:
   - Telegram Bot Token
   - Better Auth secret
   - `CLOUDFLARE_API_URL` (backend URL)

6. Start the development server:
   ```bash
   pnpm dev
   ```

### Telegram Bot Setup

1. Create a bot with @BotFather
2. Enable Web Apps for your bot
3. Set the Web App URL to your deployed URL
4. Configure the menu button to open your Mini App

## Project Structure

```
app/
├─ (webapp)/           # User-facing pages (Telegram-only)
│  ├─ layout.tsx       # Telegram gate + bottom nav
│  ├─ page.tsx         # Catalog
│  ├─ cart/page.tsx
│  ├─ reviews/page.tsx
│  └─ info/page.tsx
├─ admin/              # Admin panel (web-accessible)
│  ├─ layout.tsx
│  ├─ login/page.tsx
│  ├─ page.tsx         # Dashboard
│  ├─ products/page.tsx
│  ├─ reviews/page.tsx
│  └─ settings/page.tsx
├─ api/                # API routes
│  ├─ auth/[...all]/
│  ├─ telegram/verify/
│  ├─ products/
│  ├─ reviews/
│  ├─ orders/
│  └─ settings/
components/
├─ ui/                 # shadcn components
├─ BottomNav.tsx
├─ ProductCard.tsx
├─ TelegramGate.tsx
└─ ...
lib/
├─ telegram/           # Telegram utilities
├─ auth/               # Better Auth setup
├─ db/                 # Shared DB types
└─ store/              # Zustand stores
```

## Design System

The app uses a premium dark theme inspired by Apple's VisionOS:

- **Dark mode** by default
- **Glassmorphism** with backdrop-blur effects
- **Semi-transparent surfaces**
- **Subtle gradients and shadows**
- **Large border-radius** (2xl, 3xl)
- **Generous spacing**
- **Smooth, subtle animations**

### CSS Utilities

```css
.glass         /* Basic glass effect */
.glass-card    /* Glass card with shadow */
.glass-nav     /* Frosted nav bar */
.glass-button  /* Glass button */
.glass-input   /* Glass input field */
```

## Environment Variables

```env
# Telegram
TELEGRAM_BOT_TOKEN=

# Better Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=

# App
NEXT_PUBLIC_APP_URL=

# Backend
CLOUDFLARE_API_URL=
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Manual

```bash
pnpm build
pnpm start
```

## License

MIT
