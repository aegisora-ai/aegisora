package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

const (
	defaultHTTPAddress       = "127.0.0.1:8081"
	defaultReadHeaderTimeout = 5 * time.Second
	defaultReadTimeout       = 15 * time.Second
	defaultShutdownTimeout   = 10 * time.Second
	defaultMaximumBodyBytes  = int64(1 << 20)
	defaultAuditCapacity     = 10_000
	defaultDecisionCacheSize = 10_000
)

// Config contains process-level settings only. Policy and identity settings
// will belong to their own components once those contracts are agreed.
type Config struct {
	HTTPAddress       string
	ReadHeaderTimeout time.Duration
	ReadTimeout       time.Duration
	ShutdownTimeout   time.Duration
	MaximumBodyBytes  int64
	AuditCapacity     int
	DecisionCacheSize int
	PolicyBundlePath  string
	PolicyPublicKey   string
}

// Load reads sidecar process settings from the environment.
func Load() (Config, error) {
	readHeaderTimeout, err := durationFromEnvironment(
		"AEGISORA_SIDECAR_READ_HEADER_TIMEOUT",
		defaultReadHeaderTimeout,
	)
	if err != nil {
		return Config{}, err
	}
	readTimeout, err := durationFromEnvironment(
		"AEGISORA_SIDECAR_READ_TIMEOUT",
		defaultReadTimeout,
	)
	if err != nil {
		return Config{}, err
	}

	shutdownTimeout, err := durationFromEnvironment(
		"AEGISORA_SIDECAR_SHUTDOWN_TIMEOUT",
		defaultShutdownTimeout,
	)
	if err != nil {
		return Config{}, err
	}
	maximumBodyBytes, err := positiveInt64FromEnvironment(
		"AEGISORA_SIDECAR_MAX_BODY_BYTES",
		defaultMaximumBodyBytes,
	)
	if err != nil {
		return Config{}, err
	}
	auditCapacity, err := positiveIntFromEnvironment(
		"AEGISORA_SIDECAR_AUDIT_CAPACITY",
		defaultAuditCapacity,
	)
	if err != nil {
		return Config{}, err
	}
	decisionCacheSize, err := positiveIntFromEnvironment(
		"AEGISORA_SIDECAR_DECISION_CACHE_SIZE",
		defaultDecisionCacheSize,
	)
	if err != nil {
		return Config{}, err
	}

	policyBundlePath := strings.TrimSpace(os.Getenv("AEGISORA_SIDECAR_POLICY_BUNDLE"))
	policyPublicKey := os.Getenv("AEGISORA_SIDECAR_POLICY_PUBLIC_KEY")
	if (policyBundlePath == "") != (policyPublicKey == "") {
		return Config{}, fmt.Errorf(
			"AEGISORA_SIDECAR_POLICY_BUNDLE and AEGISORA_SIDECAR_POLICY_PUBLIC_KEY must be configured together",
		)
	}

	return Config{
		HTTPAddress: environmentOrDefault(
			"AEGISORA_SIDECAR_HTTP_ADDRESS",
			defaultHTTPAddress,
		),
		ReadHeaderTimeout: readHeaderTimeout,
		ReadTimeout:       readTimeout,
		ShutdownTimeout:   shutdownTimeout,
		MaximumBodyBytes:  maximumBodyBytes,
		AuditCapacity:     auditCapacity,
		DecisionCacheSize: decisionCacheSize,
		PolicyBundlePath:  policyBundlePath,
		PolicyPublicKey:   policyPublicKey,
	}, nil
}

func environmentOrDefault(name string, fallback string) string {
	value := strings.TrimSpace(os.Getenv(name))
	if value == "" {
		return fallback
	}

	return value
}

func durationFromEnvironment(name string, fallback time.Duration) (time.Duration, error) {
	value := strings.TrimSpace(os.Getenv(name))
	if value == "" {
		return fallback, nil
	}

	duration, err := time.ParseDuration(value)
	if err != nil {
		return 0, fmt.Errorf("parse %s: %w", name, err)
	}
	if duration <= 0 {
		return 0, fmt.Errorf("%s must be greater than zero", name)
	}

	return duration, nil
}

func positiveInt64FromEnvironment(name string, fallback int64) (int64, error) {
	value := strings.TrimSpace(os.Getenv(name))
	if value == "" {
		return fallback, nil
	}
	parsed, err := strconv.ParseInt(value, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("parse %s: %w", name, err)
	}
	if parsed <= 0 {
		return 0, fmt.Errorf("%s must be greater than zero", name)
	}
	return parsed, nil
}

func positiveIntFromEnvironment(name string, fallback int) (int, error) {
	parsed, err := positiveInt64FromEnvironment(name, int64(fallback))
	if err != nil {
		return 0, err
	}
	return int(parsed), nil
}
