# Nextcloud App Template — App Specification

This folder contains the configuration and specification for Nextcloud App Template.

## Goal

A starting point for building Nextcloud apps following ConductionNL conventions.

## Structure

| File / Folder | Purpose |
|---|---|
| `app-config.json` | Core app configuration — id, name, goal, dependencies, CI settings |
| `features/` | High-level feature definitions — each feature is a candidate for an OpenSpec change |
| `adr/` | Architectural Decision Records — documents key design decisions and their rationale |

## Workflow

1. **Define features** — Use `/app-explore` to identify and document features in `features/`
2. **Record decisions** — Use `/app-explore` to capture architectural decisions in `adr/`
3. **Apply config** — Use `/app-apply` to sync `app-config.json` changes to the actual app files
4. **Verify sync** — Use `/app-verify` to audit that app files match this configuration
5. **Implement features** — When a feature reaches `planned` status, use `/opsx:ff` to create an OpenSpec change

## Commands

- `/app-explore` — Think through and update app configuration, features, and ADRs
- `/app-apply` — Apply `app-config.json` changes to the actual app files
- `/app-verify` — Read-only audit of app files against this configuration
- `/opsx:ff {feature-name}` — Create a full OpenSpec change from a planned feature
