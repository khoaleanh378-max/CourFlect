import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import LecturerCard from '@/components/LecturerCard';
import { getTags, listLecturers, PAGE_SIZE } from '@/lib/data';

export const metadata: Metadata = { title: 'Reflect' };

type Props = { searchParams: Promise<{ q?: string; tag?: string; page?: string }> };

function href(params: { q?: string; tag?: string; page?: number }) {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.tag) qs.set('tag', params.tag);
  if (params.page && params.page > 1) qs.set('page', String(params.page));
  const s = qs.toString();
  return s ? `/reflect?${s}` : '/reflect';
}

export default async function Reflect({ searchParams }: Props) {
  const sp = await searchParams;
  const q = (sp.q ?? '').trim().slice(0, 100);
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);

  const tags = await getTags();
  // Only accept tags that exist, so a hand-edited URL can't send odd values to the query.
  const tag = tags.find((t) => t.name === sp.tag)?.name ?? '';

  const { lecturers, total } = await listLecturers({ q, tag, page });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <Header />
      <main className="reflect">
        <form className="search" role="search" action="/reflect">
          <label htmlFor="search">Search lecturers, subjects or tags</label>
          <div className="search-row">
            <input id="search" name="q" defaultValue={q} maxLength={100} />
            {tag && <input type="hidden" name="tag" value={tag} />}
            <button className="btn" type="submit">Search</button>
          </div>
        </form>

        {tags.length > 0 && (
          <div className="tag-filter" role="group" aria-label="Filter by tag">
            {tags.map((t) => (
              <Link
                key={t.id}
                href={href({ q, tag: tag === t.name ? '' : t.name })}
                className={tag === t.name ? 'on' : ''}
                aria-current={tag === t.name ? 'true' : undefined}
              >
                {t.name}
              </Link>
            ))}
          </div>
        )}

        {lecturers.length === 0 ? (
          <p className="empty">No lecturers match. Try a different name, subject or tag.</p>
        ) : (
          <>
            <p className="results-note">
              {total} {total === 1 ? 'lecturer' : 'lecturers'}
            </p>
            <div className="card-grid">
              {lecturers.map((l) => (
                <LecturerCard key={l.id} lecturer={l} />
              ))}
            </div>
          </>
        )}

        {pages > 1 && (
          <nav className="pagination" aria-label="Pages">
            {page > 1 && <Link href={href({ q, tag, page: page - 1 })}>Previous</Link>}
            <span>Page {page} of {pages}</span>
            {page < pages && <Link href={href({ q, tag, page: page + 1 })}>Next</Link>}
          </nav>
        )}
      </main>
    </>
  );
}
