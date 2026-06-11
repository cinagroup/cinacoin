'use client';

import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

interface PerformanceData {
  date: string;
  avg: number;
  good: number;
  count: number;
}

export default function PerformancePage() {
  const [data, setData] = useState<Record<string, PerformanceData[]>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.cinacoin.com';
    fetch(`${API_BASE}/analytics/performance?days=7`)
      .then(res => res.json())
      .then(data => setData(data.results))
      .catch(err => {
        logger.error('Failed to fetch performance data', err);
        setError(err.message);
      });
  }, []);

  const metrics = [
    { name: 'LCP', label: 'Largest Contentful Paint', threshold: 2500, unit: 'ms' },
    { name: 'FID', label: 'First Input Delay', threshold: 100, unit: 'ms' },
    { name: 'CLS', label: 'Cumulative Layout Shift', threshold: 0.1, unit: '' },
    { name: 'FCP', label: 'First Contentful Paint', threshold: 1800, unit: 'ms' },
    { name: 'TTFB', label: 'Time to First Byte', threshold: 800, unit: 'ms' },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-heading-1">Performance monitoring.</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map(metric => (
          <div key={metric.name} className="cc-card p-6">
            <h3 className="text-body font-medium mb-2">{metric.label}</h3>
            <p className="text-heading-2 text-link mb-4">
              {data[metric.name]?.[0]?.avg || '-'} {metric.unit}
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-caption">
                <span>Good</span>
                <span>{data[metric.name]?.[0]?.good || 0}%</span>
              </div>
              <div className="h-2 bg-canvas-soft rounded-full overflow-hidden">
                <div 
                  className="h-full bg-success"
                  style={{ width: `${data[metric.name]?.[0]?.good || 0}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
