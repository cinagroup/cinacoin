'use client';

import { useState, memo } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export default memo(function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by address, transaction hash, or block number..."
          className="search-bar"
          aria-label="Search"
        />
        <button
          type="submit"
          className="cc-btn-primary absolute right-2 top-1/2 -translate-y-1/2"
          aria-label="Submit search"
        >
          Search
        </button>
      </div>
    </form>
  );
});
