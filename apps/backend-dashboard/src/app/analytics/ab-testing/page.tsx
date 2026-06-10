'use client';

import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

interface Experiment {
  id: string;
  name: string;
  status: string;
  variants: unknown[];
}

interface Stats {
  variantId: string;
  variantName: string;
  assignments: number;
  conversions: number;
  conversionRate: number;
}

export default function ABTestingPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [results, setResults] = useState<Record<string, Stats[]>>({});
  const [error, setError] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.cinacoin.com';

  useEffect(() => {
    // 获取所有实验
    fetch(`${API_BASE}/ab/admin/experiments`)
      .then(res => res.json())
      .then(data => setExperiments(data.experiments || []))
      .catch(err => {
        logger.error('Failed to fetch experiments', err);
        setError(err.message);
      });
  }, []);

  useEffect(() => {
    // 获取每个实验的结果
    experiments.forEach(async (exp) => {
      const response = await fetch(`${API_BASE}/ab/results/${exp.id}`);
      const data = await response.json();
      setResults(prev => ({ ...prev, [exp.id]: data.stats }));
    });
  }, [experiments]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-heading-1">A/B Testing</h1>
      
      <div className="space-y-6">
        {experiments.map(exp => (
          <div key={exp.id} className="cc-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-heading-2">{exp.name}</h2>
              <span className={`px-3 py-1 rounded-full text-caption ${
                exp.status === 'running' ? 'bg-success/10 text-success' :
                exp.status === 'paused' ? 'bg-warning/10 text-warning' :
                'bg-canvas-soft text-mute'
              }`}>
                {exp.status}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {results[exp.id]?.map(stat => (
                <div key={stat.variantId} className="p-4 bg-canvas-soft rounded-lg">
                  <p className="text-body font-medium mb-2">{stat.variantName}</p>
                  <p className="text-heading-3 text-link mb-1">{stat.conversionRate}%</p>
                  <p className="text-caption text-mute">
                    {stat.conversions} / {stat.assignments} conversions
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
