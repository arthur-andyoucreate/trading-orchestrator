import { defineConfig, devices } from '@playwright/test';

/**
 * Trading Orchestrator - Playwright Configuration
 * Optimized for progress recording and demo creation
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Sequential for recording
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for recording
  reporter: [
    ['html', { outputFolder: 'recordings/reports' }],
    ['json', { outputFile: 'recordings/test-results.json' }]
  ],
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Optimized for recording
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
    // Slower interactions for better recording
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'progress-recording',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        // Enable recording features
        video: {
          mode: 'on',
          size: { width: 1920, height: 1080 }
        },
        trace: 'on',
        screenshot: 'on'
      },
    },
    
    {
      name: 'demo-creation',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        // High quality for demo
        video: {
          mode: 'on',
          size: { width: 1920, height: 1080 }
        },
        // Slower pace for demo clarity
        actionTimeout: 5000,
        navigationTimeout: 15000
      },
    },

    {
      name: 'mobile-demo',
      use: {
        ...devices['iPhone 13'],
        video: {
          mode: 'on',
          size: { width: 390, height: 844 }
        }
      },
    }
  ],

  // Local dev server
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  // Recording-specific settings
  outputDir: 'recordings/test-output',
  
  // Global setup for recordings
  globalSetup: require.resolve('./tests/global-setup.ts'),
  globalTeardown: require.resolve('./tests/global-teardown.ts'),
});