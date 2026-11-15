import Link from 'next/link';
import { getCurrentUser } from '@/lib/supabase/server';
import { accountName } from '@/lib/format';
import { signOut } from '@/app/login/actions';

// `minimal` hides the nav links: the lecturer page in the Figma shows only logo + account.
export default async function Header({ minimal = false }: { minimal?: boolean }) {
  const user = await getCurrentUser();

  return (
    <header className="site-header">
      <Link href="/" className="logo">CouRflect</Link>

      <div className="header-right">
        {!minimal && (
          <nav className="main-nav" aria-label="Main">
            <Link href="/">Home</Link>
            <Link href="/reflect">Reflect</Link>
            <Link href="/about">About</Link>
          </nav>
        )}

        {user ? (
          <details className="account">
            <summary>
              <span className="account-name">{accountName(user)}</span>
              <span className="avatar" aria-hidden="true" />
            </summary>
            <div className="account-menu">
              <form action={signOut}>
                <button type="submit">Sign out</button>
              </form>
            </div>
          </details>
        ) : (
          <Link href="/login" className="account">
            <span className="account-name">Sign in</span>
            <span className="avatar" aria-hidden="true" />
          </Link>
        )}
      </div>
    </header>
  );
}
