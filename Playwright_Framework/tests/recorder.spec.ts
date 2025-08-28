import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://login-stg.morningstar.com/login?state=hKFo2SBkSi1sVU5UdmNvcmxmQ0N3MktMQ3hBTDhwVDZrelNJUaFupWxvZ2luo3RpZNkgdzdBTm9kNGZveU85YzJxYm41TnF2alRCelN3bUhDdzCjY2lk2SBLUjJDMFNuVGFkWVhhbTk0bGNDQ25OcjdwY3FSSVlSWQ&client=KR2C0SnTadYXam94lcCCnNr7pcqRIYRY&protocol=oauth2&response_type=code&redirect_uri=https%3A%2F%2Fauth0-session-manager-api-awsstg.dir9633c.easn.morningstar.com%2Fsso%2Fjson%2Fmsusers%2Fapp-authenticate-callback&scope=openid%20profile%20offline_access%20email&msrealm=msusers&source=bus0370&ext-source=bus0370');
  await page.getByRole('textbox', { name: 'Email address*' }).click();
  await page.getByRole('button').filter({ hasText: /^$/ }).click();
});