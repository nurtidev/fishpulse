package main

import (
	"log"
	"os"

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

	log.Fatal(srv.Run(addr))
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
