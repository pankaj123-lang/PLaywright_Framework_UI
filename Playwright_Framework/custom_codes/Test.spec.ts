// New TypeScript file

import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://mira.morningstar.com/a/');
  await page.getByText('Email address*').click();
  await page.getByRole('textbox', { name: 'Email address*' }).fill('pankaj.mahanta@morningstar.com');
  await page.getByRole('textbox', { name: 'Email address*' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password*' }).fill('Mumbai@2025');
  await page.getByRole('button').filter({ hasText: /^$/ }).click();
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('h1')).toContainText('Greetings Pankaj Mahanta!');
  await expect(page.getByLabel('chatbot conversation').locator('h2')).toContainText('Welcome to DBRS the All Methodologies Corpus');
  await expect(page.getByText('Greetings Pankaj Mahanta!Welcome to DBRS the All Methodologies CorpusWhat')).toBeVisible();
  await page.getByRole('button', { name: 'Policies & Procedures' }).click();
  await page.locator('#component-9').click();
  await page.locator('.close').first().click();
  await page.locator('#component-10').click();
  await page.getByRole('link', { name: 'Logout' }).click();
});