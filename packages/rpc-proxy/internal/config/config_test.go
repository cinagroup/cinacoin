package config

import (
	"os"
	"path/filepath"
	"testing"
)

func TestDefaultConfig(t *testing.T) {
	cfg := DefaultConfig()

	if cfg.ListenAddr != ":8545" {
		t.Errorf("expected listen_addr :8545, got %s", cfg.ListenAddr)
	}
	if cfg.Region != "local" {
		t.Errorf("expected region 'local', got %s", cfg.Region)
	}
	if cfg.RedisURL != "redis://127.0.0.1:6379" {
		t.Errorf("expected redis://127.0.0.1:6379, got %s", cfg.RedisURL)
	}
	if cfg.Cache.MaxLocalCacheMB != 2048 {
		t.Errorf("expected MaxLocalCacheMB=2048, got %d", cfg.Cache.MaxLocalCacheMB)
	}
	if cfg.Cache.KeyStrategy != "sha256" {
		t.Errorf("expected KeyStrategy=sha256, got %s", cfg.Cache.KeyStrategy)
	}
	if cfg.Dedup.WindowMs != 5000 {
		t.Errorf("expected WindowMs=5000, got %d", cfg.Dedup.WindowMs)
	}
	if cfg.RateLimit.Global.RequestsPerSecond != 10000 {
		t.Errorf("expected Global RPS=10000, got %d", cfg.RateLimit.Global.RequestsPerSecond)
	}
	if cfg.RateLimit.PerIP.RequestsPerSecond != 100 {
		t.Errorf("expected PerIP RPS=100, got %d", cfg.RateLimit.PerIP.RequestsPerSecond)
	}
	if len(cfg.Providers) != 0 {
		t.Errorf("expected empty Providers map, got %d entries", len(cfg.Providers))
	}
}

func TestLoad_DefaultsWhenNoFile(t *testing.T) {
	cfg, err := Load("/tmp/nonexistent-config.yaml")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.ListenAddr != ":8545" {
		t.Errorf("expected default listen_addr, got %s", cfg.ListenAddr)
	}
}

func TestLoad_FromYAML(t *testing.T) {
	content := `
listen_addr: "0.0.0.0:9090"
region: "us-east-1"
redis_url: "redis://cache:6379"
cache:
  max_local_cache_mb: 512
  key_strategy: simple
  read_method_ttls:
    eth_call: 30
    eth_getBalance: 60
dedup:
  window_ms: 3000
rate_limit:
  global:
    requests_per_second: 500
    burst_size: 1000
  per_key:
    requests_per_minute: 5000
    burst_size: 500
  per_ip:
    requests_per_second: 50
    burst_size: 100
providers:
  "1":
    chain_id: 1
    local_node:
      url: http://localhost:8545
    primary:
      url: https://eth.example.com
      api_key: test-key
    fallbacks:
      - url: https://fallback.example.com
`

	tmp := filepath.Join(t.TempDir(), "test-config.yaml")
	if err := os.WriteFile(tmp, []byte(content), 0644); err != nil {
		t.Fatalf("failed to write test config: %v", err)
	}

	cfg, err := Load(tmp)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if cfg.ListenAddr != "0.0.0.0:9090" {
		t.Errorf("expected 0.0.0.0:9090, got %s", cfg.ListenAddr)
	}
	if cfg.Region != "us-east-1" {
		t.Errorf("expected us-east-1, got %s", cfg.Region)
	}
	if cfg.RedisURL != "redis://cache:6379" {
		t.Errorf("expected redis://cache:6379, got %s", cfg.RedisURL)
	}
	if cfg.Cache.MaxLocalCacheMB != 512 {
		t.Errorf("expected MaxLocalCacheMB=512, got %d", cfg.Cache.MaxLocalCacheMB)
	}
	if cfg.Cache.KeyStrategy != "simple" {
		t.Errorf("expected simple, got %s", cfg.Cache.KeyStrategy)
	}
	if cfg.Cache.ReadMethodTTLs["eth_call"] != 30 {
		t.Errorf("expected eth_call TTL=30, got %d", cfg.Cache.ReadMethodTTLs["eth_call"])
	}
	if cfg.Cache.ReadMethodTTLs["eth_getBalance"] != 60 {
		t.Errorf("expected eth_getBalance TTL=60, got %d", cfg.Cache.ReadMethodTTLs["eth_getBalance"])
	}
	if cfg.Dedup.WindowMs != 3000 {
		t.Errorf("expected WindowMs=3000, got %d", cfg.Dedup.WindowMs)
	}
	if cfg.RateLimit.Global.RequestsPerSecond != 500 {
		t.Errorf("expected Global RPS=500, got %d", cfg.RateLimit.Global.RequestsPerSecond)
	}

	// Check provider chain
	netCfg, ok := cfg.Providers["1"]
	if !ok {
		t.Fatal("expected provider for chain 1")
	}
	if netCfg.ChainID != 1 {
		t.Errorf("expected chain_id=1, got %d", netCfg.ChainID)
	}
	if netCfg.LocalNode.URL != "http://localhost:8545" {
		t.Errorf("unexpected local node URL: %s", netCfg.LocalNode.URL)
	}
	if netCfg.Primary.URL != "https://eth.example.com" {
		t.Errorf("unexpected primary URL: %s", netCfg.Primary.URL)
	}
	if netCfg.Primary.APIKey != "test-key" {
		t.Errorf("unexpected primary API key: %s", netCfg.Primary.APIKey)
	}
	if len(netCfg.Fallbacks) != 1 {
		t.Errorf("expected 1 fallback, got %d", len(netCfg.Fallbacks))
	}
	if netCfg.Fallbacks[0].URL != "https://fallback.example.com" {
		t.Errorf("unexpected fallback URL: %s", netCfg.Fallbacks[0].URL)
	}
}

func TestLoad_InvalidYAML(t *testing.T) {
	content := `
listen_addr: [not a string
  bad: yaml: {{{
`
	tmp := filepath.Join(t.TempDir(), "bad-config.yaml")
	if err := os.WriteFile(tmp, []byte(content), 0644); err != nil {
		t.Fatalf("failed to write test config: %v", err)
	}

	_, err := Load(tmp)
	if err == nil {
		t.Fatal("expected error for invalid YAML")
	}
}

func TestLoad_EnvVarOverrides(t *testing.T) {
	// Set env vars
	os.Setenv("PROXY_LISTEN_ADDR", "0.0.0.0:7777")
	os.Setenv("PROXY_REDIS_URL", "redis://override:6379")
	os.Setenv("PROXY_REGION", "eu-west-1")
	defer func() {
		os.Unsetenv("PROXY_LISTEN_ADDR")
		os.Unsetenv("PROXY_REDIS_URL")
		os.Unsetenv("PROXY_REGION")
	}()

	// Minimal config file
	content := `listen_addr: "file-value:8080"`
	tmp := filepath.Join(t.TempDir(), "env-config.yaml")
	if err := os.WriteFile(tmp, []byte(content), 0644); err != nil {
		t.Fatalf("failed to write test config: %v", err)
	}

	cfg, err := Load(tmp)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if cfg.ListenAddr != "0.0.0.0:7777" {
		t.Errorf("expected env override 0.0.0.0:7777, got %s", cfg.ListenAddr)
	}
	if cfg.RedisURL != "redis://override:6379" {
		t.Errorf("expected env override redis URL, got %s", cfg.RedisURL)
	}
	if cfg.Region != "eu-west-1" {
		t.Errorf("expected env override eu-west-1, got %s", cfg.Region)
	}
}

func TestLoad_PartialConfigUsesDefaults(t *testing.T) {
	content := `
listen_addr: "127.0.0.1:3000"
`
	tmp := filepath.Join(t.TempDir(), "partial-config.yaml")
	if err := os.WriteFile(tmp, []byte(content), 0644); err != nil {
		t.Fatalf("failed to write test config: %v", err)
	}

	cfg, err := Load(tmp)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if cfg.ListenAddr != "127.0.0.1:3000" {
		t.Errorf("expected 127.0.0.1:3000, got %s", cfg.ListenAddr)
	}
	// Other fields should use defaults
	if cfg.Region != "local" {
		t.Errorf("expected default region, got %s", cfg.Region)
	}
	if cfg.Dedup.WindowMs != 5000 {
		t.Errorf("expected default WindowMs, got %d", cfg.Dedup.WindowMs)
	}
}
