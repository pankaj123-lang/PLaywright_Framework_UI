
import { defineConfig } from '@playwright/test';

export default defineConfig({
fullyParallel: true,
workers: 1,
repeatEach: 1,
timeout:300000, // Default to 5 minutes
 use: {
    headless: false, // Dynamically set headless mode
    screenshot: 'off', // retain-on-failire/disable screenshots
    video: 'on', // retain-on-failure/disable video recording
  },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-report/report.json' }]
  ]
});
