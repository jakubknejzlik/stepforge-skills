#!/usr/bin/env bash
# Mechanical shape-based scan for likely-sensitive identifiers.
# Fails loudly (non-zero exit + findings printed) — never a silent pass.
# This is a floor, not a ceiling: it catches known shapes, not judgment
# calls about how much internal detail a change reveals. A human review
# pass is still required on every PR — see CONTRIBUTING.md.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

FILES=$(git ls-files | grep -v '^\.git')
if [ -z "$FILES" ]; then
  echo "check-secrets: FAILED — git ls-files returned no tracked files. Refusing to report a pass with nothing scanned." >&2
  exit 1
fi
FOUND=0

check() {
  local label="$1"
  local pattern="$2"
  local matches
  # -r/--no-run-if-empty: without it, an empty $FILES still invokes grep once
  # with no file args, which reads real stdin instead of scanning nothing —
  # a silent false-pass, not caught by $FILES already being checked above
  # for every call site that might slip through.
  matches=$(echo "$FILES" | xargs -r grep -nE "$pattern" 2>/dev/null || true)
  if [ -n "$matches" ]; then
    echo "FAIL: $label"
    echo "$matches"
    echo
    FOUND=1
  fi
}

check "12-digit number (possible AWS account ID)" '\b[0-9]{12}\b'
check "arn:aws: with embedded account ID"          'arn:aws:[a-z0-9-]*:[a-z0-9-]*:[0-9]{12}:'
check "AWS access key ID"                          'AKIA[0-9A-Z]{16}'
check "ECR registry hostname"                      '[0-9]{12}\.dkr\.ecr\.'
check "email address"                              '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'
check "URL with embedded credentials"               'https?://[^/[:space:]]*:[^/[:space:]@]*@'
check "GitHub token"                                'gh[ps]_[A-Za-z0-9]{20,}'

if [ "$FOUND" -ne 0 ]; then
  echo "check-secrets: FAILED — one or more shape matches above. Fix or justify before pushing."
  exit 1
fi

echo "check-secrets: OK — no shape matches found."
