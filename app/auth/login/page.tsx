'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the unified sign-in page
    router.replace('/auth/sign-in');
  }, [router]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-center">
        <p className="text-fg-muted">Redirecting to sign-in...</p>
      </div>
    </div>
  );
}