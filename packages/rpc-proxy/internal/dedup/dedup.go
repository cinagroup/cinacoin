// Package dedup provides request deduplication within a configurable time window.
//
// When multiple identical RPC requests arrive within the dedup window (default 5s),
// only the first request is executed upstream. All subsequent identical requests
// wait for and receive the same result.
package dedup

import (
	"context"
	"sync"
	"time"
)

// Deduplicator manages in-flight request deduplication.
type Deduplicator struct {
	window    time.Duration
	pending   map[string]*dedupEntry
	mu        sync.Mutex
}

// dedupEntry holds the state for a single in-flight request.
type dedupEntry struct {
	ctx    context.Context
	cancel context.CancelFunc
	result interface{}
	err    error
	done   chan struct{}
}

// NewDeduplicator creates a deduplicator with the given dedup window.
func NewDeduplicator(window time.Duration) *Deduplicator {
	d := &Deduplicator{
		window:  window,
		pending: make(map[string]*dedupEntry),
	}

	// Start a cleanup goroutine to remove expired entries
	go d.cleanupLoop()

	return d
}

// Do executes the given function, deduplicating calls with the same key.
//
// If another call with the same key is already in flight, this call waits
// for its result instead of executing the function again.
func (d *Deduplicator) Do(ctx context.Context, key string, fn func(context.Context) (interface{}, error)) (interface{}, error) {
	d.mu.Lock()

	// Check if there's already an in-flight request for this key
	if entry, exists := d.pending[key]; exists {
		// Wait for the existing request to complete
		d.mu.Unlock()

		select {
		case <-entry.done:
			return entry.result, entry.err
		case <-ctx.Done():
			return nil, ctx.Err()
		}
	}

	// Create a new entry
	entry := &dedupEntry{
		done: make(chan struct{}),
	}
	entry.ctx, entry.cancel = context.WithCancel(ctx)
	d.pending[key] = entry
	d.mu.Unlock()

	// Execute the function
	entry.result, entry.err = fn(entry.ctx)

	// Mark as done and broadcast to waiters
	close(entry.done)

	// Clean up the entry after the window expires
	time.AfterFunc(d.window, func() {
		d.mu.Lock()
		delete(d.pending, key)
		d.mu.Unlock()
	})

	return entry.result, entry.err
}

// cleanupLoop periodically removes entries older than the dedup window.
func (d *Deduplicator) cleanupLoop() {
	ticker := time.NewTicker(d.window)
	defer ticker.Stop()

	for range ticker.C {
		d.mu.Lock()
		for key, entry := range d.pending {
			select {
			case <-entry.done:
				// Entry is done and past window — safe to remove
				delete(d.pending, key)
			default:
				// Still in flight, leave it
			}
		}
		d.mu.Unlock()
	}
}
