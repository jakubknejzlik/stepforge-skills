# Contributing

This repo is the shared, generic knowledge layer for all StepForge/Smith
deployments. It is consumed as a read-only git submodule by every team's own
repo — nothing here should reference a specific AWS account, team, or
deployment.

## Before opening a PR

Two checks apply to every change, and both are required — neither replaces
the other.

### 1. Mechanical scan (must pass, no exceptions)

```bash
./scripts/check-secrets.sh
```

This greps for *shapes* that are almost always sensitive: 12-digit numbers
(AWS account IDs), `arn:aws:` with an embedded account ID, AWS access key IDs,
ECR registry hostnames, email addresses, credential-bearing URLs, GitHub
tokens. It fails loudly (non-zero exit, findings printed) — it does not warn
and continue. If it fails, fix the content or, in the rare case of a false
positive, get explicit maintainer sign-off before overriding it.

This should also run as a CI check on every PR, not just locally before push.

### 2. Human review: "would I be fine with anyone reading this?"

The mechanical scan only catches known *shapes*. It cannot judge whether a
change reveals more about internal system design, naming conventions, or
architecture than intended, even with no literal secret in it. Every PR needs
a reviewer to explicitly consider this question — this is a required review
step, not a one-time audit that only applied to the repo's founding commit.

## What belongs here vs. what doesn't

- **Belongs here:** patterns, procedures, and building-block templates that
  would help *any* StepForge team — nothing that's true of only one team's
  account or infrastructure.
- **Does not belong here:** account IDs, ARNs, profile names tied to a real
  account, infrastructure decisions specific to one team, operational
  logs/memory of any kind. That content lives in the team's own repo.
- Generalization is additive, not a move: when promoting a learning from a
  team's own notes into a skill here, keep the concrete example where it was
  captured and add the generalized principle here — don't delete the team's
  own record of it.

## Versioning and consumption

Teams pin this repo via a git submodule at a fixed commit. There is currently
no automated process bumping every team's pointer — each team (or the agent
operating on their behalf) is responsible for periodically checking for
upstream changes and opening a bump PR into their own repo.

## License / external contributions

Not yet decided — ask the maintainer before assuming either default.
