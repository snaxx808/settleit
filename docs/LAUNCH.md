# 🚀 SettleIt — Launch Guide

Everything you need to go from prototype to live app in a weekend.

---

## What you're deploying

| Layer | Tool | Cost |
|---|---|---|
| Frontend | Vercel | Free |
| Database + Auth | Supabase | Free up to 500MB |
| AI proxy | Vercel serverless | Free (100k req/mo) |
| Domain (optional) | Namecheap / Cloudflare | ~$10/yr |

---

## Step 1 — Supabase (Database + Auth)

1. Go to **https://supabase.com** → New Project
2. Name it `settleit`, pick a region close to your users
3. Save the **database password** somewhere safe
4. Once created, go to **SQL Editor**
5. Paste the entire contents of `schema.sql` and click **Run**
6. Go to **Settings → API**
7. Copy:
   - `Project URL` → this is your `SUPABASE_URL`
   - `anon public` key → this is your `SUPABASE_ANON_KEY`

### Enable Google Auth (optional but recommended)
1. Supabase → Authentication → Providers → Google → Enable
2. Add your Google OAuth client ID + secret
3. Add `https://yourapp.vercel.app` to allowed redirect URLs

### Enable Storage (for photo/video uploads)
1. Supabase → Storage → New bucket
2. Name: `media`, Public: ✅
3. Add policy: `Allow authenticated uploads`

---

## Step 2 — Vercel (Frontend + API)

1. Go to **https://vercel.com** → New Project
2. Import your GitHub repo (push your code there first)
   ```bash
   git init
   git add .
   git commit -m "SettleIt launch"
   git remote add origin https://github.com/yourusername/settleit.git
   git push -u origin main
   ```
3. Vercel will auto-detect your framework
4. Add **Environment Variables** in Vercel dashboard:
   ```
   ANTHROPIC_API_KEY=sk-ant-...your key...
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your anon key...
   ```
5. Deploy → Your app is live at `yourproject.vercel.app`

---

## Step 3 — Wire the frontend to the backend

In `settleit.jsx`, replace the direct `fetch` to Anthropic with the proxy:

**Before (direct — exposes key):**
```js
const r = await fetch("https://api.anthropic.com/v1/messages", { ... });
```

**After (proxy — key stays server-side):**
```js
import { callAI, callAIJson } from './supabase/client.js';
// Replace callClaude() with callAI()
// Replace jsonCall() with callAIJson()
```

Replace the data layer:
```js
// Replace useState(INITIAL_DISPUTES) with:
import { getDisputes } from './supabase/client.js';
const [disputes, setDisputes] = useState([]);
useEffect(() => {
  getDisputes({ filter: 'hot' }).then(setDisputes);
}, []);
```

---

## Step 4 — Add Auth UI

Add a simple auth screen before the app loads:

```jsx
import { signIn, signUp, onAuthChange } from './supabase/client.js';

// In App component:
const [user, setUser] = useState(null);
const [authLoading, setAuthLoading] = useState(true);

useEffect(() => {
  const { data: { subscription } } = onAuthChange(u => {
    setUser(u);
    setAuthLoading(false);
  });
  return () => subscription.unsubscribe();
}, []);

if (authLoading) return <LoadingScreen />;
if (!user) return <AuthScreen onSignIn={signIn} onSignUp={signUp} />;
```

---

## Step 5 — Custom Domain (optional)

1. Buy domain at **https://namecheap.com** (~$10/yr)
2. In Vercel → your project → Settings → Domains
3. Add your domain → follow DNS instructions
4. Done — usually live within 5 minutes

---

## Step 6 — Launch checklist

- [ ] Schema deployed to Supabase
- [ ] Environment variables set in Vercel
- [ ] App deploys without errors
- [ ] Sign up works (creates profile row)
- [ ] Voting works (creates vote row, increments count)
- [ ] AI settle works (calls `/api/claude`, returns verdict)
- [ ] Photos upload to Supabase Storage
- [ ] Notifications appear in real-time
- [ ] Test on mobile (iOS + Android)

---

## Ongoing costs at scale

| Users | Supabase | Vercel | Total/mo |
|---|---|---|---|
| 0–500 | Free | Free | $0 |
| 500–5k | Free | Free | $0 |
| 5k–50k | ~$25 | ~$20 | ~$45 |
| 50k–500k | ~$200 | ~$100 | ~$300 |

The AI costs (Anthropic) are the main variable. At $3/M input tokens:
- Each verdict/settle: ~$0.001
- 10,000 verdicts/day: ~$10/day

---

## Monetization (when you're ready)

The sponsored dispute format is already built. To activate:

1. Create a `sponsored_disputes` table in Supabase
2. Brands submit a dispute + budget via a simple form
3. Insert into the table with `is_sponsored = true`
4. Frontend already shows the sponsored card in the feed

**Rate card idea:**
- $500 for 48hr sponsored dispute (reaches all users)
- $1,500 for featured placement + AI verdict included
- $5,000 for a "sponsored week" with multiple disputes

At 50k users and 5 sponsors/month = **$7,500/month** without subscription friction.

---

## Useful links

- Supabase docs: https://supabase.com/docs
- Vercel docs: https://vercel.com/docs
- Anthropic API: https://docs.anthropic.com
- Supabase Realtime: https://supabase.com/docs/guides/realtime

---

*Built with Claude · SettleIt © 2026*
