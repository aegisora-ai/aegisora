package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/aegisora-ai/aegisora/services/sidecar/internal/audit"
	"github.com/aegisora-ai/aegisora/services/sidecar/internal/config"
	"github.com/aegisora-ai/aegisora/services/sidecar/internal/domain"
	"github.com/aegisora-ai/aegisora/services/sidecar/internal/engine"
	"github.com/aegisora-ai/aegisora/services/sidecar/internal/httpapi"
	"github.com/aegisora-ai/aegisora/services/sidecar/internal/policy"
)

var (
	version = "dev"
	commit  = "unknown"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	cfg, err := config.Load()
	if err != nil {
		logger.Error("invalid sidecar configuration", "error", err)
		os.Exit(1)
	}

	policyManager := policy.NewManager(nil)
	if cfg.PolicyBundlePath != "" {
		verifier, verifierErr := policy.NewEd25519Verifier(cfg.PolicyPublicKey)
		if verifierErr != nil {
			logger.Error("invalid policy verifier configuration", "error", verifierErr)
			os.Exit(1)
		}
		policyManager = policy.NewManager(verifier)
		bundle, loadErr := policy.LoadFile(cfg.PolicyBundlePath)
		if loadErr != nil {
			logger.Error("load policy bundle", "error", loadErr)
			os.Exit(1)
		}
		if activateErr := policyManager.Activate(bundle, time.Now()); activateErr != nil {
			logger.Error("activate policy bundle", "error", activateErr)
			os.Exit(1)
		}
		logger.Info(
			"activated policy bundle",
			"bundle_id", bundle.BundleID,
			"policy_version", bundle.Version,
			"policy_digest", bundle.Digest,
			"expires_at", bundle.ExpiresAt,
		)
	}

	auditSink, err := audit.NewMemorySink(cfg.AuditCapacity)
	if err != nil {
		logger.Error("configure audit sink", "error", err)
		os.Exit(1)
	}
	enforcementEngine, err := engine.New(engine.Options{
		Policies:     policyManager,
		Audit:        auditSink,
		CacheEntries: cfg.DecisionCacheSize,
	})
	if err != nil {
		logger.Error("configure enforcement engine", "error", err)
		os.Exit(1)
	}

	handler := httpapi.New(httpapi.Options{
		ServiceName:      "aegisora-sidecar",
		Version:          version,
		Commit:           commit,
		Evaluator:        enforcementEngine,
		MaximumBodyBytes: cfg.MaximumBodyBytes,
		Ready: func() bool {
			return policyManager.Ready(time.Now())
		},
		ActivePolicy: func() (domain.ActivePolicyVersion, bool) {
			return policyManager.Metadata(time.Now())
		},
	})

	server := &http.Server{
		Addr:              cfg.HTTPAddress,
		Handler:           handler,
		ReadHeaderTimeout: cfg.ReadHeaderTimeout,
		ReadTimeout:       cfg.ReadTimeout,
	}

	signalContext, stop := signal.NotifyContext(
		context.Background(),
		syscall.SIGINT,
		syscall.SIGTERM,
	)
	defer stop()

	serverErrors := make(chan error, 1)
	go func() {
		logger.Info(
			"starting sidecar",
			"address", cfg.HTTPAddress,
			"version", version,
			"commit", commit,
		)

		if listenErr := server.ListenAndServe(); listenErr != nil && !errors.Is(listenErr, http.ErrServerClosed) {
			serverErrors <- listenErr
		}
	}()

	var runErr error
	select {
	case <-signalContext.Done():
		logger.Info("shutdown signal received")
	case runErr = <-serverErrors:
		logger.Error("sidecar server stopped", "error", runErr)
	}

	shutdownContext, cancel := context.WithTimeout(
		context.Background(),
		cfg.ShutdownTimeout,
	)
	defer cancel()

	if err := server.Shutdown(shutdownContext); err != nil {
		logger.Error("graceful shutdown failed", "error", err)
		if runErr == nil {
			runErr = err
		}
	}

	if runErr != nil {
		os.Exit(1)
	}
}
