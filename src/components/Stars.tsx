const STAR = 'M12 1.5l3.1 6.9 7.4.8-5.5 5 1.6 7.4L12 17.9 5.4 21.6 7 14.2l-5.5-5 7.4-.8z';

function Star({ fill }: { fill: number }) {
  return (
    <span className="star">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d={STAR} className="star-empty" /></svg>
      <span className="star-fill" style={{ width: `${fill * 100}%` }}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d={STAR} className="star-full" /></svg>
      </span>
    </span>
  );
}

// rating 0-5 (decimals fill partially); null means unrated.
export default function Stars({
  rating,
  size = 'md',
}: {
  rating: number | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}) {
  const value = rating ?? 0;
  return (
    <span
      className={`stars stars-${size}`}
      role="img"
      aria-label={rating == null ? 'No ratings yet' : `Rated ${rating} out of 5`}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} fill={Math.max(0, Math.min(1, value - i))} />
      ))}
    </span>
  );
}
