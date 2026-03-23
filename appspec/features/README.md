# Features

This folder contains high-level feature definitions for Nextcloud App Template.

Features are concepts and goals — not implementation specs. They serve as the input for OpenSpec changes when you are ready to build.

## Feature Lifecycle

```
idea ──► planned ──► in-progress ──► done
  │          │
  │     use /opsx:ff
  │     to create a
  │     change spec
  │
still fuzzy,
needs more thinking
```

| Status | Meaning |
|--------|---------|
| `idea` | Concept noted, not yet ready to spec out — keep exploring |
| `planned` | User stories and acceptance criteria defined — **ready for `/opsx:ff`** |
| `in-progress` | One or more OpenSpec changes have been created from this feature |
| `done` | All associated OpenSpec changes have been archived |

## File Format

Each feature is a Markdown file named `{feature-name}.md`:

```markdown
# {Feature Name}

**Status**: idea | planned | in-progress | done

**OpenSpec changes:** _(links to openspec/ change directories when applicable)_

## Goal

What this feature does and why it matters to users.

## User Stories

- As a [role], I want to [action] so that [outcome]

## Acceptance Criteria

- [ ] ...
- [ ] ...

## Notes

Open questions, constraints, dependencies, related ADRs.
```

## Important Notes

- A single feature can result in **multiple OpenSpec changes** — break large features into independently deployable slices
- Features are maintained at the concept level here; implementation details live in `openspec/`
- Once a feature moves to `in-progress`, link to the OpenSpec change directories in the `OpenSpec changes` field
- Features are explored and created during `/app-explore` sessions
