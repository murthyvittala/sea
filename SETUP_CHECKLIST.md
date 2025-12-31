# Setup Checklist for Unified Google OAuth

## 1. Environment Setup

- [ ] Add to `.env.local`:
  ```env
  NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
  GOOGLE_CLIENT_SECRET=your_client_secret
  NEXT_PUBLIC_SITE_URL=http://localhost:3000
  ```

## 2. Google Cloud Console

- [ ] Go to [Google Cloud Console](https://console.cloud.google.com)
- [ ] Create or select project
- [ ] Enable APIs:
  - [ ] Google Analytics API
  - [ ] Google Search Console API
- [ ] Create OAuth 2.0 Web Application credentials
- [ ] Add Authorized JavaScript origins:
  - [ ] `http://localhost:3000` (development)
  - [ ] `https://yourdomain.com` (production)
- [ ] Add Authorized Redirect URIs:
  - [ ] `http://localhost:3000/api/google/callback` (development)
  - [ ] `https://yourdomain.com/api/google/callback` (production)
- [ ] Copy Client ID and Secret to `.env.local`

## 3. Code Structure Verification

- [ ] Check new files exist:
  - [ ] `app/api/google/authorize/route.ts`
  - [ ] `app/api/google/callback/route.ts`
- [ ] Check updated files:
  - [ ] `app/dashboard/settings/page.tsx`
- [ ] Old routes still exist (can be removed later):
  - [ ] `app/api/ga/authorize/route.ts`
  - [ ] `app/api/ga/callback/route.ts`
  - [ ] `app/api/gsc/authorize/route.ts`
  - [ ] `app/api/gsc/callback/route.ts`

## 4. Database Verification

- [ ] Verify `profiles` table has:
  - [ ] `ga_token` field (text or jsonb)
  - [ ] `gsc_token` field (text or jsonb)
- [ ] Fields should be nullable/optional

## 5. Local Testing

```bash
cd c:\xampp8.2\htdocs\sea
npm run dev
```

- [ ] Navigate to http://localhost:3000/dashboard/settings
- [ ] Scroll to "Google Integrations" section
- [ ] Click "Connect" button
- [ ] Verify redirects to Google login
- [ ] Complete OAuth flow
- [ ] Verify redirects back to dashboard
- [ ] Check Settings page shows "✓ Connected"
- [ ] Open browser DevTools Console - verify no errors

## 6. Database Verification

- [ ] Open Supabase dashboard
- [ ] Go to SQL Editor
- [ ] Run query:
  ```sql
  SELECT ga_token, gsc_token FROM profiles 
  WHERE id = 'your_user_id' LIMIT 1
  ```
- [ ] Verify both fields contain token data

## 7. Disconnect Feature (Optional)

If you want a disconnect button later, it would:
- Clear both `ga_token` and `gsc_token`
- Revoke the token with Google

## Troubleshooting

### "Invalid Client ID"
- Verify `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is correct
- Verify Client ID matches Google Cloud Console

### "Redirect URI mismatch"
- Verify exact redirect URI in Google Cloud Console: `http://localhost:3000/api/google/callback`
- Check URL doesn't have trailing slash or different protocol

### "Failed to exchange code"
- Verify `GOOGLE_CLIENT_SECRET` is correct
- Verify `NEXT_PUBLIC_SITE_URL` matches environment

### "Token not saving to database"
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Verify database credentials in `.env.local`
- Check browser console for API errors

### Page doesn't show "✓ Connected"
- Check browser console for JavaScript errors
- Verify profile loads correctly
- Verify both `ga_token` and `gsc_token` have data in database

## Commands

Start development server:
```powershell
cd c:\xampp8.2\htdocs\sea
npm run dev
```

Build for production:
```powershell
npm run build
```

Run tests:
```powershell
npm test
```
