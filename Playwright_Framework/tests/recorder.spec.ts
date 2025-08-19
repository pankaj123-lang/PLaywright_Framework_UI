import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://login-prod.morningstar.com/login?state=hKFo2SBIS0RuT2pjdFFjbTI1blhwTFJzanJFN2UzQmtPMEthMqFupWxvZ2luo3RpZNkgZzZOcF82RDRMWTFCTnlFUGJHQzd1bGZ0ZE9wVWJpY2-jY2lk2SBDaGVLTTR1ajhqUFQ2MGFVMkk0Y1BsSDhyREtkT3NaZA&client=CheKM4uj8jPT60aU2I4cPlH8rDKdOsZd&protocol=oauth2&response_type=code&redirect_uri=https%3A%2F%2Fauth0-session-manager-api-awsprod.dir80bdc.eas.morningstar.com%2Fsso%2Fjson%2Fmsusers%2Fapp-authenticate-callback&scope=openid%20profile%20offline_access%20email&msrealm=msusers&source=bus0370&ext-source=bus0370');
});