# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it
privately by opening a security advisory at:

https://github.com/weed33834/freenode/security/advisories/new

We will respond within a reasonable timeframe and work with you to resolve the
issue before any public disclosure.

## Scope

- The pipeline scripts (`scripts/`) and their dependencies.
- Secret/key leaks in tracked files (use `scripts/check_secrets.sh` before
  pushing).

**Out of scope:** The node/proxy links themselves come from third parties; we
do not control their content or security.
