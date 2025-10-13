# Filevo MVP Verification Checklist

Complete this checklist to verify all features are working correctly.

## Setup Verification

- [ ] **Database Migration Applied**
  - Run `supabase/migrations/20250113000000_initial_schema.sql` in SQL Editor
  - Verify all 7 tables exist (profiles, properties, property_users, requests, request_items, files, activity_logs)
  - Check that RLS is enabled on all tables

- [ ] **Storage Bucket Created**
  - Bucket named `documents` exists
  - Bucket is set to **Private**
  - No public access policies

- [ ] **Environment Variables Set**
  - All variables in `.env.local` are configured
  - `SUPABASE_SERVICE_ROLE_KEY` is kept secret (not in git)
  - `NEXT_PUBLIC_APP_URL` matches your deployment URL

- [ ] **Vercel Cron Configured**
  - `vercel.json` exists with cron job
  - Cron job points to `/api/jobs/reminders`
  - Schedule is `0 9 * * *` (daily at 9 AM UTC)

## Feature Testing

### Authentication ✅

- [ ] Navigate to `/auth/sign-in`
- [ ] Enter email address
- [ ] Receive magic link email
- [ ] Click link and successfully sign in
- [ ] Redirected to dashboard

### Properties 🏢

- [ ] Click "New Property" on dashboard or navigate to `/app/properties`
- [ ] Fill in property name and address
- [ ] Property appears in list
- [ ] Can click property to view details
- [ ] Property overview shows stats (requests, items, completion rate)

### Document Requests 📋

- [ ] Open a property
- [ ] Navigate to "Requests" tab
- [ ] Click "New Request"
- [ ] Fill in:
  - Title (e.g., "Tenant Move-In Documents")
  - Description (optional)
  - Due date (optional)
  - Add 2-3 document items (e.g., "Driver's License", "Proof of Income")
- [ ] Request is created successfully
- [ ] Each item shows a unique upload link
- [ ] Upload links follow format: `/r/{token}`

### Public Upload 🔗

- [ ] Copy an upload link from a request item
- [ ] Open link in incognito/private window (or different browser)
- [ ] Page displays:
  - Property name
  - Request title
  - Specific document tag
  - Due date (if set)
- [ ] Select a file
- [ ] File size displays correctly
- [ ] Click "Upload File"
- [ ] Progress bar appears
- [ ] Success message shows after upload
- [ ] Can upload multiple files to same item
- [ ] NO authentication required

### Files Management 📁

- [ ] Navigate to property → "Files" tab
- [ ] Uploaded files appear in list
- [ ] Files grouped by request
- [ ] Shows file name, tag, upload date
- [ ] Click "Download" button
- [ ] File downloads successfully
- [ ] Click "Export All as ZIP"
- [ ] ZIP file downloads with all property files

### Dashboard KPIs 📊

After completing uploads above:

- [ ] Return to `/dashboard`
- [ ] "Projects Completed" shows requests where ALL items are received
- [ ] "In Progress" shows requests with pending items
- [ ] "Time Saved" shows calculation (files × 0.25h)
- [ ] 7-day chart shows recent upload activity
- [ ] Properties section shows up to 6 properties
- [ ] Recent requests show completion ratios (e.g., "2/3")

### Email Reminders 📧

- [ ] Set `RESEND_API_KEY` and `RESEND_FROM` in environment
- [ ] Create a request with a due date within 2 days
- [ ] Manually trigger: `GET http://localhost:3000/api/jobs/reminders`
  - Or use: `curl http://localhost:3000/api/jobs/reminders`
- [ ] Response shows: `{ ok: true, count: X }`
- [ ] Check email (configured recipient)
- [ ] Email contains:
  - Property name
  - Document tag
  - Upload link
  - Due date
- [ ] Running endpoint again within 24h sends no duplicate (idempotent)

### Activity Log 📝

- [ ] Navigate to `/app/activity`
- [ ] See logged activities:
  - Property created
  - Request created
  - File uploaded
- [ ] Each entry shows:
  - Action icon (create, update, delete, upload)
  - Entity type
  - Timestamp

### Accessibility ♿

- [ ] Tab through interactive elements
- [ ] All buttons/links show focus ring
- [ ] Focus ring uses brand color (`--ring`)
- [ ] Text on brand buttons is readable (black on orange)
- [ ] Theme toggle works (dark ↔ light)
- [ ] Light theme brand is darker for better contrast

### UI Consistency 🎨

- [ ] Visit `/sandbox`
- [ ] All components use design tokens
- [ ] Colors match dark/light theme
- [ ] Buttons use correct variants (primary, secondary, ghost)
- [ ] Cards have shadow and border
- [ ] Stats display properly
- [ ] Fake charts show gradient bars

## Security Verification ⚠️

- [ ] **Service Role Key** is NEVER imported in client components
- [ ] Only used in:
  - `/lib/supabase/server.ts`
  - Server Components
  - API Routes (`/app/api/*`)
  - Server Actions (`actions.ts` files)
- [ ] Public upload pages (`/r/[token]`) validate tokens server-side
- [ ] Storage bucket is **private** (not public)
- [ ] All downloads use signed URLs (time-limited)
- [ ] RLS is enabled on all tables
- [ ] Upload tokens are cryptographically random (32 bytes)

## Performance Checks ⚡

- [ ] Dashboard loads in < 3 seconds
- [ ] File uploads work for files up to 10 MB
- [ ] ZIP export completes for 10+ files
- [ ] No console errors in browser DevTools
- [ ] No TypeScript errors: `npm run build`
- [ ] No ESLint errors: `npm run lint`

## Edge Cases 🔍

- [ ] Invalid upload token shows friendly error
- [ ] Upload to already-received item still works (allows re-upload)
- [ ] Delete property cascades to requests/items/files
- [ ] Empty states show for:
  - No properties
  - No requests
  - No files
  - No activity
- [ ] Date filters work in export (if implemented)
- [ ] Large file uploads (100MB+) work or show appropriate error

## Documentation ✅

- [ ] README.md has complete setup instructions
- [ ] ARCHITECTURE.md documents system design
- [ ] ROADMAP.md shows implementation phases
- [ ] `.env.example` lists all required variables
- [ ] Supabase migration file is complete
- [ ] Code comments explain complex logic

## Production Readiness 🚀

- [ ] All environment variables set in Vercel
- [ ] Vercel cron job configured
- [ ] Custom domain configured (optional)
- [ ] Resend domain verified for production emails
- [ ] Database has appropriate indexes
- [ ] No hardcoded test data in code
- [ ] Error handling in place for all user actions
- [ ] Loading states for all async operations

## Final Check

- [ ] Complete a full workflow end-to-end without errors
- [ ] No build errors or warnings
- [ ] No runtime errors in console
- [ ] UI is responsive on mobile/tablet/desktop
- [ ] All links work correctly
- [ ] Data persists between page refreshes
- [ ] Logout and sign back in works

---

## If Any Items Fail

1. Check browser console for errors
2. Check Vercel/server logs for backend errors
3. Verify environment variables are set correctly
4. Ensure Supabase migration was applied
5. Confirm storage bucket is created and private
6. Review ARCHITECTURE.md for system design
7. Check that all dependencies are installed

## Success Criteria ✨

All checkboxes above should be checked for a production-ready MVP.

If all tests pass: **Congratulations! Your Filevo MVP is ready to use!** 🎉

