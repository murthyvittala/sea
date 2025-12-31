#!/usr/bin/env pwsh

# SEO Analytics - Setup Script for PowerShell

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     SEO Analytics SaaS - Setup Script (PowerShell)            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js detected: $nodeVersion" -ForegroundColor Green
    Write-Host "✅ npm version: $(npm --version)" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Node.js is not installed" -ForegroundColor Red
    Write-Host "Please download from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Navigate to script directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Verify package.json exists
if (-not (Test-Path "package.json")) {
    Write-Host "❌ ERROR: package.json not found" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Project directory verified" -ForegroundColor Green
Write-Host ""

# Install dependencies
Write-Host "⏳ Installing dependencies..." -ForegroundColor Yellow
Write-Host "   This may take a few minutes..." -ForegroundColor Gray
Write-Host ""

npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERROR: npm install failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
Write-Host ""

# Create .env.local if it doesn't exist
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  .env.local not found. Creating from template..." -ForegroundColor Yellow
    Copy-Item .env.example .env.local
    Write-Host "✅ .env.local created" -ForegroundColor Green
    Write-Host "   ⚠️  Please edit .env.local with your credentials!" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "✅ .env.local already exists" -ForegroundColor Green
    Write-Host ""
}

# Display setup complete message
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    ✅ Setup Complete!                         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  Edit .env.local with your credentials:" -ForegroundColor Yellow
Write-Host "   • Supabase URL and Anon Key" -ForegroundColor Gray
Write-Host "   • Google OAuth Client ID and Secret" -ForegroundColor Gray
Write-Host "   • PayPal Client ID and Secret" -ForegroundColor Gray
Write-Host ""

Write-Host "2️⃣  Run database migrations:" -ForegroundColor Yellow
Write-Host "   • Open Supabase Dashboard" -ForegroundColor Gray
Write-Host "   • Go to SQL Editor" -ForegroundColor Gray
Write-Host "   • Paste: database/migrations/001_initial_schema.sql" -ForegroundColor Gray
Write-Host "   • Click 'Run'" -ForegroundColor Gray
Write-Host ""

Write-Host "3️⃣  Start development server:" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""

Write-Host "4️⃣  Open in browser:" -ForegroundColor Yellow
Write-Host "   http://localhost:3000" -ForegroundColor Cyan
Write-Host ""

Write-Host "📚 Documentation:" -ForegroundColor Green
Write-Host "   • Setup Guide: SETUP_GUIDE.md" -ForegroundColor Gray
Write-Host "   • Components: COMPONENTS_GUIDE.md" -ForegroundColor Gray
Write-Host ""
