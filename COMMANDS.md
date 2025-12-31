# 🔧 Complete Command Reference

## 🚀 QUICK START (Copy & Paste)

### Windows PowerShell
```powershell
# Navigate to project
cd c:\xampp8.2\htdocs\sea

# Run setup
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\setup.ps1

# After setup completes, start dev server
npm run dev

# Open browser
Start-Process http://localhost:3000
```

### Windows CMD
```batch
cd c:\xampp8.2\htdocs\sea
setup.bat
npm run dev
```

### macOS/Linux
```bash
cd /path/to/sea
chmod +x setup.sh
./setup.sh
npm run dev
open http://localhost:3000
```

---

## 📦 NPM Commands

### Installation & Setup
```powershell
# Install all dependencies
npm install

# Install specific package
npm install @supabase/supabase-js

# Install dev dependency
npm install --save-dev typescript

# Update all packages
npm update

# Check for security vulnerabilities
npm audit

# Fix security issues
npm audit fix
```

### Development
```powershell
# Start development server on port 3000
npm run dev

# Start on custom port
npm run dev -- -p 3001

# Run type checking
npm run type-check

# Run linting
npm run lint

# Fix linting errors
npm run lint -- --fix
```

### Production
```powershell
# Build for production
npm run build

# Start production server
npm start

# Preview production build locally
npm run build && npm start
```

### Database
```powershell
# Push migrations to Supabase
npm run db:migrate

# Reset database (WARNING: deletes all data)
npm run db:reset
```

---

## 🔑 Environment Setup

### Create .env.local from Template
```powershell
# Windows
Copy-Item .env.example .env.local

# macOS/Linux
cp .env.example .env.local
```

### Edit Environment Variables
```powershell
# Open with VS Code
code .env.local

# Or use Notepad
notepad .env.local
```

### Required Environment Variables
```env
# Supabase (Get from Supabase Dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google (Get from Google Cloud Console)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abcdef.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxx

# PayPal (Get from PayPal Developer)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=Ac1234567890ABC
PAYPAL_SECRET=EHwxxxxxxxxxxxxxxxx
PAYPAL_API_URL=https://api.sandbox.paypal.com
PAYPAL_WEBHOOK_ID=1AB23CD45EFG
PAYPAL_PLAN_ID_BASIC=P-1234567890ABC
PAYPAL_PLAN_ID_PRO=P-0987654321XYZ
PAYPAL_PLAN_ID_ADVANCED=P-5555555555

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 🗄️ Database Commands

### Create Database Tables
```powershell
# 1. Open Supabase Dashboard
# 2. Go to SQL Editor
# 3. Create new query
# 4. Copy entire file: database/migrations/001_initial_schema.sql
# 5. Paste into SQL Editor
# 6. Click "Run"
```

### Using Supabase CLI
```powershell
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link project
supabase link --project-ref your-project-id

# Push migrations
supabase db push

# Pull latest schema
supabase db pull

# Reset database
supabase db reset
```

---

## 🔍 Debugging Commands

### Check Node Version
```powershell
node --version    # Should be v18+
npm --version     # Should be v8+
```

### Check Dependencies
```powershell
# List all installed packages
npm list

# Check for outdated packages
npm outdated

# Check for duplicate packages
npm ls

# Show dependency tree
npm ls --all
```

### Check Environment
```powershell
# Show environment variables
$env:NODE_ENV
$env:NEXT_PUBLIC_SUPABASE_URL

# Show all env vars
Get-ChildItem env: | Sort-Object Name
```

### Clear Cache & Rebuild
```powershell
# Delete cache directories
Remove-Item -Recurse .next
Remove-Item -Recurse node_modules
Remove-Item -Recurse .turbo

# Reinstall and build
npm install
npm run build
```

---

## 🌐 Testing Commands

### Test API Endpoints
```powershell
# Using curl (if installed)
curl http://localhost:3000/api/data/ga

# Using PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/api/data/ga"

# Using fetch in browser console
fetch('http://localhost:3000/api/data/ga')
  .then(r => r.json())
  .then(d => console.log(d))
```

### Test Authentication
1. Navigate to http://localhost:3000
2. Click "Sign Up"
3. Create account with test email
4. Check Supabase Auth dashboard to verify user

### Test Database Connection
1. Open Settings page: http://localhost:3000/dashboard/settings
2. Try connecting Google Analytics
3. Check Supabase to verify token saved

---

## 📊 Performance Monitoring

### Lighthouse Audit
```powershell
# Build for production
npm run build

# Use Chrome DevTools Lighthouse
# Open DevTools → Lighthouse → Generate report
```

### Bundle Size
```powershell
# Analyze bundle size
npm install -g webpack-bundle-analyzer

# After build:
# webpack-bundle-analyzer .next/static/webpack
```

### Performance Profiling
```powershell
# Enable React Profiler in development
# DevTools → React Components → Profiler
```

---

## 🚨 Troubleshooting Commands

### Issue: Port 3000 in use
```powershell
# Find process using port 3000
Get-NetTCPConnection -LocalPort 3000

# Kill process
Stop-Process -Id <PID> -Force

# Or use different port
npm run dev -- -p 3001
```

### Issue: npm install fails
```powershell
# Clear npm cache
npm cache clean --force

# Delete lock file and reinstall
Remove-Item package-lock.json
npm install
```

### Issue: TypeScript errors
```powershell
# Check TypeScript version
npm list typescript

# Reinstall TypeScript
npm install --save-dev typescript@latest

# Run type check
npm run type-check
```

### Issue: Tailwind not loading
```powershell
# Rebuild CSS
npm run build

# Clear Tailwind cache
Remove-Item .next/cache -Recurse

# Restart dev server
npm run dev
```

### Issue: Can't connect to Supabase
```powershell
# Check environment variables are loaded
$env:NEXT_PUBLIC_SUPABASE_URL

# Verify URL format (should have .supabase.co)
# Check Supabase project is active
# Check API key is valid
```

---

## 🔄 Git Commands

### Initialize Git
```powershell
git init
git add .
git commit -m "Initial commit: SEO Analytics SaaS"
```

### Push to Repository
```powershell
git remote add origin https://github.com/username/repo.git
git branch -M main
git push -u origin main
```

### Common Git Commands
```powershell
# Check status
git status

# Add changes
git add .

# Commit
git commit -m "message"

# Push
git push

# Pull latest
git pull

# Create branch
git checkout -b feature/name

# Switch branch
git checkout main
```

---

## 🐳 Docker Commands (Optional)

### Build Docker Image
```powershell
docker build -t seo-analytics:latest .
```

### Run Docker Container
```powershell
docker run -p 3000:3000 seo-analytics:latest
```

### Docker Compose
```powershell
docker-compose up
docker-compose down
```

---

## 📝 File Commands

### View File Content
```powershell
# View file
Get-Content .env.local

# View first 10 lines
Get-Content .env.local -TotalCount 10

# Search in file
Select-String "SUPABASE" .env.local
```

### Create Files
```powershell
# Create new file
New-Item -Path "file.txt" -Type File

# Create directory
New-Item -ItemType Directory -Name "folder"
```

### Copy Files
```powershell
# Copy file
Copy-Item source.txt destination.txt

# Copy directory
Copy-Item -Recurse source/ destination/
```

---

## 🔑 Access Credentials Getting Started

### Supabase Credentials
1. Go to https://app.supabase.com
2. Select your project
3. Settings → API
4. Copy URL and Anon Key

### Google OAuth Credentials
1. Go to https://console.cloud.google.com
2. Create new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI
6. Copy Client ID and Secret

### PayPal Credentials
1. Go to https://developer.paypal.com
2. Log in or create account
3. Create app in Sandbox
4. Get Client ID and Secret
5. Create billing plans

---

## 💡 Pro Tips

### Quick Commands
```powershell
# Alias for dev server
Set-Alias dev "npm run dev"
dev

# Alias for type checking
Set-Alias tc "npm run type-check"
tc

# Alias for build
Set-Alias build "npm run build"
build
```

### Open VS Code from Terminal
```powershell
code .
```

### Open Project in Browser
```powershell
Start-Process http://localhost:3000
```

### SSH Key Setup (for Git)
```powershell
ssh-keygen -t ed25519 -C "email@example.com"
```

---

## 📞 Emergency Commands

### If everything breaks
```powershell
# Nuclear option - start fresh
Remove-Item -Recurse node_modules
Remove-Item package-lock.json
Remove-Item .next
npm install
npm run dev
```

### Check Everything
```powershell
node --version
npm --version
npm list
npm run type-check
npm run lint
npm run build
```

---

## ✅ Command Checklist

Before going live:

```powershell
# 1. Install dependencies
npm install

# 2. Type check
npm run type-check

# 3. Lint check
npm run lint

# 4. Build check
npm run build

# 5. Test dev server
npm run dev

# 6. Run production
npm start
```

---

**Commands updated: November 2025**
**Version: 1.0.0**
