package api

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

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
var defaultOrigins = map[string][]string{
	"production":  {"https://fishpulse-production.up.railway.app"},
	"development": {"http://localhost:3000"},
}

// Run starts the HTTP server on the given address (e.g. ":8080").
// CORS origins are resolved in this order:
//  1. ALLOWED_ORIGIN env var — comma-separated list, e.g. "https://a.com,http://localhost:3000"
//  2. defaults for APP_ENV (production / development)
//  3. fallback: http://localhost:3000
func (s *Server) Run(addr string) error {
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
	handler := withLogging(withSecurityHeaders(withCORS(origins, s.mux)))
	log.Printf("FishPulse API listening on http://localhost%s", addr)
	return http.ListenAndServe(addr, handler) //nolint:gosec
}

func keys[V any](m map[string]V) []string {
	result := make([]string, 0, len(m))
	for k := range m {
		result = append(result, k)
	}
	return result
}
