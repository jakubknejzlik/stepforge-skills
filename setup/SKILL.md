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
3. Confirm `.claude/hooks/check-shared-mount.sh` exists and is wired into
   `.claude/settings.json` under `hooks.SessionStart`. It should check for a
   specific known file inside the mount (not just directory existence — an
   uninitialized submodule directory still exists, just empty), not merely
   log to a console nobody reads. **Before relying on this in production,
   verify empirically which exit code + output channel actually surfaces the
   failure to the agent itself** (rename the known file, start a session,
   observe) rather than assuming — this hasn't been confirmed yet as of this
   writing, and getting it wrong means the agent silently starts a session
   with no skills and no idea anything is missing, which is the exact failure
   this step exists to prevent. Update this note once verified.

Only move on to Step 1 once this passes — an agent that starts a session with
an uninitialized shared layer will behave as if it never had any skills at
all, with no error visible anywhere.

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
