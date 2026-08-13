# Integration Tests (Newman / Postman)

This directory contains Newman/Postman test collections for API integration testing.

## Enabling in CI

In `.github/workflows/code-quality.yml`, set:

```yaml
enable-newman: true
```

## Running locally

```bash
npm install -g newman
newman run tests/integration/apptemplate.postman_collection.json \
  --env-var base_url=http://nextcloud.local \
  --env-var admin_user=admin \
  --env-var admin_password=admin
```

The variable names (`base_url`, `admin_user`, `admin_password`) match what the CI workflow passes.

`base_url` has **no default** — you must pass `--env-var base_url=...`. It used to
default to `http://localhost:8080`, which on a developer machine is the *shared*
Nextcloud dev container, so a local `newman run` quietly created fixtures and fired
failed logins inside an instance other people were using. In CI the ephemeral PHP
built-in server is on `:8080` and the workflow passes it explicitly; locally, point
at your own disposable instance (e.g. `http://localhost:8096`) or `http://nextcloud.local`.

## Structure

Add your Postman collection JSON files to this directory. The CI runner picks up
all `*.postman_collection.json` files automatically.
