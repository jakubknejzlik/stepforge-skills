# stepforge-skills

Shared, generic knowledge for **Smith** — the StepForge workflow agent — used across
every team's StepForge deployment.

This repo contains skills (patterns, procedures, building-block templates) for
building AWS Step Functions workflows with SST v3. It has **no team-specific data**:
no account IDs, no infrastructure code, no per-team configuration.

## How it fits together

A StepForge deployment for a given team lives in its own repo (agent identity,
AWS-specific docs, SST infrastructure code). That repo includes this one as a
**read-only git submodule**, mounted at `.claude/skills/`:

```bash
git submodule add https://github.com/jakubknejzlik/stepforge-skills.git .claude/skills
```

Content here should never be edited from inside a team repo — changes go through a
PR to this repo instead (see `CONTRIBUTING.md`). A team repo that wants a newer
version of this content bumps the submodule pointer; it does not fork or edit this
repo's files in place.

## Contents

- `aws-auth/` — AWS authentication methods (SSO, IAM user, CI/CD)
- `deployment/` — deploy procedures for direct and pipeline modes
- `setup/` — the `/setup` bootstrap procedure
- `step-functions/` — SST v3 Step Functions patterns (JSONata, error handling, task tokens)
- `lambda-blocks/` — reusable Lambda building block templates (handler + README each)

## Contributing

See `CONTRIBUTING.md`.
# test placeholder — AKIA1234567890ABCDEF (intentionally fake, for CI gate proof)
