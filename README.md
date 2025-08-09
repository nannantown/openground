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
pnpm i
```
3) Run web
```
pnpm dev
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
- Vercel: set NITRO preset `vercel`, env `SUPABASE_URL`, `SUPABASE_ANON_KEY`.

API
- See `openapi.yaml`

