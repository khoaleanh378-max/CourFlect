import Link from 'next/link';
import type { Lecturer, LecturerStats, Trait } from '@/lib/types';
import Stars from './Stars';
import LecturerPhoto from './LecturerPhoto';

const LABELS = ['Awesome', 'Great', 'Good', 'OK', 'Awful']; // 5 → 1 stars

export default function LecturerHero({
  lecturer,
  stats,
  traits,
  similar,
}: {
  lecturer: Lecturer;
  stats: LecturerStats | null;
  traits: Trait[];
  similar: Lecturer[];
}) {
  const total = stats?.review_count ?? 0;

  return (
    <section className="detail">
      <div className="detail-inner">
        <div className="detail-main">
          <div className="detail-head">
            <div className="detail-title">
              <h1>{lecturer.name}</h1>
              <Stars rating={lecturer.avg_rating} size="lg" />
            </div>
            {lecturer.department && <p className="dept">{lecturer.department}</p>}
            {lecturer.tags.length > 0 && (
              <ul className="tag-list" aria-label="Tags">
                {lecturer.tags.map((t) => (
                  <li key={t.id}>
                    <Link href={`/reflect?tag=${encodeURIComponent(t.name)}`}>{t.name}</Link>
                  </li>
                ))}
              </ul>
            )}

            <div className="score-row">
              <div className="score-big">
                <b>{stats && total > 0 ? stats.avg_rating.toFixed(1) : '–'}</b>
                <span>/ 5</span>
              </div>
              <p className="score-note">
                Overall quality
                <br />
                {total > 0 ? `Based on ${total} ${total === 1 ? 'rating' : 'ratings'}` : 'No ratings yet'}
              </p>
              {stats?.would_take_again_pct != null && (
                <div className="stat">
                  <b>{stats.would_take_again_pct}%</b>
                  <span>Would take again</span>
                </div>
              )}
              {stats?.avg_difficulty != null && (
                <div className="stat">
                  <b>{stats.avg_difficulty.toFixed(1)}</b>
                  <span>Level of difficulty</span>
                </div>
              )}
            </div>

            <a href="#write-review" className="btn detail-cta">Rate this lecturer</a>
          </div>

          <section className="subjects-box" aria-label="Subjects and traits">
            <div className="box-block">
              <h2>Subjects taught</h2>
              {lecturer.subjects.length > 0 ? (
                <ul className="chip-list">
                  {lecturer.subjects.map((s) => (
                    <li className="chip" key={s.id}>{s.code} {s.name}</li>
                  ))}
                </ul>
              ) : (
                <p>No subjects listed yet.</p>
              )}
            </div>
            {traits.length > 0 && (
              <div className="box-block">
                <h2>Top traits from reviews</h2>
                <ul className="chip-list">
                  {traits.map((t) => (
                    <li className="chip" key={t.name}>
                      {t.name}
                      <b aria-label={`${t.uses} reviews`}>{t.uses}</b>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>

        <aside className="detail-side">
          <LecturerPhoto lecturer={lecturer} className="detail-photo" />
          <section className="dist-card" aria-labelledby="dist-h">
            <h2 id="dist-h">Rating distribution</h2>
            {stats && total > 0 ? (
              LABELS.map((label, i) => {
                const count = stats.distribution[i];
                return (
                  <div className="dist-row" key={label}>
                    <span>{label} <b>{5 - i}</b></span>
                    <div className="dist-track">
                      <div className="dist-fill" style={{ width: `${(count / total) * 100}%` }} />
                    </div>
                    <b>{count}</b>
                  </div>
                );
              })
            ) : (
              <p className="empty">No ratings yet.</p>
            )}
          </section>
        </aside>

        {similar.length > 0 && (
          <section className="similar" aria-labelledby="sim-h">
            <h2 id="sim-h">Similar lecturers</h2>
            {similar.map((l) => (
              <Link key={l.id} href={`/lecturers/${l.id}`}>
                <span className="mini-score">{l.avg_rating?.toFixed(1)}</span>
                {l.name}
              </Link>
            ))}
          </section>
        )}
      </div>
    </section>
  );
}
