# Actions
Shared GitHub actions for Polylang projects. Provides the following actions:
- PHPUnit
- PHP Coding Standard (PHPCS and PHPStan)
- Playwright
- JS and CSS Coding Standard (ESLint)
- Slack Notifications
- Distribute

## Distribute

Builds a WordPress plugin distribution ZIP with [`@wpsyntex/distribute`](https://github.com/polylang/distribute), uploads it as a GitHub Actions artifact, and posts a download link on the associated pull request.

```yaml
permissions:
  contents: read
  actions: write
  pull-requests: write

steps:
  - uses: actions/checkout@v4
    with:
      fetch-depth: 0

  - uses: polylang/actions/distribute@main
    with:
      mode: production        # production | dev
      version: commit         # commit | tag | literal (e.g. 3.8.0)
      retention-days: 30
    env:
      COMPOSER_AUTH: ${{ secrets.GH_COMPOSER_AUTH }}
```

**Inputs:** `mode`, `version`, `npm-cmd`, `node-version` (default `22`), `php-version` (default `8.5`), `retention-days` (default `30`).

**Outputs:** `artifact-name`, `artifact-url`, `run-url`.

**Notes:**
- Run `actions/checkout@v4` with `fetch-depth: 0` before this action (required for git-based versioning).
- Pass `COMPOSER_AUTH` via `env` when the project uses private Composer packages.
- Artifact download URLs require a logged-in GitHub user; `run-url` is a fallback.
- Enable debug logging on a workflow re-run to force sequential composer/npm builds (`--sequential`).
