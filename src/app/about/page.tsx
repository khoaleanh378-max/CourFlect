import type { Metadata } from 'next';
import Header from '@/components/Header';

export const metadata: Metadata = { title: 'About' };

export default function About() {
  return (
    <>
      <Header />
      <main className="page-message">
        <h1>About CouRflect</h1>
        <p>
          CouRflect is a research project that lets students review and reflect on the lecturers
          they have learned from.
        </p>
        {/* Replace with your project's aim, ethics notes, and contact details. */}
        <p>
          Reviews are anonymous and tied to a verified student account, with one review per
          lecturer.
        </p>
      </main>
    </>
  );
}
