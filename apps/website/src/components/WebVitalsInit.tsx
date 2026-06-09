'use client';

import { useEffect } from 'react';
import { initWebVitals } from '@/lib/analytics';
import { initErrorTracking } from '@/lib/error-tracking';

export default function WebVitalsInit() {
  useEffect(() => {
    initWebVitals();
    initErrorTracking();
  }, []);

  return null;
}
