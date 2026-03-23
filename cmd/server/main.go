package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/nurtidev/fishpulse/api"
)

func main() {
	addr := getenv("PORT", ":8080")
	if addr[0] != ':' {
		addr = ":" + addr
	}

	dataDir := getenv("FISHPULSE_DATA_DIR", "./algorithms")

	srv, err := api.New(dataDir)
	if err != nil {
		log.Fatalf("failed to start server: %v", err)
	}

	httpServer := srv.Build(addr)

	go func() {
		log.Printf("FishPulse API listening on http://localhost%s", addr)
		if err := httpServer.ListenAndServe(); err != nil {
			log.Printf("server stopped: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("shutting down gracefully…")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	if err := httpServer.Shutdown(ctx); err != nil {
		log.Fatalf("forced shutdown: %v", err)
	}
	log.Println("server exited")
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
