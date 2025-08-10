# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Open Ground is a marketplace application built with Nuxt 4 and Supabase. It allows users to create listings, browse items, and communicate through a chat system. The application includes user authentication, geospatial search, and admin functionality.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server
- `npm run dev -- --host` - Start development server with host access (recommended)
- `npm run build` - Build for production
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix

### Setup Commands
- `cp env.example .env` - Copy environment file
- `npm i --legacy-peer-deps` - Install dependencies (requires legacy peer deps)
- `supabase db push` - Apply database migrations
- `supabase functions deploy on_new_listing on_new_message stripe_webhook cleanup_expired` - Deploy Supabase functions

### Testing
- No specific test commands are configured in package.json
- Use `npm run typecheck` for type validation

## Architecture

### Tech Stack
- **Frontend**: Nuxt 4 with Vue 3, TypeScript strict mode
- **Backend**: Nitro server with Vercel preset
- **Database**: PostgreSQL with PostGIS via Supabase
- **Authentication**: Supabase Auth with OTP and OAuth (Google, Apple)
- **State Management**: Pinia store
- **Styling**: Tailwind CSS (via @nuxt/image module)
- **Data Fetching**: TanStack Vue Query
- **Validation**: Zod schemas

### Key Directories
- `pages/` - File-based routing (Nuxt convention)
- `composables/` - Vue composables for reusable logic
- `server/routes/` - Server-side API routes
- `shared/` - Shared types and validation schemas
- `supabase/` - Database migrations and edge functions
- `layouts/` - Application layouts

### Core Entities
- **User**: Authentication and profile data
- **Listing**: Marketplace items with geolocation, pricing, and status
- **Thread**: Chat conversations between users
- **Message**: Individual chat messages with image support

### Authentication Flow
- Uses Supabase Auth with redirect disabled
- Pages handle auth gating explicitly
- OTP email authentication and OAuth providers supported
- Server-side user session handling in `server/utils/supabase.ts`

### Database Schema
- PostGIS enabled for geospatial queries
- Generated geography columns for location-based search
- JSONB fields for arrays (images, read_by)
- UUID primary keys throughout
- Auto-generated expiry dates for listings (30 days)

### API Structure
- RESTful API under `/v1/` prefix with CORS enabled
- Server routes in `server/routes/v1/` for public API
- Admin routes in `server/routes/api/admin/`
- OpenAPI specification in `openapi.yaml`

### Route Rules and Caching
- Home page: 60s SWR cache
- Listing pages: 300s SWR cache
- Admin and auth routes excluded from global auth redirects

## Code Conventions

### TypeScript
- Strict mode enabled with `typeCheck: true`
- Consistent type imports enforced via ESLint
- Unused variables must start with `_`
- Vue 3.5 target with strict templates

### ESLint Configuration
- Vue 3 recommended rules
- TypeScript recommended rules  
- Prettier integration
- Multi-word component names disabled for pages

### File Naming
- Vue pages use kebab-case with brackets for dynamic routes
- TypeScript files use camelCase
- Server routes follow REST conventions

### Import Patterns
- Use `#imports` for Nuxt auto-imports
- Prefer `type` imports for TypeScript types
- Server utilities imported from `~/server/utils/`

## Environment Variables

### Required for Development
- `NUXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NUXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Server-side Supabase key
- `ADMIN_EMAILS` - Comma-separated admin emails

### Optional
- `STRIPE_SECRET` - For future payment features

## Database Operations

### Supabase CLI Commands
- `supabase db push` - Apply local migrations to remote
- `supabase functions deploy [function-names]` - Deploy edge functions
- `supabase status` - Check local development status

### Key Functions
- `on_new_listing` - Triggered when listings are created
- `on_new_message` - Triggered when messages are sent
- `stripe_webhook` - Handle Stripe payment webhooks
- `cleanup_expired` - Remove expired listings

## Common Patterns

### Server-side Authentication
```typescript
const user = await getSupabaseUser(event)
if (!user) throw createError({ statusCode: 401 })
```

### Client-side Authentication
```typescript
const { user } = useAuth()
// user is reactive and null when not authenticated
```

### API Error Handling
Use `createError()` from H3 for consistent error responses with proper status codes.

### Validation
All API inputs should be validated using Zod schemas from `shared/validation.ts`.