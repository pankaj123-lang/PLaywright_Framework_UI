
import { defineConfig } from '@playwright/test';

export default defineConfig({
fullyParallel: true,
 use: {
    headless: true, // Dynamically set headless mode
  },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-report/report.json' }]
  ]
});
