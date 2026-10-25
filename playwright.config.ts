import { defineConfig, devices } from '@playwright/test';

// Fake microphone (a synthetic tone) so the tuner can be exercised without hardware.
const FAKE_MEDIA = ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'];

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: false,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['github']] : [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    locale: 'pt-PT',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'], launchOptions: { args: FAKE_MEDIA } } },
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], launchOptions: { args: FAKE_MEDIA } } },
  ],
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
