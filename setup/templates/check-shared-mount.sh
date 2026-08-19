#!/usr/bin/env bash
# Copied into <brain-repo>/.claude/hooks/check-shared-mount.sh by /setup
# (Step 0) and wired into .claude/settings.json's SessionStart hook.
#
# Anchored on step-functions/SKILL.md specifically because it's a stable,
# unlikely-to-be-renamed file in stepforge-skills — if this starts firing
# false alarms, check whether that file got renamed/moved upstream before
# assuming the submodule itself is broken.
#
# Always exits 0, on purpose. Empirically confirmed (2026-08-18): a
# SessionStart hook's stdout on exit 0 reaches the agent's own context.
# Nothing currently consumes a non-zero exit code from this hook, so
# there's no reason to route the failure message through an unverified
# path when a verified one is right there — this makes the check work
# the same way whether it passes or fails, instead of depending on
# exit-code semantics nobody has confirmed and nothing acts on anyway.
DIR="${CLAUDE_PROJECT_DIR:-.}"
KNOWN_FILE="$DIR/.claude/skills/shared/step-functions/SKILL.md"
if [ ! -e "$KNOWN_FILE" ]; then
  MSG="ERROR: shared skills submodule is not initialized ($KNOWN_FILE missing). Run: git submodule update --init --recursive"
  echo "$MSG"
  echo "$MSG" >&2
  exit 0
fi
echo "shared skills submodule OK"
