package proxy

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/cinaconnect/rpc-proxy/internal/cache"
	"github.com/cinaconnect/rpc-proxy/internal/config"
)

// RPCProxy routes JSON-RPC requests through a prioritized provider chain:
// local node → primary provider → fallback providers.
type RPCProxy struct {
	cfg    *config.Config
	cache  *cache.MultiCache
	client *http.Client
}

// NewRPCProxy creates a new proxy with the configured provider chain.
func NewRPCProxy(cfg *config.Config, c *cache.MultiCache) (*RPCProxy, error) {
	return &RPCProxy{
		cfg:   cfg,
		cache: c,
		client: &http.Client{
			Timeout: 30 * time.Second,
			Transport: &http.Transport{
				MaxIdleConns:        100,
				MaxIdleConnsPerHost: 20,
				IdleConnTimeout:     90 * time.Second,
			},
		},
	}, nil
}

// Execute routes an RPC call through the provider chain for the given chain ID.
func (p *RPCProxy) Execute(ctx context.Context, chainID, method string, params json.RawMessage) (interface{}, error) {
	netCfg, ok := p.cfg.Providers[chainID]
	if !ok {
		return nil, fmt.Errorf("no provider configured for chain %s", chainID)
	}

	// Build the JSON-RPC request body
	body, err := json.Marshal(map[string]interface{}{
		"jsonrpc": "2.0",
		"method":  method,
		"params":  params,
		"id":      1,
	})
	if err != nil {
		return nil, fmt.Errorf("marshal request: %w", err)
	}

	// Determine routing strategy based on method type
	if isReadOnly(method) {
		// Read-only: try local node → primary → fallbacks
		return p.routeRead(ctx, netCfg, body)
	}
	// Write methods: direct to local node or primary
	return p.routeWrite(ctx, netCfg, body)
}

// isReadOnly returns true for methods that don't modify state.
func isReadOnly(method string) bool {
	switch method {
	case "eth_call",
		"eth_getBalance",
		"eth_blockNumber",
		"eth_getBlockByNumber",
		"eth_getBlockByHash",
		"eth_getTransactionReceipt",
		"eth_getLogs",
		"eth_getCode",
		"eth_getStorageAt",
		"eth_gasPrice",
		"eth_estimateGas",
		"net_version",
		"eth_chainId":
		return true
	default:
		return false
	}
}

// routeRead tries providers in order: local → primary → fallbacks.
func (p *RPCProxy) routeRead(ctx context.Context, netCfg config.NetworkConfig, body []byte) (interface{}, error) {
	var providers []config.Provider

	// Local node first (fastest, free)
	if netCfg.LocalNode.URL != "" {
		providers = append(providers, netCfg.LocalNode)
	}

	// Primary provider
	if netCfg.Primary.URL != "" {
		providers = append(providers, netCfg.Primary)
	}

	// Fallbacks
	providers = append(providers, netCfg.Fallbacks...)

	if len(providers) == 0 {
		return nil, fmt.Errorf("no providers available for chain")
	}

	var lastErr error
	for _, provider := range providers {
		result, err := p.callProvider(ctx, provider, body)
		if err == nil {
			return result, nil
		}
		log.Printf("provider %s failed: %v", provider.URL, err)
		lastErr = err
	}

	return nil, fmt.Errorf("all providers failed: %w", lastErr)
}

// routeWrite sends write transactions to the most trusted provider.
func (p *RPCProxy) routeWrite(ctx context.Context, netCfg config.NetworkConfig, body []byte) (interface{}, error) {
	// Prefer local node for write operations (most trusted)
	if netCfg.LocalNode.URL != "" {
		result, err := p.callProvider(ctx, netCfg.LocalNode, body)
		if err == nil {
			return result, nil
		}
		log.Printf("local node failed for write: %v", err)
	}

	// Fall back to primary provider
	if netCfg.Primary.URL != "" {
		return p.callProvider(ctx, netCfg.Primary, body)
	}

	// Try fallbacks
	for _, fb := range netCfg.Fallbacks {
		result, err := p.callProvider(ctx, fb, body)
		if err == nil {
			return result, nil
		}
	}

	return nil, fmt.Errorf("no available provider for write operation")
}

// callProvider sends a JSON-RPC request to a single provider and parses the response.
func (p *RPCProxy) callProvider(ctx context.Context, provider config.Provider, body []byte) (interface{}, error) {
	req, err := http.NewRequestWithContext(ctx, "POST", provider.URL, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	// Add API key header if configured
	if provider.APIKey != "" {
		req.Header.Set("Authorization", "Bearer "+provider.APIKey)
	}

	resp, err := p.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("http request to %s: %w", provider.URL, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("provider %s returned %d: %s", provider.URL, resp.StatusCode, string(bodyBytes))
	}

	var rpcResp struct {
		JSONRPC string          `json:"jsonrpc"`
		Result  interface{}     `json:"result"`
		Error   *RPCError       `json:"error"`
		ID      json.RawMessage `json:"id"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&rpcResp); err != nil {
		return nil, fmt.Errorf("decode response: %w", err)
	}

	if rpcResp.Error != nil {
		return nil, fmt.Errorf("rpc error %d: %s", rpcResp.Error.Code, rpcResp.Error.Message)
	}

	return rpcResp.Result, nil
}

// RPCError represents a JSON-RPC error response.
type RPCError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}
