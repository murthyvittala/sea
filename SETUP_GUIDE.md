# 🚀 SEO Analytics SaaS - Local Setup Guide

## ✅ Checklist Before Running

### Step 1: Prerequisites
- ✅ Node.js v18+ installed
- ✅ npm or yarn package manager
- ✅ Git installed
- ✅ Code editor (VS Code recommended)

### Step 2: Clone/Navigate to Project
```bash
cd c:\xampp8.2\htdocs\sea
```

---

## 📦 Installation Commands

### Step 3: Install Dependencies
```powershell
# Using npm
npm install

# OR using yarn
yarn install

# OR using pnpm
pnpm install
```

**What gets installed:**
- React 18.3.1
- Next.js 14.2.0
- Supabase JavaScript SDK
- Tailwind CSS
- TypeScript and type definitions
- React Hook Form
- Framer Motion

---

## 🔧 Configuration Setup

### Step 4: Environment Variables

1. **Copy the example file:**
```powershell
Copy-Item .env.example .env.local
```

2. **Update `.env.local` with your credentials:**

```env
# 1️⃣ SUPABASE SETUP
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 2️⃣ GOOGLE OAUTH (Get from Google Cloud Console)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456-abcdef.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxx

# 3️⃣ PAYPAL (Get from PayPal Developer)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=Ac1234567890
PAYPAL_SECRET=EHwxxxxxxxxxxxxxxxx
PAYPAL_API_URL=https://api.sandbox.paypal.com
PAYPAL_WEBHOOK_ID=1234567890
PAYPAL_PLAN_ID_BASIC=P-1234567890ABC
PAYPAL_PLAN_ID_PRO=P-0987654321XYZ
PAYPAL_PLAN_ID_ADVANCED=P-5555555555555

# 4️⃣ SITE CONFIG
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Step 5: How to Get Credentials

#### 🔑 Supabase Setup
1. Go to https://supabase.com
2. Create new project
3. Copy URL and Anon Key from Settings → API
4. Get Service Role Key from Settings → API

#### 🔐 Google OAuth Setup
1. Go to https://console.cloud.google.com
2. Create new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URI: `http://localhost:3000/api/ga/callback`
6. Copy Client ID and Secret

#### 💳 PayPal Setup
1. Go to https://developer.paypal.com
2. Create app in Sandbox
3. Create billing plans (Basic, Pro, Advanced)
4. Setup Webhook URL: `http://localhost:3000/api/payment/paypal/webhook`
5. Copy credentials

---

## 🗄️ Database Setup

### Step 6: Create Database Schema

1. **Go to Supabase SQL Editor**
2. **Run the migration file:** `database/migrations/001_initial_schema.sql`
   - Copy entire SQL content
   - Paste into Supabase SQL Editor
   - Click "Run"

OR use Supabase CLI:
```powershell
npm install -g supabase
supabase login
supabase db push
```

---

## 🚀 Running the Application

### Step 7: Start Development Server
```powershell
npm run dev
```

**Output:**
```
> seo-analytics-saas@1.0.0 dev
> next dev

  ▲ Next.js 14.2.0
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 2.5s
```

### Step 8: Open in Browser
1. Go to `http://localhost:3000`
2. You should be redirected to `/auth/login`
3. Click "Sign up" to create account
4. Try logging in

---

## 🛠️ Useful Commands

### Development
```powershell
# Run dev server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

### Database
```powershell
# Push migrations
npm run db:migrate

# Reset database (WARNING: deletes all data)
npm run db:reset
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Cannot find module 'react'"
**Solution:**
```powershell
npm install
# or if that doesn't work:
rm -r node_modules
npm install
```

### Issue 2: Port 3000 already in use
**Solution:**
```powershell
# Use different port
npm run dev -- -p 3001
```

### Issue 3: Supabase connection fails
**Checklist:**
- ✅ NEXT_PUBLIC_SUPABASE_URL is correct
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY is correct
- ✅ Your IP is not blocked (check Supabase settings)
- ✅ Network connection is working

### Issue 4: TypeScript errors remain
**Solution:**
```powershell
# Clear build cache
rm -r .next
npm run build
```

### Issue 5: Tailwind CSS not working
**Solution:**
```powershell
npm install -D tailwindcss autoprefixer postcss @tailwindcss/forms
npm run build
```

---

## 🧪 Testing the Setup

### Test Authentication
1. Go to http://localhost:3000/auth/register
2. Create account with email/password
3. Check Supabase → Auth to verify user created
4. Try Google OAuth (if configured)

### Test API Routes
```powershell
# Open browser console and test:
curl http://localhost:3000/api/data/ga -H "x-user-id: your-user-id"
```

### Test Database Connection
1. Go to http://localhost:3000/dashboard/settings
2. Try connecting Google Analytics
3. Check if token saved in Supabase

---

## 📁 Project Structure

```
c:\xampp8.2\htdocs\sea\
├── app/                          # Next.js App Router
│   ├── auth/                      # Auth pages (login, register)
│   ├── dashboard/                 # Dashboard pages
│   ├── api/                       # API routes
│   ├── payment/                   # Payment pages
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Home redirects to login
│   └── globals.css                # Global styles
├── components/                    # React components
│   ├── ui/                        # UI components (Button, Input)
│   ├── dashboard/                 # Dashboard components
│   └── payment/                   # Payment components
├── hooks/                         # Custom React hooks
│   ├── useAuth.ts                 # Auth hook
│   ├── useUserProfile.ts          # Profile hook
│   ├── useGA.ts                   # GA4 hook
│   ├── useGSC.ts                  # GSC hook
│   └── usePagination.ts           # Pagination hook
├── lib/                           # Utilities & helpers
│   ├── supabase.ts                # Supabase client
│   ├── utils.ts                   # Helper functions
│   ├── constants.ts               # App constants
│   ├── api.ts                     # API client
│   ├── validation.ts              # Validation rules
│   ├── analytics.ts               # Analytics tracking
│   └── paypal.ts                  # PayPal utilities
├── database/                      # Database migrations
│   └── migrations/
│       └── 001_initial_schema.sql # Initial schema
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
├── next.config.js                 # Next.js config
├── tailwind.config.js             # Tailwind config
├── postcss.config.js              # PostCSS config
├── .eslintrc.json                 # ESLint config
├── .env.local                     # Environment variables (local)
├── .env.example                   # Environment template
├── .gitignore                     # Git ignore rules
└── readme.md                      # Documentation
```

---

## 📚 Key Files Overview

| File | Purpose |
|------|---------|
| `lib/supabase.ts` | Supabase client initialization & auth helpers |
| `app/auth/login/page.tsx` | Login page with email/OAuth |
| `app/dashboard/layout.tsx` | Dashboard wrapper with sidebar |
| `components/dashboard/traffic-table.tsx` | GA4 data table with sorting |
| `hooks/useAuth.ts` | Auth state management |
| `database/migrations/001_initial_schema.sql` | Database schema |

---

## 🔍 File Verification Checklist

✅ All files created:
- ✅ Auth pages (login, register, pricing)
- ✅ API routes (OAuth, PayPal, data)
- ✅ Dashboard pages (main, traffic, keywords, pagespeed)
- ✅ Components (tables, cards, filters)
- ✅ Hooks (useAuth, useProfile, etc.)
- ✅ Utilities (api, validation, analytics)
- ✅ Configuration (tsconfig, next.config, tailwind.config)
- ✅ Database schema (migrations)

---

## 🚀 Next Steps After Setup

1. **Setup Google OAuth:**
   - Create credentials in Google Cloud
   - Update `.env.local` with CLIENT_ID

2. **Setup PayPal:**
   - Create billing plans in PayPal
   - Update plan IDs in `.env.local`

3. **Setup GA4 & GSC:**
   - Users will authorize from settings page

4. **Test Full Flow:**
   - Register → Login → Connect GA4/GSC → View Dashboard

---

## 📞 Troubleshooting

### For detailed logs:
```powershell
# Enable debug mode
$env:DEBUG="*"; npm run dev
```

### Check Node version:
```powershell
node --version  # Should be v18+
npm --version   # Should be v8+
```

### Verify all dependencies installed:
```powershell
npm list
```

---

## 🎉 Success!

If you see the dashboard without errors, setup is complete! 

Next: Configure OAuth providers and test the full user flow.

---

**Questions?** Check the COMPONENTS_GUIDE.md for component documentation.

## TABLE SCHEMA UPDATE for LLM
supabase/migrations/create_ai_analytics_tables.sql

UPDATE schema_registry SET is_active = true WHERE table_name = 'ga_data';
UPDATE schema_registry SET is_active = true WHERE table_name = 'gsc_data';

### LLM FIELDS SAVING SETTINGS PAGE
-- Add LLM configuration fields to users table

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS llm_provider TEXT DEFAULT 'openai',
ADD COLUMN IF NOT EXISTS llm_model TEXT DEFAULT 'gpt-4o',
ADD COLUMN IF NOT EXISTS llm_api_key_encrypted TEXT;

-- Add comments for documentation
COMMENT ON COLUMN users.llm_provider IS 'LLM provider: openai, anthropic, google, groq';
COMMENT ON COLUMN users.llm_model IS 'Selected LLM model ID';
COMMENT ON COLUMN users.llm_api_key_encrypted IS 'Encrypted API key for the selected LLM provider';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('llm_provider', 'llm_model', 'llm_api_key_encrypted');