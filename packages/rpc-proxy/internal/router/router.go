package router

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync/atomic"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/cinaconnect/rpc-proxy/internal/cache"
	"github.com/cinaconnect/rpc-proxy/internal/config"
	"github.com/cinaconnect/rpc-proxy/internal/dedup"
	"github.com/cinaconnect/rpc-proxy/internal/proxy"
	"github.com/cinaconnect/rpc-proxy/internal/ratelimit"
)

// ── Prometheus counters (atomic, lock-free) ──────────────────────────────
var (
	metricsTotalRequests   atomic.Int64
	metricsTotalErrors     atomic.Int64
	metricsRateLimited     atomic.Int64
	metricsCacheHits       atomic.Int64
	metricsCacheMisses     atomic.Int64
	metricsUpstreamLatency atomic.Int64 // cumulative ms for averaging
	metricsChainRequests   = make(map[string]*atomic.Int64)
)

// RPCRouter holds all middleware and routing state.
type RPCRouter struct {
	cfg     *config.Config
	cache   *cache.MultiCache
	dedup   *dedup.Deduplicator
	limiter *ratelimit.RateLimiter
	proxy   *proxy.RPCProxy
}

// New creates a new RPC router with all middleware initialized.
func New(cfg *config.Config) (*RPCRouter, error) {
	// Initialize cache
	mc, err := cache.NewMultiCache(cfg.Cache, cfg.RedisURL)
	if err != nil {
		return nil, fmt.Errorf("init cache: %w", err)
	}

	// Initialize deduplication
	d := dedup.NewDeduplicator(time.Duration(cfg.Dedup.WindowMs) * time.Millisecond)

	// Initialize rate limiter
	rl := ratelimit.NewRateLimiter(cfg.RateLimit)

	// Initialize proxy
	p, err := proxy.NewRPCProxy(cfg, mc)
	if err != nil {
		return nil, fmt.Errorf("init proxy: %w", err)
	}

	return &RPCRouter{
		cfg:     cfg,
		cache:   mc,
		dedup:   d,
		limiter: rl,
		proxy:   p,
	}, nil
}

// Handler returns the fully configured HTTP handler.
func (r *RPCRouter) Handler() http.Handler {
	mux := chi.NewRouter()

	// Global middleware
	mux.Use(middleware.Recoverer)
	mux.Use(middleware.RequestID)
	mux.Use(middleware.RealIP)
	mux.Use(middleware.Logger)
	mux.Use(middleware.Timeout(60 * time.Second))

	// CORS
	mux.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-API-Key"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Health check
	mux.Get("/health", r.handleHealth)

	// Prometheus metrics (if available)
	mux.Get("/metrics", r.handleMetrics)

	// Main RPC endpoint — per-chain routing
	mux.Post("/rpc/{chainID}", r.handleRPC)
	// Default chain (for backward compatibility)
	mux.Post("/rpc", r.handleRPCDefault)

	return mux
}

type healthResponse struct {
	Status  string `json:"status"`
	Version string `json:"version"`
	Region  string `json:"region"`
	Uptime  int64  `json:"uptime_seconds"`
}

var startTime = time.Now()

func (r *RPCRouter) handleHealth(w http.ResponseWriter, req *http.Request) {
	resp := healthResponse{
		Status:  "ok",
		Version: "0.1.0",
		Region:  r.cfg.Region,
		Uptime:  int64(time.Since(startTime).Seconds()),
	}
	writeJSON(w, http.StatusOK, resp)
}

func (r *RPCRouter) handleMetrics(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "text/plain")
	uptime := int64(time.Since(startTime).Seconds())
	totalReq := metricsTotalRequests.Load()
	totalErr := metricsTotalErrors.Load()
	rateLimited := metricsRateLimited.Load()
	cacheHits := metricsCacheHits.Load()
	cacheMisses := metricsCacheMisses.Load()
	cumLatency := metricsUpstreamLatency.Load()

	fmt.Fprintf(w, "# HELP rpc_proxy_uptime_seconds Service uptime\n")
	fmt.Fprintf(w, "# TYPE rpc_proxy_uptime_seconds gauge\n")
	fmt.Fprintf(w, "rpc_proxy_uptime_seconds %d\n", uptime)

	fmt.Fprintf(w, "# HELP rpc_proxy_requests_total Total requests\n")
	fmt.Fprintf(w, "# TYPE rpc_proxy_requests_total counter\n")
	fmt.Fprintf(w, "rpc_proxy_requests_total %d\n", totalReq)

	fmt.Fprintf(w, "# HELP rpc_proxy_errors_total Total upstream errors\n")
	fmt.Fprintf(w, "# TYPE rpc_proxy_errors_total counter\n")
	fmt.Fprintf(w, "rpc_proxy_errors_total %d\n", totalErr)

	fmt.Fprintf(w, "# HELP rpc_proxy_rate_limited_total Rate-limited requests\n")
	fmt.Fprintf(w, "# TYPE rpc_proxy_rate_limited_total counter\n")
	fmt.Fprintf(w, "rpc_proxy_rate_limited_total %d\n", rateLimited)

	fmt.Fprintf(w, "# HELP rpc_proxy_cache_hits_total KV cache hits\n")
	fmt.Fprintf(w, "# TYPE rpc_proxy_cache_hits_total counter\n")
	fmt.Fprintf(w, "rpc_proxy_cache_hits_total %d\n", cacheHits)

	fmt.Fprintf(w, "# HELP rpc_proxy_cache_misses_total KV cache misses\n")
	fmt.Fprintf(w, "# TYPE rpc_proxy_cache_misses_total counter\n")
	fmt.Fprintf(w, "rpc_proxy_cache_misses_total %d\n", cacheMisses)

	if totalReq > 0 {
		avgLatency := float64(cumLatency) / float64(totalReq)
		fmt.Fprintf(w, "# HELP rpc_proxy_upstream_latency_ms_avg Average upstream latency\n")
		fmt.Fprintf(w, "# TYPE rpc_proxy_upstream_latency_ms_avg gauge\n")
		fmt.Fprintf(w, "rpc_proxy_upstream_latency_ms_avg %.2f\n", avgLatency)
	}

	fmt.Fprintf(w, "# HELP rpc_proxy_region Region label\n")
	fmt.Fprintf(w, "# TYPE rpc_proxy_region gauge\n")
	fmt.Fprintf(w, "rpc_proxy_region{region=\"%s\"} 1\n", r.cfg.Region)

	for chain, counter := range metricsChainRequests {
		fmt.Fprintf(w, "# HELP rpc_proxy_chain_requests_total Requests per chain\n")
		fmt.Fprintf(w, "# TYPE rpc_proxy_chain_requests_total counter\n")
		fmt.Fprintf(w, "rpc_proxy_chain_requests_total{chain=\"%s\"} %d\n", chain, counter.Load())
	}
}

// incChainRequest atomically increments the per-chain request counter.
func incChainRequest(chainID string) {
	if c, ok := metricsChainRequests[chainID]; ok {
		c.Add(1)
	} else {
		var n atomic.Int64
		n.Add(1)
		metricsChainRequests[chainID] = &n
	}
}

// recordUpstream records latency and optionally an error.
func recordUpstream(latencyMs int64, isError bool) {
	metricsUpstreamLatency.Add(latencyMs)
	if isError {
		metricsTotalErrors.Add(1)
	}
}

func (r *RPCRouter) handleRPC(w http.ResponseWriter, req *http.Request) {
	chainID := chi.URLParam(req, "chainID")
	if chainID == "" {
		writeError(w, http.StatusBadRequest, -32600, "chain ID is required")
		return
	}

	r.handleRPCInternal(w, req, chainID)
}

func (r *RPCRouter) handleRPCDefault(w http.ResponseWriter, req *http.Request) {
	// Default to chain ID 1 (Ethereum mainnet)
	r.handleRPCInternal(w, req, "1")
}

// handleRPCInternal processes a JSON-RPC request through the full pipeline:
// rate limit → dedup → cache → proxy → response
func (r *RPCRouter) handleRPCInternal(w http.ResponseWriter, req *http.Request, chainID string) {
	metricsTotalRequests.Add(1)
	incChainRequest(chainID)

	// 1. Rate limiting (per-IP)
	clientIP := req.RemoteAddr
	if !r.limiter.AllowIP(clientIP) {
		metricsRateLimited.Add(1)
		writeError(w, http.StatusTooManyRequests, -32001, "rate limit exceeded")
		return
	}

	// 2. Parse JSON-RPC request
	var rpcReq struct {
		JSONRPC string          `json:"jsonrpc"`
		Method  string          `json:"method"`
		Params  json.RawMessage `json:"params"`
		ID      json.RawMessage `json:"id"`
	}

	decoder := json.NewDecoder(req.Body)
	if err := decoder.Decode(&rpcReq); err != nil {
		metricsTotalErrors.Add(1)
		writeError(w, http.StatusBadRequest, -32700, "parse error")
		return
	}

	// 3. Cache check (for read-only methods)
	if cached, ok := r.cache.Get(chainID, rpcReq.Method, rpcReq.Params); ok {
		metricsCacheHits.Add(1)
		resp := map[string]interface{}{
			"jsonrpc": "2.0",
			"id":      rpcReq.ID,
			"result":  cached,
		}
		writeJSON(w, http.StatusOK, resp)
		return
	}
	metricsCacheMisses.Add(1)

	// 4. Deduplication check
	if rpcReq.Method == "eth_call" || rpcReq.Method == "eth_getBlockByNumber" {
		start := time.Now()
		result, err := r.dedup.Do(req.Context(), makeDedupKey(chainID, rpcReq.Method, rpcReq.Params), func(ctx context.Context) (interface{}, error) {
			return r.proxy.Execute(ctx, chainID, rpcReq.Method, rpcReq.Params)
		})
		latencyMs := time.Since(start).Milliseconds()
		if err != nil {
			recordUpstream(latencyMs, true)
			writeError(w, http.StatusBadGateway, -32000, err.Error())
			return
		}
		recordUpstream(latencyMs, false)

		resp := map[string]interface{}{
			"jsonrpc": "2.0",
			"id":      rpcReq.ID,
			"result":  result,
		}
		writeJSON(w, http.StatusOK, resp)
		return
	}

	// 5. Direct proxy execution
	start := time.Now()
	result, err := r.proxy.Execute(req.Context(), chainID, rpcReq.Method, rpcReq.Params)
	latencyMs := time.Since(start).Milliseconds()
	if err != nil {
		recordUpstream(latencyMs, true)
		writeError(w, http.StatusBadGateway, -32000, err.Error())
		return
	}
	recordUpstream(latencyMs, false)

	// 6. Cache the result
	r.cache.Set(chainID, rpcReq.Method, rpcReq.Params, result)

	resp := map[string]interface{}{
		"jsonrpc": "2.0",
		"id":      rpcReq.ID,
		"result":  result,
	}
	writeJSON(w, http.StatusOK, resp)
}

func makeDedupKey(chainID, method string, params json.RawMessage) string {
	return fmt.Sprintf("%s:%s:%s", chainID, method, string(params))
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, httpStatus int, code int, message string) {
	resp := map[string]interface{}{
		"jsonrpc": "2.0",
		"error": map[string]interface{}{
			"code":    code,
			"message": message,
		},
		"id": nil,
	}
	writeJSON(w, httpStatus, resp)
}

// Log helper
func init() {
	log.SetFlags(log.LstdFlags | log.Lmicroseconds)
}
