'use client';

import { useState } from 'react';
import { useI18n } from '@/providers/I18nProvider';

export function NewsletterForm({ source = 'website' }: { source?: string }) {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('https://users.cinacoin.com/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, source }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.alreadySubscribed 
          ? t('newsletter.already_subscribed')
          : t('newsletter.check_email'));
      } else {
        setStatus('error');
        setMessage(data.error || t('newsletter.error'));
      }
    } catch (error) {
      setStatus('error');
      setMessage(t('newsletter.error'));
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <svg className="w-12 h-12 text-green-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <p className="text-green-700 font-medium">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder={t('newsletter.name_placeholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="px-4 py-3 bg-white border border-[#ebebeb] rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#0070f3] focus:border-transparent text-[14px]"
        />
        <input
          type="email"
          placeholder={t('newsletter.email_placeholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="px-4 py-3 bg-white border border-[#ebebeb] rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#0070f3] focus:border-transparent text-[14px]"
        />
      </div>
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full px-8 py-3 bg-[#171717] hover:bg-[#2a2a2a] text-white rounded-[6px] font-medium text-[14px] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === 'loading' ? t('newsletter.subscribing') : t('newsletter.subscribe')}
      </button>
      {status === 'error' && (
        <p className="text-red-500 text-sm text-center">{message}</p>
      )}
    </form>
  );
}
