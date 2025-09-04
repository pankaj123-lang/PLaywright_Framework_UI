
import { defineConfig } from '@playwright/test';

export default defineConfig({
fullyParallel: true,
workers: 1,
repeatEach: 1,
retries: 0,
timeout:300000, // Default to 5 minutes

   projects: [
    
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        headless: false,
        screenshot: 'off',
        video: 'off',
        trace: 'off',
      },
    },
    
    
  ],
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-report/report.json' }]
  ]
});
