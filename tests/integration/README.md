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
newman run tests/integration/app-template.postman_collection.json \
  --env-var baseUrl=http://localhost \
  --env-var username=admin \
  --env-var password=admin
```

## Structure

Add your Postman collection JSON files to this directory. The CI runner picks up
all `*.postman_collection.json` files automatically.
