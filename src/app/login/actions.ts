'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { safeNext } from '@/lib/format';

export type AuthState = { error?: string; notice?: string };

const credentials = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentials.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: 'Email or password is incorrect.' };

  redirect(safeNext(String(formData.get('next') ?? '/'))); // throws; keep outside try/catch
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentials.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Friendly early message. The database enforces the real rule (allowed_email_domains).
  const domain = process.env.ALLOWED_EMAIL_DOMAIN?.trim().toLowerCase();
  if (domain && !parsed.data.email.endsWith(`@${domain}`)) {
    return { error: `Use your @${domain} email address.` };
  }

  const name = String(formData.get('name') ?? '').trim().slice(0, 60);
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL || (await headers()).get('origin') || 'http://localhost:3000';

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { data: name ? { name } : {}, emailRedirectTo: `${origin}/auth/confirm` },
  });
  if (error) return { error: error.message };

  if (data.session) redirect('/'); // email confirmation is off: already signed in
  return { notice: 'Check your email to confirm your account, then sign in.' };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
