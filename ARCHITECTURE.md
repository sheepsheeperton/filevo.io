# Filevo Architecture

## Overview
Filevo is a SaaS platform for property managers to collect and organize required documents from tenants, owners, and vendors using secure, tokenized upload links.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + CSS Variables (dark theme)
- **Auth & Database**: Supabase (PostgreSQL + Auth + Storage)
- **Hosting**: Vercel
- **Email**: Resend
- **State Management**: Server Components + React Server Actions

## Project Structure

```
/app
  /api
    /export         # ZIP export endpoint
    /health         # Health check
    /jobs
      /reminders    # Cron job for email reminders
    /upload         # File upload handler
  /app              # Protected app routes
    /dashboard      # Main dashboard with KPIs
    /properties     # Property management
    /property/[id]  # Property detail pages
    /activity       # Activity log
  /auth             # Authentication pages
    /sign-in        # Magic link sign-in
  /r/[token]        # Public upload pages (tokenized)
  /sandbox          # UI component showcase

/components
  /brand            # Logo components
  /layout           # AppShell (sidebar layout)
  /ui               # Reusable UI components
  /auth             # Auth-related components

/lib
  /supabase
    /server.ts      # Server-side Supabase client (service role)
    /client.ts      # Client-side Supabase client
    /browser.ts     # Browser client
  /auth.ts          # Auth helpers (requireUser)
  /email.ts         # Email sending via Resend
  /storage.ts       # Storage helpers (signed URLs)
  /activity.ts      # Activity logging

/supabase
  /migrations       # Database migrations
  /seed.sql         # Example data
```

## Data Model

```
profiles (1:N properties via created_by)
  ├─ properties (1:N requests)
  │   ├─ property_users (M:N join with profiles)
  │   └─ requests (1:N request_items)
  │       └─ request_items (1:N files)
  │           └─ files (binary data in Storage)
  └─ activity_logs
```

## Authentication Flow

1. **Sign-in**: Magic link via Supabase Auth (`/auth/sign-in`)
2. **Session**: Managed by Supabase client-side
3. **Server Protection**: `requireUser()` helper redirects if not authenticated
4. **RLS**: All tables have Row Level Security policies

## Supabase Clients

### Client-side (`lib/supabase/client.ts`)
- Uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- For auth UI and public operations
- Limited by RLS policies

### Server-side (`lib/supabase/server.ts`)
- Uses `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS)
- **NEVER** imported in client components
- Used in Server Components, API Routes, Server Actions

## Storage Architecture

- **Bucket**: `documents` (private)
- **Access**: Signed URLs only (server-generated)
- **Path Structure**: `{propertyId}/{tag}/{ulid}-{originalName}`
- **Upload Flow**:
  1. Server generates signed upload URL
  2. Client uploads directly to Supabase Storage
  3. Server records file metadata in DB

## Public Upload Flow

1. User receives link: `/r/{upload_token}`
2. Server resolves token → request_item → request → property
3. Client requests signed upload URL from server
4. Client uploads file to Storage
5. Server records file + marks item as `received`

## Email & Reminders

- **Provider**: Resend
- **Trigger**: Vercel Cron (daily at 9 AM)
- **Endpoint**: `/api/jobs/reminders`
- **Logic**: Find pending items due within 48h, send reminders
- **Idempotency**: Uses `last_reminder_at` timestamp

## Environment Variables

### Public (client-side)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

### Private (server-only)
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM`

## Security

1. **RLS Enabled**: All tables enforce row-level security
2. **Service Role Isolation**: Only used in server code
3. **Signed URLs**: All storage access uses time-limited signed URLs
4. **Token Security**: Upload tokens are cryptographically random
5. **Public Routes**: Limited to upload endpoints with token validation

## Theme & Design

- **Default**: Dark mode
- **Tokens**: CSS variables in `app/globals.css`
- **Components**: Shadcn-style primitives (Button, Card, Stat)
- **Fonts**: Inter (UI), JetBrains Mono (code/numbers)
- **Accessibility**: WCAG 2.1 AA compliant

