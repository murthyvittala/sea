# Implementation Summary - Unified Google OAuth

## What Changed

### ✅ New Unified Routes
- `app/api/google/authorize/route.ts` - Single OAuth authorization endpoint
- `app/api/google/callback/route.ts` - Unified callback handler

### ✅ Updated Settings Page
- `app/dashboard/settings/page.tsx` 
  - Single "Analytics & Search Console" section
  - One connect button initiates combined OAuth flow
  - Shows connection status for both GA4 and GSC

### ✅ Old Routes (Still Active - Keep for Now)
- `app/api/ga/*` - Can be deprecated later
- `app/api/gsc/*` - Can be deprecated later

## How It Works

### Before (Separate OAuth Flows)
```
Click GA Connect → OAuth → Save ga_token
Click GSC Connect → OAuth → Save gsc_token
(2 OAuth flows, 2 screens, 2 clicks)
```

### After (Unified OAuth Flow)
```
Click Connect → OAuth (requests both GA4 + GSC scopes) → Save ga_token + gsc_token
(1 OAuth flow, 1 screen, 1 click)
```

## Database Changes

Both fields get the same token:

```json
{
  "ga_token": {
    "access_token": "ya29.a0AfH6SMB...",
    "refresh_token": "1//0g...",
    "expires_at": "2025-11-30T12:34:56.789Z",
    "saved_at": "2025-11-30T11:34:56.789Z"
  },
  "gsc_token": {
    "access_token": "ya29.a0AfH6SMB...",
    "refresh_token": "1//0g...",
    "expires_at": "2025-11-30T12:34:56.789Z",
    "saved_at": "2025-11-30T11:34:56.789Z"
  }
}
```

Same token works for both GA4 and GSC scopes.

## Required Environment Variables

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Testing Checklist

- [ ] Add Google credentials to `.env.local`
- [ ] Configure `/api/google/callback` in Google Cloud Console
- [ ] Run `npm run dev`
- [ ] Go to Settings page
- [ ] Click "Connect" button
- [ ] Complete Google OAuth flow
- [ ] Verify redirects back to dashboard
- [ ] Verify Settings page shows "✓ Connected"
- [ ] Check Supabase DB for token in both `ga_token` and `gsc_token`

## User Experience Flow

1. User goes to Settings → Google Integrations
2. Clicks "Connect" button
3. Redirected to Google login/consent screen
4. Screen shows:
   - "View and manage your Google Analytics data"
   - "View your Google Search Console data"
5. User clicks "Allow"
6. Redirected back to dashboard with success message
7. Settings page now shows "✓ Connected"
8. App can now use GA4 and GSC APIs with the same token

## API Implementation Notes

- Single OAuth consent screen combines both GA4 + GSC scopes
- Google returns one access token valid for both scopes
- Token saved to both `ga_token` and `gsc_token` fields
- When making API calls, use the same token for both GA4 and GSC requests
- Refresh token stored for token renewal when expired

## Next Phase (Optional Future Improvements)

- Add disconnect button to remove connection
- Add token refresh logic
- Add scope-specific error handling
- Add individual connect/disconnect for GA4 and GSC if needed
