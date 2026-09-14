APP := aegisora-sidecar
BIN_DIR := bin
GO ?= go
VERSION ?= dev
COMMIT ?= unknown
LDFLAGS := -s -w -X main.version=$(VERSION) -X main.commit=$(COMMIT)

.DEFAULT_GOAL := help

.PHONY: help deps tidy fmt fmt-check vet test test-race build tools run verify clean docker-build

help: ## Show available commands.
	@awk 'BEGIN {FS = ":.*## "}; /^[a-zA-Z0-9_-]+:.*## / {printf "%-16s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

deps: ## Download module dependencies.
	$(GO) mod download

tidy: ## Normalize go.mod and go.sum.
	$(GO) mod tidy

fmt: ## Format Go source files.
	$(GO) fmt ./...

fmt-check: ## Fail if Go source files are not formatted.
	@test -z "$$(gofmt -l .)" || { gofmt -l .; exit 1; }

vet: ## Run the Go static analyzer.
	$(GO) vet ./...

test: ## Run unit tests.
	$(GO) test ./...

test-race: ## Run unit tests with the race detector.
	$(GO) test -race ./...

build: ## Build the sidecar binary.
	mkdir -p $(BIN_DIR)
	$(GO) build -trimpath -ldflags "$(LDFLAGS)" -o $(BIN_DIR)/$(APP) ./cmd/aegisora-sidecar

tools: ## Build local policy key-generation and signing tools.
	mkdir -p $(BIN_DIR)
	$(GO) build -trimpath -o $(BIN_DIR)/aegisora-policy-keygen ./cmd/aegisora-policy-keygen
	$(GO) build -trimpath -o $(BIN_DIR)/aegisora-policy-sign ./cmd/aegisora-policy-sign

run: ## Run the sidecar locally.
	$(GO) run ./cmd/aegisora-sidecar

verify: fmt-check vet test build ## Run the local verification suite.

clean: ## Remove generated sidecar and policy-tool binaries.
	$(RM) $(BIN_DIR)/$(APP) $(BIN_DIR)/aegisora-policy-keygen $(BIN_DIR)/aegisora-policy-sign
	@rmdir $(BIN_DIR) 2>/dev/null || true

docker-build: ## Build the sidecar container image.
	docker build --build-arg VERSION=$(VERSION) --build-arg COMMIT=$(COMMIT) -t aegisora/$(APP):$(VERSION) .
