import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30000,
  use: { baseURL: 'http://localhost:3210' },
  webServer: {
    command: 'node cli.mjs -s -p 3210 -r tests/fixtures',
    url: 'http://localhost:3210',
    reuseExistingServer: !process.env.CI,
  },
});
