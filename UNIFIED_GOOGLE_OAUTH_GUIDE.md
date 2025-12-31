# Unified Google OAuth Integration Setup

## Overview

✅ **Unified OAuth Flow** - Single "Connect" button initiates Google OAuth consent for both GA4 and GSC
✅ **Same Token** - Both `ga_token` and `gsc_token` fields store the same token data (same access token works for both scopes)
✅ **Consolidated Routes** - Uses new `/api/google/*` routes instead of separate `/api/ga/*` and `/api/gsc/*`
✅ **Single Click Setup** - Users only need one Google authorization instead of two

## File Changes

### New Files Created

1. **`app/api/google/authorize/route.ts`** - Initiates OAuth with combined scopes
   - Requests GA4 read/write + GSC read scopes
   - Single OAuth consent screen for both services

2. **`app/api/google/callback/route.ts`** - Handles OAuth callback
   - Exchanges auth code for access token
   - Saves token to both `ga_token` and `gsc_token` fields

3. **`app/dashboard/settings/page.tsx`** - Updated settings UI
   - Single "Analytics & Search Console" connection section
   - Consolidated connect button
   - Shows connected status when both tokens exist

## Database Schema

The `profiles` table needs these fields (likely already present):

```sql
-- Both fields store the same token data
ga_token: jsonb or text  -- {access_token, refresh_token, expires_at, saved_at}
gsc_token: jsonb or text -- {access_token, refresh_token, expires_at, saved_at}
```

## OAuth Flow

```
User clicks "Connect"
    ↓
Redirects to /api/google/authorize?userId={userId}
    ↓
Google OAuth consent (requests GA4 + GSC scopes)
    ↓
User authorizes
    ↓
Redirects to /api/google/callback with authorization code
    ↓
Backend exchanges code for token
    ↓
Backend saves token to both ga_token and gsc_token
    ↓
Redirects to /dashboard?success=google_connected
```

## Environment Variables

Add to `.env.local`:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Google Cloud Console Configuration

### Authorized Redirect URIs

Add both:
- **Development**: `http://localhost:3000/api/google/callback`
- **Production**: `https://yourdomain.com/api/google/callback`

### Required APIs

Enable in Google Cloud:
1. Google Analytics API
2. Google Search Console API

### Scopes Requested

The OAuth flow requests these scopes in one consent:
- `https://www.googleapis.com/auth/analytics.readonly` (GA4 read)
- `https://www.googleapis.com/auth/analytics` (GA4 write)
- `https://www.googleapis.com/auth/webmasters.readonly` (GSC read)

## Benefits of This Approach

1. ✅ **Better UX** - One OAuth flow instead of two
2. ✅ **Single Token** - Same access token works for both services
3. ✅ **Simpler Code** - One unified API route vs separate routes
4. ✅ **Fewer Redirects** - Only one OAuth consent screen
5. ✅ **Maintained Fields** - Both `ga_token` and `gsc_token` updated (for backwards compatibility)

## Testing

1. Go to Settings page
2. Click "Connect" button
3. Authorize with Google account
4. Verify redirect back to dashboard with success message
5. Check Settings page shows "✓ Connected"
6. Verify database: both `ga_token` and `gsc_token` contain token data

## Next Steps

1. Add Google credentials to `.env.local`
2. Configure redirect URIs in Google Cloud Console
3. Test locally with `npm run dev`
4. Deploy to production with production URLs in Google Cloud Console
