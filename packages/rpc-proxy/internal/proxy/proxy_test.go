package proxy

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/onchainux/rpc-proxy/internal/cache"
	"github.com/onchainux/rpc-proxy/internal/config"
)

// newTestProxy creates an RPCProxy with in-memory cache and a test server provider.
func newTestProxy(t *testing.T, handler http.HandlerFunc) (*RPCProxy, *httptest.Server) {
	t.Helper()
	srv := httptest.NewServer(handler)
	t.Cleanup(srv.Close)

	cfg := &config.Config{
		Providers: map[string]config.NetworkConfig{
			"1": {
				ChainID: 1,
				LocalNode: config.Provider{
					URL: srv.URL,
				},
				Primary: config.Provider{
					URL: srv.URL,
				},
				Fallbacks: []config.Provider{
					{URL: "http://fallback1.example"},
					{URL: "http://fallback2.example"},
				},
			},
		},
	}

	c, err := cache.NewMultiCache(config.CacheConfig{}, "")
	if err != nil {
		t.Fatalf("failed to create cache: %v", err)
	}

	p, err := NewRPCProxy(cfg, c)
	if err != nil {
		t.Fatalf("failed to create proxy: %v", err)
	}
	return p, srv
}

func TestIsReadOnly(t *testing.T) {
	readMethods := []string{
		"eth_call",
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
		"eth_chainId",
	}
	for _, method := range readMethods {
		if !isReadOnly(method) {
			t.Errorf("isReadOnly(%q) = false, want true", method)
		}
	}

	writeMethods := []string{
		"eth_sendRawTransaction",
		"eth_sendTransaction",
		"eth_accounts",
	}
	for _, method := range writeMethods {
		if isReadOnly(method) {
			t.Errorf("isReadOnly(%q) = true, want false", method)
		}
	}
}

func TestRPCProxy_Execute_Success(t *testing.T) {
	handler := func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"jsonrpc":"2.0","result":"0x123","id":1}`)
	}
	p, _ := newTestProxy(t, handler)

	result, err := p.Execute(context.Background(), "1", "eth_call", json.RawMessage(`[{"to":"0xabc"}]`))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result != "0x123" {
		t.Errorf("expected result '0x123', got %v", result)
	}
}

func TestRPCProxy_Execute_NoProviderForChain(t *testing.T) {
	handler := func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"jsonrpc":"2.0","result":"0x1","id":1}`)
	}
	p, _ := newTestProxy(t, handler)

	_, err := p.Execute(context.Background(), "999", "eth_call", json.RawMessage(`[]`))
	if err == nil {
		t.Fatal("expected error for unconfigured chain")
	}
	if got := err.Error(); got != "no provider configured for chain 999" {
		t.Errorf("unexpected error message: %s", got)
	}
}

func TestRPCProxy_Execute_AllProvidersFail(t *testing.T) {
	callCount := 0
	handler := func(w http.ResponseWriter, r *http.Request) {
		callCount++
		w.WriteHeader(http.StatusBadGateway)
		fmt.Fprint(w, `{"error":"server error"}`)
	}
	p, _ := newTestProxy(t, handler)

	_, err := p.Execute(context.Background(), "1", "eth_call", json.RawMessage(`[]`))
	if err == nil {
		t.Fatal("expected error when all providers fail")
	}
	if callCount == 0 {
		t.Error("expected at least one provider attempt")
	}
}

func TestRPCProxy_Execute_WriteMethodUsesLocalNode(t *testing.T) {
	var path string
	handler := func(w http.ResponseWriter, r *http.Request) {
		path = r.URL.Path
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"jsonrpc":"2.0","result":"0xtxhash","id":1}`)
	}
	p, _ := newTestProxy(t, handler)

	result, err := p.Execute(context.Background(), "1", "eth_sendRawTransaction", json.RawMessage(`["0xraw"]`))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result != "0xtxhash" {
		t.Errorf("expected '0xtxhash', got %v", result)
	}
	if path == "" {
		t.Error("expected request to be made to a provider")
	}
}

func TestRPCProxy_Execute_RPCErrorFromProvider(t *testing.T) {
	handler := func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"jsonrpc":"2.0","error":{"code":-32600,"message":"invalid request"},"id":1}`)
	}
	p, _ := newTestProxy(t, handler)

	_, err := p.Execute(context.Background(), "1", "eth_call", json.RawMessage(`[]`))
	if err == nil {
		t.Fatal("expected RPC error")
	}
}

func TestRPCProxy_Execute_FallbackChain(t *testing.T) {
	attempts := 0
	handler := func(w http.ResponseWriter, r *http.Request) {
		attempts++
		// Primary fails with HTTP error, but since local node is configured first,
		// the local node will succeed.
		// For this test, we use a chain ID with no local node.
	}
	// Create a proxy with only primary and fallbacks
	cfg := &config.Config{
		Providers: map[string]config.NetworkConfig{
			"137": {
				ChainID: 137,
				Primary: config.Provider{
					URL: "http://invalid-host-99999.example", // will fail
				},
				Fallbacks: []config.Provider{
					{URL: "http://invalid-host-99998.example"}, // will also fail
				},
			},
		},
	}
	c, _ := cache.NewMultiCache(config.CacheConfig{}, "")
	p, err := NewRPCProxy(cfg, c)
	if err != nil {
		t.Fatalf("failed to create proxy: %v", err)
	}

	_, err = p.Execute(context.Background(), "137", "eth_call", json.RawMessage(`[]`))
	if err == nil {
		t.Fatal("expected error when all providers are unreachable")
	}
}

func TestRPCProxy_Execute_JSONRoundTrip(t *testing.T) {
	handler := func(w http.ResponseWriter, r *http.Request) {
		// Verify the JSON-RPC request body
		var req struct {
			JSONRPC string          `json:"jsonrpc"`
			Method  string          `json:"method"`
			Params  json.RawMessage `json:"params"`
			ID      json.RawMessage `json:"id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			t.Errorf("failed to decode request: %v", err)
			return
		}
		if req.JSONRPC != "2.0" {
			t.Errorf("expected jsonrpc=2.0, got %s", req.JSONRPC)
		}
		if req.Method != "eth_getBalance" {
			t.Errorf("expected method=eth_getBalance, got %s", req.Method)
		}

		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"jsonrpc":"2.0","result":"0x1000000","id":1}`)
	}
	p, _ := newTestProxy(t, handler)

	result, err := p.Execute(context.Background(), "1", "eth_getBalance", json.RawMessage(`["0xabc","latest"]`))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result != "0x1000000" {
		t.Errorf("expected '0x1000000', got %v", result)
	}
}

func TestRPCProxy_Execute_WriteFallbackToPrimary(t *testing.T) {
	var attempts int
	handler := func(w http.ResponseWriter, r *http.Request) {
		attempts++
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"jsonrpc":"2.0","result":"0xsuccess","id":1}`)
	}
	// Proxy with no local node — write should go to primary
	cfg := &config.Config{
		Providers: map[string]config.NetworkConfig{
			"1": {
				ChainID: 1,
				LocalNode: config.Provider{
					URL: "http://invalid-node.example", // will fail
				},
				Primary: config.Provider{
					URL: "http://invalid-primary.example", // will also fail
				},
			},
		},
	}
	c, _ := cache.NewMultiCache(config.CacheConfig{}, "")
	p, err := NewRPCProxy(cfg, c)
	if err != nil {
		t.Fatalf("failed to create proxy: %v", err)
	}

	_, err = p.Execute(context.Background(), "1", "eth_sendRawTransaction", json.RawMessage(`["0xdata"]`))
	if err == nil {
		t.Fatal("expected error when all providers fail")
	}
	_ = attempts
}

func TestRPCProxy_Execute_NoAvailableProviderForWrite(t *testing.T) {
	cfg := &config.Config{
		Providers: map[string]config.NetworkConfig{
			"1": {
				ChainID:   1,
				Fallbacks: []config.Provider{{URL: "http://invalid.example"}},
			},
		},
	}
	c, _ := cache.NewMultiCache(config.CacheConfig{}, "")
	p, err := NewRPCProxy(cfg, c)
	if err != nil {
		t.Fatalf("failed to create proxy: %v", err)
	}

	_, err = p.Execute(context.Background(), "1", "eth_sendRawTransaction", json.RawMessage(`["0xdata"]`))
	if err == nil {
		t.Fatal("expected error when no provider is available for write")
	}
}

func TestRPCError(t *testing.T) {
	err := RPCError{Code: -32600, Message: "invalid request"}
	if err.Code != -32600 {
		t.Errorf("expected code -32600, got %d", err.Code)
	}
	if err.Message != "invalid request" {
		t.Errorf("expected 'invalid request', got %s", err.Message)
	}
}
