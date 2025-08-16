
import { defineConfig } from '@playwright/test';

export default defineConfig({
fullyParallel: true,
workers: 5,
repeatEach: 1,
timeout:600000, // Default to 5 minutes
 use: {
    headless: false, // Dynamically set headless mode
    screenshot: 'on', // retain-on-failire/disable screenshots
    video: 'off', // retain-on-failure/disable video recording
  },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-report/report.json' }]
  ]
});
