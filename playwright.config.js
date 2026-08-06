// @ts-check
'use strict';

const { defineConfig, devices } = require('@playwright/test');

/**
 * Dev-only smoke tests for the static site (no build step).
 * Serves the repo root so relative asset paths match GitHub Pages layout.
 */
module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Local: few workers + 1 retry — python http.server can reset under heavy parallel gallery load.
  retries: 1,
  workers: process.env.CI ? 1 : 2,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'python3 -m http.server 4173',
    url: 'http://127.0.0.1:4173/index.html',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
