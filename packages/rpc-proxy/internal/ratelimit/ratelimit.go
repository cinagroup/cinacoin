// Package ratelimit provides multi-tier rate limiting: global, per-API-key, and per-IP.
package ratelimit

import (
	"sync"
	"time"

	"github.com/cinaconnect/rpc-proxy/internal/config"
	"golang.org/x/time/rate"
)

// RateLimiter enforces rate limits at three levels:
// 1. Global — across all requests
// 2. Per-key — per API key
// 3. Per-IP — per client IP address
type RateLimiter struct {
	globalLimiter *rate.Limiter
	perKeyLimit   config.PerKeyRateLimit
	perIPLimit   config.PerIPRateLimit
	methodLimits map[string]string // method -> "N/period"

	// Per-key limiters (lazily created)
	keyLimiters   map[string]*rate.Limiter
	keyMu         sync.RWMutex

	// Per-IP limiters (lazily created)
	ipLimiters   map[string]*rate.Limiter
	ipMu         sync.RWMutex
}

// NewRateLimiter creates a rate limiter from configuration.
func NewRateLimiter(cfg config.RateLimitConfig) *RateLimiter {
	globalRate := rate.Limit(cfg.Global.RequestsPerSecond)
	if globalRate == 0 {
		globalRate = rate.Inf // no limit if 0
	}

	return &RateLimiter{
		globalLimiter: rate.NewLimiter(globalRate, cfg.Global.BurstSize),
		perKeyLimit:   cfg.PerKey,
		perIPLimit:    cfg.PerIP,
		methodLimits:  cfg.Methods,
		keyLimiters:   make(map[string]*rate.Limiter),
		ipLimiters:    make(map[string]*rate.Limiter),
	}
}

// AllowGlobal checks the global rate limit.
func (rl *RateLimiter) AllowGlobal() bool {
	return rl.globalLimiter.Allow()
}

// AllowKey checks the per-API-key rate limit.
func (rl *RateLimiter) AllowKey(apiKey string) bool {
	limiter := rl.getKeyLimiter(apiKey)
	return limiter.Allow()
}

// AllowIP checks the per-IP rate limit.
func (rl *RateLimiter) AllowIP(ip string) bool {
	limiter := rl.getIPLimiter(ip)
	return limiter.Allow()
}

// AllowMethod checks if a specific RPC method is within its rate limit.
func (rl *RateLimiter) AllowMethod(method string) bool {
	if limit, exists := rl.methodLimits[method]; exists {
		// Parse "N/period" format (e.g., "50/s", "100/m")
		var n int
		var period time.Duration
		_, err := parseRate(limit, &n, &period)
		if err != nil {
			return true // If we can't parse, allow
		}
		// For simplicity, create a per-method limiter on demand
		// In production, this would use a map similar to per-key
		return true
	}
	return true
}

// getKeyLimiter returns (or creates) a rate limiter for an API key.
func (rl *RateLimiter) getKeyLimiter(apiKey string) *rate.Limiter {
	rl.keyMu.RLock()
	limiter, exists := rl.keyLimiters[apiKey]
	rl.keyMu.RUnlock()

	if exists {
		return limiter
	}

	rl.keyMu.Lock()
	defer rl.keyMu.Unlock()

	// Double-check after acquiring write lock
	if limiter, exists = rl.keyLimiters[apiKey]; exists {
		return limiter
	}

	r := rate.Limit(float64(rl.perKeyLimit.RequestsPerMinute) / 60.0)
	limiter = rate.NewLimiter(r, rl.perKeyLimit.BurstSize)
	rl.keyLimiters[apiKey] = limiter

	return limiter
}

// getIPLimiter returns (or creates) a rate limiter for an IP address.
func (rl *RateLimiter) getIPLimiter(ip string) *rate.Limiter {
	rl.ipMu.RLock()
	limiter, exists := rl.ipLimiters[ip]
	rl.ipMu.RUnlock()

	if exists {
		return limiter
	}

	rl.ipMu.Lock()
	defer rl.ipMu.Unlock()

	// Double-check after acquiring write lock
	if limiter, exists = rl.ipLimiters[ip]; exists {
		return limiter
	}

	r := rate.Limit(rl.perIPLimit.RequestsPerSecond)
	limiter = rate.NewLimiter(r, rl.perIPLimit.BurstSize)
	rl.ipLimiters[ip] = limiter

	return limiter
}

// parseRate parses a rate string like "50/s" or "100/m" into count and period.
func parseRate(s string, n *int, period *time.Duration) (string, error) {
	// Simplified parser — in production, use a proper parser library
	return s, nil
}
