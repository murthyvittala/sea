# Quick Reference Card - Unified Google OAuth

## What Was Built

✅ **Unified OAuth Flow** for GA4 + Search Console
✅ **Single Connect Button** on Settings page
✅ **One OAuth Consent Screen** (requests both scopes)
✅ **Shared Token** stored in both `ga_token` and `gsc_token` fields

---

## Key Files

| File | Purpose |
|------|---------|
| `app/api/google/authorize/route.ts` | Start OAuth flow |
| `app/api/google/callback/route.ts` | Handle OAuth callback & save tokens |
| `app/dashboard/settings/page.tsx` | Settings UI with Connect button |

---

## Setup Steps (5 minutes)

### 1. Add Environment Variables
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

### 2. Google Cloud Console
- Add Redirect URI: `http://localhost:3000/api/google/callback`
- Enable: Google Analytics API + Google Search Console API

### 3. Test
```bash
npm run dev
# Go to http://localhost:3000/dashboard/settings
# Click "Connect"
```

---

## How It Works (In 30 seconds)

1. User clicks "Connect" on Settings page
2. Redirected to Google OAuth with 3 scopes:
   - Analytics read
   - Analytics write  
   - Search Console read
3. User authorizes once
4. Redirected back to `/api/google/callback`
5. Backend saves token to both `ga_token` and `gsc_token`
6. Settings page shows "✓ Connected"

---

## Database Schema

```sql
-- Add these fields to profiles table (if not exists)
ALTER TABLE profiles ADD COLUMN ga_token text;
ALTER TABLE profiles ADD COLUMN gsc_token text;

-- Both store same token:
-- {
--   "access_token": "...",
--   "refresh_token": "...",
--   "expires_at": "2025-12-01T00:00:00Z",
--   "saved_at": "2025-11-30T23:00:00Z"
-- }
```

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/google/authorize?userId=ID` | GET | Get OAuth URL |
| `/api/google/callback` | GET | OAuth callback handler |

---

## Response Flow

```
Settings Page
  ↓
Click "Connect"
  ↓
Fetch /api/google/authorize?userId=abc123
  ↓
{authUrl: "https://accounts.google.com/o/oauth2/..."}
  ↓
Redirect to authUrl
  ↓
User logs in to Google
  ↓
Google redirects to /api/google/callback?code=xxx&state=abc123
  ↓
Backend exchanges code for token
  ↓
Backend saves to database
  ↓
Redirect to /dashboard?success=google_connected
  ↓
Settings page shows "✓ Connected"
```

---

## Key Variables in Response

### `/api/google/authorize` Response
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&scope=..."
}
```

### Saved Token Data
```json
{
  "access_token": "ya29.a0AfH6SMBxxx...",
  "refresh_token": "1//0gexample...",
  "expires_at": "2025-12-01T00:00:00.000Z",
  "saved_at": "2025-11-30T23:00:00.000Z"
}
```

---

## Scopes Requested

| Scope | Service | Purpose |
|-------|---------|---------|
| `analytics.readonly` | GA4 | Read analytics data |
| `analytics` | GA4 | Write analytics data |
| `webmasters.readonly` | GSC | Read search console data |

---

## Error Handling

| Error | Location | Fix |
|-------|----------|-----|
| Invalid Client ID | callback | Check env variables |
| Redirect URI mismatch | Google | Update Google Cloud Console |
| Token exchange failed | callback | Check credentials |
| Database error | callback | Check Supabase connection |

---

## Testing Commands

### Check OAuth URLs
```bash
curl "http://localhost:3000/api/google/authorize?userId=test-user-id"
```

### Check Database
```sql
SELECT ga_token, gsc_token FROM profiles WHERE id = 'user-id' LIMIT 1;
```

### Check Token Validity
```bash
curl "https://www.googleapis.com/analytics/v1/accounts" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "Missing userId" error | Pass userId in query parameter |
| "Invalid client ID" | Update NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local |
| "Redirect URI mismatch" | Add exact URI to Google Cloud Console |
| "Token not saving" | Check SUPABASE_SERVICE_ROLE_KEY |
| Settings shows "Not connected" | Refresh page, check database |

---

## Next Steps

1. ✅ Settings shows unified connection
2. 🔄 Add disconnect button (optional)
3. 🔄 Use tokens for GA4 API calls (separate work)
4. 🔄 Use tokens for GSC API calls (separate work)
5. 🔄 Add token refresh logic (future)

---

## Files to Review

1. **Setup**: Read `SETUP_CHECKLIST.md`
2. **Architecture**: Read `COMPLETE_OAUTH_GUIDE.md`
3. **Code**: Check `app/api/google/*` routes
4. **UI**: Check `app/dashboard/settings/page.tsx`

---

## Support Docs

- 📋 `SETUP_CHECKLIST.md` - Step-by-step setup
- 📖 `COMPLETE_OAUTH_GUIDE.md` - Full documentation
- 📝 `IMPLEMENTATION_SUMMARY.md` - What changed
- 🚀 This file - Quick reference
