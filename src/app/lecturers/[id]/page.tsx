import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import LecturerHero from '@/components/LecturerHero';
import ReviewSection from '@/components/ReviewSection';
import {
  getLecturer,
  getLecturerStats,
  getMyReview,
  getReviews,
  getSimilar,
  getTags,
  getTraits,
} from '@/lib/data';
import { getCurrentUser } from '@/lib/supabase/server';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const lecturer = await getLecturer(id);
  return { title: lecturer ? lecturer.name : 'Lecturer not found' };
}

export default async function LecturerPage({ params }: Props) {
  const { id } = await params;
  const lecturer = await getLecturer(id);
  if (!lecturer) notFound();

  const user = await getCurrentUser();
  const signedIn = Boolean(user);

  const [stats, traits, similar, reviews, mine, tags] = await Promise.all([
    getLecturerStats(id),
    getTraits(id),
    getSimilar(lecturer),
    getReviews(id, signedIn),
    signedIn ? getMyReview(id) : Promise.resolve(null),
    getTags(),
  ]);

  return (
    <>
      <Header minimal />
      <main>
        <LecturerHero lecturer={lecturer} stats={stats} traits={traits} similar={similar} />
        <ReviewSection
          lecturer={lecturer}
          stats={stats}
          reviews={reviews}
          mine={mine}
          tags={tags}
          signedIn={signedIn}
        />
      </main>
    </>
  );
}
