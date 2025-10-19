# Filevo Architecture

## Overview
Filevo is a SaaS platform for property managers to collect and organize required documents from tenants, owners, and vendors using secure, tokenized upload links. The platform features workflow-based navigation with category-specific views for onboarding, maintenance, and audit processes.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + CSS Variables (dark theme)
- **Auth & Database**: Supabase (PostgreSQL + Auth + Storage)
- **Hosting**: Vercel
- **Email**: Resend
- **SMS**: Twilio (optional)
- **State Management**: Server Components + React Server Actions
- **Icons**: Lucide React

## Project Structure

```
/app
  /api
    /ai
      /compose-message    # AI-powered message composition
    /auth                 # Authentication endpoints
      /confirm-email      # Email confirmation
      /custom-magic-link  # Custom magic link generation
      /reset-password     # Password reset
      /sign-up           # User registration
    /export              # ZIP export endpoint
    /files
      /download          # Secure file download
    /health              # Health check
    /jobs
      /reminders         # Cron job for email reminders
    /upload              # File upload handler
      /get-url           # Generate signed upload URLs
      /record            # Record uploaded files
  /app                   # Protected app routes
    /dashboard           # Main dashboard with KPIs
    /properties          # Property management (Onboarding & Renewals)
    /property/[id]       # Property detail pages
    /activity            # Activity log timeline
  /auth                  # Authentication pages
    /sign-in             # Magic link sign-in
    /sign-up             # User registration
    /forgot-password     # Password reset
  /workflows             # Workflow-specific pages
    /maintenance         # Maintenance & Vendor Receipts
    /audit               # Ownership / Accounting / Audit
  /r/[token]             # Public upload pages (tokenized)
  /sandbox               # UI component showcase

/components
  /brand                 # Logo components
  /layout                # AppShell (sidebar layout)
  /ui                    # Reusable UI components
    /CategoryChips.tsx   # Category filtering chips (deprecated)
    /DocumentUpload.tsx  # File upload with drag-and-drop
    /KpiCard.tsx         # Dashboard KPI cards (clickable)
  /auth                  # Auth-related components
  /requests              # Request management components
    /RequestModal.tsx    # Enhanced request creation with file upload
    /SharePanel.tsx      # Request sharing interface
  /modals                # Modal components
    /UploadReceiptModal.tsx # Receipt upload modal
  /drawers               # Drawer components
    /AuditPacketDrawer.tsx # 4-step audit packet creation
  /tables                # Table components
    /MaintenanceTable.tsx # Maintenance data table
    /AuditFileTable.tsx  # Audit file table

/lib
  /supabase
    /server.ts           # Server-side Supabase client (service role)
    /client.ts           # Client-side Supabase client
    /browser.ts          # Browser client
    /middleware.ts       # Auth middleware
  /auth.ts               # Auth helpers (requireUser)
  /email.ts              # Email sending via Resend
  /email-service.ts      # Enhanced email service
  /storage.ts            # Storage helpers (signed URLs)
  /activity.ts           # Activity logging
  /categories.ts         # Category inference and filtering
  /format.ts             # Formatting utilities (currency, dates)

/supabase
  /migrations            # Database migrations
  /seed.sql              # Example data
```

## Data Model

```
profiles (1:N properties via created_by)
  ├─ properties (1:N requests)
  │   ├─ property_users (M:N join with profiles)
  │   └─ requests (1:N request_items)
  │       ├─ request_items (1:N files)
  │       │   └─ files (binary data in Storage)
  │       └─ files (direct request attachments)
  └─ activity_logs

Categories (client-side inference):
  ├─ onboarding: Driver's license, lease, insurance
  ├─ maintenance: Receipts, repair photos, vendor invoices
  └─ audit: Financial docs, compliance, ownership records
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

## Workflow Architecture

### Navigation Structure
- **Dashboard**: Central KPI overview with clickable cards
- **Onboarding & Renewals** (`/app/properties`): Property management with preset packets
- **Maintenance & Vendor Receipts** (`/workflows/maintenance`): Receipt tracking and vendor management
- **Ownership / Accounting / Audit** (`/workflows/audit`): Virtual packet builder with export
- **Activity**: Timeline view of all system events

### Category System
- **Client-side Inference**: Categories determined from request metadata (title, items, tags)
- **No Database Changes**: Categories computed dynamically without schema modifications
- **Workflow Filtering**: Each workflow page filters data by category automatically

### Sidebar Accents
- **Onboarding & Renewals**: Teal accent when active
- **Maintenance & Vendor Receipts**: Amber accent when active  
- **Ownership / Accounting / Audit**: Violet accent when active
- **Dashboard/Activity**: Neutral (no accent)

## Storage Architecture

- **Bucket**: `files` (private)
- **Access**: Signed URLs only (server-generated)
- **Path Structure**: `{requestId}/{timestamp}-{randomId}.{ext}`
- **Upload Flow**:
  1. Server generates signed upload URL
  2. Client uploads directly to Supabase Storage
  3. Server records file metadata in DB
- **File Types**: PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG, GIF, WEBP
- **Size Limit**: 10MB per file

## Public Upload Flow

1. User receives link: `/r/{upload_token}`
2. Server resolves token → request_item → request → property
3. Client requests signed upload URL from server
4. Client uploads file to Storage
5. Server records file + marks item as `received`

## Email & Notifications

- **Provider**: Resend
- **SMS Provider**: Twilio (optional)
- **Trigger**: Vercel Cron (daily at 9 AM) + immediate notifications
- **Endpoint**: `/api/jobs/reminders`
- **Logic**: Find pending items due within 48h, send reminders
- **Idempotency**: Uses `last_reminder_at` timestamp
- **Enhanced Features**:
  - Document attachments in request emails
  - Professional HTML templates with branding
  - Upload links for each required document
  - File type validation and size limits
  - Multi-channel notifications (email/SMS/both)

## Environment Variables

### Public (client-side)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

### Private (server-only)
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `TWILIO_ACCOUNT_SID` (optional)
- `TWILIO_AUTH_TOKEN` (optional)
- `TWILIO_PHONE_NUMBER` (optional)
- `MESSAGING_SEND_ENABLED` (feature flag)

## Security

1. **RLS Enabled**: All tables enforce row-level security
2. **Service Role Isolation**: Only used in server code
3. **Signed URLs**: All storage access uses time-limited signed URLs
4. **Token Security**: Upload tokens are cryptographically random
5. **Public Routes**: Limited to upload endpoints with token validation

## Enhanced Features

### Document Upload in Requests
- **Drag & Drop Interface**: Intuitive file upload with visual feedback
- **File Validation**: Server-side validation of file types and sizes
- **Preview Support**: Image thumbnails and file type icons
- **Storage Integration**: Direct upload to Supabase Storage
- **Email Integration**: Uploaded files listed in notification emails

### Dashboard Enhancements
- **Clickable KPI Cards**: Navigate to relevant pages from metrics
- **Data Source Filtering**: Only show metrics from existing properties
- **Category-Aware Metrics**: KPIs reflect workflow-specific data
- **Visual Feedback**: Hover effects and accessibility support

### Workflow-Specific Pages
- **Maintenance Page**: Vendor receipt tracking with filters and export
- **Audit Page**: Virtual packet builder with 4-step process
- **Preset Packets**: Quick-create buttons for common document sets
- **Export Functionality**: CSV and ZIP export capabilities

### UI/UX Improvements
- **Sidebar Accents**: Color-coded active navigation items
- **Responsive Design**: Mobile-optimized layouts
- **Accessibility**: WCAG 2.1 AA compliance with keyboard navigation
- **Dark Theme**: Consistent dark mode throughout application

## Theme & Design

- **Default**: Dark mode
- **Tokens**: CSS variables in `app/globals.css`
- **Components**: Shadcn-style primitives (Button, Card, Stat)
- **Fonts**: Inter (UI), JetBrains Mono (code/numbers)
- **Accessibility**: WCAG 2.1 AA compliant
- **Icons**: Lucide React icon library
- **Color System**: Semantic color tokens with accent colors for workflows

