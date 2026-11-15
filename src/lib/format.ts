import type { User } from '@supabase/supabase-js';

// "AccountName" in the design: the user's name, falling back to the email's local part.
export function accountName(user: User): string {
  const name = user.user_metadata?.name;
  return (typeof name === 'string' && name) || user.email?.split('@')[0] || 'Account';
}

// Only allow redirects to paths on this site.
export function safeNext(value: string | null | undefined): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}
