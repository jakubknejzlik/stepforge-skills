# Deployment Skill

How Smith deploys workflows to AWS. Two modes — choose during `/setup`.

## Direct Mode

Smith runs `sst deploy` directly. User's AWS credentials required.

### Deploy Workflow
```bash
export AWS_PROFILE=stepforge

# Deploy everything
sst deploy --stage dev

# Deploy specific workflow only
sst deploy --stage dev --target InvoiceWorkflow

# Deploy with verbose output
sst deploy --stage dev --verbose
```

### After Deploy
1. Verify deployment: check AWS console or `aws stepfunctions list-state-machines`
2. Update `data/registry.yaml` with:
   - Workflow name, ARN, stage
   - Building blocks used (with versions)
   - Deploy timestamp
   - Trigger configuration

### Workspace Management (Direct)
- Workspace may or may not be a git repo
- If git: commit after every change (`git add . && git commit -m "..."`)
- If not git: code is ephemeral — acceptable for experimentation
- Recommended: always use git for traceability

## Pipeline Mode *(planned)*

Smith commits code, CI/CD deploys. No direct AWS access needed.

### Deploy Workflow
1. Generate/modify code in workspace
2. `git add` + `git commit` with descriptive message
3. `git push` to remote
4. Create PR/MR:
   - GitHub: `gh pr create --title "..." --body "..."`
   - GitLab: `glab mr create --title "..." --description "..."`
5. Wait for review + merge
6. Monitor pipeline:
   - GitHub: `gh run watch`
   - GitLab: `glab ci status`
7. Update registry after successful deploy

### Pipeline Bootstrap
During `/setup` with pipeline mode, create:
- `.github/workflows/deploy.yml` (GitHub) or `.gitlab-ci.yml` (GitLab)
- Configure AWS credentials in CI secrets
- Set up branch protection rules (recommended)

## Rollback

### Direct Mode
```bash
# SST keeps state — redeploy previous version
git checkout HEAD~1 -- infra/ src/
sst deploy --stage dev
git checkout HEAD -- infra/ src/
```

### Pipeline Mode
- Revert commit → push → pipeline redeploys
- Or: create new PR that reverts changes

## Stage Management

Use SST stages to separate environments:
- `dev` — development/testing
- `production` — live workflows

```bash
sst deploy --stage dev         # development
sst deploy --stage production  # production (careful!)
```

Each stage has its own:
- AWS resources (separate state machines, Lambdas, tables)
- Secrets (`sst secret set KEY value --stage production`)
- SST state (`.sst/` directory)
