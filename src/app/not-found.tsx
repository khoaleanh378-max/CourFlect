import Link from 'next/link';
import Header from '@/components/Header';

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="page-message">
        <h1>Page not found</h1>
        <p><Link href="/reflect">Browse all lecturers</Link></p>
      </main>
    </>
  );
}
