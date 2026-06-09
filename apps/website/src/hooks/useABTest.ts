import { useState, useEffect } from 'react';

interface Assignment {
  experimentId: string;
  variantId: string;
  variantName: string;
  value: any;
}

export function useABTest(experimentId: string) {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssignment() {
      try {
        const response = await fetch('https://api.cinacoin.com/ab/experiments');
        const data = await response.json();
        
        const expAssignment = data.assignments[experimentId];
        setAssignment(expAssignment || null);
      } catch (error) {
        console.error('Failed to fetch A/B test assignment:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAssignment();
  }, [experimentId]);

  const trackConversion = async (eventName: string, metadata?: any) => {
    if (!assignment) return;

    try {
      await fetch('https://api.cinacoin.com/ab/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName,
          experimentId: assignment.experimentId,
          variantId: assignment.variantId,
          metadata,
        }),
      });
    } catch (error) {
      console.error('Failed to track conversion:', error);
    }
  };

  return { assignment, loading, trackConversion };
}
