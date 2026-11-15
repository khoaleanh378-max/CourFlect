'use client';

import { useActionState, useState } from 'react';
import { signIn, signUp, type AuthState } from '@/app/login/actions';

function Feedback({ state }: { state: AuthState }) {
  return (
    <>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      {state.notice && <p className="form-note" role="status">{state.notice}</p>}
    </>
  );
}

function SignInForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, {});
  return (
    <form action={action}>
      <input type="hidden" name="next" value={next} />
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" required autoComplete="email" />
      <label htmlFor="password">Password</label>
      <input id="password" name="password" type="password" required autoComplete="current-password" />
      <Feedback state={state} />
      <button className="btn" type="submit" disabled={pending}>
        {pending ? 'Please wait…' : 'Sign in'}
      </button>
    </form>
  );
}

function SignUpForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, {});
  return (
    <form action={action}>
      <label htmlFor="name">Display name</label>
      <input id="name" name="name" autoComplete="nickname" maxLength={60} />
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" required autoComplete="email" />
      <label htmlFor="password">Password</label>
      <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
      <Feedback state={state} />
      <button className="btn" type="submit" disabled={pending}>
        {pending ? 'Please wait…' : 'Create account'}
      </button>
    </form>
  );
}

export default function AuthPanel({ next, confirmError }: { next: string; confirmError: boolean }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  return (
    <>
      <h1>{mode === 'signin' ? 'Sign in' : 'Create an account'}</h1>
      {confirmError && (
        <p className="form-error" role="alert">
          That confirmation link is invalid or has expired. Sign up again to get a new one.
        </p>
      )}
      {mode === 'signin' ? <SignInForm next={next} /> : <SignUpForm />}
      <p className="form-note">
        {mode === 'signin' ? 'New here? ' : 'Already have an account? '}
        <button
          type="button"
          className="link-btn"
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        >
          {mode === 'signin' ? 'Create an account' : 'Sign in'}
        </button>
      </p>
    </>
  );
}
