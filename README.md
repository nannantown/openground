# Open Ground

A modern classifieds platform built with Next.js 14, React, TypeScript, and Supabase.

## Features

- 🏗️ **Modern Stack**: Next.js 14 with App Router, React 18, TypeScript
- 🎨 **UI/UX**: Tailwind CSS + shadcn/ui components
- 🔐 **Authentication**: Supabase Auth (Email, OAuth)
- 💾 **Database**: PostgreSQL with Row Level Security (RLS)
- 📱 **Responsive**: Mobile-first design
- 🔍 **Search**: Full-text search with filters
- 💬 **Real-time Chat**: WebSocket messaging
- ❤️ **Favourites**: Save listings
- ⭐ **Reviews**: User rating system
- 🛡️ **Security**: Built-in spam protection and reporting
- 📊 **Testing**: Comprehensive E2E and unit tests
- ♿ **Accessibility**: WCAG 2.2 AA compliance

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Functions)
- **Testing**: Playwright (E2E), Vitest (Unit), axe-core (A11y)
- **Deployment**: Vercel
- **CI/CD**: GitHub Actions

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase CLI
- Git

## Getting Started

### 1. Clone and Install

```bash
git clone https://github.com/nannantown/openground.git
cd openground
npm install
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp env.example .env.local
```

Update `.env.local` with your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Admin Configuration  
ADMIN_EMAILS=admin@example.com,admin2@example.com

# Optional: Stripe (for future payment features)
STRIPE_SECRET_KEY=your_stripe_secret_key
```

### 3. Database Setup

Initialize the Supabase database:

```bash
# Apply database schema
supabase db push

# Deploy edge functions
supabase functions deploy on_new_listing on_new_message stripe_webhook cleanup_expired
```

### 4. Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run E2E tests
- `npm run test:a11y` - Run accessibility tests

## Testing

### Unit Tests (Vitest)

```bash
npm run test
npm run test:watch
npm run test:coverage
```

### E2E Tests (Playwright)

```bash
npm run test:e2e
npm run test:e2e:ui
```

### Accessibility Tests

```bash
npm run test:a11y
```

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_EMAILS`
   - `STRIPE_SECRET_KEY` (optional)

3. Deploy automatically on git push to main

### Manual Deployment

```bash
npm run build
npm run start
```

## Project Structure

```
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/            # API routes
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Home page
│   ├── components/         # React components
│   │   ├── ui/            # shadcn/ui components
│   │   └── ...            # Custom components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   └── shared/            # Shared types and validation
├── tests/                 # Test files
│   ├── e2e/              # Playwright E2E tests
│   └── unit/             # Vitest unit tests
├── supabase/             # Supabase configuration
│   ├── migrations/       # Database migrations
│   └── functions/        # Edge functions
└── requirements/         # Project requirements (YAML)
```

## API Documentation

The API follows RESTful conventions:

- `GET /api/v1/listings` - Search listings
- `POST /api/v1/listings` - Create listing
- `GET /api/v1/listings/:id` - Get listing details
- `POST /api/v1/favourites` - Add to favourites
- `POST /api/v1/threads` - Create chat thread
- `GET /api/v1/users/:id` - Get user profile

See `requirements/spec.yaml` for complete API specification.

## Database Schema

Key tables:
- `users` - User profiles and auth
- `listings` - Marketplace listings
- `threads` - Chat conversations
- `messages` - Chat messages
- `favourites` - Saved listings
- `reviews` - User ratings
- `reports` - Content moderation

## Features

### Authentication
- Email magic link sign-in
- OAuth (Google, GitHub)
- Protected routes and API endpoints

### Listings
- Create, edit, delete listings
- Image upload and management
- Search with filters (category, location, price)
- Auto-expiration after 30 days

### Messaging
- Real-time 1:1 chat
- Typing indicators
- Message history
- Read receipts

### User Profiles
- Public profiles with listings
- Review system
- Favourites management

### Admin Features
- Report handling
- User moderation
- Content management

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Write tests for new features
- Ensure accessibility compliance
- Follow the established code style
- Update documentation as needed

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@openground.app or create an issue on GitHub.# Deploy trigger #午後
