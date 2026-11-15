import { cache } from 'react';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { Lecturer, LecturerStats, MyReview, Review, Tag, Trait } from '@/lib/types';

export const PAGE_SIZE = 12;

type LecturerRow = Omit<Lecturer, 'avg_rating'> & { avg_rating: number | string | null };

const toLecturer = (r: LecturerRow): Lecturer => ({
  ...r,
  avg_rating: r.avg_rating == null ? null : Number(r.avg_rating),
});

// Make user input match literally inside ILIKE.
const escapeLike = (s: string) => s.replace(/[\\%_]/g, '\\$&');

// Search, tag filter and pagination all run in Postgres (lecturer_directory view).
export async function listLecturers({
  q = '',
  tag = '',
  page = 1,
}: { q?: string; tag?: string; page?: number } = {}) {
  const supabase = await createClient();
  let query = supabase
    .from('lecturer_directory')
    .select('*', { count: 'exact' })
    .order('name');

  const term = q.trim();
  if (term) query = query.ilike('search_text', `%${escapeLike(term)}%`);
  if (tag) query = query.contains('tag_names', [tag]);

  const from = (page - 1) * PAGE_SIZE;
  const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
  if (error) throw new Error(error.message);

  return { lecturers: (data as LecturerRow[]).map(toLecturer), total: count ?? 0 };
}

export async function getTopRated(limit = 3) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('lecturer_directory')
    .select('*')
    .not('avg_rating', 'is', null)
    .order('avg_rating', { ascending: false })
    .order('review_count', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data as LecturerRow[]).map(toLecturer);
}

export const getLecturer = cache(async (id: string): Promise<Lecturer | null> => {
  if (!z.string().uuid().safeParse(id).success) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('lecturer_directory')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toLecturer(data as LecturerRow) : null;
});

export async function getTags(): Promise<Tag[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('tags').select('id, name').order('name');
  if (error) throw new Error(error.message);
  return data;
}

// Reads the anonymous view: reviewers' user ids are never selectable.
export async function getReviews(lecturerId: string, signedIn = false): Promise<Review[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('public_reviews')
    .select('id, rating, difficulty, would_take_again, comment, created_at, subject_code, tag_names, score')
    .eq('lecturer_id', lecturerId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  // The signed-in user's own votes (row-level security only returns their rows).
  const myVotes = new Map<string, number>();
  if (signedIn && data.length > 0) {
    const { data: votes } = await supabase
      .from('review_votes')
      .select('review_id, value')
      .in('review_id', data.map((r) => r.id));
    votes?.forEach((v) => myVotes.set(v.review_id, v.value));
  }

  return data.map((r) => ({ ...r, my_vote: myVotes.get(r.id) ?? 0 })) as Review[];
}

export async function getLecturerStats(id: string): Promise<LecturerStats | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('lecturer_ratings')
    .select('*')
    .eq('lecturer_id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    avg_rating: Number(data.avg_rating),
    review_count: data.review_count,
    avg_difficulty: data.avg_difficulty == null ? null : Number(data.avg_difficulty),
    would_take_again_pct: data.would_take_again_pct,
    distribution: [data.r5, data.r4, data.r3, data.r2, data.r1],
  };
}

// Traits reviewers picked most often for this lecturer.
export async function getTraits(id: string, limit = 8): Promise<Trait[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('lecturer_traits')
    .select('name, uses')
    .eq('lecturer_id', id)
    .order('uses', { ascending: false })
    .order('name')
    .limit(limit);
  if (error) throw new Error(error.message);
  return data;
}

// Lecturers sharing at least one tag, best rated first. Non-critical, so failures return [].
export async function getSimilar(lecturer: Lecturer, limit = 3): Promise<Lecturer[]> {
  const supabase = await createClient();
  let query = supabase
    .from('lecturer_directory')
    .select('*')
    .neq('id', lecturer.id)
    .not('avg_rating', 'is', null)
    .order('avg_rating', { ascending: false })
    .limit(limit);
  const names = lecturer.tags.map((t) => t.name);
  if (names.length > 0) query = query.overlaps('tag_names', names);
  const { data, error } = await query;
  if (error) return [];
  return (data as LecturerRow[]).map(toLecturer);
}

// The signed-in user's own review of this lecturer (null if none yet).
export async function getMyReview(lecturerId: string): Promise<MyReview | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('reviews')
    .select('id, rating, difficulty, would_take_again, subject_id, comment, review_tags(tag_id)')
    .eq('lecturer_id', lecturerId)
    .maybeSingle();
  if (error || !data) return null;
  const { review_tags, ...rest } = data as typeof data & { review_tags: { tag_id: string }[] };
  return { ...rest, tag_ids: review_tags.map((t) => t.tag_id) } as MyReview;
}
