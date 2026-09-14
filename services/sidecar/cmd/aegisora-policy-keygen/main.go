package main

import (
	"crypto/ed25519"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"

	"github.com/aegisora-ai/aegisora/services/sidecar/internal/policy"
)

func main() {
	publicKey, privateKey, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		fmt.Fprintln(os.Stderr, "aegisora-policy-keygen:", err)
		os.Exit(1)
	}
	output := struct {
		Algorithm  string `json:"algorithm"`
		PublicKey  string `json:"public_key"`
		PrivateKey string `json:"private_key"`
	}{
		Algorithm:  "Ed25519",
		PublicKey:  policy.EncodePublicKey(publicKey),
		PrivateKey: base64.StdEncoding.EncodeToString(privateKey),
	}
	encoder := json.NewEncoder(os.Stdout)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(output); err != nil {
		fmt.Fprintln(os.Stderr, "aegisora-policy-keygen:", err)
		os.Exit(1)
	}
}
