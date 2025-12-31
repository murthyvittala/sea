# Google OAuth Setup Guide

## Step 1: Environment Variables

Update `.env.local` with:

```env
# ===== GOOGLE OAUTH =====
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Step 2: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable these APIs:
   - Google Analytics API
   - Google Search Console API

### For Local Development (http://localhost:3000)

**Authorized JavaScript Origins:**
```
http://localhost:3000
```

**Authorized Redirect URIs:**
```
http://localhost:3000/api/google/callback
```

### For Production (yourdomain.com)

**Authorized JavaScript Origins:**
```
https://yourdomain.com
```

**Authorized Redirect URIs:**
```
https://yourdomain.com/api/google/callback
```

## Step 3: How It Works

1. User clicks "Connect" button on settings page
2. Redirects to `/api/google/authorize?userId={userId}`
3. User is directed to Google OAuth consent screen with both GA4 and GSC scopes
4. After approval, redirects to `/api/google/callback` with authorization code
5. Backend exchanges code for access token + refresh token
6. Both `ga_token` and `gsc_token` fields in profiles table are updated with same token data
7. Redirect back to dashboard with success message

## Database Fields

The `profiles` table should have these fields:
- `ga_token` (text/jsonb) - Contains { access_token, refresh_token, expires_at, saved_at }
- `gsc_token` (text/jsonb) - Contains { access_token, refresh_token, expires_at, saved_at }

Both fields will have the same token data since they require the same OAuth consent flow.

## Scopes Requested

- `https://www.googleapis.com/auth/analytics.readonly` - GA4 read access
- `https://www.googleapis.com/auth/analytics` - GA4 write access
- `https://www.googleapis.com/auth/webmasters.readonly` - GSC read access
