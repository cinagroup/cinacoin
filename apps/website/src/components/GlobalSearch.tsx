'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/providers/I18nProvider';

interface SearchResult {
  id: string;
  type: 'page' | 'doc' | 'product' | 'blog';
  title: string;
  description: string;
  url: string;
  category: string;
}

export function GlobalSearch() {
  const { t } = useI18n();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // 键盘快捷键 Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 搜索
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`https://api.cinacoin.com/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults(data.results);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Search error:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      navigateTo(results[selectedIndex].url);
    }
  };

  const navigateTo = (url: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(url);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--cc-body)] bg-[var(--cc-canvas-soft)] border border-[var(--cc-hairline)] rounded-lg hover:border-[var(--cc-link)] transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span>{t('search.placeholder')}</span>
        <kbd className="hidden md:inline-flex px-1.5 py-0.5 text-xs bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded">⌘K</kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50" onClick={() => setIsOpen(false)}>
      <div 
        className="w-full max-w-2xl bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 搜索输入 */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--cc-hairline)]">
          <svg className="w-5 h-5 text-[var(--cc-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('search.placeholder')}
            className="flex-1 bg-transparent outline-none text-[var(--cc-ink)]"
            autoFocus
          />
          <button
            onClick={() => setIsOpen(false)}
            className="text-[var(--cc-muted)] hover:text-[var(--cc-ink)]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 搜索结果 */}
        <div ref={resultsRef} className="max-h-96 overflow-y-auto p-2">
          {query.length < 2 ? (
            <p className="text-center text-[var(--cc-body)] py-8">{t('search.min_chars')}</p>
          ) : loading ? (
            <p className="text-center text-[var(--cc-body)] py-8">{t('search.loading')}</p>
          ) : results.length === 0 ? (
            <p className="text-center text-[var(--cc-body)] py-8">{t('search.no_results')}</p>
          ) : (
            <ul className="space-y-1">
              {results.map((result, index) => (
                <li key={result.id}>
                  <button
                    onClick={() => navigateTo(result.url)}
                    className={`w-full flex items-start gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      index === selectedIndex ? 'bg-[var(--cc-link)]/10' : 'hover:bg-[var(--cc-canvas-soft)]'
                    }`}
                  >
                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-[var(--cc-canvas-soft-2)] flex items-center justify-center text-caption">
                      {result.type === 'page' && '📄'}
                      {result.type === 'doc' && '📚'}
                      {result.type === 'product' && '📦'}
                      {result.type === 'blog' && '📝'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[var(--cc-ink)] font-medium truncate">{result.title}</p>
                      <p className="text-caption text-[var(--cc-body)] truncate">{result.description}</p>
                    </div>
                    <span className="flex-shrink-0 text-caption text-[var(--cc-muted)]">{result.category}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 底部提示 */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--cc-hairline)] text-caption text-[var(--cc-muted)]">
          <div className="flex items-center gap-4">
            <span>↑↓ {t('search.navigate')}</span>
            <span>↵ {t('search.select')}</span>
            <span>esc {t('search.close')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
