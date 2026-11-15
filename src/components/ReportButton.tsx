'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { reportReview } from '@/app/lecturers/[id]/actions';

export default function ReportButton({
  reviewId,
  lecturerId,
  signedIn,
}: {
  reviewId: string;
  lecturerId: string;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  async function report() {
    if (!signedIn) {
      router.push(`/login?next=/lecturers/${lecturerId}`);
      return;
    }
    if (!window.confirm('Report this review as inappropriate?')) return;
    setStatus('sending');
    const res = await reportReview(reviewId);
    setStatus(res.error ? 'error' : 'done');
  }

  return (
    <button
      type="button"
      className="link-action"
      onClick={report}
      disabled={status === 'sending' || status === 'done'}
    >
      {status === 'done' ? 'Reported' : status === 'error' ? 'Failed, retry' : 'Report'}
    </button>
  );
}
