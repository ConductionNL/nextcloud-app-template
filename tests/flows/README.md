# Test Flows

This directory contains markdown test flow files for LLM-based testing.

Test flows describe user journeys in structured markdown that can be executed by:
- **LLM test agents** (via `/test-app` or persona testers)
- **Human testers** following the steps manually

## Naming Convention

Files are numbered and named by user journey:
- `01-dashboard.md` — Dashboard page verification
- `02-sidebar-navigation.md` — Navigation structure
- `03-{feature}.md` — Feature-specific flows

## Structure

Each flow file contains:
- **Persona** — Who is performing the test
- **Preconditions** — Required state before testing
- **Steps** — Numbered actions with expected results
- **Verification** — What to check after the flow completes
