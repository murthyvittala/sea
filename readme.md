# 🎯 SEO Analytics SaaS - Production-Ready Dashboard

A complete Next.js + Supabase SEO Analytics platform with real-time GA4, Google Search Console, and PageSpeed integration.

## ✨ Features

✅ **Authentication**
- Email/Password signup & login
- OAuth (Google, Facebook, LinkedIn)
- Role-based access control
- Secure session management

✅ **Subscription Management**
- 4 pricing tiers (Free, Basic, Pro, Advanced)
- PayPal subscription billing
- Automated webhook handling
- Plan limits enforcement

✅ **Analytics Integration**
- Google Analytics 4 data import
- Google Search Console keywords
- PageSpeed Insights monitoring
- Last 3 months data history

✅ **Dashboard Features**
- Real-time data visualization
- Advanced filtering & sorting
- Pagination (100 rows/page)
- Data export (CSV, JSON)
- Mobile responsive design

✅ **Professional UI**
- Tailwind CSS styling
- Modern component library
- Smooth animations
- Professional grey/blue/white theme

---

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

#### For Windows (CMD):
```powershell
cd c:\xampp8.2\htdocs\sea
setup.bat
```

#### For PowerShell:
```powershell
cd c:\xampp8.2\htdocs\sea
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\setup.ps1
```

#### For macOS/Linux:
```bash
cd /path/to/sea
chmod +x setup.sh
./setup.sh
```

### Option 2: Manual Setup

```powershell
# 1. Install dependencies
npm install

# 2. Create environment file
Copy-Item .env.example .env.local

# 3. Start dev server
npm run dev

# 4. Open browser
Start-Process http://localhost:3000
```

---

## 📋 Prerequisites

- **Node.js** v18 or higher
- **npm** v8 or higher (or yarn/pnpm)
- **Supabase** account
- **Google Cloud** project (for OAuth)
- **PayPal** developer account

### Verify Installation:
```powershell
node --version  # Should be v18+
npm --version   # Should be v8+
```

---

## 🔧 Environment Setup

### Step 1: Copy Environment Template
```powershell
Copy-Item .env.example .env.local
```

### Step 2: Fill in Credentials

#### Supabase (Required)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Google OAuth (Optional but recommended)
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxx
```

#### PayPal (Required for billing)
```env
NEXT_PUBLIC_PAYPAL_CLIENT_ID=Ac1234567890ABC
PAYPAL_SECRET=EHwxxxxxxxxxxxxxxxx
PAYPAL_API_URL=https://api.sandbox.paypal.com
PAYPAL_WEBHOOK_ID=1AB23CD45EFG
PAYPAL_PLAN_ID_BASIC=P-1234567890ABC
PAYPAL_PLAN_ID_PRO=P-0987654321XYZ
PAYPAL_PLAN_ID_ADVANCED=P-5555555555
```

#### Site Configuration
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 💾 Database Setup

### Create Tables & RLS Policies

1. Open [Supabase Dashboard](https://app.supabase.com)
2. Go to **SQL Editor**
3. Create new query
4. Copy content from `database/migrations/001_initial_schema.sql`
5. Click **Run**

OR use Supabase CLI:
```powershell
npm install -g supabase
supabase link --project-ref your-project-id
supabase db push
```

---

## 🎯 Running the Application

### Development Server
```powershell
npm run dev
```

Access at: `http://localhost:3000`

### Production Build
```powershell
npm run build
npm start
```

### Type Checking
```powershell
npm run type-check
```

### Linting
```powershell
npm run lint
```

---

## 📁 Project Structure

```
sea/
├── app/                          # Next.js App Router
│   ├── auth/                      # Authentication pages
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── callback/page.tsx
│   ├── dashboard/                 # Dashboard pages
│   │   ├── layout.tsx             # Dashboard wrapper
│   │   ├── page.tsx               # Dashboard home
│   │   ├── traffic/page.tsx       # GA4 analytics
│   │   ├── keywords/page.tsx      # GSC keywords
│   │   ├── pagespeed/page.tsx     # PageSpeed metrics
│   │   └── settings/page.tsx      # User settings
│   ├── pricing/page.tsx           # Pricing page
│   ├── payment/                   # Payment pages
│   │   ├── success/page.tsx
│   │   └── cancel/page.tsx
│   ├── api/                       # API routes
│   │   ├── auth/
│   │   ├── ga/                    # Google Analytics
│   │   ├── gsc/                   # Search Console
│   │   ├── data/                  # Data endpoints
│   │   └── payment/               # Payment webhooks
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Home redirect
│   └── globals.css                # Global styles
│
├── components/                    # React components
│   ├── ui/                        # Base UI components
│   │   ├── button.tsx
│   │   └── input.tsx
│   ├── dashboard/                 # Dashboard components
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   ├── traffic-table.tsx      # GA4 table with sorting
│   │   ├── keywords-table.tsx     # GSC table with bulk actions
│   │   ├── pagespeed-table.tsx    # PageSpeed table with filtering
│   │   ├── stats-card.tsx         # KPI cards
│   │   ├── chart-card.tsx         # Chart wrapper
│   │   ├── data-filters.tsx       # Advanced filtering
│   │   ├── data-table.tsx         # Generic table
│   │   └── export-button.tsx      # CSV/JSON export
│   └── payment/
│       └── paypal-checkout.tsx
│
├── hooks/                         # Custom React hooks
│   ├── useAuth.ts                 # Auth state
│   ├── useUserProfile.ts          # User profile
│   ├── useGA.ts                   # Google Analytics
│   ├── useGSC.ts                  # Search Console
│   └── usePagination.ts           # Pagination logic
│
├── lib/                           # Utilities & helpers
│   ├── supabase.ts                # Supabase client & auth
│   ├── utils.ts                   # Helper functions
│   ├── constants.ts               # App constants
│   ├── api.ts                     # API client with errors
│   ├── validation.ts              # Form validation
│   ├── analytics.ts               # Analytics tracking
│   └── paypal.ts                  # PayPal utilities
│
├── database/                      # Database
│   └── migrations/
│       └── 001_initial_schema.sql # Initial schema
│
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
├── next.config.js                 # Next.js config
├── tailwind.config.js             # Tailwind config
├── postcss.config.js              # PostCSS config
├── .eslintrc.json                 # ESLint config
├── .env.example                   # Environment template
├── .env.local                     # Local environment (gitignored)
├── .gitignore                     # Git ignore rules
├── SETUP_GUIDE.md                 # Detailed setup instructions
├── COMPONENTS_GUIDE.md            # Components documentation
└── README.md                      # This file
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/callback` - OAuth callback
- `POST /api/auth/logout` - User logout

### Google Analytics
- `GET /api/ga/authorize?userId=...` - Get GA4 auth URL
- `GET /api/ga/callback` - GA4 OAuth callback
- `GET /api/data/ga?page=1` - Fetch GA4 data

### Google Search Console
- `GET /api/gsc/authorize?userId=...` - Get GSC auth URL
- `GET /api/gsc/callback` - GSC OAuth callback
- `GET /api/data/gsc?page=1` - Fetch GSC data

### PageSpeed
- `GET /api/data/pagespeed?page=1` - Fetch PageSpeed data

### Payment
- `POST /api/payment/paypal/create-subscription` - Create subscription
- `POST /api/payment/paypal/webhook` - PayPal webhook

---

## 🎨 Design System

### Colors
- **Primary Blue**: `#3B82F6`
- **Secondary Grey**: `#1F2937`
- **Background**: `#F3F4F6`
- **White**: `#FFFFFF`

### Typography
- **Font**: System fonts (sans-serif)
- **Headings**: Bold (font-weight: 700)
- **Body**: Regular (font-weight: 400)

### Spacing
- **Base Unit**: 4px (Tailwind default)
- **Standard Padding**: 16px, 24px, 32px
- **Gap**: 16px between sections

---

## 🚨 Troubleshooting

### "Cannot find module 'react'"
```powershell
rm -r node_modules
npm install
```

### "Port 3000 already in use"
```powershell
npm run dev -- -p 3001
```

### "Supabase connection failed"
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is valid
- Ensure Supabase project is active

### "TypeScript errors"
```powershell
rm -r .next
npm run build
```

### "Tailwind CSS not loading"
```powershell
npm install -D tailwindcss postcss autoprefixer @tailwindcss/forms
npm run build
```

---

## 📚 Documentation Files

- **SETUP_GUIDE.md** - Detailed setup instructions
- **COMPONENTS_GUIDE.md** - Component documentation
- **.env.example** - Environment variables template

---

## 🔐 Security Considerations

✅ Environment variables are never exposed to client
✅ RLS policies prevent unauthorized data access
✅ API routes validate user authentication
✅ PayPal webhooks verify request signatures
✅ OAuth providers ensure secure authentication

---

## 📦 Dependencies

### Core
- `next@14.2.0` - React framework
- `react@18.3.1` - UI library
- `typescript@5.3.3` - Type checking

### Database & Auth
- `@supabase/supabase-js@2.43.5` - Supabase client
- `@supabase/auth-helpers-nextjs@0.10.0` - Auth helpers

### Styling
- `tailwindcss@3.4.1` - CSS framework
- `postcss@8.4.32` - CSS processor
- `autoprefixer@10.4.16` - CSS prefixer

### Forms & Validation
- `react-hook-form@7.51.3` - Form management

### Animation
- `framer-motion@10.16.19` - Animations

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

```powershell
npm install -g vercel
vercel
```

### Deploy to Other Platforms

Ensure you set environment variables on your hosting platform.

---

## 📞 Support & Questions

- Check SETUP_GUIDE.md for detailed setup instructions
- Check COMPONENTS_GUIDE.md for component usage
- Review .env.example for required environment variables

---

## 📄 License

This project is private and for commercial use.

---

## 🎉 Ready to Go!

Your SEO Analytics SaaS is ready for development. Start the dev server and begin building!

```powershell
npm run dev
```

Visit: `http://localhost:3000`

Happy coding! 🚀
