package api

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/nurtidev/fishpulse/core"
)

// Server holds loaded configs and the HTTP mux.
type Server struct {
	species map[string]core.SpeciesMeta
	mux     *http.ServeMux
}

// New creates a Server, loading species configs from dataDir/species/.
func New(dataDir string) (*Server, error) {
	species, err := core.LoadAllSpecies(dataDir + "/species")
	if err != nil {
		return nil, fmt.Errorf("loading species: %w", err)
	}
	log.Printf("loaded %d species: %v", len(species), keys(species))

	s := &Server{species: species, mux: http.NewServeMux()}
	s.routes()
	return s, nil
}

// routes registers all API endpoints.
func (s *Server) routes() {
	s.mux.HandleFunc("GET /health", handleHealth)
	s.mux.HandleFunc("GET /api/v1/bite", s.handleBite)
	s.mux.HandleFunc("GET /api/v1/species", s.handleSpecies)
}

// defaultOrigins maps APP_ENV to the default list of allowed frontend origins.
// Production origins should be configured via the ALLOWED_ORIGIN env var.
var defaultOrigins = map[string][]string{
	"development": {"http://localhost:3000"},
}

// Build creates an *http.Server ready to serve, without starting it.
// CORS origins are resolved in this order:
//  1. ALLOWED_ORIGIN env var — comma-separated list, e.g. "https://a.com,http://localhost:3000"
//  2. defaults for APP_ENV (production / development)
//  3. fallback: http://localhost:3000
func (s *Server) Build(addr string) *http.Server {
	var origins []string
	if raw := os.Getenv("ALLOWED_ORIGIN"); raw != "" {
		for _, o := range strings.Split(raw, ",") {
			if trimmed := strings.TrimSpace(o); trimmed != "" {
				origins = append(origins, trimmed)
			}
		}
	}
	if len(origins) == 0 {
		env := os.Getenv("APP_ENV")
		if defaults, ok := defaultOrigins[env]; ok {
			origins = defaults
		} else {
			origins = defaultOrigins["development"]
		}
	}
	log.Printf("APP_ENV=%q  CORS origins: %v", os.Getenv("APP_ENV"), origins)
	handler := withLogging(withRateLimit(withSecurityHeaders(withCORS(origins, s.mux))))
	return &http.Server{
		Addr:              addr,
		Handler:           handler,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       120 * time.Second,
	}
}

func keys[V any](m map[string]V) []string {
	result := make([]string, 0, len(m))
	for k := range m {
		result = append(result, k)
	}
	return result
}
