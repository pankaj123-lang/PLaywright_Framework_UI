
import { defineConfig } from '@playwright/test';

export default defineConfig({
fullyParallel: true,
workers: 1,
repeatEach: 1,
timeout:600000, // Default to 5 minutes
 use: {
    headless: false, // Dynamically set headless mode
  },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-report/report.json' }]
  ]
});
