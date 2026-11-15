import Link from 'next/link';
import type { Lecturer } from '@/lib/types';
import Stars from './Stars';
import LecturerPhoto from './LecturerPhoto';

export default function LecturerCard({ lecturer }: { lecturer: Lecturer }) {
  return (
    <Link href={`/lecturers/${lecturer.id}`} className="lecturer-card">
      <LecturerPhoto lecturer={lecturer} />
      <div className="lecturer-card-body">
        <h3>{lecturer.name}</h3>
        <Stars rating={lecturer.avg_rating} size="sm" />
        {lecturer.tags.length > 0 && (
          <p className="card-tags">{lecturer.tags.map((t) => t.name).join(', ')}</p>
        )}
        {lecturer.subjects.length > 0 && (
          <p className="card-subjects">{lecturer.subjects.map((s) => s.code).join(', ')}</p>
        )}
      </div>
    </Link>
  );
}
