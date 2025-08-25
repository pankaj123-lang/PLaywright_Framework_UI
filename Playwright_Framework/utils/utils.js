import variables from "../../frontend/src/constants/variables.js";
import { expect } from "@playwright/test";
export function resolveValue(value) {
    if (typeof value === "string" && value.startsWith("${") && value.endsWith("}")) {
      const key = value.slice(2, -1); // Remove ${ and }
      console.log(`Resolving variable: ${key}`); // Log variable resolution
      return variables[key] || value; // Return variable value or original if not found
    }
    return value; // Return as is if not a variable
  }

  export async function elementToBevisible(page, selector, test, timeOut) {
    try {
      await expect(page.locator(selector), `Element Not Found: ${selector}`).toBeVisible({ timeout: timeOut });
    } catch (error) {
      const screenShot = await page.screenshot();
      await test.info().attach(`Failed_Screenshot`, {
        body: screenShot,
        contentType: "image/png",
      });
      throw error;
    }
    return page.locator(selector);
  }