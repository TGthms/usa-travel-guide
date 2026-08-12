#!/bin/sh
# Remove maintainer-only files before a public static deploy.
# Used by GitHub Pages (static.yml). Cloudflare Pages should run the same
# command as its build step, or rely on root _redirects as a fallback.
set -eu
cd "$(dirname "$0")/.."

rm -rf \
  tools \
  e2e \
  docs \
  .github \
  .grok \
  "Add Photos.command"

rm -f \
  package.json \
  package-lock.json \
  playwright.config.js \
  .gitignore \
  .gitattributes \
  .editorconfig

find . -name '__pycache__' -type d -prune -exec rm -rf {} +
find . -name '.DS_Store' -delete
find . -name '*.pyc' -delete
