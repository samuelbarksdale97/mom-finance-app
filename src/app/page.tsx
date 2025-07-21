'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function Home() {
  const { user, loading, initializing } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect after Firebase has finished initializing
    if (!loading && !initializing) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/auth/signin');
      }
    }
  }, [user, loading, initializing, router]);

  // Show loading screen while Firebase is initializing or redirecting
  if (loading || initializing) {
    return <LoadingScreen message="Checking if you're already signed in..." progress={50} />;
  }

  return null; // This should never render as we redirect above
}