import type { Metadata } from 'next';
import Header from '@/components/Header';
import AuthPanel from '@/components/AuthPanel';
import { safeNext } from '@/lib/format';

export const metadata: Metadata = { title: 'Sign in' };

type Props = { searchParams: Promise<{ next?: string; error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <>
      <Header minimal />
      <main className="auth">
        <AuthPanel next={safeNext(sp.next)} confirmError={sp.error === 'confirm'} />
      </main>
    </>
  );
}
