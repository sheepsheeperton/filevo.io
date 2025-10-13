# Filevo Development Roadmap

## Phase 0: Documentation ✅
**Status**: Complete

**Files**:
- `ARCHITECTURE.md` - System architecture documentation
- `ROADMAP.md` - This file

---

## Phase 1: Database Schema + RLS
**Status**: Pending

**Files to Create**:
- `supabase/migrations/20250113_initial_schema.sql` - Full schema with RLS
- `supabase/seed.sql` - Example seed data
- `.env.example` - Environment variable template

**Tables**:
- `profiles` - User profiles (maps to auth.users)
- `properties` - Properties managed by users
- `property_users` - M:N relationship (properties ↔ users)
- `requests` - Document requests per property
- `request_items` - Individual items in a request
- `files` - Uploaded file metadata
- `activity_logs` - Audit trail

**RLS Policies**: Read access based on property ownership/membership

---

## Phase 2: Storage Bucket + Server Helpers
**Status**: Pending

**Files to Create**:
- `lib/storage.ts` - Signed URL helpers
- `README.md` update - Storage bucket creation instructions

**Functions**:
- `getSignedUploadUrl()` - Generate upload URL
- `getSignedDownloadUrl()` - Generate download URL

---

## Phase 3: Properties Management
**Status**: Pending

**Files to Create**:
- `app/app/properties/page.tsx` - Properties list page
- `app/app/properties/actions.ts` - Server actions (CRUD)
- `components/properties/PropertyForm.tsx` - Create/edit modal

**Features**:
- List all properties
- Create new property
- Edit property details
- Delete property
- Empty state UI

---

## Phase 4: Requests + Items
**Status**: Pending

**Files to Create**:
- `app/app/property/[id]/layout.tsx` - Tabbed layout
- `app/app/property/[id]/page.tsx` - Overview tab
- `app/app/property/[id]/requests/page.tsx` - Requests tab
- `app/app/property/[id]/requests/actions.ts` - Server actions
- `components/requests/RequestForm.tsx` - Create request modal
- `components/requests/RequestItemForm.tsx` - Add items to request

**Features**:
- Tabbed interface (Overview/Requests/Files/People)
- Create requests with multiple items
- Generate secure upload tokens
- View request status

---

## Phase 5: Public Upload (Token)
**Status**: Pending

**Files to Edit**:
- `app/r/[token]/page.tsx` - Already exists, enhance
- `app/r/[token]/upload-form.tsx` - Already exists, enhance
- `app/api/upload/route.ts` - Already exists, enhance

**Features**:
- Resolve token to request item
- Display request details (tag, due date)
- Upload file with progress
- Multiple uploads support
- Friendly confirmation

---

## Phase 6: Files Tab (Manager)
**Status**: Pending

**Files to Create**:
- `app/app/property/[id]/files/page.tsx` - Files list
- `app/app/property/[id]/files/actions.ts` - Server actions
- `components/files/FilesList.tsx` - Files table component

**Features**:
- List all files grouped by request → item
- Download via signed URL
- Filter by tag/date
- File preview (images)

---

## Phase 7: Email + Reminders
**Status**: Pending

**Files to Create**:
- `lib/email/resend.ts` - Resend wrapper (already exists as `lib/email.ts`)
- `lib/email/templates/request-created.tsx` - Request created email
- `lib/email/templates/request-reminder.tsx` - Reminder email
- `app/api/jobs/reminders/route.ts` - Already exists, enhance

**Features**:
- Send email when request created
- Daily cron job for reminders
- Reminder for items due within 48h
- Idempotent using `last_reminder_at`

---

## Phase 8: Export ZIP
**Status**: Pending

**Files to Edit**:
- `app/api/export/route.ts` - Already exists, enhance

**Features**:
- Export all files for a property
- Optional date range filter
- Stream ZIP response
- Button on Files tab

---

## Phase 9: Activity Logs
**Status**: Pending

**Files to Create**:
- `lib/activity.ts` - Activity logging helper
- `app/app/activity/page.tsx` - Activity log viewer
- `components/activity/ActivityList.tsx` - Activity list component

**Features**:
- Log all major actions
- Display activity feed
- Filter by entity type/date

**Actions to Log**:
- Property created/updated/deleted
- Request created
- File uploaded
- Export initiated

---

## Phase 10: Dashboard KPIs
**Status**: Pending

**Files to Edit**:
- `app/dashboard/page.tsx` - Already exists, enhance with real data

**KPIs**:
- Projects Completed (requests with all items received)
- In-progress (requests with ≥1 pending)
- Time Saved (received_files × 0.25h)
- 7-day uploads chart

---

## Phase 11: Documentation & Environment
**Status**: Pending

**Files to Update**:
- `README.md` - Complete setup instructions
- `.env.example` - All environment variables
- Add storage policy documentation

**Documentation**:
- Migration instructions
- Bucket creation steps
- Vercel Cron configuration
- Environment variable setup

---

## Phase 12: Testing & Verification
**Status**: Pending

**Manual Test Checklist**:
1. ✅ Sign in with magic link
2. ✅ Create property
3. ✅ Create request with items
4. ✅ Open public upload link
5. ✅ Upload file successfully
6. ✅ Verify item status = received
7. ✅ Dashboard KPIs update
8. ✅ Export ZIP contains file
9. ✅ Reminders endpoint returns success
10. ✅ Activity log shows actions

**Acceptance Criteria**:
- All tables have RLS enabled
- Service role only in server code
- Private bucket, signed URLs only
- UI matches dark theme
- README complete
- No build errors

---

## Implementation Order

1. Database foundation (Phase 1-2)
2. Core features (Phase 3-6)
3. Automation (Phase 7-8)
4. Polish (Phase 9-11)
5. Verification (Phase 12)

