'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AARedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/aa-demo');
  }, [router]);
  return null;
}
