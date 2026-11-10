#!/usr/bin/env bash
# Idempotent installer for the tovedem git hooks.
# Safe to run any number of times: it never overwrites an existing hook,
# it chains to it instead. Run via: npm run secrets:install
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOKS_DIR="$(git rev-parse --git-path hooks)"
MARKER="tovedem-secrets-hook"
SOURCE_HOOK="$REPO_ROOT/scripts/git-hooks/pre-commit"
TARGET_HOOK="$HOOKS_DIR/pre-commit"

if [ ! -f "$SOURCE_HOOK" ]; then
  echo "install-git-hooks: $SOURCE_HOOK not found" >&2
  exit 1
fi

# Already installed? Nothing to do.
if [ -f "$TARGET_HOOK" ] && grep -q "$MARKER" "$TARGET_HOOK"; then
  echo "install-git-hooks: pre-commit hook already installed."
  exit 0
fi

# A different pre-commit hook exists: preserve it and let ours chain to it.
if [ -f "$TARGET_HOOK" ]; then
  mv "$TARGET_HOOK" "$HOOKS_DIR/pre-commit.pre-tovedem"
  chmod +x "$HOOKS_DIR/pre-commit.pre-tovedem"
  echo "install-git-hooks: existing pre-commit hook preserved as pre-commit.pre-tovedem (it will still run)."
fi

cp "$SOURCE_HOOK" "$TARGET_HOOK"
chmod +x "$TARGET_HOOK"
echo "install-git-hooks: installed $TARGET_HOOK"

if ! command -v gitleaks >/dev/null 2>&1; then
  echo "install-git-hooks: WARNING - gitleaks not found in PATH." >&2
  echo "  Install with: brew install gitleaks" >&2
  echo "  The hook will refuse to let commits through until gitleaks is available." >&2
fi
