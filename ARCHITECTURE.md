# Filevo Architecture

## Overview
Filevo is a SaaS platform for property managers to collect and organize required documents from tenants, owners, and vendors using secure, tokenized upload links. The platform features workflow-based navigation with category-specific views for onboarding, maintenance, and audit processes. The architecture emphasizes performance optimization with zero-network-call forms and lazy-loaded components.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + CSS Variables (dark theme)
- **Auth & Database**: Supabase (PostgreSQL + Auth + Storage)
- **Hosting**: Vercel
- **Email**: Resend
- **SMS**: Twilio (optional)
- **AI**: OpenAI GPT-4o-mini (for message composition)
- **State Management**: Server Components + React Server Actions
- **Icons**: Lucide React
- **Performance**: React.lazy, Suspense, memoization

## Project Structure

```
/app
  /api
    /ai
      /compose-message    # AI-powered message composition
    /auth                 # Authentication endpoints
      /confirm-email      # Email confirmation
      /custom-magic-link  # Custom magic link generation
      /custom-verify      # Custom verification
      /debug-magic-link   # Debug magic link
      /reset-password     # Password reset
      /reset-password-confirm # Password reset confirmation
      /sign-up           # User registration
      /simple-magic-link # Simple magic link
      /simple-magic-link-real # Real magic link
      /simple-reset-password # Simple password reset
      /ultra-simple-reset # Ultra simple reset
      /verify-magic-link # Magic link verification
    /basic               # Basic API route
    /debug-test         # Debug testing
    /env-status         # Environment status check
    /export             # ZIP export endpoint
    /files
      /download         # Secure file download
      /route.ts         # DELETE endpoint for file deletion
    /health             # Health check
    /hello              # Hello world endpoint
    /jobs
      /reminders        # Cron job for email reminders
    /ok                 # OK endpoint
    /ping               # Ping endpoint
    /test               # Test endpoint
    /test-api           # API testing endpoint
    /test-email         # Email testing
    /test-forgot-password # Password reset testing
    /test-magic-link    # Magic link testing
    /test-new-auth      # New auth testing
    /test-reset         # Reset testing
    /test-simple        # Simple testing
    /ultra-simple       # Ultra simple testing
    /upload             # File upload handler
      /get-url          # Generate signed upload URLs (supports request attachments)
      /record           # Record uploaded files (supports request attachments)
      /route.ts         # Main upload handler
  /app                  # Protected app routes
    /dashboard          # Main dashboard with KPIs
    /properties         # Property management (Onboarding & Renewals)
    /property/[id]      # Property detail pages
      /files           # Property files view
      /people          # Property people management
      /requests        # Property requests view
    /activity           # Activity log timeline
  /auth                 # Authentication pages
    /callback          # Auth callback
    /confirm           # Email confirmation
    /error             # Auth error page
    /sign-in           # Magic link sign-in
    /sign-up           # User registration
    /sign-up-success   # Registration success
    /forgot-password   # Password reset
    /update-password   # Password update
    /logout            # Logout handler
  /workflows            # Workflow-specific pages
    /maintenance        # Maintenance & Vendor Receipts
    /audit              # Ownership / Accounting / Audit
  /r/[token]            # Public upload pages (tokenized)
  /sandbox              # UI component showcase
  /test-api             # API testing

/components
  /activity
    /ActivityList.tsx   # Activity timeline component
  /auth-button.tsx      # Authentication button
  /brand
    /Logo.tsx           # Filevo logo component
  /deploy-button.tsx   # Deployment button
  /env-var-warning.tsx # Environment variable warnings
  /files
    /FilePreviewModal.tsx # File preview modal
    /FilesList.tsx      # Files list component
  /forgot-password-form.tsx # Password reset form
  /hero.tsx             # Landing page hero
  /layout
    /AppShell.tsx       # Main app layout with sidebar
  /login-form.tsx       # Login form component
  /logout-button.tsx    # Logout button
  /next-logo.tsx        # Next.js logo
  /properties
    /PropertyForm.tsx   # Property creation/edit form
    /PropertyManagement.tsx # Property management interface
  /requests
    /AIComposeModal.tsx # AI-powered message composition (lazy-loaded)
    /EditRequestModal.tsx # Request editing modal
    /RequestCard.tsx    # Request display card
    /RequestForm.tsx    # Performance-optimized request form with attachments
    /ResendNotificationModal.tsx # Resend notification modal
    /SharePanel.tsx     # Request sharing interface
  /sign-up-form.tsx     # Registration form
  /supabase-logo.tsx   # Supabase logo
  /theme
    /ThemeProvider.tsx  # Theme context provider
  /theme-switcher.tsx  # Theme toggle
  /tutorial
    /code-block.tsx     # Code display component
    /connect-supabase-steps.tsx # Supabase setup steps
    /fetch-data-steps.tsx # Data fetching tutorial
    /sign-up-user-steps.tsx # User registration tutorial
    /tutorial-step.tsx  # Tutorial step component
  /ui
    /badge.tsx          # Badge component
    /button.tsx         # Button component
    /card.tsx           # Card component
    /checkbox.tsx       # Checkbox component
    /DocumentUpload.tsx # File upload component with drag & drop
    /dropdown-menu.tsx  # Dropdown menu
    /input.tsx          # Input component
    /label.tsx          # Label component
    /Stat.tsx           # Statistics display
    /textarea.tsx       # Textarea component
    /ThemeToggle.tsx    # Theme toggle button
  /update-password-form.tsx # Password update form

/lib
  /supabase
    /server.ts          # Server-side Supabase client (service role)
    /client.ts          # Client-side Supabase client
    /browser.ts         # Browser client
    /middleware.ts      # Auth middleware
  /auth.ts              # Auth helpers (requireUser)
  /email
    /templates          # Email templates
      /request-notification.tsx # Request notification template
      /welcome.tsx      # Welcome email template
  /email-service.ts     # Enhanced email service with attachment support
  /email.ts             # Email sending via Resend
  /storage.ts           # Storage helpers (signed URLs, request attachments)
  /activity.ts          # Activity logging
  /categories.ts        # Category inference and filtering
  /format.ts            # Formatting utilities (currency, dates)
  /utils.ts             # General utilities

/supabase
  /migrations           # Database migrations
    /20250113000000_initial_schema.sql # Initial database schema
    /20250114000000_add_password_reset_tokens.sql # Password reset tokens
    /20250114000001_add_email_confirmation_tokens.sql # Email confirmation tokens
    /20250114000002_add_magic_link_tokens.sql # Magic link tokens
    /20250114000003_rebuild_magic_link_tokens.sql # Rebuild magic link tokens
    /20250115000000_add_recipient_notification_fields.sql # Notification fields
    /20250115000001_add_profiles_insert_policy.sql # Profiles RLS policy
    /20250115000002_add_public_upload_policy.sql # Public upload policy
    /20250115000003_clean_html_descriptions.sql # Clean HTML descriptions
    /20250115000004_create_storage_bucket.sql # Storage bucket creation
    /20250116000000_add_archived_at_to_requests.sql # Archive functionality
    /20250116000001_add_properties_created_at_index.sql # Performance index
    /20250116000002_add_request_attachments.sql # Request attachment support
    /20250116000003_create_files_bucket.sql # Files storage bucket
    /20250116000004_fix_files_schema.sql # Fix files table schema
    /20250116000005_fix_files_rls.sql # Fix files RLS policies
    /20250116000006_emergency_rls_fix.sql # Emergency RLS fix
    /20250116000007_fix_all_rls.sql # Comprehensive RLS fix
  /seed.sql             # Example data
```

## Data Model

```
profiles (1:N properties via created_by)
  ├─ properties (1:N requests)
  │   ├─ property_users (M:N join with profiles)
  │   └─ requests (1:N request_items)
  │       ├─ request_items (1:N files via item_upload)
  │       │   └─ files (origin: 'item_upload', tag: 'document')
  │       └─ files (direct request attachments)
  │           └─ files (origin: 'request_attachment', tag: 'attachment')
  └─ activity_logs

File Attachment System:
  ├─ files.origin: 'request_attachment' | 'item_upload'
  ├─ files.tag: 'attachment' | 'document'
  ├─ files.request_id: Direct link to request (for manager uploads)
  ├─ files.request_item_id: Link to specific item (for recipient uploads)
  ├─ files.file_path: Storage path in Supabase Storage
  ├─ files.file_size: File size in bytes
  └─ files.content_type: MIME type

Categories (client-side inference):
  ├─ onboarding: Driver's license, lease, insurance
  ├─ maintenance: Receipts, repair photos, vendor invoices
  └─ audit: Financial docs, compliance, ownership records

Archive System:
  ├─ requests.archived_at (nullable timestamp)
  ├─ Archived requests excluded from default queries
  ├─ Token invalidation for archived requests
  └─ Activity logging for archive/restore/delete actions
```

## Authentication Flow

1. **Sign-in**: Magic link via Supabase Auth (`/auth/sign-in`)
2. **Session**: Managed by Supabase client-side
3. **Server Protection**: `requireUser()` helper redirects if not authenticated
4. **RLS**: All tables have Row Level Security policies
5. **Middleware**: Auth middleware protects routes

## Supabase Clients

### Client-side (`lib/supabase/client.ts`)
- Uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- For auth UI and public operations
- Limited by RLS policies

### Server-side (`lib/supabase/server.ts`)
- Uses `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS)
- **NEVER** imported in client components
- Used in Server Components, API Routes, Server Actions

### Browser (`lib/supabase/browser.ts`)
- Browser-specific Supabase client
- Handles client-side auth state

### Middleware (`lib/supabase/middleware.ts`)
- Auth middleware for route protection
- Handles session validation

## Request Form Architecture

### Performance-Optimized Form System
- **RequestForm.tsx**: Main minimal form component with zero network calls on mount
- **Lazy Loading**: AI Compose and DocumentUpload load only when needed
- **Memoization**: All callbacks and values memoized to prevent re-renders
- **Inline Presets**: No database fetches for preset data
- **File Attachments**: Direct manager uploads with drag & drop interface

### Form Features
- **Preset Selector**: Onboarding/Renewal presets when opened from Onboarding & Renewals page
- **Property Context**: Property selector or locked property based on entry point
- **AI Compose Integration**: Lazy-loaded AI generation for descriptions
- **Document Upload**: Drag & drop file upload with preview and validation
- **Success Panel**: Upload links and copy actions after creation
- **Form Validation**: Client-side validation with clear error messages
- **Performance Monitoring**: Built-in timing for mount, init, and submit operations
- **Email Attachments**: Uploaded files included as email attachments

### Entry Points
- **Onboarding & Renewals page**: Uses `RequestForm` with preset selector
- **Property requests page**: Uses `RequestForm` directly

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

## Archive/Delete System (NEW)

### Archive Functionality
- **Soft Delete**: `requests.archived_at` timestamp (nullable)
- **Exclusion**: Archived requests excluded from all default queries
- **Token Invalidation**: Upload tokens invalidated for archived requests
- **Activity Logging**: `request_archived`, `request_unarchived`, `request_deleted` events
- **Reversible**: Archive can be undone with restore functionality

### Delete Functionality
- **Hard Delete**: Only when zero files associated with request_items
- **File Check**: Prevents deletion if files exist
- **Complete Removal**: Deletes request and request_items
- **Token Cleanup**: Invalidates any lingering tokens

### API Endpoints
- `/api/requests/[requestId]/archive` - Archive request
- `/api/requests/[requestId]/restore` - Restore archived request
- `/api/requests/[requestId]/delete` - Permanently delete request

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
- **Archive Behavior**: Files remain in storage when requests are archived

### File Attachment System
- **Manager Uploads**: Direct attachments to requests (`origin: 'request_attachment'`)
- **Recipient Uploads**: Files linked to specific request items (`origin: 'item_upload'`)
- **Email Integration**: Manager attachments included in notification emails
- **Download Links**: Large files (>20MB total) provided as download links
- **File Validation**: Server-side validation of file types and sizes
- **Preview Support**: Image thumbnails using Next.js Image component

## Public Upload Flow

1. User receives link: `/r/{upload_token}`
2. Server resolves token → request_item → request → property
3. **Archive Check**: Verify request is not archived
4. Client requests signed upload URL from server
5. Client uploads file to Storage
6. Server records file + marks item as `received`

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
  - AI-generated message composition

### Email Attachment System
- **Manager Attachments**: Files uploaded by managers included as email attachments
- **Size Limits**: Total attachment size limited to 20MB per email
- **Fallback**: Large files provided as download links instead of attachments
- **File Processing**: Server fetches files from storage and converts to email attachments
- **Debug Logging**: Comprehensive logging for attachment processing and errors

## AI Integration

- **Provider**: OpenAI GPT-4o-mini
- **Endpoint**: `/api/ai/compose-message`
- **Features**:
  - Request description generation
  - Email message composition
  - SMS message composition
  - Context-aware suggestions
- **Lazy Loading**: AI Compose modal loads only when needed
- **Server-side Only**: AI API keys never exposed to client

## Environment Variables

### Public (client-side)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

### Private (server-only)
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `OPENAI_API_KEY`
- `AI_MODEL` (default: gpt-4o-mini)
- `AI_ENABLED` (feature flag)
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
6. **Archive Security**: Archived requests cannot be accessed via public links
7. **AI Security**: AI API keys server-side only

## Performance Optimizations

### Form Performance
- **Zero Network Calls**: Forms open instantly with no server requests
- **Lazy Loading**: Heavy components load only when needed
- **Memoization**: Callbacks and values memoized to prevent re-renders
- **Single Render**: No effect loops or render storms
- **Database Indexes**: Optimized queries with proper indexing

### Database Performance
- **Indexes**: `properties.created_at DESC` for faster ordering
- **Query Optimization**: Efficient Supabase queries with proper select statements
- **Archive Filtering**: Default queries exclude archived records

### Client Performance
- **Code Splitting**: Dynamic imports for heavy components
- **Bundle Optimization**: Minimal JavaScript bundles
- **Caching**: Proper cache headers and strategies

## Enhanced Features

### Document Upload System
- **Drag & Drop Interface**: Intuitive file upload with visual feedback
- **File Validation**: Server-side validation of file types and sizes
- **Preview Support**: Image thumbnails and file type icons using Next.js Image
- **Storage Integration**: Direct upload to Supabase Storage
- **Email Integration**: Uploaded files included as email attachments
- **Two Modes**: Default mode for manager uploads, request-attachment mode for direct uploads
- **Performance Optimized**: Memoized callbacks and lazy loading
- **Error Handling**: Comprehensive error handling with user feedback

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

### Archive/Delete Management
- **Request Actions**: Archive, restore, and delete functionality
- **Confirmation Modals**: Clear consequences explained to users
- **Undo Functionality**: Archive can be undone within time limit
- **File Protection**: Prevents deletion when files exist

### UI/UX Improvements
- **Sidebar Accents**: Color-coded active navigation items
- **Responsive Design**: Mobile-optimized layouts
- **Accessibility**: WCAG 2.1 AA compliance with keyboard navigation
- **Dark Theme**: Consistent dark mode throughout application
- **Performance Monitoring**: Built-in timing and debugging

## Theme & Design

- **Default**: Dark mode
- **Tokens**: CSS variables in `app/globals.css`
- **Components**: Shadcn-style primitives (Button, Card, Stat)
- **Fonts**: Inter (UI), JetBrains Mono (code/numbers)
- **Accessibility**: WCAG 2.1 AA compliant
- **Icons**: Lucide React icon library
- **Color System**: Semantic color tokens with accent colors for workflows
- **Images**: Next.js Image component for optimized loading

## Migration History

### Recent Migrations
- **20250116000007**: Comprehensive RLS fix for files and activity_logs tables
- **20250116000006**: Emergency RLS fix (temporary permissive policies)
- **20250116000005**: Fix files RLS policies for manager access
- **20250116000004**: Fix files table schema (add missing columns)
- **20250116000003**: Create files storage bucket in Supabase
- **20250116000002**: Add request attachment support to files table
- **20250116000001**: Added index on `properties.created_at` for performance
- **20250116000000**: Added `archived_at` column to requests table
- **20250115000004**: Created storage bucket for file uploads
- **20250115000003**: Cleaned HTML descriptions
- **20250115000002**: Added public upload policy
- **20250115000001**: Added profiles insert policy
- **20250115000000**: Added recipient notification fields

### Performance Improvements
- **Database Indexing**: Optimized queries with proper indexes
- **Form Rebuild**: Complete rewrite for zero-network-call performance
- **Lazy Loading**: Heavy components load on demand
- **Memoization**: Prevented unnecessary re-renders
- **Bundle Optimization**: Reduced JavaScript bundle sizes

### File Attachment System
- **Database Schema**: Added request_id, origin, tag, file_size, content_type columns
- **Storage Integration**: Created files bucket with proper RLS policies
- **Email Integration**: Files included as email attachments with size limits
- **API Endpoints**: Enhanced upload/record endpoints for request attachments

## API Endpoints Summary

### Authentication
- `/api/auth/*` - Various authentication endpoints
- `/auth/*` - Authentication pages

### Request Management
- `/api/requests/[requestId]/archive` - Archive request
- `/api/requests/[requestId]/restore` - Restore request
- `/api/requests/[requestId]/delete` - Delete request

### File Management
- `/api/upload/*` - File upload handling (supports request attachments)
- `/api/files/download` - Secure file download
- `/api/files` - DELETE endpoint for file deletion
- `/r/[token]` - Public upload pages

### AI Integration
- `/api/ai/compose-message` - AI message composition

### Utilities
- `/api/export` - ZIP export
- `/api/health` - Health check
- `/api/jobs/reminders` - Email reminders

This architecture supports a high-performance, scalable document management system with comprehensive workflow support, AI integration, and robust security measures.