package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"mime"
	"net/http"

	"github.com/aegisora-ai/aegisora/services/sidecar/internal/domain"
)

const defaultMaximumBodyBytes = int64(1 << 20)

type Evaluator interface {
	Evaluate(context.Context, domain.ExecutionIntent) (domain.DecisionEnvelope, error)
}

type Options struct {
	ServiceName      string
	Version          string
	Commit           string
	Ready            func() bool
	ActivePolicy     func() (domain.ActivePolicyVersion, bool)
	Evaluator        Evaluator
	MaximumBodyBytes int64
}

type Handler struct {
	serviceName      string
	version          string
	commit           string
	ready            func() bool
	activePolicy     func() (domain.ActivePolicyVersion, bool)
	evaluator        Evaluator
	maximumBodyBytes int64
	mux              *http.ServeMux
}

func New(options Options) *Handler {
	if options.ServiceName == "" {
		options.ServiceName = "aegisora-sidecar"
	}
	if options.Version == "" {
		options.Version = "dev"
	}
	if options.Commit == "" {
		options.Commit = "unknown"
	}
	if options.Ready == nil {
		options.Ready = func() bool { return false }
	}
	if options.ActivePolicy == nil {
		options.ActivePolicy = func() (domain.ActivePolicyVersion, bool) {
			return domain.ActivePolicyVersion{}, false
		}
	}
	if options.MaximumBodyBytes <= 0 {
		options.MaximumBodyBytes = defaultMaximumBodyBytes
	}

	handler := &Handler{
		serviceName:      options.ServiceName,
		version:          options.Version,
		commit:           options.Commit,
		ready:            options.Ready,
		activePolicy:     options.ActivePolicy,
		evaluator:        options.Evaluator,
		maximumBodyBytes: options.MaximumBodyBytes,
		mux:              http.NewServeMux(),
	}
	handler.routes()
	return handler
}

func (handler *Handler) ServeHTTP(response http.ResponseWriter, request *http.Request) {
	response.Header().Set("X-Content-Type-Options", "nosniff")
	handler.mux.ServeHTTP(response, request)
}

func (handler *Handler) routes() {
	handler.mux.HandleFunc("GET /healthz", handler.legacyHealth)
	handler.mux.HandleFunc("GET /readyz", handler.readiness)
	handler.mux.HandleFunc("GET /v1alpha1/health", handler.health)
	handler.mux.HandleFunc("GET /v1alpha1/readiness", handler.readiness)
	handler.mux.HandleFunc("GET /v1alpha1/policies/active", handler.getActivePolicy)
	handler.mux.HandleFunc("POST /v1alpha1/execution/intent", handler.submitExecutionIntent)
}

func (handler *Handler) legacyHealth(response http.ResponseWriter, _ *http.Request) {
	writeJSON(response, http.StatusOK, map[string]any{
		"status":           "ok",
		"service":          handler.serviceName,
		"version":          handler.version,
		"commit":           handler.commit,
		"contract_version": domain.ContractVersion,
	})
}

func (handler *Handler) health(response http.ResponseWriter, _ *http.Request) {
	writeJSON(response, http.StatusOK, map[string]string{
		"status":           "healthy",
		"contract_version": domain.ContractVersion,
	})
}

func (handler *Handler) readiness(response http.ResponseWriter, _ *http.Request) {
	if !handler.ready() {
		writeJSON(response, http.StatusServiceUnavailable, map[string]string{
			"status":           "not_ready",
			"contract_version": domain.ContractVersion,
		})
		return
	}
	writeJSON(response, http.StatusOK, map[string]string{
		"status":           "ready",
		"contract_version": domain.ContractVersion,
	})
}

func (handler *Handler) getActivePolicy(response http.ResponseWriter, _ *http.Request) {
	active, ok := handler.activePolicy()
	if !ok {
		writeError(response, http.StatusServiceUnavailable, "POLICY_UNAVAILABLE", "no valid policy bundle is active")
		return
	}
	writeJSON(response, http.StatusOK, active)
}

func (handler *Handler) submitExecutionIntent(response http.ResponseWriter, request *http.Request) {
	if handler.evaluator == nil {
		writeError(response, http.StatusServiceUnavailable, "ENGINE_UNAVAILABLE", "the enforcement engine is unavailable")
		return
	}
	mediaType, _, err := mime.ParseMediaType(request.Header.Get("Content-Type"))
	if err != nil || mediaType != "application/json" {
		writeError(response, http.StatusUnsupportedMediaType, "UNSUPPORTED_CONTENT_TYPE", "Content-Type must be application/json")
		return
	}

	request.Body = http.MaxBytesReader(response, request.Body, handler.maximumBodyBytes)
	decoder := json.NewDecoder(request.Body)
	decoder.DisallowUnknownFields()
	var intent domain.ExecutionIntent
	if err := decoder.Decode(&intent); err != nil {
		status := http.StatusBadRequest
		var maximumBytesError *http.MaxBytesError
		if errors.As(err, &maximumBytesError) {
			status = http.StatusRequestEntityTooLarge
		}
		writeError(response, status, "INVALID_JSON", err.Error())
		return
	}
	if err := ensureEndOfBody(decoder); err != nil {
		writeError(response, http.StatusBadRequest, "INVALID_JSON", err.Error())
		return
	}
	if err := intent.Validate(); err != nil {
		writeError(response, http.StatusBadRequest, "INVALID_EXECUTION_INTENT", err.Error())
		return
	}

	decision, err := handler.evaluator.Evaluate(request.Context(), intent)
	if err != nil {
		writeError(response, http.StatusInternalServerError, "ENFORCEMENT_FAILURE", "the decision could not be safely recorded")
		return
	}
	writeJSON(response, http.StatusOK, decision)
}

func ensureEndOfBody(decoder *json.Decoder) error {
	var trailing any
	err := decoder.Decode(&trailing)
	if errors.Is(err, io.EOF) {
		return nil
	}
	if err == nil {
		return errors.New("request body must contain exactly one JSON object")
	}
	return err
}

func writeError(response http.ResponseWriter, status int, code string, message string) {
	writeJSON(response, status, map[string]any{
		"error": map[string]string{
			"code":    code,
			"message": message,
		},
	})
}

func writeJSON(response http.ResponseWriter, status int, value any) {
	response.Header().Set("Content-Type", "application/json")
	response.WriteHeader(status)
	_ = json.NewEncoder(response).Encode(value)
}
