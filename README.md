# Taprobana Sports Club Premium Digital Platform

Ready-to-deploy Next.js + Supabase + Vercel launch-night project.

## What is included
- Cinematic pre-launch screen
- 10 to 0 live countdown
- Premium dark and gold Taprobana reveal
- Visitor Pavilion
- Member registration and login using Supabase Auth
- Founding Digital Member dashboard
- Digital membership card with QR code
- Club news centre
- Upcoming events
- Member profile update area
- Admin panel for announcements and events
- Demo mode fallback if Supabase environment variables are not configured
- Supabase SQL schema with Row Level Security policies

## Deploy quick steps

### 1. Create Supabase project
Create a Supabase project, then go to Project Settings > API and copy:
- Project URL
- Anon/public key

### 2. Run database schema
Open Supabase SQL Editor and run:

```sql
supabase/schema.sql
```

### 3. Set admin emails
In `.env.example`, replace:

```env
NEXT_PUBLIC_ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

with committee/admin emails.

### 4. Push to GitHub
Upload this whole folder to a GitHub repository.

### 5. Import to Vercel
In Vercel:
- New Project
- Import GitHub repo
- Framework should auto-detect Next.js
- Add these Environment Variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_ADMIN_EMAILS=admin1@example.com,admin2@example.com
NEXT_PUBLIC_CLUB_NAME=Taprobana Sports Club
NEXT_PUBLIC_LAUNCH_EVENT=Annual Gathering & Appreciation Night 2026
```

### 6. Deploy
Click Deploy.

## Launch night operation
1. Open the deployed website on the projector.
2. Click **Start Live Launch**.
3. Countdown runs 10 to 0.
4. Site reveals Home, Visitor Pavilion and Member Pavilion.
5. Members can create accounts and log in.
6. Admin email users can open the Admin panel and add announcements/events.

## Important Supabase Auth note
If Supabase email confirmation is enabled, new users must verify their email before login. If you want instant event-night login, temporarily disable email confirmation in Supabase Authentication settings and enable it again after the event.

## Files
- `app/page.jsx`: main platform UI and logic
- `app/globals.css`: premium dark/gold styling and animations
- `lib/supabaseClient.js`: Supabase configuration
- `supabase/schema.sql`: database tables and policies
- `.env.example`: Vercel environment variable template

## Demo mode
If Supabase variables are missing, the app still opens in demo mode so you can test the cinematic launch and dashboard UI. Real member accounts require Supabase variables.
