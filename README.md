Open Ground (Nuxt 4 + Supabase)

Requirements
- Node 20+
- Supabase CLI

Setup
1) Copy env
```
cp env.example .env
```
2) Install
```
npm i --legacy-peer-deps
```
3) Run web
```
npm run dev -- --host
```

Supabase
- Apply SQL
```
supabase db push
```
- Deploy functions
```
supabase functions deploy on_new_listing on_new_message stripe_webhook cleanup_expired
```

Deploy
- Vercel: Nitro preset is already `vercel`. Set Environment Variables (Production/Preview):
  - `NUXT_PUBLIC_SUPABASE_URL`
  - `NUXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_URL` (same as public url)
  - `SUPABASE_ANON_KEY` (same as public key)
  - `SUPABASE_SERVICE_ROLE_KEY` (server only)
  - `ADMIN_EMAILS` (comma-separated emails)
  - `STRIPE_SECRET` (optional for future payments)

After successful build, follow the provided `npx vercel deploy --prebuilt` instruction or connect repo on Vercel.

API
- See `openapi.yaml`

