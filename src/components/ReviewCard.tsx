import type { Review } from '@/lib/types';
import { timeAgo } from '@/lib/time';
import VoteButtons from './VoteButtons';
import ShareButton from './ShareButton';
import ReportButton from './ReportButton';

export default function ReviewCard({
  review,
  lecturerId,
  signedIn,
  isOwn,
}: {
  review: Review;
  lecturerId: string;
  signedIn: boolean;
  isOwn: boolean;
}) {
  // A stable pseudo-number from the review id: it can't identify the author.
  const anon = String(parseInt(review.id.slice(0, 4), 16) % 10000).padStart(4, '0');

  return (
    <li className="review" id={`review-${review.id}`}>
      <div className="review-badges">
        <div className="badge badge-rating">
          <b>{review.rating}</b>
          <span>Rating</span>
        </div>
        <div className="badge badge-difficulty">
          <b>{review.difficulty ?? '–'}</b>
          <span>Difficulty</span>
        </div>
      </div>

      <div className="review-body">
        <div className="review-meta">
          <strong>{isOwn ? 'Your review' : `Anonymous ${anon}`}</strong>
          {review.subject_code && <span className="pill-dark">Subject: {review.subject_code}</span>}
        </div>

        {review.comment ? (
          <p className="review-text">{review.comment}</p>
        ) : (
          <p className="review-text muted">No written comment.</p>
        )}

        {(review.would_take_again != null || review.tag_names.length > 0) && (
          <ul className="chip-list review-chips">
            {review.would_take_again != null && (
              <li className="chip chip-strong">
                Would take again: {review.would_take_again ? 'Yes' : 'No'}
              </li>
            )}
            {review.tag_names.map((t) => (
              <li className="chip" key={t}>{t}</li>
            ))}
          </ul>
        )}

        <div className="review-actions">
          <VoteButtons
            reviewId={review.id}
            lecturerId={lecturerId}
            score={review.score}
            myVote={review.my_vote}
            signedIn={signedIn}
            disabled={isOwn}
          />
          <span className="spacer" />
          {!isOwn && <ReportButton reviewId={review.id} lecturerId={lecturerId} signedIn={signedIn} />}
          <ShareButton reviewId={review.id} />
        </div>

        <time className="review-time" dateTime={review.created_at}>
          {timeAgo(review.created_at)}
        </time>
      </div>
    </li>
  );
}
