@echo off
REM SEO Analytics - Quick Setup Script for Windows

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║     SEO Analytics SaaS - Automated Setup Script               ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: Node.js is not installed
    echo Please download from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js detected: 
node --version
npm --version
echo.

REM Navigate to project directory
cd /d "%~dp0"

REM Check if package.json exists
if not exist "package.json" (
    echo ❌ ERROR: package.json not found
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

echo ✅ Project directory verified
echo.

REM Install dependencies
echo ⏳ Installing dependencies... This may take a few minutes.
echo.
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: npm install failed
    pause
    exit /b 1
)

echo.
echo ✅ Dependencies installed successfully!
echo.

REM Check .env.local
if not exist ".env.local" (
    echo ⚠️  .env.local not found. Creating from template...
    copy .env.example .env.local
    echo ✅ .env.local created. Please edit with your credentials.
    echo.
    pause
) else (
    echo ✅ .env.local already exists
    echo.
)

REM Display setup complete message
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                    ✅ Setup Complete!                         ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo 📝 Next steps:
echo.
echo 1. Edit .env.local with your credentials:
echo    - Supabase URL and Key
echo    - Google OAuth credentials
echo    - PayPal credentials
echo.
echo 2. Run database migrations:
echo    - Open Supabase SQL Editor
echo    - Paste content from: database/migrations/001_initial_schema.sql
echo    - Click Run
echo.
echo 3. Start development server:
echo    npm run dev
echo.
echo 4. Open http://localhost:3000 in your browser
echo.
pause
