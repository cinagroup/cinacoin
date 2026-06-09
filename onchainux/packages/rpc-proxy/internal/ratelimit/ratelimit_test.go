package ratelimit

import (
	"testing"
	"time"

	"github.com/onchainux/rpc-proxy/internal/config"
)

func TestNewRateLimiter(t *testing.T) {
	cfg := config.RateLimitConfig{
		Global: config.GlobalRateLimit{
			RequestsPerSecond: 100,
			BurstSize:         200,
		},
		PerKey: config.PerKeyRateLimit{
			RequestsPerMinute: 6000,
			BurstSize:         1000,
		},
		PerIP: config.PerIPRateLimit{
			RequestsPerSecond: 50,
			BurstSize:         100,
		},
	}

	rl := NewRateLimiter(cfg)
	if rl == nil {
		t.Fatal("expected non-nil RateLimiter")
	}
}

func TestNewRateLimiterNoLimit(t *testing.T) {
	cfg := config.RateLimitConfig{
		Global: config.GlobalRateLimit{
			RequestsPerSecond: 0, // no limit
			BurstSize:         0,
		},
	}

	rl := NewRateLimiter(cfg)
	if rl == nil {
		t.Fatal("expected non-nil RateLimiter")
	}
	// With no limit, all requests should be allowed
	for i := 0; i < 1000; i++ {
		if !rl.AllowGlobal() {
			t.Fatalf("global rate limiter should allow all requests when limit is 0, blocked at %d", i)
		}
	}
}

func TestAllowGlobal_BurstConsumed(t *testing.T) {
	cfg := config.RateLimitConfig{
		Global: config.GlobalRateLimit{
			RequestsPerSecond: 1000, // very high rate
			BurstSize:         5,    // small burst
		},
	}

	rl := NewRateLimiter(cfg)

	// First 5 should be allowed (burst)
	for i := 0; i < 5; i++ {
		if !rl.AllowGlobal() {
			t.Fatalf("expected AllowGlobal()=true for burst call %d", i)
		}
	}

	// 6th should be denied (burst consumed)
	if rl.AllowGlobal() {
		t.Fatal("expected AllowGlobal()=false after burst consumed")
	}
}

func TestAllowKey_CreatesLimiterOnDemand(t *testing.T) {
	cfg := config.RateLimitConfig{
		Global: config.GlobalRateLimit{
			RequestsPerSecond: 1000,
			BurstSize:         1000,
		},
		PerKey: config.PerKeyRateLimit{
			RequestsPerMinute: 60, // 1 per second
			BurstSize:         2,
		},
		PerIP: config.PerIPRateLimit{
			RequestsPerSecond: 100,
			BurstSize:         100,
		},
	}

	rl := NewRateLimiter(cfg)

	// First call for a new key should create limiter and allow
	if !rl.AllowKey("api-key-1") {
		t.Fatal("expected AllowKey()=true for first call")
	}
}

func TestAllowKey_DifferentKeysIndependent(t *testing.T) {
	cfg := config.RateLimitConfig{
		Global: config.GlobalRateLimit{
			RequestsPerSecond: 1000,
			BurstSize:         1000,
		},
		PerKey: config.PerKeyRateLimit{
			RequestsPerMinute: 60,
			BurstSize:         2,
		},
		PerIP: config.PerIPRateLimit{
			RequestsPerSecond: 100,
			BurstSize:         100,
		},
	}

	rl := NewRateLimiter(cfg)

	// Exhaust key-1's burst
	_ = rl.AllowKey("key-1")
	_ = rl.AllowKey("key-1")

	// Key-2 should still be allowed (independent limiter)
	if !rl.AllowKey("key-2") {
		t.Fatal("expected key-2 to be independent of key-1")
	}
}

func TestAllowIP_CreatesLimiterOnDemand(t *testing.T) {
	cfg := config.RateLimitConfig{
		Global: config.GlobalRateLimit{
			RequestsPerSecond: 1000,
			BurstSize:         1000,
		},
		PerKey: config.PerKeyRateLimit{
			RequestsPerMinute: 6000,
			BurstSize:         1000,
		},
		PerIP: config.PerIPRateLimit{
			RequestsPerSecond: 10,
			BurstSize:         3,
		},
	}

	rl := NewRateLimiter(cfg)

	if !rl.AllowIP("192.168.1.1") {
		t.Fatal("expected AllowIP()=true for first call")
	}
}

func TestAllowIP_DifferentIPsIndependent(t *testing.T) {
	cfg := config.RateLimitConfig{
		Global: config.GlobalRateLimit{
			RequestsPerSecond: 1000,
			BurstSize:         1000,
		},
		PerKey: config.PerKeyRateLimit{
			RequestsPerMinute: 6000,
			BurstSize:         1000,
		},
		PerIP: config.PerIPRateLimit{
			RequestsPerSecond: 10,
			BurstSize:         2,
		},
	}

	rl := NewRateLimiter(cfg)

	// Exhaust IP 1's burst
	_ = rl.AllowIP("10.0.0.1")
	_ = rl.AllowIP("10.0.0.1")

	// IP 2 should still be allowed
	if !rl.AllowIP("10.0.0.2") {
		t.Fatal("expected IP 2 to be independent of IP 1")
	}
}

func TestAllowMethod_NoConfigAllows(t *testing.T) {
	cfg := config.RateLimitConfig{
		Global: config.GlobalRateLimit{
			RequestsPerSecond: 1000,
			BurstSize:         1000,
		},
		PerKey: config.PerKeyRateLimit{
			RequestsPerMinute: 6000,
			BurstSize:         1000,
		},
		PerIP: config.PerIPRateLimit{
			RequestsPerSecond: 100,
			BurstSize:         100,
		},
	}

	rl := NewRateLimiter(cfg)

	// No method limits configured — should always allow
	if !rl.AllowMethod("eth_call") {
		t.Fatal("expected AllowMethod()=true when no method limits configured")
	}
}

func TestAllowMethod_WithLimitsAllows(t *testing.T) {
	cfg := config.RateLimitConfig{
		Global: config.GlobalRateLimit{
			RequestsPerSecond: 1000,
			BurstSize:         1000,
		},
		PerKey: config.PerKeyRateLimit{
			RequestsPerMinute: 6000,
			BurstSize:         1000,
		},
		PerIP: config.PerIPRateLimit{
			RequestsPerSecond: 100,
			BurstSize:         100,
		},
		Methods: map[string]string{
			"eth_call":     "100/s",
			"eth_getLogs":  "10/m",
		},
	}

	rl := NewRateLimiter(cfg)

	// Method limits exist but parseRate is a no-op, so always allow
	if !rl.AllowMethod("eth_call") {
		t.Fatal("expected AllowMethod()=true for configured method")
	}
}

func TestParseRate(t *testing.T) {
	// parseRate is a simplified parser that just returns the input string
	var n int
	var period time.Duration
	result, err := parseRate("50/s", &n, &period)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result != "50/s" {
		t.Errorf("expected '50/s', got '%s'", result)
	}
}
