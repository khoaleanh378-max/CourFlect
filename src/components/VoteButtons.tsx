'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { voteReview } from '@/app/lecturers/[id]/actions';

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M12 5l7 8h-4v6H9v-6H5z" fill="currentColor" />
    </svg>
  );
}

export default function VoteButtons({
  reviewId,
  lecturerId,
  score,
  myVote,
  signedIn,
  disabled = false,
}: {
  reviewId: string;
  lecturerId: string;
  score: number;
  myVote: number;
  signedIn: boolean;
  disabled?: boolean; // your own review
}) {
  const router = useRouter();
  const [state, setState] = useState({ score, vote: myVote });
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  function cast(value: 1 | -1) {
    if (!signedIn) {
      router.push(`/login?next=/lecturers/${lecturerId}`);
      return;
    }
    const next = state.vote === value ? 0 : value;
    const previous = state;
    setError('');
    setState({ vote: next, score: state.score - state.vote + next }); // optimistic
    startTransition(async () => {
      const res = await voteReview(reviewId, lecturerId, next);
      if (res.error) {
        setState(previous);
        setError(res.error);
      }
    });
  }

  return (
    <div className="vote">
      <button
        type="button"
        aria-label="Upvote"
        aria-pressed={state.vote === 1}
        disabled={disabled || pending}
        onClick={() => cast(1)}
      >
        <Arrow />
      </button>
      <span aria-live="polite">{state.score}</span>
      <button
        type="button"
        className="down"
        aria-label="Downvote"
        aria-pressed={state.vote === -1}
        disabled={disabled || pending}
        onClick={() => cast(-1)}
      >
        <Arrow />
      </button>
      {error && <span className="form-error" role="alert">{error}</span>}
    </div>
  );
}
