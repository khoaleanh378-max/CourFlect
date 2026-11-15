import type { Lecturer } from '@/lib/types';

// Real photo if there is one, otherwise a stock avatar chosen by gender (per the design).
export default function LecturerPhoto({
  lecturer,
  className = '',
}: {
  lecturer: Pick<Lecturer, 'name' | 'gender' | 'photo_url'>;
  className?: string;
}) {
  const stock = lecturer.gender === 'male' || lecturer.gender === 'female' ? lecturer.gender : 'neutral';
  return (
    // Plain <img>: photo URLs can come from any host, and the stock avatars are tiny SVGs.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={`lecturer-photo ${className}`}
      src={lecturer.photo_url || `/avatars/${stock}.svg`}
      alt={`Photo of ${lecturer.name}`}
    />
  );
}
