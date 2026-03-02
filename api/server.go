package api

import (
	"fmt"
	"log"
	"net/http"

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

// Run starts the HTTP server on the given address (e.g. ":8080").
func (s *Server) Run(addr string) error {
	handler := withLogging(withCORS(s.mux))
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
