
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/Project_1_1754321220807', open: 'never' }],
    ['json', { outputFile: 'test-report/report.json' }]
  ]
});
