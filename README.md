# Filevo.io

> Secure document collection platform for property managers

Filevo streamlines document collection from tenants, owners, and vendors using tokenized upload links, automated reminders, and organized file management.

## Features

- 🔐 **Secure Authentication** - Supabase Auth with magic link sign-in
- 🏢 **Property Management** - Organize documents by property
- 📋 **Document Requests** - Create requests with multiple items
- 🔗 **Tokenized Uploads** - Share secure upload links (no login required)
- 📧 **Automated Reminders** - Email reminders for pending documents
- 📦 **ZIP Export** - Download all property files in one archive
- 🎨 **Modern UI** - Dark theme with accessible design system
- 📊 **Dashboard KPIs** - Track completion rates and time saved

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Database & Auth**: Supabase (PostgreSQL + Auth + Storage)
- **Styling**: Tailwind CSS + CSS Variables
- **Email**: Resend
- **Hosting**: Vercel
- **File Storage**: Supabase Storage (private bucket)

## Quick Start

### 1. Prerequisites

- Node.js 18+ and npm
- Supabase account ([sign up free](https://supabase.com))
- Resend account for emails ([sign up free](https://resend.com))

### 2. Clone and Install

```bash
git clone https://github.com/yourusername/filevo.io.git
cd filevo.io
npm install
```

### 3. Set Up Supabase

#### 3.1 Create Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Create a new project
3. Wait for the project to finish setting up

#### 3.2 Run Database Migration

1. Go to the **SQL Editor** in your Supabase dashboard
2. Copy the contents of `supabase/migrations/20250113000000_initial_schema.sql`
3. Paste and run the migration
4. Verify all tables are created in the **Table Editor**

#### 3.3 Create Storage Bucket

1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket named `documents`
3. Set it to **Private** (NOT public)
4. No additional policies needed (we use signed URLs)

#### 3.4 Get API Keys

1. Go to **Project Settings** → **API**
2. Copy the following:
   - **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`)
   - **anon/public key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - **service_role key** (`SUPABASE_SERVICE_ROLE_KEY`) ⚠️ Keep this secret!

### 4. Configure Environment Variables

Create `.env.local` in the project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Resend (Email)
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM=Filevo <no-reply@yourdomain.com>
```

**Note**: Replace all placeholder values with your actual keys.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Set Up Resend (Email)

1. Sign up at [https://resend.com](https://resend.com)
2. Verify your sending domain (or use test mode)
3. Create an API key
4. Add it to `.env.local` as `RESEND_API_KEY`

## Deployment to Vercel

### 1. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Or connect your GitHub repo via the [Vercel Dashboard](https://vercel.com/new).

### 2. Configure Environment Variables

In Vercel Project Settings → Environment Variables, add:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` (your production URL)
- `RESEND_API_KEY`
- `RESEND_FROM`

### 3. Set Up Cron Job for Reminders

In your Vercel project, add a `vercel.json` file:

```json
{
  "crons": [{
    "path": "/api/jobs/reminders",
    "schedule": "0 9 * * *"
  }]
}
```

This runs the reminder job daily at 9:00 AM UTC.

## Usage

### 1. Sign In

1. Navigate to `/auth/sign-in`
2. Enter your email
3. Check email for magic link
4. Click link to sign in

### 2. Create a Property

1. Go to **Properties** page
2. Click "New Property"
3. Enter property name and address
4. Save

### 3. Create a Document Request

1. Open a property
2. Go to the **Requests** tab
3. Click "New Request"
4. Enter:
   - Request title (e.g., "Tenant Move-In Documents")
   - Optional description and due date
   - Add required documents (e.g., "Driver's License", "Proof of Income")
5. Create request

### 4. Share Upload Links

For each request item, you'll get a unique upload link:
- Format: `https://yourapp.com/r/{upload_token}`
- Share this link via email, SMS, or messaging
- No login required for recipients
- Each link is for a specific document

### 5. Track Uploads

- **Dashboard**: View KPIs and recent activity
- **Property → Files**: See all uploaded files
- **Property → Requests**: Track status of each item

### 6. Export Files

From the **Files** tab, click "Export All as ZIP" to download all files for a property.

## Project Structure

```
/app
  /api           # API routes
  /app           # Protected app routes
  /auth          # Authentication pages
  /r/[token]     # Public upload pages
  /dashboard     # Main dashboard
  /sandbox       # UI components showcase

/components
  /brand         # Logo components
  /layout        # AppShell (sidebar)
  /ui            # Reusable UI components
  /properties    # Property-related components
  /requests      # Request-related components
  /files         # File-related components
  /activity      # Activity log components

/lib
  /supabase      # Supabase client configuration
  /email         # Email helpers and templates
  auth.ts        # Auth helpers
  storage.ts     # Storage helpers (signed URLs)
  activity.ts    # Activity logging

/supabase
  /migrations    # Database migrations
  seed.sql       # Example seed data
```

## Database Schema

### Tables

- **profiles** - User profiles (1:1 with auth.users)
- **properties** - Properties managed by users
- **property_users** - M:N relationship (team access)
- **requests** - Document requests per property
- **request_items** - Individual items in a request
- **files** - Uploaded file metadata
- **activity_logs** - Audit trail

### Security

All tables have Row Level Security (RLS) enabled. Users can only access:
- Properties they created or are members of
- Requests/files for their properties
- Their own profile

## API Routes

- `GET /api/health` - Health check
- `GET /api/export?propertyId={id}` - Export files as ZIP
- `POST /api/upload/get-url` - Get signed upload URL
- `POST /api/upload/record` - Record uploaded file
- `POST /api/files/download` - Get signed download URL
- `GET /api/jobs/reminders` - Send reminder emails (cron)

## Storage

Files are stored in a **private** Supabase Storage bucket named `documents`.

**Path structure**: `{propertyId}/{tag}/{ulid}-{filename}`

All file access is via **signed URLs** only (time-limited, secure).

## Email Templates

Located in `lib/email/templates/`:
- `request-created.tsx` - Sent when new request is created
- `request-reminder.tsx` - Sent for pending items (automated)

## Development

### Run Locally

```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm start
```

### Lint

```bash
npm run lint
```

## Testing the Happy Path

1. ✅ Sign in with magic link
2. ✅ Create a property
3. ✅ Create a request with items
4. ✅ Copy upload link for an item
5. ✅ Open link in incognito/different browser
6. ✅ Upload a file
7. ✅ Verify item status changes to "Received"
8. ✅ Check dashboard KPIs update
9. ✅ Export files as ZIP
10. ✅ Test reminder endpoint: `curl http://localhost:3000/api/jobs/reminders`

## Environment Variables

See `.env.example` for a complete list of required environment variables.

### Required

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-only!)
- `NEXT_PUBLIC_APP_URL` - Your app's URL
- `RESEND_API_KEY` - Resend API key
- `RESEND_FROM` - Sender email address

## Security Notes

⚠️ **IMPORTANT**: Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser!

- Only used in server-side code (API routes, Server Components, Server Actions)
- Bypasses RLS, so use carefully
- Public uploads use token validation, not service role

## Troubleshooting

### Build Errors

If you get import errors:
- Ensure all dependencies are installed: `npm install`
- Check that file names match imports (case-sensitive on Linux/Vercel)

### Upload Failures

- Verify the `documents` bucket exists and is private
- Check storage permissions in Supabase dashboard
- Ensure signed URLs are not expired (1 hour default)

### Email Not Sending

- Verify `RESEND_API_KEY` is set
- Check that `RESEND_FROM` uses a verified domain
- For development, Resend allows limited test emails

## UI Components

Visit `/sandbox` to see all available UI components and design tokens.

## License

MIT

## Support

For issues or questions, please open an issue on GitHub or contact support.

---

Built with ❤️ for property managers
#   E n h a n c e d   D o c u m e n t   R e q u e s t   F l o w   -   1 0 / 1 8 / 2 0 2 5   0 9 : 3 6 : 3 5  
 