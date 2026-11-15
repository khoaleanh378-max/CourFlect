import Link from 'next/link';
import Header from '@/components/Header';
import LecturerCard from '@/components/LecturerCard';
import { getTopRated } from '@/lib/data';

// Hero copy and image: swap these for your final content.
// For an image, put a file in /public (e.g. hero.jpg) and set HERO_IMAGE = '/hero.jpg'.
const HERO_TEXT = 'See how your lecturers teach, and share how they taught you';
const HERO_IMAGE: string | null = null;

export default async function Home() {
  const featured = await getTopRated(3).catch(() => []); // the hero still works if data fails

  return (
    <>
      <Header />
      <section
        className="hero"
        style={HERO_IMAGE ? { backgroundImage: `url(${HERO_IMAGE})` } : undefined}
      >
        <h1>{HERO_TEXT}</h1>
      </section>

      {featured.length > 0 && (
        <section className="featured">
          <h2>Top rated</h2>
          <div className="card-grid">
            {featured.map((l) => (
              <LecturerCard key={l.id} lecturer={l} />
            ))}
          </div>
          <p>
            <Link href="/reflect">Browse all lecturers</Link>
          </p>
        </section>
      )}
    </>
  );
}
