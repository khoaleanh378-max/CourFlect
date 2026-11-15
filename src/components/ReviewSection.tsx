import Link from 'next/link';
import type { Lecturer, LecturerStats, MyReview, Review, Tag } from '@/lib/types';
import ReviewCard from './ReviewCard';
import ReviewForm from './ReviewForm';

export default function ReviewSection({
  lecturer,
  stats,
  reviews,
  mine,
  tags,
  signedIn,
}: {
  lecturer: Lecturer;
  stats: LecturerStats | null;
  reviews: Review[];
  mine: MyReview | null;
  tags: Tag[];
  signedIn: boolean;
}) {
  return (
    <section className="reviews">
      <h2>
        Reviews
        {stats && stats.review_count > 0 && (
          <span className="reviews-summary">
            {stats.avg_rating.toFixed(1)} average from {stats.review_count}{' '}
            {stats.review_count === 1 ? 'review' : 'reviews'}
          </span>
        )}
      </h2>

      <div id="write-review" className="write-review">
        {signedIn ? (
          <>
            <h3>{mine ? 'Update your review' : 'Write a review'}</h3>
            <ReviewForm
              lecturerId={lecturer.id}
              subjects={lecturer.subjects}
              tags={tags}
              mine={mine}
            />
          </>
        ) : (
          <p className="form-note">
            <Link href={`/login?next=/lecturers/${lecturer.id}`}>Sign in</Link> to review this lecturer.
          </p>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="empty">No reviews yet. Be the first to reflect on this lecturer.</p>
      ) : (
        <ul className="review-list">
          {reviews.map((r) => (
            <ReviewCard
              key={r.id}
              review={r}
              lecturerId={lecturer.id}
              signedIn={signedIn}
              isOwn={mine?.id === r.id}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
