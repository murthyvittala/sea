# Unified Google OAuth Integration - Complete Documentation

## Executive Summary

✅ **Single unified OAuth flow** combines GA4 and GSC authentication into one step
✅ **One connect button** initiates Google OAuth with both scopes
✅ **Shared token** - same access token works for both GA4 and Search Console APIs
✅ **Better UX** - users don't need to authorize twice
✅ **Backwards compatible** - both `ga_token` and `gsc_token` fields are updated

---

## Architecture

### Before (Separate OAuth)
```
Settings Page
├── "Connect GA" button → /api/ga/authorize → OAuth → /api/ga/callback → Save ga_token
└── "Connect GSC" button → /api/gsc/authorize → OAuth → /api/gsc/callback → Save gsc_token
```

### After (Unified OAuth)
```
Settings Page
└── "Connect" button → /api/google/authorize → OAuth (both scopes) → /api/google/callback → Save ga_token + gsc_token
```

---

## File Structure

### New Files Created

#### `app/api/google/authorize/route.ts`
- **Purpose**: Initiates OAuth flow
- **Scopes Requested**:
  - `https://www.googleapis.com/auth/analytics.readonly` (GA4 read)
  - `https://www.googleapis.com/auth/analytics` (GA4 write)
  - `https://www.googleapis.com/auth/webmasters.readonly` (GSC read)
- **Returns**: OAuth URL for user to click

#### `app/api/google/callback/route.ts`
- **Purpose**: Handles OAuth callback after user authorizes
- **Flow**:
  1. Receives authorization code from Google
  2. Exchanges code for access token
  3. Creates token data object with expiry
  4. Saves to both `ga_token` and `gsc_token` fields
  5. Redirects to dashboard with success message

### Modified Files

#### `app/dashboard/settings/page.tsx`
- **Changes**:
  - Added `ga_token` and `gsc_token` back to UserProfile interface
  - Created `handleConnectGoogle()` function
  - Unified "Google Integrations" section
  - Single connect button with combined status check

---

## Database Schema

The `profiles` table should have these fields:

```sql
-- Existing fields (keep as is)
CREATE TABLE profiles (
  id uuid PRIMARY KEY,
  plan varchar,
  role varchar,
  openai_api_key text,
  website_url text,
  sitemap_url text,
  
  -- Google OAuth fields
  ga_token text,           -- Store as JSON string
  gsc_token text,          -- Store as JSON string
  
  created_at timestamp,
  updated_at timestamp
);
```

### Token Data Structure

Both fields store identical JSON:

```json
{
  "access_token": "ya29.a0AfH6SMB...",
  "refresh_token": "1//0gexample...",
  "expires_at": "2025-12-01T00:00:00.000Z",
  "saved_at": "2025-11-30T23:00:00.000Z"
}
```

---

## Environment Setup

### `.env.local`

```env
# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_xxxxxxxxxxxx

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Google Cloud Console Configuration

### Step 1: Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select or create a project
3. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
4. Choose **Web application**

### Step 2: Configure for Development

**Authorized JavaScript Origins:**
```
http://localhost:3000
```

**Authorized Redirect URIs:**
```
http://localhost:3000/api/google/callback
```

### Step 3: Configure for Production

**Authorized JavaScript Origins:**
```
https://yourdomain.com
```

**Authorized Redirect URIs:**
```
https://yourdomain.com/api/google/callback
```

### Step 4: Enable Required APIs

Go to **APIs & Services** → **Enabled APIs & services**

Enable:
1. ✅ Google Analytics API
2. ✅ Google Search Console API

### Step 5: Copy Credentials

Copy `Client ID` and `Client Secret` to `.env.local`

---

## OAuth Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ User on Settings Page                                       │
│ Clicks "Connect" Button                                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────┐
        │ handleConnectGoogle()               │
        │ - Calls /api/google/authorize      │
        │ - Gets OAuth URL                   │
        │ - Redirects user to Google         │
        └────────────────┬───────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────┐
        │ Google OAuth Consent Screen         │
        │ Shows:                              │
        │ - View Analytics data              │
        │ - View Search Console data         │
        │ User clicks "Allow"                │
        └────────────────┬───────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────┐
        │ /api/google/callback               │
        │ 1. Receives authorization code     │
        │ 2. Exchanges for access token      │
        │ 3. Creates token object            │
        │ 4. Saves to ga_token + gsc_token   │
        │ 5. Redirects to dashboard          │
        └────────────────┬───────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────┐
        │ Dashboard with Success Message     │
        │ "✅ Google connected!"              │
        └────────────────────────────────────┘
```

---

## Usage Examples

### In Your API Code (Future)

Once connected, use the token for API calls:

```typescript
// GA4 API Call
const gaResponse = await fetch('https://www.googleapis.com/analytics/v1/accounts', {
  headers: {
    'Authorization': `Bearer ${tokenData.access_token}`
  }
})

// GSC API Call (same token)
const gscResponse = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
  headers: {
    'Authorization': `Bearer ${tokenData.access_token}`
  }
})
```

### Check Connection Status

```typescript
// Both must be present for connected status
const isConnected = !!(profile?.ga_token && profile?.gsc_token)

if (isConnected) {
  // Token available for both GA4 and GSC
  // Safe to make API calls
}
```

---

## Testing Checklist

### Pre-Testing
- [ ] `.env.local` has Google credentials
- [ ] Google Cloud Console has redirect URI configured
- [ ] Database schema has `ga_token` and `gsc_token` fields

### Local Testing
```bash
npm run dev
# Navigate to http://localhost:3000/dashboard/settings
```

- [ ] Click "Connect" button
- [ ] Redirected to Google login
- [ ] Google shows both GA4 and GSC scopes
- [ ] User authorizes
- [ ] Redirected back to dashboard
- [ ] Settings page shows "✓ Connected"
- [ ] Dashboard shows success message

### Database Verification

```sql
-- Check tokens saved
SELECT id, ga_token, gsc_token FROM profiles 
WHERE id = 'your_user_id' LIMIT 1

-- Verify both have data
-- Should show JSON with access_token, refresh_token, etc.
```

### API Testing

```typescript
// Verify token works
const token = JSON.parse(profile.ga_token)
const response = await fetch('https://www.googleapis.com/analytics/v1/accounts', {
  headers: { 'Authorization': `Bearer ${token.access_token}` }
})
// Should return 200 with data, not 401 Unauthorized
```

---

## Troubleshooting

### Issue: "Invalid client ID"
**Solution**: 
- Verify `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in `.env.local`
- Verify it matches Google Cloud Console exactly

### Issue: "Redirect URI mismatch"
**Solution**:
- Verify exact URI in Google Cloud Console: `http://localhost:3000/api/google/callback`
- No trailing slashes
- Must use `http://` for localhost, `https://` for production

### Issue: "Failed to exchange code"
**Solution**:
- Verify `GOOGLE_CLIENT_SECRET` is correct
- Verify `NEXT_PUBLIC_SITE_URL` matches environment
- Check Google Cloud Console credentials are still valid

### Issue: Token not saving
**Solution**:
- Verify `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
- Check database connection
- Look at browser console for API errors

### Issue: Settings page shows "Not connected" after authorization
**Solution**:
- Verify page loaded with fresh profile data
- Check database to confirm both fields have data
- Try refreshing the page
- Check browser console for JavaScript errors

---

## Security Notes

1. **Access Token**: Stored in database - used to make API calls
2. **Refresh Token**: Stored in database - used to get new access token when expired
3. **Service Role Key**: Only used server-side to save tokens
4. **No tokens in localStorage**: Tokens stored securely in database only

---

## Migration from Separate Routes

### Option 1: Keep Both (Recommended for now)
- Keep old `/api/ga/*` and `/api/gsc/*` routes active
- New unified routes take precedence
- Users can gradually migrate

### Option 2: Remove Old Routes (Future)
When all users have used new flow:
```bash
rm -r app/api/ga
rm -r app/api/gsc
```

---

## Future Enhancements

### Disconnect Feature
```typescript
// Allow users to disconnect
const handleDisconnect = async () => {
  await fetch('/api/google/disconnect', {
    method: 'POST',
    body: JSON.stringify({ userId: profile.id })
  })
  // Clears both ga_token and gsc_token
}
```

### Token Refresh
```typescript
// Refresh token when expired
if (new Date() > new Date(token.expires_at)) {
  // Use refresh_token to get new access_token
}
```

### Scope Management
```typescript
// Allow selective scopes later
// "Connect Analytics Only" vs "Connect Analytics & Search Console"
```

---

## Support

For issues or questions:
1. Check `SETUP_CHECKLIST.md` for step-by-step setup
2. Review `IMPLEMENTATION_SUMMARY.md` for architecture
3. Check Supabase logs for database errors
4. Check browser DevTools Console for client errors
5. Check Next.js terminal for server errors
