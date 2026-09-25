package config

import (
	"testing"
	"time"
)

func TestLoadDefaults(t *testing.T) {
	t.Setenv("AEGISORA_SIDECAR_HTTP_ADDRESS", "")
	t.Setenv("AEGISORA_SIDECAR_READ_HEADER_TIMEOUT", "")
	t.Setenv("AEGISORA_SIDECAR_READ_TIMEOUT", "")
	t.Setenv("AEGISORA_SIDECAR_SHUTDOWN_TIMEOUT", "")
	t.Setenv("AEGISORA_SIDECAR_MAX_BODY_BYTES", "")
	t.Setenv("AEGISORA_SIDECAR_AUDIT_CAPACITY", "")
	t.Setenv("AEGISORA_SIDECAR_DECISION_CACHE_SIZE", "")
	t.Setenv("AEGISORA_SIDECAR_POLICY_BUNDLE", "")
	t.Setenv("AEGISORA_SIDECAR_POLICY_PUBLIC_KEY", "")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}

	if cfg.HTTPAddress != defaultHTTPAddress {
		t.Fatalf("HTTPAddress = %q, want %q", cfg.HTTPAddress, defaultHTTPAddress)
	}
	if cfg.ReadHeaderTimeout != defaultReadHeaderTimeout {
		t.Fatalf(
			"ReadHeaderTimeout = %s, want %s",
			cfg.ReadHeaderTimeout,
			defaultReadHeaderTimeout,
		)
	}
	if cfg.ReadTimeout != defaultReadTimeout {
		t.Fatalf("ReadTimeout = %s, want %s", cfg.ReadTimeout, defaultReadTimeout)
	}
	if cfg.ShutdownTimeout != defaultShutdownTimeout {
		t.Fatalf(
			"ShutdownTimeout = %s, want %s",
			cfg.ShutdownTimeout,
			defaultShutdownTimeout,
		)
	}
	if cfg.MaximumBodyBytes != defaultMaximumBodyBytes {
		t.Fatalf("MaximumBodyBytes = %d, want %d", cfg.MaximumBodyBytes, defaultMaximumBodyBytes)
	}
}

func TestLoadOverrides(t *testing.T) {
	t.Setenv("AEGISORA_SIDECAR_HTTP_ADDRESS", "127.0.0.1:9090")
	t.Setenv("AEGISORA_SIDECAR_READ_HEADER_TIMEOUT", "2s")
	t.Setenv("AEGISORA_SIDECAR_READ_TIMEOUT", "4s")
	t.Setenv("AEGISORA_SIDECAR_SHUTDOWN_TIMEOUT", "3s")
	t.Setenv("AEGISORA_SIDECAR_MAX_BODY_BYTES", "2048")
	t.Setenv("AEGISORA_SIDECAR_AUDIT_CAPACITY", "20")
	t.Setenv("AEGISORA_SIDECAR_DECISION_CACHE_SIZE", "30")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}

	if cfg.HTTPAddress != "127.0.0.1:9090" {
		t.Fatalf("HTTPAddress = %q", cfg.HTTPAddress)
	}
	if cfg.ReadHeaderTimeout != 2*time.Second {
		t.Fatalf("ReadHeaderTimeout = %s", cfg.ReadHeaderTimeout)
	}
	if cfg.ReadTimeout != 4*time.Second {
		t.Fatalf("ReadTimeout = %s", cfg.ReadTimeout)
	}
	if cfg.ShutdownTimeout != 3*time.Second {
		t.Fatalf("ShutdownTimeout = %s", cfg.ShutdownTimeout)
	}
	if cfg.MaximumBodyBytes != 2048 || cfg.AuditCapacity != 20 || cfg.DecisionCacheSize != 30 {
		t.Fatalf("numeric overrides were not applied: %#v", cfg)
	}
}

func TestLoadRequiresPolicyPathAndKeyTogether(t *testing.T) {
	t.Setenv("AEGISORA_SIDECAR_POLICY_BUNDLE", "/tmp/policy.json")
	t.Setenv("AEGISORA_SIDECAR_POLICY_PUBLIC_KEY", "")
	if _, err := Load(); err == nil {
		t.Fatal("Load() error = nil, want paired-policy-configuration error")
	}
}

func TestLoadRejectsInvalidDuration(t *testing.T) {
	t.Setenv("AEGISORA_SIDECAR_READ_HEADER_TIMEOUT", "not-a-duration")

	if _, err := Load(); err == nil {
		t.Fatal("Load() error = nil, want an invalid-duration error")
	}
}
