import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './tests',
  timeout: 30000,
  expect: {
    timeout: 10000
  },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on',
    screenshot: 'on',
    video: 'on',
    headless: false,
    viewport: { width: 1280, height: 720 },
    launchOptions: {
      slowMo: 1000,
    }
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
      },
    }
  ],
  reporter: [
    ['list'],
    ['html'],
    ['json', { outputFile: 'test-results/test-results.json' }]
  ],
  outputDir: 'test-results',
  preserveOutput: 'always',
  workers: 1,
  retries: 0,
  fullyParallel: false,
  forbidOnly: true,
  globalTimeout: 60000,
  reportSlowTests: {
    max: 5,
    threshold: 15000
  },
  maxFailures: 1
};

export default config;
