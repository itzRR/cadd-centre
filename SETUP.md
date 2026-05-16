# Scholar Sync — Setup Guide

## Prerequisites
- Node.js 18+
- A Supabase project (already created)

---

## Step 1: Environment Variables

Your `.env.local` already has the keys. Verify it looks like:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Step 2: Run the Database Schema

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New query**
5. Copy and paste the entire contents of `SUPABASE_SCHEMA.sql`
6. Click **Run** (or press Cmd+Enter)

This will create:
- All tables (profiles, courses, events, enrollments, event_registrations, contact_messages)
- All indexes for performance
- Row Level Security (RLS) policies
- Triggers (auto updated_at, auto profile creation on signup)
- Helper RPC functions
- Sample courses and events

---

## Step 3: Configure Supabase Auth

In your Supabase Dashboard:

1. Go to **Authentication → Settings**
2. Under **Email**, make sure **Enable email confirmations** is set as desired
   - For development: **disable** email confirmation so you can log in instantly
   - For production: enable it for security
3. Set **Site URL** to `http://localhost:3000` (for dev) or your production domain

---

## Step 4: Install & Run

```bash
npm install
npm run dev
```

Visit: http://localhost:3000

---

## Step 5: Create Your Admin Account

1. Go to http://localhost:3000/auth/register
2. Register with your email and password
3. Go to your **Supabase Dashboard → SQL Editor**
4. Run this query (replace with your email):

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your@email.com';
```

5. Log out and log back in at `/auth/login`
6. You'll now be redirected to `/admin` after login

---

## Feature Overview

### Public Website
| Page | URL | Description |
|------|-----|-------------|
| Home | `/` | Dynamic hero, featured courses & events |
| Courses | `/courses` | All active courses with search & filters |
| Course Detail | `/courses/[slug]` | Full course info, syllabus, pricing |
| Events | `/events` | All active events with filters |
| Event Detail | `/events/[slug]` | Event info, agenda, speakers |
| About | `/about` | About the institution |
| Contact | `/contact` | Contact form (stored in DB) |
| Login | `/auth/login` | Supabase email/password login |
| Register | `/auth/register` | New account creation |

### Admin Dashboard
| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/admin` | Stats, charts, recent activity |
| Courses | `/admin/courses` | List, filter, toggle active |
| New Course | `/admin/courses/new` | Create course with all fields |
| Edit Course | `/admin/courses/[id]/edit` | Full CRUD editing |
| Events | `/admin/events` | List all events |
| New Event | `/admin/events/new` | Create event |
| Edit Event | `/admin/events/[id]/edit` | Edit event |
| Users | `/admin/users` | View all users, change roles, suspend |
| Messages | `/admin/messages` | View contact form submissions |

---

## Database Schema Overview

```
profiles           — Extended user data (links to auth.users)
  └── id (FK → auth.users)
  └── email, full_name, phone, role, avatar_url, ...

courses            — Course catalog
  └── slug, title, description, price, level, category, ...
  └── tags[], syllabus[], is_active, is_featured

events             — Events and workshops
  └── slug, title, description, venue, capacity, price, ...
  └── agenda JSONB, speakers JSONB, tags[], is_featured

enrollments        — Student → Course relationship
  └── user_id (FK → profiles), course_id (FK → courses)
  └── status, payment_status, amount_paid

event_registrations — Student → Event relationship
  └── user_id (FK → profiles), event_id (FK → events)
  └── quantity, status, payment_status, amount_paid

contact_messages   — Contact form submissions
  └── name, email, phone, subject, message, is_read
```

---

## RLS Policy Summary

| Table | Anonymous | Student | Admin |
|-------|-----------|---------|-------|
| profiles | — | Read/Update own | Read/Update all |
| courses | Read active | Read active | Full CRUD |
| events | Read active | Read active | Full CRUD |
| enrollments | — | Read/Insert own | Read/Update all |
| event_registrations | — | Read/Insert own | Read/Update all |
| contact_messages | INSERT only | — | Full access |

---

## Production Checklist

- [ ] Enable email confirmation in Supabase Auth settings
- [ ] Set production Site URL in Supabase Auth settings
- [ ] Add your domain to Supabase allowed redirect URLs
- [ ] Review and tighten RLS policies as needed
- [ ] Set up Supabase Storage bucket for image uploads (optional)
- [ ] Configure custom SMTP for transactional emails (optional)
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in your deployment environment

---

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **UI Components**: Radix UI + shadcn/ui primitives
- **Icons**: Lucide React
- **Animations**: Framer Motion
