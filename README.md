# CouRflect (Next.js)

Lecturer review site. **Next.js 15 (App Router) + TypeScript + Supabase** (Postgres + Auth). Zod validates input.

```
src/app/            pages (Home, Reflect, lecturer detail, About, Login) + server actions
src/components/     Header, Stars, LecturerCard, ReviewForm, ...
src/lib/            data.ts (queries), supabase/ (server client + session middleware)
supabase/           schema.sql (tables, views, row-level security) + seed.sql
```

Check Node.js version with `node -v` and `npm -v`.

## Setup

1. Create a project at supabase.com. In **SQL Editor** run `supabase/schema.sql`, then optionally `supabase/seed.sql`.
2. Get your URL and key. Click the **Connect** button at the top of your project: it shows the project URL and the **publishable key** together. You can also find the key under **Project Settings > API Keys**. It starts with `sb_publishable_`.
   - The old `anon` key is the legacy version of this key and is being retired by Supabase, so use the publishable key.
   - Never use the `secret` or `service_role` key in this app. Those bypass the security rules.
3. `cp .env.example .env.local` (Windows Command Prompt: `copy .env.example .env.local`) and fill in the values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://(project_name).supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_... (ignore the ANON_KEY, it still work)
   ```
4. **Authentication > URL Configuration**: set **Site URL** to `http://localhost:3000` (real URL in production, will paste the deployed URL later) and add `http://localhost:3000/**` to **Redirect URLs** (once again, will get the deployed URL when deployed).
5. Confirmation emails (pick one):
   - **Default email template (simplest, fine for testing).** Change nothing. The app's `/auth/confirm` route accepts Supabase's default link. Open the email in the **same browser** you signed up from.
   - **Custom template (works on any device).** In **Authentication > Emails**, open the **Confirm signup** template and change the link to
     `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`
     On some free projects the template editor is locked until you set up custom SMTP (see step 6).
   - While testing you can also switch off "Confirm email" in the Email provider settings under Authentication. Turn it back on before launch.
6. **Before real students use it, set up custom SMTP** in **Authentication > Emails > SMTP Settings**. Supabase's built-in email sender is meant for testing only: it is heavily rate-limited and may only deliver to members of your Supabase organization. You need a provider (for example Brevo or Resend) that gives you a host, a port (465 or 587), a username and a password, plus a sender address you are allowed to send from.
7. Restrict reviewing to your university: run `insert into allowed_email_domains values ('your-university.edu');`
   Leave the table empty to allow any signed-in user. Keep "Confirm email" ON so nobody can claim an address they don't own.
8. `npm install && npm run dev` → http://localhost:3000

Deploy on Vercel: import the repo and set the same env vars (`NEXT_PUBLIC_SITE_URL` = your live URL).

## Where the rules live

| Rule | Enforced by |
|---|---|
| One review per student per lecturer | `unique (lecturer_id, user_id)` |
| Only your own review rows are writable | RLS policies on `reviews` |
| Only university emails may review | `email_allowed()` + `allowed_email_domains` |
| Reviews are anonymous | The app reads the `public_reviews` view (no `user_id`) |
| Max 10 new reviews per user per hour | `reviews_rate_limit` trigger |
| Search, tag filter, pagination | SQL via the `lecturer_directory` view |
| Input shape (rating 1-5, comment length) | Zod in `lecturers/[id]/actions.ts` and DB `check` constraints |

The app never uses a service-role or secret key.

## Troubleshooting

**"That confirmation link is invalid or has expired" right after signing up.**
The account is usually created fine. This happens when the email link isn't in the format the route expects. Make sure `src/app/auth/confirm/route.ts` handles both link types (`token_hash` + `type` for the custom template, and `code` for the default one, via `exchangeCodeForSession`). If the account already works, just sign in. Also check that the Redirect URLs in step 4 are set.

**Security Advisor shows "Security Definer View" (critical) for `lecturer_ratings` and `public_reviews`.**
This is intentional. These views run with owner rights so everyone can read reviews and averages while the `reviews` table itself stays private. `public_reviews` leaves out `user_id`, which keeps reviews anonymous. To check nothing leaks, run in the SQL Editor:

```sql
-- Should list id, lecturer_id, rating, comment, created_at, and no user_id
select column_name from information_schema.columns where table_name = 'public_reviews';

set role anon;
select count(*) from reviews;   -- expect 0 (or a permission error)
reset role;
```

Note that anyone, including signed-out visitors, can read reviews through `public_reviews`. That is intended for a public review site. If your research needs reviews visible only to signed-in students, restrict that view.

**Sign-in or data loading fails with an auth error after switching to the publishable key.**
Update the Supabase packages: `npm install @supabase/supabase-js@latest @supabase/ssr@latest`.

## Design notes

- Colours, proportions and layout come from the Figma export (`#D9D9D9` hero/detail, `#A9A9A9` subjects box, `#1E1E1E` photo block, yellow stars, Manrope).
- The lecturer page hides Home/Reflect/About, as in the Figma. Remove `minimal` in `lecturers/[id]/page.tsx` to show them.
- Missing photos fall back to `public/avatars/{male,female,neutral}.svg` by the lecturer's `gender`.
- Hero text/image: `HERO_TEXT` / `HERO_IMAGE` at the top of `src/app/page.tsx`.

## Research and ethics

Check your university's ethics requirements for collecting reviews about named staff before launch.