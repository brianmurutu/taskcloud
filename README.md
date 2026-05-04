# TaskCloud — Digital Task Marketplace

A modern, full-stack task marketplace built with Next.js 14, Supabase, and Paystack. A significantly improved clone of SariCloud.com.

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Real-time | Supabase Realtime |
| Payments | Paystack (KES + USD) |
| Deployment | Vercel |

## ✨ Features vs SariCloud

| Feature | SariCloud | TaskCloud |
|---------|-----------|-----------|
| Task listing | ✅ Basic | ✅ Advanced with filters/search |
| Task detail | ✅ Basic | ✅ Full with applications |
| Auth (signup/login) | ✅ PHP session | ✅ Supabase JWT |
| Dashboard | ✅ Basic | ✅ Full with stats |
| Bidding/Applications | ❌ | ✅ Full bid system |
| Messaging | Mentioned | ✅ Real-time chat |
| Wallet | ❌ | ✅ Full wallet + history |
| Paystack (KES) | Unknown | ✅ KES + USD |
| Escrow system | Described | ✅ Built-in |
| Submissions | ❌ | ✅ Submit & approve flow |
| Ratings/Reviews | Mentioned | ✅ Star ratings |
| Category filtering | ❌ | ✅ 12 categories |
| Mobile responsive | Basic | ✅ Mobile-first |
| Real-time updates | ❌ | ✅ Supabase Realtime |
| Notifications | ❌ | ✅ In-app notifications |
| Withdrawal | ❌ | ✅ M-Pesa withdrawal |
| Paystack webhook | ❌ | ✅ Secure webhook handler |

## 🚀 Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the contents of `supabase-schema.sql`
3. Enable Row Level Security (already in schema)
4. Get your project URL and anon key from Settings → API

### 3. Set up Paystack

1. Create an account at [paystack.com](https://paystack.com)
2. Go to Settings → API Keys & Webhooks
3. Get your Public Key and Secret Key
4. Add webhook URL: `https://your-domain.vercel.app/api/payments/webhook`
5. Subscribe to events: `charge.success`, `transfer.success`, `transfer.failed`

### 4. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxxx
PAYSTACK_SECRET_KEY=sk_live_xxxx

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=TaskCloud
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🌐 Deploy to Vercel

### Option A: Via Vercel CLI

```bash
npm install -g vercel
vercel login
vercel

# Set environment variables:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
vercel env add PAYSTACK_SECRET_KEY
vercel env add NEXT_PUBLIC_APP_URL

# Deploy to production:
vercel --prod
```

### Option B: Via GitHub

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your GitHub repo
4. Add all environment variables in the Vercel dashboard
5. Click Deploy

## 💡 Supabase Helper Functions Needed

Add these to your Supabase SQL editor after running the schema:

```sql
-- Increment views
CREATE OR REPLACE FUNCTION increment_views(task_id UUID)
RETURNS void AS $$
  UPDATE tasks SET views = views + 1 WHERE id = task_id;
$$ LANGUAGE sql;

-- Credit wallet (used by payment release)
CREATE OR REPLACE FUNCTION credit_wallet(user_id UUID, amount DECIMAL)
RETURNS void AS $$
  UPDATE profiles SET wallet_balance = wallet_balance + amount WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;
```

## 💰 Payment Flow

```
Client posts task (free)
        ↓
Client accepts tasker bid
        ↓
Client funds escrow via Paystack
        ↓
Paystack → /api/payments/webhook (charge.success)
        ↓
Funds held in client wallet as "reserved"
        ↓
Tasker submits work
        ↓
Client approves submission
        ↓
95% of budget credited to tasker wallet
5% platform fee retained
        ↓
Tasker withdraws → M-Pesa or bank
        ↓
Paystack Transfer API triggered
```

## 🗂️ Project Structure

```
taskmarket/
├── app/
│   ├── page.tsx              # Landing page
│   ├── auth/
│   │   ├── login/            # Login page
│   │   └── signup/           # Signup page
│   ├── tasks/
│   │   ├── page.tsx          # Public task listing
│   │   └── [id]/page.tsx     # Task detail + apply
│   ├── dashboard/
│   │   ├── layout.tsx        # Dashboard sidebar layout
│   │   ├── page.tsx          # Overview
│   │   ├── tasks/            # Browse tasks (auth)
│   │   ├── post-task/        # Post new task
│   │   ├── my-tasks/         # Posted + applied tasks
│   │   ├── wallet/           # Deposit, withdraw, history
│   │   ├── messages/         # Real-time messaging
│   │   └── profile/          # Profile management
│   └── api/
│       └── payments/
│           ├── verify/       # Paystack verification
│           ├── withdraw/     # Withdrawal request
│           └── webhook/      # Paystack webhook
├── lib/
│   ├── supabase.ts           # Supabase client
│   ├── paystack.ts           # Paystack utilities
│   └── auth-context.tsx      # Auth provider
├── types/
│   └── database.ts           # TypeScript types
└── supabase-schema.sql       # Full DB schema
```

## 🔧 Customization

### Branding
- Update app name in `app/layout.tsx` metadata and throughout
- Replace `TaskCloud` with your brand name
- Adjust colors in `tailwind.config.js` (currently green accent)

### Platform Fee
- Change `PLATFORM_FEE_PERCENT` in `lib/paystack.ts` (currently 5%)

### Categories
- Edit `CATEGORIES` array in `types/database.ts`

### Currency
- Add more currencies by updating Paystack config and category selectors

## 📱 Mobile Support

The app is fully responsive with:
- Mobile bottom navigation bar
- Collapsible sidebar for desktop
- Touch-friendly chat interface
- Mobile-optimized task cards

## 🔒 Security

- Row Level Security (RLS) on all tables
- Paystack webhook signature verification
- Server-side payment verification (never trust client)
- Auth via Supabase JWT tokens
- Service role key only used server-side
