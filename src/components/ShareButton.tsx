'use client';

import { useState } from 'react';

export default function ShareButton({ reviewId }: { reviewId: string }) {
  const [label, setLabel] = useState('Share');

  async function share() {
    const url = `${window.location.origin}${window.location.pathname}#review-${reviewId}`;
    try {
      await navigator.clipboard.writeText(url);
      setLabel('Link copied');
    } catch {
      // Clipboard needs a secure page (https or localhost): fall back to a prompt.
      window.prompt('Copy this link', url);
    }
    setTimeout(() => setLabel('Share'), 2000);
  }

  return (
    <button type="button" className="link-action" onClick={share}>
      {label}
    </button>
  );
}
