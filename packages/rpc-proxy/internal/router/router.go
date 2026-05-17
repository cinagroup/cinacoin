package router

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
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
	fmt.Fprintf(w, "# CinaConnect RPC Proxy Metrics\n")
	fmt.Fprintf(w, "# (Prometheus metrics placeholder)\n")
	fmt.Fprintf(w, "proxy_uptime_seconds %d\n", int64(time.Since(startTime).Seconds()))
	fmt.Fprintf(w, "proxy_region \"%s\"\n", r.cfg.Region)
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
	// 1. Rate limiting (per-IP)
	clientIP := req.RemoteAddr
	if !r.limiter.AllowIP(clientIP) {
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
		writeError(w, http.StatusBadRequest, -32700, "parse error")
		return
	}

	// 3. Cache check (for read-only methods)
	if cached, ok := r.cache.Get(chainID, rpcReq.Method, rpcReq.Params); ok {
		resp := map[string]interface{}{
			"jsonrpc": "2.0",
			"id":      rpcReq.ID,
			"result":  cached,
		}
		writeJSON(w, http.StatusOK, resp)
		return
	}

	// 4. Deduplication check
	if rpcReq.Method == "eth_call" || rpcReq.Method == "eth_getBlockByNumber" {
		result, err := r.dedup.Do(req.Context(), makeDedupKey(chainID, rpcReq.Method, rpcReq.Params), func(ctx context.Context) (interface{}, error) {
			return r.proxy.Execute(ctx, chainID, rpcReq.Method, rpcReq.Params)
		})
		if err != nil {
			writeError(w, http.StatusBadGateway, -32000, err.Error())
			return
		}

		resp := map[string]interface{}{
			"jsonrpc": "2.0",
			"id":      rpcReq.ID,
			"result":  result,
		}
		writeJSON(w, http.StatusOK, resp)
		return
	}

	// 5. Direct proxy execution
	result, err := r.proxy.Execute(req.Context(), chainID, rpcReq.Method, rpcReq.Params)
	if err != nil {
		writeError(w, http.StatusBadGateway, -32000, err.Error())
		return
	}

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
