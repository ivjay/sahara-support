# 🔒 Security Fix - GitGuardian Alert

## ⚠️ Redis Credentials Exposed

GitGuardian detected your Redis URL in the repository. Here's how to fix it:

---

## 🚨 **Immediate Actions Required**

### Step 1: Rotate Redis Credentials **RIGHT NOW**

Your current Redis URL is exposed:
```
redis://default:tdmRgHEeDQaW8OAAWFQ4bbLXTzstxqE7@redis-19549.crce179.ap-south-1-1.ec2.cloud.redislabs.com:19549
```

**Action:**
1. Go to Redis Labs dashboard: https://app.redislabs.com
2. Navigate to your database
3. Click "Configuration" → "Security"
4. Click "Regenerate Password" or create a new database
5. Copy the new connection URL

### Step 2: Remove Exposed Credentials from Git History

Even though `.env.local` is in `.gitignore`, if it was ever committed, it's in git history.

**Check if it's in history:**
```bash
git log --all --full-history -- .env.local
```

**If found, remove from history:**
```bash
# Install git-filter-repo (safer than git filter-branch)
pip install git-filter-repo

# Remove .env.local from entire git history
git filter-repo --path .env.local --invert-paths

# Force push (WARNING: Only if you haven't shared this repo)
git push origin --force --all
```

**Alternatively, if the repo is already public:**
Just create a new Redis database with new credentials and update your env vars.

### Step 3: Update Environment Variables

**In `.env.local` (Local Development):**
```env
REDIS_URL=redis://default:YOUR_NEW_PASSWORD@redis-19549...
```

**In Vercel/Production:**
1. Go to Vercel Dashboard
2. Settings → Environment Variables
3. Update `REDIS_URL` with new credentials
4. Redeploy

### Step 4: Create .env.example (Safe to commit)

This helps other developers without exposing secrets:

```env
# .env.example
# Copy this to .env.local and fill in your actual values

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
DATABASE=postgresql://user:password@host:5432/database

# Redis (Optional - for caching)
REDIS_URL=redis://user:password@host:port

# AI Models (Choose one)
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key_here
# OR
OLLAMA_BASE_URL=https://your-ollama-server.com
OLLAMA_API_KEY=your_key_here
OLLAMA_MODEL=llama3.2:latest

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

---

## 🛡️ **Prevention - Never Commit Secrets Again**

### Option 1: Pre-commit Hook (Recommended)

Install `git-secrets`:
```bash
# Install
brew install git-secrets  # macOS
# or
git clone https://github.com/awslabs/git-secrets.git && cd git-secrets && make install  # Linux/Windows

# Setup
cd your-project
git secrets --install
git secrets --register-aws  # Detects AWS keys
git secrets --add 'redis://.*@.*'  # Detects Redis URLs
git secrets --add 'postgresql://.*@.*'  # Detects DB URLs
git secrets --add 'sk-[a-zA-Z0-9]{48}'  # Detects API keys
```

Now git will block commits with secrets!

### Option 2: Use Environment Variable Validation

Add this to your project:

**`lib/env-validator.ts`:**
```typescript
const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    // Add more as needed
];

export function validateEnv() {
    const missing: string[] = [];

    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            missing.push(envVar);
        }
    }

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}
```

Call it in `app/layout.tsx`:
```typescript
import { validateEnv } from '@/lib/env-validator';

if (process.env.NODE_ENV === 'production') {
    validateEnv();
}
```

---

## 📋 **GitGuardian Resolution Checklist**

- [ ] **Rotated Redis credentials** (new password/database)
- [ ] **Updated `.env.local`** with new Redis URL
- [ ] **Updated Vercel env vars** with new Redis URL
- [ ] **Removed from git history** (if committed)
- [ ] **Created `.env.example`** (safe template)
- [ ] **Installed git-secrets** (prevent future leaks)
- [ ] **Redeployed production** with new credentials
- [ ] **Marked GitGuardian alert as resolved**

---

## 🔍 **Verify No More Secrets in Repo**

```bash
# Search for potential secrets in tracked files
git grep -E 'redis://|postgresql://|sk-[a-zA-Z0-9]' -- ':!*.md' ':!SECURITY_FIX.md'

# Should return empty (or only .env.example with placeholders)
```

---

## ⚡ **Quick Fix (30 seconds)**

If you just want to fix it fast:

1. **Go to Redis Labs** → Create new database → Copy new URL
2. **Update Vercel** → Settings → Environment Variables → Update `REDIS_URL`
3. **Redeploy** → Deployments → Redeploy
4. **Mark resolved** in GitGuardian

Done! Old credentials are useless now.

---

## 📝 **What GitGuardian Found**

GitGuardian scans your repository for:
- API keys (OpenAI, Gemini, etc.)
- Database connection strings (PostgreSQL, MongoDB)
- Redis URLs
- Private keys (.pem files)
- OAuth tokens

**Why it's dangerous:**
- Anyone can use your Redis instance
- Could run up your bill
- Could access cached data
- Could DoS your service

**How to respond:**
1. Rotate credentials immediately
2. Remove from history
3. Mark as resolved in GitGuardian
4. Set up prevention tools

---

## ✅ **After Fix**

Your secrets are safe when:
- ✅ `.env.local` is in `.gitignore` (already done)
- ✅ No secrets in git history
- ✅ No secrets in code files
- ✅ Pre-commit hooks prevent future commits
- ✅ Vercel has production env vars set
- ✅ Old credentials rotated/invalidated

**Test that it works:**
```bash
# Verify Redis works with new URL
curl https://your-production-url.com/api/health
# Should return: {"status":"ok"}
```

---

Need help with any of these steps? Let me know!
