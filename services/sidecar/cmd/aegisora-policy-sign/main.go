package main

import (
	"crypto/ed25519"
	"encoding/base64"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"os"
	"strings"

	"github.com/aegisora-ai/aegisora/services/sidecar/internal/policy"
)

func main() {
	bundlePath := flag.String("bundle", "", "path to an unsigned policy bundle JSON file")
	flag.Parse()
	if strings.TrimSpace(*bundlePath) == "" {
		exit(errors.New("-bundle is required"))
	}

	privateKey, err := privateKeyFromEnvironment()
	if err != nil {
		exit(err)
	}
	bundle, err := policy.LoadFile(*bundlePath)
	if err != nil {
		exit(err)
	}
	signed, err := policy.Sign(bundle, privateKey)
	if err != nil {
		exit(err)
	}

	encoder := json.NewEncoder(os.Stdout)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(signed); err != nil {
		exit(fmt.Errorf("encode signed policy bundle: %w", err))
	}
}

func privateKeyFromEnvironment() (ed25519.PrivateKey, error) {
	encoded := strings.TrimSpace(os.Getenv("AEGISORA_POLICY_PRIVATE_KEY"))
	if encoded == "" {
		return nil, errors.New("AEGISORA_POLICY_PRIVATE_KEY is required")
	}
	decoded, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		return nil, fmt.Errorf("decode AEGISORA_POLICY_PRIVATE_KEY: %w", err)
	}
	if len(decoded) != ed25519.PrivateKeySize {
		return nil, fmt.Errorf("AEGISORA_POLICY_PRIVATE_KEY must decode to %d bytes", ed25519.PrivateKeySize)
	}
	return ed25519.PrivateKey(decoded), nil
}

func exit(err error) {
	fmt.Fprintln(os.Stderr, "aegisora-policy-sign:", err)
	os.Exit(1)
}
