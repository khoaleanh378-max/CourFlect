'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient, getCurrentUser } from '@/lib/supabase/server';

export type ReviewState = { ok?: boolean; error?: string };

const RATING = 'Choose a rating from 1 to 5 stars.';
const DIFFICULTY = 'Rate the difficulty from 1 to 5.';

const reviewSchema = z.object({
  lecturerId: z.string().uuid('Lecturer not found.'),
  rating: z.coerce.number().int(RATING).min(1, RATING).max(5, RATING),
  difficulty: z.coerce.number().int(DIFFICULTY).min(1, DIFFICULTY).max(5, DIFFICULTY),
  wouldTakeAgain: z.enum(['yes', 'no', '']).transform((v) => (v === '' ? null : v === 'yes')),
  subjectId: z.union([z.string().uuid(), z.literal('')]).transform((v) => v || null),
  tags: z.array(z.string().uuid()).max(5, 'Choose up to 5 traits.'),
  comment: z.string().trim().max(2000, 'Keep your review under 2000 characters.'),
});

// Row-level security and the database functions make the final decision; this maps their errors.
function dbMessage(error: { code?: string; message: string }, fallback: string) {
  if (error.code === '42501') return 'Your account can’t do this. Use your university email.';
  if (error.code === 'P0001') return error.message;
  if (error.code === '23503') return 'That lecturer, subject or trait no longer exists.';
  console.error(error);
  return fallback;
}

export async function submitReview(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const parsed = reviewSchema.safeParse({
    lecturerId: formData.get('lecturerId'),
    rating: formData.get('rating'),
    difficulty: formData.get('difficulty'),
    wouldTakeAgain: formData.get('wouldTakeAgain') ?? '',
    subjectId: formData.get('subjectId') ?? '',
    tags: formData.getAll('tags').map(String),
    comment: formData.get('comment') ?? '',
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in to review this lecturer.' };

  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.rpc('submit_review', {
    p_lecturer: v.lecturerId,
    p_rating: v.rating,
    p_difficulty: v.difficulty,
    p_would_take_again: v.wouldTakeAgain,
    p_subject: v.subjectId,
    p_comment: v.comment,
    p_tags: v.tags,
  });
  if (error) return { error: dbMessage(error, 'Couldn’t save your review. Try again.') };

  revalidatePath(`/lecturers/${v.lecturerId}`);
  return { ok: true };
}

// value: 1 = up, -1 = down, 0 = remove vote
export async function voteReview(
  reviewId: string,
  lecturerId: string,
  value: number
): Promise<{ error?: string }> {
  if (!z.string().uuid().safeParse(reviewId).success || ![-1, 0, 1].includes(value)) {
    return { error: 'Invalid vote.' };
  }
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in to vote.' };

  const supabase = await createClient();
  const { error } = await supabase.rpc('vote_review', { p_review: reviewId, p_value: value });
  if (error) {
    if (error.code === '42501') return { error: 'You can’t vote on this review.' };
    return { error: dbMessage(error, 'Couldn’t save your vote.') };
  }
  return {};
}

export async function reportReview(reviewId: string): Promise<{ error?: string }> {
  if (!z.string().uuid().safeParse(reviewId).success) return { error: 'Invalid review.' };
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in to report a review.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('review_reports')
    .insert({ review_id: reviewId, user_id: user.id });
  if (error && error.code !== '23505') {
    return { error: dbMessage(error, 'Couldn’t send your report.') }; // 23505 = already reported
  }
  return {};
}
