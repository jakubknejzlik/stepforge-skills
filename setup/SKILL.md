# Setup Skill

The `/setup` command bootstraps a new StepForge installation. Smith guides the user through the entire process interactively.

## Setup Flow

### Step 0: Verify the Shared Skills Layer

This repo (the team's brain) consumes `stepforge-skills` as a read-only git
submodule at `.claude/skills/shared/`. Before anything else, make sure the
guard that protects it actually exists — it does not come from the submodule
itself (a check for an empty mount stored inside the mount can't fire if the
mount is empty), so `/setup` is what has to establish it for every team.

1. Initialize the submodule if needed:
   ```bash
   git submodule update --init --recursive
   ```
2. Confirm `.claude/settings.json` has a deny rule blocking Write/Edit on the
   shared path (create it if missing — merge into any existing file, don't
   overwrite):
   ```json
   {
     "permissions": {
       "deny": ["Write(.claude/skills/shared/**)", "Edit(.claude/skills/shared/**)"]
     }
   }
   ```
   This does not cover Bash — a shell command can still write into the
   submodule path. It catches the common case, not every case.
3. Copy `setup/templates/check-shared-mount.sh` (in this submodule) to
   `.claude/hooks/check-shared-mount.sh` in the brain repo, **always
   overwriting** — don't just check whether the destination already exists.
   A presence-only check means a team's copy can silently drift from the
   canonical template after this file changes upstream; always re-copying
   makes every `/setup` run (initial or re-run) self-correcting instead.
   Wire it into `.claude/settings.json` under `hooks.SessionStart`. This is
   deliberate — the template owns the canonical content — but it means any
   local edit a team makes to this file is silently lost on the next
   `/setup` run; say so if you make one, don't let it be discovered as a bug.

**Known limit, not yet closed:** this step only runs at `/setup` time. A
submodule bump updates the *instructions* a team gets the next time they run
`/setup`, but does nothing for a team that already onboarded and never reruns
it — their copy of the hook script stays whatever it was, even after this
template changes upstream. Re-copying on every `/setup` run helps only if
`/setup` actually gets rerun. The scheduled harvest/bump-check cycle (see
this repo's own `CONTRIBUTING.md`) should re-run this copy step as part of
bumping the submodule pointer, not just update the SHA — until that's wired
up, an existing team's guard can go stale with no signal that it happened.

4. **Exit-code / output-channel behavior — partially confirmed, one gap
   remains.** Confirmed 2026-08-18 on a real deployment (stepforge-brain,
   commit `e123294`): on success (`exit 0`), the hook's stdout message
   *does* reach the agent's own context, not just a console — observed
   directly as a `SessionStart:resume hook success: ...` entry in the
   agent's context at session start. The write-guard was also confirmed
   working the same session: an `Edit` attempt on a file under
   `.claude/skills/shared/` was rejected with `"File is in a directory that
   is denied by your permission settings."`

   **Still open:** the failure path (`exit 1`, mount actually broken/empty)
   has not yet been observed — the confirmation above happened on a healthy
   mount. Don't assume the failure path behaves the same as the success
   path just because the success path is now confirmed; verify it
   separately (break the known-file check, start a fresh session, observe)
   before treating this as fully closed.

Only move on to Step 1 once this passes.

### Step 1: Check Prerequisites
```bash
# Verify Bun is installed
bun --version

# Verify AWS CLI is installed
aws --version
```
If missing, guide user to install:
- Bun: `curl -fsSL https://bun.sh/install | bash`
- AWS CLI: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html

### Step 2: Choose Deployment Mode
Ask user:
> How do you want to deploy workflows?
> 1. **Direct** — I deploy to your AWS account directly (simpler, faster)
> 2. **Pipeline** — I commit code, CI/CD deploys (safer, team-friendly)

### Step 3: Configure AWS Access

**If Direct + SSO:**
1. Ask for SSO start URL, account ID, region, role name
2. Write SSO profile to `~/.aws/config` (or guide user to do it)
3. Run `aws sso login --profile stepforge --no-browser --use-device-code`
4. Send device code to user, wait for authorization
5. Verify: `aws sts get-caller-identity --profile stepforge`

**If Direct + IAM:**
1. Ask user to create IAM user with appropriate permissions
2. Guide user to configure `~/.aws/credentials`
3. Verify: `aws sts get-caller-identity --profile stepforge`

**If Pipeline:**
1. Ask for git repo URL (or create new one)
2. CI/CD credentials will be configured in the pipeline setup step

### Step 4: Create Workspace
Ask user where to create the workspace (must be outside brain directory):
```bash
# Create workspace directory
mkdir -p /path/to/workspace
cd /path/to/workspace

# Initialize git repo (if not pipeline mode with existing repo)
git init

# Initialize SST project
bun init -y
bunx sst init

# Install dependencies
bun install
```

Generate initial `sst.config.ts`:
```typescript
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "stepforge",
      removal: input.stage === "production" ? "retain" : "remove",
      home: "aws",
      providers: {
        aws: {
          region: "YOUR_REGION", // ask the user which region to deploy to during Step 3 — don't default
        },
      },
    };
  },
  async run() {
    // Core infrastructure will be added here
  },
});
```

### Step 5: Deploy Core (Direct mode only)
```bash
export AWS_PROFILE=stepforge
sst deploy --stage dev
```

### Step 6: Pipeline Setup (Pipeline mode only)
Generate CI/CD config:
- GitHub: `.github/workflows/deploy.yml`
- GitLab: `.gitlab-ci.yml`

Guide user to configure AWS credentials in CI secrets.

### Step 7: Confirm & Save Config
- Verify workspace is set up
- Verify AWS connectivity
- Save config to `.local/config.yaml` in brain directory
- Report: "Setup complete. Tell me what you want to automate."

## Config File

After setup, `.local/config.yaml` stores minimal runtime state:
```yaml
workspaces:
  - name: default
    path: /absolute/path/to/workspace
    mode: direct           # direct | pipeline
    git_repo: null         # URL if pipeline mode
    stage: dev             # default SST stage

aws:
  profile: stepforge       # AWS profile name
  auth: sso                # sso | iam | pipeline
  region: eu-central-1     # example — actual value is whatever the user chose during setup

setup_completed: true
setup_date: 2026-04-21
```

Note: `.local/` is gitignored — this config is per-instance, not shared.

## Re-running Setup

If `/setup` is called again and `.local/config.yaml` exists:
- Ask: "You already have a configuration. Do you want to reconfigure?"
- Allow changing mode, AWS settings, or adding another workspace
- Don't destroy existing workspace without explicit confirmation
