package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/onchainux/rpc-proxy/internal/config"
	"github.com/onchainux/rpc-proxy/internal/router"
)

func main() {
	// Load configuration
	cfgPath := os.Getenv("PROXY_CONFIG")
	if cfgPath == "" {
		cfgPath = "configs/proxy.yaml"
	}

	cfg, err := config.Load(cfgPath)
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	log.Printf("starting OnChainUX RPC proxy on %s (region: %s)", cfg.ListenAddr, cfg.Region)

	// Initialize the router with all providers
	r, err := router.New(cfg)
	if err != nil {
		log.Fatalf("failed to initialize router: %v", err)
	}

	// Create HTTP server
	srv := &http.Server{
		Addr:         cfg.ListenAddr,
		Handler:      r.Handler(),
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 120 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	go func() {
		log.Printf("RPC proxy listening on %s", cfg.ListenAddr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	// Wait for shutdown signal
	<-ctx.Done()
	log.Println("shutting down...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("forced shutdown: %v", err)
		os.Exit(1)
	}

	fmt.Println("graceful shutdown complete")
}
