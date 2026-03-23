# OpenSpec — Implementation Specifications

This folder contains implementation specifications and the product roadmap for Nextcloud App Template.

OpenSpec specifications define the **how** of building features. They are created from planned features in `appspec/features/` and follow the artifact progression below.

## Structure

| File / Folder | Purpose |
|---|---|
| `ROADMAP.md` | High-level product roadmap, linked to features in `appspec/features/` |
| `changes/` | Individual change directories, each with a full set of specification artifacts |

## Artifact Progression

Each change in `changes/` moves through these artifacts:

```
proposal.md ──► specs.md ──► design.md ──► tasks.md ──► plan.json
                                                          │
                                                          ▼
                                                    GitHub Issues
                                                          │
                                                          ▼
                                                    implementation
                                                          │
                                                          ▼
                                                    archive/
```

## Starting a Change

When a feature in `appspec/features/` reaches `planned` status, create a change spec:

```
/opsx:ff {feature-name}    # Generate all artifacts at once
/opsx:new {change-name}    # Or start step by step
```

The feature definition (goal, user stories, acceptance criteria) becomes the input for the proposal.

## One Feature → Multiple Changes

A single feature may result in multiple OpenSpec changes if the scope is large. For example, a "Document Upload" feature might become:
- `changes/document-upload-backend/` — schema and API endpoints
- `changes/document-upload-frontend/` — Vue upload component
- `changes/document-upload-notifications/` — email/push notifications

Keep changes independently deployable where possible.

## Commands

| Command | Purpose |
|---------|---------|
| `/opsx:ff {name}` | Create all artifacts for a new change at once |
| `/opsx:new {name}` | Start a new change (step-by-step) |
| `/opsx:continue` | Generate the next artifact in the sequence |
| `/opsx:apply` | Implement tasks from a change |
| `/opsx:verify` | Verify implementation matches the spec |
| `/opsx:archive` | Archive a completed change |

## Relationship to `appspec/`

| `appspec/` | `openspec/` |
|---|---|
| **What** the app should do | **How** to build it |
| Feature concepts and ADRs | Detailed specs and design decisions |
| Config, identity, goals | Implementation tasks and GitHub Issues |
| Input for OpenSpec | Output for the development team |
