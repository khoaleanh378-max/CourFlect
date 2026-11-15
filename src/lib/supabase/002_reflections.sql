-- 002: data for the new reflection UI (difficulty, would-take-again, traits, votes, reports).
-- Run once in the Supabase SQL Editor, AFTER schema.sql. Safe to re-run.

-- ===== New columns =====
alter table lecturers add column if not exists department text;

alter table reviews
  add column if not exists difficulty       int check (difficulty between 1 and 5),
  add column if not exists would_take_again boolean,
  add column if not exists subject_id       uuid references subjects(id) on delete set null;

-- ===== Traits chosen by the reviewer (reuses the `tags` table) =====
create table if not exists review_tags (
  review_id uuid not null references reviews(id) on delete cascade,
  tag_id    uuid not null references tags(id)    on delete cascade,
  primary key (review_id, tag_id)
);
alter table review_tags enable row level security;

drop policy if exists "own review tags: read"   on review_tags;
drop policy if exists "own review tags: insert" on review_tags;
drop policy if exists "own review tags: delete" on review_tags;
create policy "own review tags: read" on review_tags for select to authenticated
  using (exists (select 1 from reviews r where r.id = review_id and r.user_id = auth.uid()));
create policy "own review tags: insert" on review_tags for insert to authenticated
  with check (exists (select 1 from reviews r where r.id = review_id and r.user_id = auth.uid()));
create policy "own review tags: delete" on review_tags for delete to authenticated
  using (exists (select 1 from reviews r where r.id = review_id and r.user_id = auth.uid()));

-- ===== Votes on reviews (+1 / -1, one per student, not on your own review) =====
create table if not exists review_votes (
  review_id uuid not null references reviews(id)    on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  value     smallint not null check (value in (-1, 1)),
  primary key (review_id, user_id)
);
alter table review_votes enable row level security;

drop policy if exists "own vote: read"   on review_votes;
drop policy if exists "own vote: insert" on review_votes;
drop policy if exists "own vote: update" on review_votes;
drop policy if exists "own vote: delete" on review_votes;
create policy "own vote: read" on review_votes for select to authenticated
  using (user_id = auth.uid());
create policy "own vote: insert" on review_votes for insert to authenticated
  with check (
    user_id = auth.uid() and public.email_allowed()
    -- reviews are only visible to their author, so this is true only for your own review:
    and not exists (select 1 from reviews r where r.id = review_id and r.user_id = auth.uid())
  );
create policy "own vote: update" on review_votes for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own vote: delete" on review_votes for delete to authenticated
  using (user_id = auth.uid());

-- ===== Reports: write-only for students. Read them in the Table Editor. =====
create table if not exists review_reports (
  review_id  uuid not null references reviews(id)    on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  reason     text not null default 'inappropriate' check (char_length(reason) <= 200),
  created_at timestamptz not null default now(),
  primary key (review_id, user_id)
);
alter table review_reports enable row level security;
drop policy if exists "own report: insert" on review_reports;
create policy "own report: insert" on review_reports for insert to authenticated
  with check (user_id = auth.uid());

-- ===== Views (new columns are appended, existing ones keep their order) =====
create or replace view lecturer_ratings as
  select lecturer_id,
         round(avg(rating)::numeric, 1) as avg_rating,
         count(*)::int                  as review_count,
         round(avg(difficulty)::numeric, 1) as avg_difficulty,
         round(100.0 * count(*) filter (where would_take_again)
               / nullif(count(*) filter (where would_take_again is not null), 0))::int as would_take_again_pct,
         (count(*) filter (where rating = 1))::int as r1,
         (count(*) filter (where rating = 2))::int as r2,
         (count(*) filter (where rating = 3))::int as r3,
         (count(*) filter (where rating = 4))::int as r4,
         (count(*) filter (where rating = 5))::int as r5
  from reviews
  group by lecturer_id;

-- Still anonymous: no user_id. Adds the new fields, the reviewer's traits and the vote score.
create or replace view public_reviews as
  select r.id, r.lecturer_id, r.rating, r.comment, r.created_at,
         r.difficulty, r.would_take_again,
         s.code as subject_code,
         coalesce((select array_agg(t.name order by t.name)
                   from review_tags rt join tags t on t.id = rt.tag_id
                   where rt.review_id = r.id), '{}'::text[]) as tag_names,
         coalesce((select sum(v.value)::int from review_votes v where v.review_id = r.id), 0) as score
  from reviews r
  left join subjects s on s.id = r.subject_id;

-- Traits per lecturer with how many reviewers picked each.
create or replace view lecturer_traits as
  select r.lecturer_id, t.id as tag_id, t.name, count(*)::int as uses
  from review_tags rt
  join reviews r on r.id = rt.review_id
  join tags t    on t.id = rt.tag_id
  group by r.lecturer_id, t.id, t.name;

create or replace view lecturer_directory with (security_invoker = true) as
select l.id, l.name, l.gender, l.photo_url,
       r.avg_rating,
       coalesce(r.review_count, 0) as review_count,
       subj.items  as subjects,
       tg.items    as tags,
       tg.names    as tag_names,
       concat_ws(' ', l.name, l.department, subj.search, tg.search) as search_text,
       l.department
from lecturers l
left join lecturer_ratings r on r.lecturer_id = l.id
cross join lateral (
  select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'code', s.code, 'name', s.name) order by s.code), '[]'::jsonb) as items,
         coalesce(string_agg(s.code || ' ' || s.name, ' '), '') as search
  from lecturer_subjects ls join subjects s on s.id = ls.subject_id
  where ls.lecturer_id = l.id
) subj
cross join lateral (
  select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name) order by t.name), '[]'::jsonb) as items,
         coalesce(array_agg(t.name order by t.name), '{}'::text[]) as names,
         coalesce(string_agg(t.name, ' '), '') as search
  from lecturer_tags lt join tags t on t.id = lt.tag_id
  where lt.lecturer_id = l.id
) tg;

grant select on lecturer_ratings, public_reviews, lecturer_traits, lecturer_directory to anon, authenticated;

-- ===== Functions the app calls (run as the signed-in user, so RLS still applies) =====
create or replace function public.submit_review(
  p_lecturer uuid, p_rating int, p_difficulty int, p_would_take_again boolean,
  p_subject uuid, p_comment text, p_tags uuid[]
) returns uuid
language plpgsql set search_path = public as $$
declare v_id uuid;
begin
  if coalesce(array_length(p_tags, 1), 0) > 5 then
    raise exception 'Choose up to 5 traits.' using errcode = 'P0001';
  end if;
  if p_subject is not null and not exists (
       select 1 from lecturer_subjects where lecturer_id = p_lecturer and subject_id = p_subject) then
    raise exception 'Pick a subject this lecturer teaches.' using errcode = 'P0001';
  end if;

  insert into reviews (lecturer_id, user_id, rating, difficulty, would_take_again, subject_id, comment)
  values (p_lecturer, auth.uid(), p_rating, p_difficulty, p_would_take_again, p_subject,
          nullif(trim(p_comment), ''))
  on conflict (lecturer_id, user_id) do update set
    rating = excluded.rating, difficulty = excluded.difficulty,
    would_take_again = excluded.would_take_again, subject_id = excluded.subject_id,
    comment = excluded.comment
  returning id into v_id;

  delete from review_tags where review_id = v_id;
  insert into review_tags (review_id, tag_id)
  select v_id, t from unnest(coalesce(p_tags, '{}'::uuid[])) as t;

  return v_id;
end $$;

-- p_value: 1 = up, -1 = down, 0 = remove my vote
create or replace function public.vote_review(p_review uuid, p_value int) returns void
language plpgsql set search_path = public as $$
begin
  if p_value = 0 then
    delete from review_votes where review_id = p_review and user_id = auth.uid();
  else
    insert into review_votes (review_id, user_id, value)
    values (p_review, auth.uid(), p_value)
    on conflict (review_id, user_id) do update set value = excluded.value;
  end if;
end $$;

revoke all on function public.submit_review(uuid, int, int, boolean, uuid, text, uuid[]) from public, anon;
revoke all on function public.vote_review(uuid, int) from public, anon;
grant execute on function public.submit_review(uuid, int, int, boolean, uuid, text, uuid[]) to authenticated;
grant execute on function public.vote_review(uuid, int) to authenticated;

-- Optional: fill in departments so they show under each name.
-- update lecturers set department = 'Information Technology' where name = 'Dr. Anh Nguyen';
