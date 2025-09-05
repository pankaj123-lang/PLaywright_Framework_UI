import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://login-prod.morningstar.com/login?state=hKFo2SBIdFU4X2lKZHJHSWdzSWdKY195dFRFOFc3NEs4eV85SKFupWxvZ2luo3RpZNkgbHRrcWFVOTR1eHdZYUwtZUFCRGR6SnMwd3NRQy14MkSjY2lk2SBDaGVLTTR1ajhqUFQ2MGFVMkk0Y1BsSDhyREtkT3NaZA&client=CheKM4uj8jPT60aU2I4cPlH8rDKdOsZd&protocol=oauth2&response_type=code&redirect_uri=https%3A%2F%2Fauth0-session-manager-api-awsprod.dir80bdc.eas.morningstar.com%2Fsso%2Fjson%2Fmsusers%2Fapp-authenticate-callback&scope=openid%20profile%20offline_access%20email&msrealm=msusers&source=bus0370&ext-source=bus0370');
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