'use client';

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="page-message">
      <h1>Something went wrong</h1>
      <p className="form-error">{error.message}</p>
      <button className="btn" type="button" onClick={reset}>Try again</button>
    </main>
  );
}
