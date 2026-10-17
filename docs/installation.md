# Installation

## Requirements

- Node.js (verified on v24.13.0)
- pnpm
- Git

## Install from source

    git clone https://github.com/aegisora-ai/aegisora.git
    cd aegisora
    pnpm install

## Verify the installation

    pnpm verify

`pnpm verify` builds, type-checks and tests all `@aegisora/*` workspace packages.

## Workspace packages

`@aegisora/core`, `@aegisora/policy-engine`, `@aegisora/security-engine`, `@aegisora/runtime`, `@aegisora/sdk`, `@aegisora/audit`, `@aegisora/observability`, `@aegisora/plugins`, `@aegisora/storage`.

## Not included yet

Container images, Helm charts and Terraform modules are not part of this repository yet.

## Troubleshooting

- `pnpm: command not found` - install it with `npm install -g pnpm`.
- Build errors after upgrading Node.js - delete `node_modules` and run `pnpm install` again.