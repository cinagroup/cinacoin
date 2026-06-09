package config

import (
	"fmt"
	"os"
	"time"

	"gopkg.in/yaml.v3"
)

// Config holds the full proxy configuration.
type Config struct {
	// HTTP listen address (e.g., "0.0.0.0:8545").
	ListenAddr string `yaml:"listen_addr"`
	// Deployment region identifier.
	Region string `yaml:"region"`

	// Redis connection string for caching and deduplication.
	RedisURL string `yaml:"redis_url"`

	// Multi-level cache configuration.
	Cache CacheConfig `yaml:"cache"`
	// Request deduplication configuration.
	Dedup DedupConfig `yaml:"dedup"`
	// Rate limiting configuration.
	RateLimit RateLimitConfig `yaml:"rate_limit"`
	// Provider chain configuration per network.
	Providers map[string]NetworkConfig `yaml:"providers"`
	// Allowed CORS origins (empty defaults to cinacoin.com subdomains).
	AllowedOrigins []string `yaml:"allowed_origins"`
}

// CORSOrigins returns the configured allowed origins, defaulting to cinacoin.com subdomains.
func (c *Config) CORSOrigins() []string {
	if len(c.AllowedOrigins) > 0 {
		return c.AllowedOrigins
	}
	return []string{
		"https://cinacoin.com",
		"https://*.cinacoin.com",
		"https://cinacoin.pages.dev",
		"http://localhost:3000",
		"http://localhost:8787",
	}
}

// CacheConfig configures the multi-level cache.
type CacheConfig struct {
	// Per-method cache TTLs in seconds.
	ReadMethodTTLs map[string]int `yaml:"read_method_ttls"`
	// Maximum local cache size in MB.
	MaxLocalCacheMB int `yaml:"max_local_cache_mb"`
	// Cache key strategy.
	KeyStrategy string `yaml:"key_strategy"` // "sha256" or "simple"
}

// DedupConfig configures request deduplication.
type DedupConfig struct {
	// Deduplication window in milliseconds.
	WindowMs int `yaml:"window_ms"`
}

// RateLimitConfig configures rate limiting.
type RateLimitConfig struct {
	Global   GlobalRateLimit   `yaml:"global"`
	PerKey   PerKeyRateLimit   `yaml:"per_key"`
	PerIP    PerIPRateLimit    `yaml:"per_ip"`
	Methods  map[string]string `yaml:"method_limits"` // method -> "N/period"
}

type GlobalRateLimit struct {
	RequestsPerSecond int `yaml:"requests_per_second"`
	BurstSize         int `yaml:"burst_size"`
}

type PerKeyRateLimit struct {
	RequestsPerMinute int `yaml:"requests_per_minute"`
	BurstSize         int `yaml:"burst_size"`
}

type PerIPRateLimit struct {
	RequestsPerSecond int `yaml:"requests_per_second"`
	BurstSize         int `yaml:"burst_size"`
}

// NetworkConfig defines the provider chain for a single network.
type NetworkConfig struct {
	// Chain ID (e.g., 1 for Ethereum mainnet).
	ChainID int `yaml:"chain_id"`
	// Local full node (lowest priority cost, highest trust).
	LocalNode Provider `yaml:"local_node"`
	// Primary public provider.
	Primary Provider `yaml:"primary"`
	// Fallback providers (tried in order on failure).
	Fallbacks []Provider `yaml:"fallbacks"`
}

// Provider represents a single JSON-RPC upstream.
type Provider struct {
	URL     string        `yaml:"url"`
	APIKey  string        `yaml:"api_key,omitempty"`
	Timeout time.Duration `yaml:"timeout"`
}

// DefaultConfig returns a Config with sensible defaults.
func DefaultConfig() *Config {
	return &Config{
		ListenAddr: ":8545",
		Region:     "local",
		RedisURL:   "redis://127.0.0.1:6379",
		Cache: CacheConfig{
			ReadMethodTTLs: map[string]int{
				"eth_blockNumber":          2,
				"eth_getBlockByNumber":     12,
				"eth_call":                 12,
				"eth_getBalance":           30,
				"eth_getTransactionReceipt": 300,
				"eth_getLogs":              600,
			},
			MaxLocalCacheMB: 2048,
			KeyStrategy:     "sha256",
		},
		Dedup: DedupConfig{
			WindowMs: 5000,
		},
		RateLimit: RateLimitConfig{
			Global: GlobalRateLimit{
				RequestsPerSecond: 10000,
				BurstSize:         20000,
			},
			PerKey: PerKeyRateLimit{
				RequestsPerMinute: 100000,
				BurstSize:         200000,
			},
			PerIP: PerIPRateLimit{
				RequestsPerSecond: 100,
				BurstSize:         500,
			},
		},
		Providers: make(map[string]NetworkConfig),
	}
}

// Load reads a YAML config file and returns a Config with defaults applied.
func Load(path string) (*Config, error) {
	cfg := DefaultConfig()

	data, err := os.ReadFile(path)
	if err != nil {
		// If no config file found, use defaults
		if os.IsNotExist(err) {
			return cfg, nil
		}
		return nil, fmt.Errorf("read config: %w", err)
	}

	if err := yaml.Unmarshal(data, cfg); err != nil {
		return nil, fmt.Errorf("parse config: %w", err)
	}

	// Override with environment variables if set
	if v := os.Getenv("PROXY_LISTEN_ADDR"); v != "" {
		cfg.ListenAddr = v
	}
	if v := os.Getenv("PROXY_REDIS_URL"); v != "" {
		cfg.RedisURL = v
	}
	if v := os.Getenv("PROXY_REGION"); v != "" {
		cfg.Region = v
	}
	if v := os.Getenv("PROXY_ALLOWED_ORIGINS"); v != "" {
		cfg.AllowedOrigins = splitAndTrim(v)
	}

	return cfg, nil
}

func splitAndTrim(s string) []string {
	parts := make([]string, 0)
	for _, p := range splitAny(s, ",;") {
		p = trimSpace(p)
		if p != "" {
			parts = append(parts, p)
		}
	}
	return parts
}

func splitAny(s, sep string) []string {
	result := []string{}
	start := 0
	for i := 0; i < len(s); i++ {
		for j := 0; j < len(sep); j++ {
			if s[i] == sep[j] {
				result = append(result, s[start:i])
				start = i + 1
			}
		}
	}
	result = append(result, s[start:])
	return result
}

func trimSpace(s string) string {
	start := 0
	end := len(s)
	for start < end && (s[start] == ' ' || s[start] == '\t') {
		start++
	}
	for end > start && (s[end-1] == ' ' || s[end-1] == '\t') {
		end--
	}
	return s[start:end]
}
