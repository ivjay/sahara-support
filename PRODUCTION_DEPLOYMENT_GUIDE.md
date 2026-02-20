# 🚀 Production Deployment Checklist

## ❌ **Critical Issues Preventing Production Chat/Notifications**

### 1. **Ollama Running on Localhost** ⚠️ BLOCKING ISSUE
**Problem:** `OLLAMA_BASE_URL=http://127.0.0.1:11434` only works on your local machine

**Solutions (Choose ONE):**

#### **Option A: Use Ollama Cloud (Recommended for Quick Deploy)**
```env
# In your production environment variables:
OLLAMA_BASE_URL=https://api.ollama.com
OLLAMA_API_KEY=your-ollama-cloud-api-key
OLLAMA_MODEL=llama3.2:latest
```

**Steps:**
1. Sign up at https://ollama.com/cloud
2. Get your API key
3. Add to Vercel/production env vars

#### **Option B: Host Ollama on a Server**
Deploy Ollama to a cloud server (DigitalOcean, AWS, Railway, etc.):

```bash
# On your cloud server:
curl -fsSL https://ollama.com/install.sh | sh
ollama serve
ollama pull llama3.2:latest
```

Then set:
```env
OLLAMA_BASE_URL=https://your-server-ip:11434
```

#### **Option C: Switch to Gemini (Already Configured)**
You already have Gemini API configured! This might be the fastest fix.

**In `lib/integrations/ollama-service.ts`:**
```typescript
// Change from Ollama to Gemini for production
const USE_GEMINI = process.env.NODE_ENV === 'production';
```

### 2. **Database Not Seeded in Production** ⚠️
**Problem:** Your production Supabase probably has no services loaded

**Fix:**
1. Go to your Supabase dashboard: https://kdgjwndtwrjoqgvwxdds.supabase.co
2. Open **SQL Editor**
3. Copy **entire file**: `supabase/seed_all_services.sql`
4. Paste and click **RUN**
5. Verify: Visit `https://your-production-url.com/api/check-services`

### 3. **Database Migrations Not Run** ⚠️
**Check if these migrations exist in production:**

Run in Supabase SQL Editor:
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**If missing, run these migrations in order:**
1. `001_mvp_complete.sql`
2. `002_update_seat_layouts.sql`
3. `003_create_payments_table.sql`
4. `004_create_notifications_table.sql`
5. `005_add_hybrid_search.sql`
6. `007_create_venues.sql`

### 4. **Environment Variables Missing in Production**

**Required ENV vars for Vercel/Production:**

```env
# Supabase (CRITICAL)
NEXT_PUBLIC_SUPABASE_URL=https://kdgjwndtwrjoqgvwxdds.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE=postgresql://postgres:NOS@213SONA@db.kdgjwndtwrjoqgvwxdds.supabase.co:5432/postgres

# AI Model (CHOOSE ONE - Gemini is easiest)
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyB0iHv5MHSefm9PSuDwCAgiRjGrHLjHY0k
# OR
OLLAMA_BASE_URL=https://your-ollama-server.com
OLLAMA_API_KEY=your-key
OLLAMA_MODEL=llama3.2:latest

# Redis Cache (Optional but 60x faster)
REDIS_URL=redis://default:tdmRgHEeDQaW8OAAWFQ4bbLXTzstxqE7@redis-19549.crce179.ap-south-1-1.ec2.cloud.redislabs.com:19549

# Firebase (for auth)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAZgB_yge5u5gO_ky-pB2N8mXAlsNjGSf8
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=sahara-14ce5.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=sahara-14ce5
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=sahara-14ce5.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=527053568248
NEXT_PUBLIC_FIREBASE_APP_ID=1:527053568248:web:c0baa25023e1713b20230d
```

---

## 🔧 **Quick Fix for Production (5 minutes)**

### **Step 1: Switch to Gemini (You Already Have the Key)**

Create a new file or update the existing one:

**`lib/integrations/ollama-service.ts`** - Add this at the top:

```typescript
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const USE_GEMINI_FALLBACK = IS_PRODUCTION || !process.env.OLLAMA_BASE_URL?.includes('localhost');
```

Then in your chat functions, use Gemini when Ollama is unavailable.

### **Step 2: Add Environment Variables in Vercel**

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add ALL the variables from `.env.local` (except localhost URLs)
3. **Redeploy**

### **Step 3: Run Seed File in Production Database**

1. Supabase Dashboard → **SQL Editor**
2. Paste `supabase/seed_all_services.sql`
3. Click **RUN**

### **Step 4: Test Production**

Visit these URLs on production:
- `https://your-site.com/api/health` - Should return OK
- `https://your-site.com/api/check-services` - Should show 51 services
- `https://your-site.com/chat` - Chat should work

---

## 🐛 **Debugging Production Issues**

### **Check 1: API Routes Working?**
```bash
curl https://your-production-url.com/api/health
```
Should return: `{"status":"ok"}`

### **Check 2: Database Connected?**
```bash
curl https://your-production-url.com/api/check-services
```
Should return 51 services with details

### **Check 3: Notifications Table Exists?**
Run in Supabase SQL Editor:
```sql
SELECT COUNT(*) FROM notifications;
```
Should not error

### **Check 4: Environment Variables Set?**
In Vercel:
- Dashboard → Settings → Environment Variables
- Verify `NEXT_PUBLIC_SUPABASE_URL` is set
- Verify `NEXT_PUBLIC_GEMINI_API_KEY` is set

### **Check 5: Build Logs**
In Vercel:
- Go to **Deployments**
- Click latest deployment
- Check **Build Logs** for errors

---

## 📝 **Common Production Errors**

### Error: "Failed to fetch" in chat
**Cause:** Ollama URL is localhost
**Fix:** Use Gemini or host Ollama publicly

### Error: "No services found"
**Cause:** Seed file not run in production DB
**Fix:** Run `seed_all_services.sql` in Supabase SQL Editor

### Error: "Table notifications does not exist"
**Cause:** Migrations not run
**Fix:** Run all migration files in order

### Error: "Supabase client error"
**Cause:** Environment variables not set
**Fix:** Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel

---

## ✅ **Production Deployment Checklist**

- [ ] **Environment Variables Set in Vercel/Production**
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `NEXT_PUBLIC_GEMINI_API_KEY` (or Ollama cloud URL)
  - [ ] Firebase config (all 6 variables)
  - [ ] `REDIS_URL` (optional)

- [ ] **Database Setup Complete**
  - [ ] All migrations run in production Supabase
  - [ ] Seed file executed (51 services loaded)
  - [ ] Venues created (4 venues)
  - [ ] Notifications table exists

- [ ] **AI Model Configured**
  - [ ] Gemini API key working OR
  - [ ] Ollama hosted on public URL (not localhost)

- [ ] **Verification Tests Pass**
  - [ ] `/api/health` returns OK
  - [ ] `/api/check-services` shows 51 services
  - [ ] Chat sends/receives messages
  - [ ] Notifications appear

- [ ] **Redeployed After Changes**
  - [ ] Triggered new build in Vercel
  - [ ] Build completed successfully
  - [ ] No errors in build logs

---

## 🎯 **Recommended Quick Solution**

Since you already have **Gemini API key**, the fastest path to production:

1. **Verify Gemini is enabled** (it should be by default based on your code)
2. **Add env vars to Vercel**
3. **Run seed file in Supabase**
4. **Redeploy**

Total time: **~5 minutes**

Let me know which approach you want to take and I can help implement it!
