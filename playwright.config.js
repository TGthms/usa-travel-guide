// @ts-check
'use strict';

const { defineConfig, devices } = require('@playwright/test');

/**
 * Dev-only smoke tests for the static site (no build step).
 * Serves the repo root so relative asset paths match GitHub Pages layout.
 */
module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: process.env.CI ? 60_000 : 45_000,
  expect: { timeout: 12_000 },
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    navigationTimeout: 25_000,
    actionTimeout: 12_000,
    ...devices['Desktop Chrome'],
  },
  webServer: {
    // Node static server: handles keep-alive + broken clients better than python -m http.server
    command: 'node tools/static-server.js 4173',
    url: 'http://127.0.0.1:4173/index.html',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
