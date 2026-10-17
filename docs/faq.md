# FAQ

## What is Aegisora?
A runtime security and governance layer for AI agents. It evaluates agent actions against policy and returns ALLOW, BLOCK or ESCALATE decisions with audit evidence.

## Is Aegisora SOC 2, ISO 27001 or HIPAA certified?
No. Aegisora does not currently claim these certifications. See the compliance readiness documents in this repository for the current status.

## How do I install it?
See `installation.md`.

## How do I run the tests?
Run `pnpm verify` for the full check, or `pnpm --filter "@aegisora/runtime" test` for the runtime suite only.

## Are Docker images or Helm charts available?
Not yet. Packaging is not part of this repository at the moment.

## How do I report a vulnerability?
Follow the process in `SECURITY.md`. Please do not open public issues for security reports.

## Where do I get help?
See `SUPPORT.md`.