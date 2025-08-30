import variables from "../../frontend/src/constants/variables.js";
import { expect } from "@playwright/test";
export function resolveAppropriately(value, test) {
  if (test && test.datarow) {
    return resolveDatasetValue(test.datarow, value);
  } else {
    return resolveValue(value);
  }
}
export function resolveDatasetValue(dataRow,value) {
    if (typeof value === "string" && value.startsWith("${") && value.endsWith("}")) {
      const key = value.slice(2, -1); // Remove ${ and }
      console.log(`Resolving Dataset : ${key}`); // Log variable resolution
      return dataRow[key] || value; // Return variable value or original if not found
    }
    return value; // Return as is if not a variable
  }
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
  export async function saveVariables(page, key, value) {
    try {
      const response = await page.request.post("http://localhost:5000/api/saveVariables", {
        data: { newKey: key, newValue: value },
      });
      const data = await response.json();
      if (data.success) {
        console.log(`Variable saved: ${key} = ${value}`);
      } else {
        console.error("Failed to save variable. Please try again.");
      }
    } catch (error) {
      console.error("Error saving variable:", error);
    }
  }
  export async function normalizeSelector(raw) {
    // If XPath
    if (raw.startsWith("//") || raw.startsWith("(")) {
      return `xpath=${raw}`;
    }
    // If CSS-like attribute selector [name="login"]
    if (raw.startsWith("[") && raw.endsWith("]")) {
      return raw;
    }
    // If starts with # or . (id or class selector)
    if (raw.startsWith("#") || raw.startsWith(".")) {
      return raw;
    }
    // If it's text selector
    if (raw.startsWith("text=")) {
      return raw;
    }
    if (raw.startsWith("id=")) {
      const value = raw.split("=")[1];
      return `[id=${value}]`;
    }
    if (raw.startsWith("name=")) {
      const value = raw.split("=")[1];
      return `[name=${value}]`;
    }
    if (raw.startsWith("css=")) {
      const value = raw.split("=")[1];
      return value;
    }
    if (raw.startsWith("class=")) {
      const value = raw.split("=")[1];
      return `[class=${value}]`;
      
    }
    
    // Fallback: treat as CSS selector
    return raw;
  }