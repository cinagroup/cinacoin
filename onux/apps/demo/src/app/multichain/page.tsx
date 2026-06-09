'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MultichainRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/multi-chain');
  }, [router]);
  return null;
}
