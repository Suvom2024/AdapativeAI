'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';

function AuthCallbackContent() {
  const router = useRouter();

  useEffect(() => {
    // The backend handles the OAuth callback and redirects here
    // Check if we have a session by trying to get user info
    const checkAuth = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/auth/me`, {
          credentials: 'include',
        });
        if (response.ok) {
          const user = await response.json();
          router.push(`/dashboard/${user.role}`);
        } else {
          router.push('/');
        }
      } catch (error) {
        router.push('/');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-slate-600">Completing authentication...</p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}

