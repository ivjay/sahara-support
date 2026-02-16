# Production Fixes - Deployment Guide

## 🐛 Issues Fixed

### 1. **Bookings Not Confirmed in Production**
**Problem:** File-based storage (`data/bookings.json`) doesn't work on Vercel/Netlify (read-only filesystem)

**Solution:**
- Modified `/api/bookings` to use **Supabase first**, fall back to file DB
- Both POST (create) and GET (fetch) endpoints now production-compatible
- Bookings now persist in Supabase `bookings` table

### 2. **Doctors/Services Not Showing in Chat**
**Problem:**
- `option-helper.ts` was reloading ALL mock data instead of using filtered services
- Admin-added services were getting overwritten or diluted

**Solution:**
- Fixed `getOptionsByType()` to trust the `allServices` parameter
- Added comprehensive logging to diagnose issues
- Increased Supabase timeout from 2s to 5s

### 3. **Specialty Keywords Missing**
**Problem:** Safety net keywords missing for nephrologist, gynecologist, dentist, ENT, etc.

**Solution:**
- Added 10+ missing medical specialties to safety net
- Made safety net context-aware (checks last 3 messages)
- Now remembers if you mention "nephrologist" then type "doctor"

## 📋 Pre-Deployment Checklist

### Step 1: Verify Environment Variables in Production

Go to your hosting platform (Vercel/Netlify) and ensure these are set:

```bash
# Firebase (Required for Google Login)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAZgB_yge5u5gO_ky-pB2N8mXAlsNjGSf8
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=sahara-14ce5.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=sahara-14ce5
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=sahara-14ce5.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=527053568248
NEXT_PUBLIC_FIREBASE_APP_ID=1:527053568248:web:c0baa25023e1713b20230d

# Supabase (Required for Bookings & Services)
NEXT_PUBLIC_SUPABASE_URL=https://kdgjwndtwrjoqgvwxdds.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkZ2p3bmR0d3Jqb3Fndnd4ZGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDM4NTksImV4cCI6MjA4NjQ3OTg1OX0.y1yVwrHfOmOYmL2o5DlpyMuPz4tFPhBaAwJ8608Qg2w

# Ollama (Optional - only if you have deployed Ollama server)
# OLLAMA_BASE_URL=http://your-ollama-server:11434
# OLLAMA_MODEL=llama3.2:latest
```

### Step 2: Firebase Console - Add Production Domain

1. Go to: https://console.firebase.google.com
2. Select project: `sahara-14ce5`
3. Navigate to: **Authentication → Settings → Authorized domains**
4. Click **"Add domain"** and add:
   - Your Vercel domain: `your-app.vercel.app`
   - Your custom domain (if any): `yourdomain.com`

### Step 3: Google Cloud Console - Update Redirect URIs

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, add:
   ```
   https://sahara-14ce5.firebaseapp.com/__/auth/handler
   https://your-production-domain.com/__/auth/handler
   ```

### Step 4: Deploy

```bash
# Commit changes
git add .
git commit -m "Fix production issues: Supabase bookings, service filtering, specialty keywords"
git push origin main

# If using Vercel CLI
vercel --prod
```

## 🧪 Post-Deployment Testing

### Test 1: Health Check
Visit: `https://your-domain.com/api/health`

Expected response:
```json
{
  "status": "ok",
  "checks": {
    "supabase": {
      "configured": true,
      "connected": true
    },
    "firebase": {
      "configured": true
    }
  },
  "warnings": []
}
```

If you see warnings, fix those environment variables!

### Test 2: Google Login
1. Visit your production site
2. Click "Sign in with Google"
3. Should redirect to Google, then back to your site
4. Check if you're logged in

**Common Issue:** "auth/unauthorized-domain"
- **Fix:** Add your domain to Firebase Authorized Domains (Step 2)

### Test 3: Booking with "Pay at Counter"
1. Select a service
2. Choose date/time
3. Enter passenger details
4. Select **"Pay at Counter"**
5. Click "Confirm Reservation"

**Check console logs:**
```
[API] ✓ Booking created in Supabase: BK-XXXXX
```

If you see "File DB also failed", your Supabase env vars are missing!

### Test 4: Admin Services in Chat
1. Go to `/admin` and add a test doctor:
   - Name: "Dr. Test Cardiologist"
   - Specialty: "Cardiologist"
2. Go to `/chat` and type: "I want a heart doctor"
3. Should show your admin-added doctor

**Check console logs:**
```
[Chat] ✓ Fetched 1 admin services from Supabase
[Chat] ✓ Converted services: Dr. Test Cardiologist (appointment, category: doctor)
[OptionHelper] ✓ Returning 1 options: ["Dr. Test Cardiologist"]
```

### Test 5: Specialty Keywords
Try these queries:
- "I want a nephrologist" → Should show Dr. Pukar Chandra
- "kidney doctor" → Should show nephrologist
- "heart specialist" → Should show cardiologists
- "skin doctor" → Should show dermatologists

## 🚨 Troubleshooting

### Problem: Bookings still not working
**Check:**
1. Visit `/api/health` - is Supabase connected?
2. Check browser console for errors
3. Check Vercel/Netlify logs for backend errors
4. Verify Supabase `bookings` table exists

**Quick fix:**
```sql
-- Run this in Supabase SQL Editor if table is missing
CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    booking_type TEXT NOT NULL,
    booking_data JSONB,
    user_id UUID,
    total_price DECIMAL(10,2),
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Problem: Doctors not showing
**Check:**
1. Console logs: `[Chat] ✓ Fetched X admin services`
2. If X = 0, no services in Supabase
3. Add services from `/admin` panel
4. Verify `services` table in Supabase has data

### Problem: Google login fails
**Error:** "auth/unauthorized-domain"
**Fix:** Add production domain to Firebase Authorized Domains

**Error:** "auth/popup-closed-by-user"
**Fix:** Check Google Cloud Console redirect URIs

## 📊 Monitoring

After deployment, monitor these logs:

1. **Vercel/Netlify Function Logs:**
   - Look for `[API] ✓ Booking created in Supabase`
   - Look for `[Chat] ✓ Fetched X admin services`

2. **Browser Console:**
   - `[OptionHelper] ✓ Returning X options`
   - `[Agent] 🛡️ SAFETY NET: Forcing show_options for X request`

3. **Supabase Dashboard:**
   - Check `bookings` table for new entries
   - Check `services` table for admin-added services

## ✅ Success Criteria

You know it's working when:
- ✅ Health check returns no warnings
- ✅ Google login works on production domain
- ✅ Bookings with "Pay at Counter" create records in Supabase
- ✅ Admin-added doctors appear in chat
- ✅ Typing "nephrologist" shows Dr. Pukar Chandra
- ✅ Browser console shows successful service fetches

## 📞 Need Help?

If issues persist:
1. Check `/api/health` response
2. Share Vercel/Netlify logs
3. Share browser console logs when reproducing issue
4. Verify all environment variables are set correctly
