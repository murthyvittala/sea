# Architecture Diagram & Flow Charts

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js Frontend                            │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Settings Page (/dashboard/settings)                       │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │  Account Section                                     │  │  │
│  │  │  Website Configuration                               │  │  │
│  │  │  API Keys (OpenAI)                                   │  │  │
│  │  │  ┌────────────────────────────────────────────────┐  │  │  │
│  │  │  │ Google Integrations                            │  │  │  │
│  │  │  │ [ ✓ Connected / Connect ] ← handleConnectGoogle│  │  │  │
│  │  │  └────────────────────────────────────────────────┘  │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              │                                    │
│                              │ Fetch /api/google/authorize       │
│                              ↓                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  API Routes                                                 │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │ /api/google/authorize                                  │ │  │
│  │  │ - Build OAuth URL with scopes                          │ │  │
│  │  │ - Return authUrl to frontend                           │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ window.location = authUrl
                              ↓
          ┌───────────────────────────────────────┐
          │   Google OAuth Consent Screen          │
          │                                        │
          │  "SEA wants to access:"                │
          │  ☑ Google Analytics                   │
          │  ☑ Google Search Console              │
          │                                        │
          │  [ Allow ] [ Cancel ]                 │
          └───────────────────────────────────────┘
                              │
                      User clicks "Allow"
                              │
                              ↓
              code=xxx&state=userid
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Backend API Routes                             │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ /api/google/callback                                       │  │
│  │                                                            │  │
│  │ 1. Receive: code, state, error                            │  │
│  │ 2. Exchange code → access_token (Google API)             │  │
│  │ 3. Create tokenData object                                │  │
│  │ 4. Save to Supabase:                                      │  │
│  │    - profiles[userId].ga_token = tokenData              │  │
│  │    - profiles[userId].gsc_token = tokenData             │  │
│  │ 5. Redirect to /dashboard?success=google_connected       │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
                    ┌──────────────────────┐
                    │   Supabase Database   │
                    │                       │
                    │  profiles table:      │
                    │  ├─ id                │
                    │  ├─ ga_token (JSON)  │
                    │  └─ gsc_token (JSON) │
                    │                       │
                    │  Token Data:          │
                    │  {                   │
                    │   access_token,      │
                    │   refresh_token,     │
                    │   expires_at,        │
                    │   saved_at           │
                    │  }                   │
                    └──────────────────────┘
                              │
                              ↓
              Redirect to /dashboard
                              │
                              ↓
         ┌────────────────────────────────────┐
         │  Dashboard Page                    │
         │  ✅ Google connected!              │
         │  Settings page shows               │
         │  "✓ Connected"                     │
         └────────────────────────────────────┘
```

---

## OAuth Flow Sequence Diagram

```
User                 Settings Page          /api/google/*           Google
 │                        │                       │                    │
 │──────── Click ────────→ │                       │                    │
 │       "Connect"         │                       │                    │
 │                         │                       │                    │
 │                         │──Fetch /authorize────→ │                    │
 │                         │                       │                    │
 │                         │←Build authUrl────────│                    │
 │                         │                       │                    │
 │←Redirect to authUrl─────│                       │                    │
 │                         │                       │   ↓ Redirects      │
 │─────────── Logs In ─────────────────────────────────────────────────→│
 │                         │                       │  User Authorizes   │
 │←─── OAuth Consent ──────────────────────────────────────────────────│
 │       Screen            │                       │                    │
 │                         │                       │                    │
 │──── Clicks Allow ───────────────────────────────────────────────────→│
 │                         │                       │                    │
 │←──Redirects to cb url───────────────────────────────────────────────│
 │                         │  code=xxx&state=uid  │                    │
 │                         │                  ↓   │                    │
 │                         │              Exchange │                    │
 │                         │              code→   │                    │
 │                         │             token    │                    │
 │                         │                  ↓   │                    │
 │                         │←Token Response───────│                    │
 │                         │                       │                    │
 │                    ↓ Save to DB                │                    │
 │                  ga_token = token              │                    │
 │                  gsc_token = token             │                    │
 │                         │                       │                    │
 │←── Redirect /dashboard──│                       │                    │
 │  ?success=connected     │                       │                    │
 │                    ↓                            │                    │
 │        "✓ Connected"    │                       │                    │
 │        Display on UI    │                       │                    │
```

---

## Database State Diagram

```
BEFORE Authorization:
┌─────────────────────────────────────────┐
│ profiles table (user_id = "abc123")      │
├─────────────────────────────────────────┤
│ id                 │ abc123              │
│ plan               │ free                │
│ ga_token           │ NULL                │
│ gsc_token          │ NULL                │
│ website_url        │ https://...         │
│ sitemap_url        │ https://.../xml     │
│ openai_api_key     │ sk-...              │
└─────────────────────────────────────────┘


AFTER Authorization:
┌──────────────────────────────────────────────────────────┐
│ profiles table (user_id = "abc123")                      │
├──────────────────────────────────────────────────────────┤
│ id                 │ abc123                              │
│ plan               │ free                                │
│ ga_token           │ {"access_token": "ya29...",         │
│                    │  "refresh_token": "1//0...",        │
│                    │  "expires_at": "2025-12-01T...",    │
│                    │  "saved_at": "2025-11-30T..."}      │
│ gsc_token          │ {"access_token": "ya29...",         │
│                    │  "refresh_token": "1//0...",        │
│                    │  "expires_at": "2025-12-01T...",    │
│                    │  "saved_at": "2025-11-30T..."}      │
│ website_url        │ https://...                         │
│ sitemap_url        │ https://.../xml                     │
│ openai_api_key     │ sk-...                              │
└──────────────────────────────────────────────────────────┘

Note: Both ga_token and gsc_token contain IDENTICAL data
      Same access_token works for both GA4 and GSC APIs
```

---

## Component Hierarchy

```
app/
├── api/
│   └── google/
│       ├── authorize/
│       │   └── route.ts (GET)
│       │       ├── Receives: userId
│       │       ├── Returns: OAuth URL
│       │       └── Scopes: GA4 + GSC
│       │
│       └── callback/
│           └── route.ts (GET)
│               ├── Receives: code, state
│               ├── Exchanges: code → token
│               ├── Saves: ga_token, gsc_token
│               └── Redirects: /dashboard
│
├── dashboard/
│   └── settings/
│       └── page.tsx
│           ├── State: profile (with ga_token, gsc_token)
│           ├── Functions:
│           │   ├── handleConnectGoogle()
│           │   ├── handleChange()
│           │   ├── validateForm()
│           │   └── handleSave()
│           └── UI Sections:
│               ├── Account Information
│               ├── Website Configuration
│               ├── API Keys
│               └── Google Integrations ← NEW

types/
├── UserProfile
│   ├── id: string
│   ├── plan: string
│   ├── role: string
│   ├── ga_token?: string ← NEW
│   ├── gsc_token?: string ← NEW
│   ├── openai_api_key?: string
│   ├── website_url?: string
│   └── sitemap_url?: string
```

---

## Request/Response Flow

### Request: Get OAuth URL

```
Request:
→ GET /api/google/authorize?userId=abc123

Response:
← {
    "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?
                client_id=xxx&
                redirect_uri=http://localhost:3000/api/google/callback&
                response_type=code&
                scope=https://www.googleapis.com/auth/analytics.readonly%20
                      https://www.googleapis.com/auth/analytics%20
                      https://www.googleapis.com/auth/webmasters.readonly&
                access_type=offline&
                state=abc123&
                prompt=consent"
  }
```

### Request: Handle OAuth Callback

```
Request:
→ GET /api/google/callback?
     code=4/0AX4XfWgJR...&
     state=abc123&
     scope=https://www.googleapis.com/auth/analytics%20...

Processing:
1. Extract code and state
2. POST to https://oauth2.googleapis.com/token
   - Send: code, client_id, client_secret, redirect_uri
3. Receive: access_token, refresh_token, expires_in

Response:
← Redirect to /dashboard?success=google_connected

Database Update:
UPDATE profiles 
SET ga_token = '{"access_token":"ya29...","refresh_token":"1//0...","expires_at":"2025-12-01T...","saved_at":"2025-11-30T..."}',
    gsc_token = '{"access_token":"ya29...","refresh_token":"1//0...","expires_at":"2025-12-01T...","saved_at":"2025-11-30T..."}' 
WHERE id = 'abc123'
```

---

## State Management

```
Settings Page State:
┌─────────────────────────────────────────┐
│ useState Hook Variables                  │
├─────────────────────────────────────────┤
│ profile                                 │
│  ├─ id: string                          │
│  ├─ ga_token?: string                   │
│  ├─ gsc_token?: string                  │
│  ├─ openai_api_key?: string             │
│  ├─ website_url?: string                │
│  ├─ sitemap_url?: string                │
│  └─ plan, role, dates...                │
│                                         │
│ loading: boolean (initial load)         │
│ saving: boolean (save in progress)      │
│ message: string (user feedback)         │
│ errors: Record<string, string>          │
└─────────────────────────────────────────┘

User clicks "Connect" → handleConnectGoogle()
  ↓
Fetch /api/google/authorize?userId={profile.id}
  ↓
Get authUrl from response
  ↓
window.location.href = authUrl (redirect to Google)
  ↓
[User in Google OAuth flow]
  ↓
Google redirects to /api/google/callback?code=...&state=...
  ↓
Backend saves tokens to database
  ↓
Redirect to /dashboard?success=google_connected
  ↓
User navigates back to Settings
  ↓
useEffect re-loads profile
  ↓
profile now has ga_token and gsc_token
  ↓
UI updates to show "✓ Connected"
```

---

## Error Flow

```
Errors that can occur:

1. Missing userId
   ↓
   /api/google/authorize (no userId param)
   ↓
   Returns: {error: 'Missing userId'} (400)

2. Invalid Client ID
   ↓
   Google rejects client_id
   ↓
   Returns: error_description=Invalid client_id

3. Redirect URI Mismatch
   ↓
   Google URL doesn't match registered URI
   ↓
   Returns: error=redirect_uri_mismatch

4. Token Exchange Failed
   ↓
   /api/google/callback receives code
   ↓
   Exchange fails (invalid secret, expired code)
   ↓
   Returns: error_description=Invalid authorization code

5. Database Error
   ↓
   Supabase save fails
   ↓
   Logs error, redirects to dashboard?error=...

All errors → User redirected to /dashboard with error message
```

---

## File Dependencies

```
Settings Page (page.tsx)
    ├─ Imports: Button, Input components
    ├─ Imports: supabase utilities
    │   ├─ getAuthUser()
    │   ├─ getUserProfile()
    │   └─ createOrUpdateUserProfile()
    ├─ Calls: /api/google/authorize
    └─ Navigates to: /api/google/callback (via Google)

/api/google/authorize/route.ts
    ├─ Imports: NextRequest, NextResponse
    ├─ Uses: process.env (Google Client ID, Site URL)
    └─ Returns: OAuth URL

/api/google/callback/route.ts
    ├─ Imports: Supabase client
    ├─ Uses: process.env (all Google + Supabase vars)
    ├─ Calls: OAuth2 token endpoint
    └─ Updates: Supabase profiles table

Supabase Database
    └─ profiles table
        ├─ ga_token (text/jsonb)
        └─ gsc_token (text/jsonb)
```
