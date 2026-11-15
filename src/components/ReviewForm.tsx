'use client';

import { useActionState, useState } from 'react';
import { submitReview, type ReviewState } from '@/app/lecturers/[id]/actions';
import type { MyReview, Subject, Tag } from '@/lib/types';

const MAX_TRAITS = 5;

export default function ReviewForm({
  lecturerId,
  subjects,
  tags,
  mine,
}: {
  lecturerId: string;
  subjects: Subject[];
  tags: Tag[];
  mine: MyReview | null;
}) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(submitReview, {});

  // Everything is controlled so a saved review isn't wiped when the form resets.
  const [rating, setRating] = useState(mine?.rating ?? 0);
  const [difficulty, setDifficulty] = useState(mine?.difficulty ?? 0);
  const [would, setWould] = useState(
    mine?.would_take_again == null ? '' : mine.would_take_again ? 'yes' : 'no'
  );
  const [subjectId, setSubjectId] = useState(mine?.subject_id ?? '');
  const [picked, setPicked] = useState<string[]>(mine?.tag_ids ?? []);
  const [comment, setComment] = useState(mine?.comment ?? '');

  const toggle = (id: string) =>
    setPicked((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : p.length < MAX_TRAITS ? [...p, id] : p
    );

  return (
    <form className="review-form" action={action}>
      <input type="hidden" name="lecturerId" value={lecturerId} />
      <input type="hidden" name="rating" value={rating} />
      <input type="hidden" name="difficulty" value={difficulty} />

      <fieldset>
        <legend>Overall rating</legend>
        <div className="rating-input">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={n <= rating ? 'on' : ''}
              aria-pressed={n <= rating}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              onClick={() => setRating(n)}
            >
              ★
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Difficulty (1 = very easy, 5 = very hard)</legend>
        <div className="num-input">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={n === difficulty ? 'on' : ''}
              aria-pressed={n === difficulty}
              onClick={() => setDifficulty(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </fieldset>

      {subjects.length > 0 && (
        <div>
          <label htmlFor="subjectId">Subject (optional)</label>
          <select id="subjectId" name="subjectId" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">Not specified</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.code} {s.name}</option>
            ))}
          </select>
        </div>
      )}

      <fieldset>
        <legend>Would you take this lecturer again?</legend>
        <div className="radio-row">
          {[['yes', 'Yes'], ['no', 'No'], ['', 'Not sure']].map(([value, label]) => (
            <label key={label} className="radio">
              <input
                type="radio"
                name="wouldTakeAgain"
                value={value}
                checked={would === value}
                onChange={() => setWould(value)}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {tags.length > 0 && (
        <fieldset>
          <legend>Traits (up to {MAX_TRAITS})</legend>
          <div className="chip-list">
            {tags.map((t) => {
              const on = picked.includes(t.id);
              return (
                <label key={t.id} className="chip-toggle">
                  <input
                    type="checkbox"
                    name="tags"
                    value={t.id}
                    checked={on}
                    disabled={!on && picked.length >= MAX_TRAITS}
                    onChange={() => toggle(t.id)}
                  />
                  <span>{t.name}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      <div>
        <label htmlFor="comment">Your review (optional)</label>
        <textarea
          id="comment"
          name="comment"
          rows={4}
          maxLength={2000}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What was it like to learn from this lecturer?"
        />
      </div>

      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      {state.ok && <p className="form-note" role="status">Review saved.</p>}

      <button className="btn" type="submit" disabled={pending}>
        {pending ? 'Posting…' : mine ? 'Update review' : 'Post review'}
      </button>
      <p className="form-note">Reviews are anonymous. Posting again replaces your earlier review.</p>
    </form>
  );
}
