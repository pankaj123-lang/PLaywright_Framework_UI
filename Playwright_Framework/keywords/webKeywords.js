const { expect } = require("@playwright/test");
const { resolveValue } = require("../utils/utils.js");
module.exports = {
  goto: async (page, step, test) => {
    const value = resolveValue(step.value || "");
    if (!value) throw new Error(`Missing selector for goto step`);
    try {
      await page.goto(value);
    } catch (error) {
      throw new Error(`Failed to navigate to ${value}: ${error.message}`);
    }

  },
  fill: async (page, step, test) => {
    const value = resolveValue(step.value || "");
    if (!step.selector) throw new Error(`Missing selector for fill step`);
    const selector = normalizeSelector(step.selector);
    try {
      elementToBevisible(page, selector, test);
      await page.locator(selector).fill(value || "");
    } catch (error) {
      throw new Error(`Failed to fill selector ${selector}: ${error.message}`);
    }
  },
  click: async (page, step, test) => {
    if (!step.selector) throw new Error(`Missing selector for click step`);
    const selector = normalizeSelector(step.selector);
    try {
      elementToBevisible(page, selector, test);
      await page.locator(selector).click();
    } catch (error) {
      throw new Error(`Failed to click selector ${selector}: ${error.message}`);
    }

  },

  reload: async (page) => {
    await page.reload();
  },
  goBack: async (page) => {
    await page.goBack();
  },
  goForward: async (page) => {
    await page.goForward();
  },
  tap: async (page, step) => {
    if (!step.selector) throw new Error(`Missing selector for tap step`);
    const selector = normalizeSelector(step.selector);
    await page.locator(selector).tap();
  },
  doubleClick: async (page, step) => {
    if (!step.selector) throw new Error(`Missing selector for dblclick step`);
    const selector = normalizeSelector(step.selector);
    await page.locator(selector).dblclick();
  },
  assertText: async (page, step) => {
    const value = resolveValue(step.value || "");
    if (!step.selector) throw new Error(`Missing selector for assertText step`);
    const selector = normalizeSelector(step.selector);
    const text = await page.locator(selector).innerText();
    if (text !== value) {
      throw new Error(`Expected text "${value}" but got "${text}"`);
    }
  },
  waitForSelector: async (page, step) => {
    const value = resolveValue(step.value || "");
    if (!step.selector)
      throw new Error(`Missing selector for waitForSelector step`);
    const selector = normalizeSelector(step.selector);
    await page.waitForSelector(selector, { timeout: value || 5000 });
  },
  waitForTimeout: async (page, step) => {
    const value = resolveValue(step.value || "");
    if (!value)
      throw new Error(`Missing timeout value for waitForTimeout step`);
    const timeout = parseInt(value, 10);
    if (isNaN(timeout)) throw new Error(`Invalid timeout value: ${value}`);
    await page.waitForTimeout(timeout);
  },
  waitForLoadState: async (page, step) => {
    const value = resolveValue(step.value || "");
    const state = value || "load"; // Default to 'load' if not specified
    if (!["load", "domcontentloaded", "networkidle"].includes(state)) {
      throw new Error(
        `Invalid load state "${state}". Must be one of: load, domcontentloaded, networkidle`
      );
    }
    await page.waitForLoadState(state);
  },
  scrollIntoView: async (page, step) => {
    if (!step.selector)
      throw new Error(`Missing selector for scrollIntoView step`);
    const selector = normalizeSelector(step.selector);
    await page.locator(selector).scrollIntoViewIfNeeded();
  },
  evaluate: async (page, step) => {
    if (!step.function || typeof step.function !== "string") {
      throw new Error(`Missing or invalid function for evaluate step`);
    }
    const func = new Function("page", step.function);
    await func(page);
  },
  setCookie: async (page, step) => {
    if (!step.cookie || typeof step.cookie !== "object") {
      throw new Error(`Missing or invalid cookie for setCookie step`);
    }
    const cookie = {
      name: step.cookie.name || "",
      value: step.cookie.value || "",
      domain: step.cookie.domain || "",
    };
    if (!cookie.name || !cookie.value) {
      throw new Error(`Cookie must have a name and value`);
    }
    await page.context().addCookies([cookie]);
  },
  press: async (page, step) => {
    const value = resolveValue(step.value || "");
    if (!step.selector) throw new Error(`Missing selector for press step`);
    const selector = normalizeSelector(step.selector);
    await page.locator(selector).press(value || "");
  },
  screenshot: async (page, step) => {
    const value = resolveValue(step.value || "");
    const screenshotPath = value || "screenshot.png";
    await page.screenshot({ path: screenshotPath });
    console.log(`Screenshot saved to ${screenshotPath}`);
  },
  assertExists: async (page, step) => {
    if (!step.selector)
      throw new Error(`Missing selector for assertExists step`);
    const selector = normalizeSelector(step.selector);
    const exists = (await page.locator(selector).count()) > 0;
    if (!exists) {
      throw new Error(`Element with selector "${selector}" does not exist`);
    }
  },
  assertNotExists: async (page, step) => {
    if (!step.selector)
      throw new Error(`Missing selector for assertNotExists step`);
    const selector = normalizeSelector(step.selector);
    const exists = (await page.locator(selector).count()) > 0;
    if (exists) {
      throw new Error(`Element with selector "${selector}" should not exist`);
    }
  },
  assertValue: async (page, step) => {
    const value = resolveValue(step.value || "");
    if (!step.selector)
      throw new Error(`Missing selector for assertValue step`);
    const selector = normalizeSelector(step.selector);
    const expValue = await page.locator(selector).inputValue();
    if (expValue !== value) {
      throw new Error(`Expected value "${expValue}" but got "${value}"`);
    }
  },
  assertAttribute: async (page, step) => {
    const value = resolveValue(step.value || "");
    if (!step.selector || !step.attribute) {
      throw new Error(`Missing selector or attribute for assertAttribute step`);
    }
    const selector = normalizeSelector(step.selector);
    const attributeValue = await page
      .locator(selector)
      .getAttribute(step.attribute);
    if (attributeValue !== value) {
      throw new Error(
        `Expected attribute "${step.attribute}" to be "${value}" but got "${attributeValue}"`
      );
    }
  },
  assertUrl: async (page, step) => {
    const value = resolveValue(step.value || "");
    const currentUrl = page.url();
    if (currentUrl !== value) {
      throw new Error(`Expected URL "${value}" but got "${currentUrl}"`);
    }
  },
  assertTitle: async (page, step) => {
    const value = resolveValue(step.value || "");
    const title = await page.title();
    if (title !== value) {
      throw new Error(`Expected title "${value}" but got "${title}"`);
    }
  },
  assertElementCount: async (page, step) => {
    const value = resolveValue(step.value || "");
    if (!step.selector)
      throw new Error(`Missing selector for assertElementCount step`);
    const selector = normalizeSelector(step.selector);
    const count = await page.locator(selector).count();
    if (count !== value) {
      throw new Error(`Expected ${value} elements but found ${count}`);
    }
  },
  assertElementVisible: async (page, step) => {
    if (!step.selector)
      throw new Error(`Missing selector for assertElementVisible step`);
    const selector = normalizeSelector(step.selector);
    const isVisible = await page.locator(selector).isVisible();
    if (!isVisible) {
      throw new Error(`Element with selector "${selector}" is not visible`);
    }
  },
  assertElementHidden: async (page, step) => {
    if (!step.selector)
      throw new Error(`Missing selector for assertElementHidden step`);
    const selector = normalizeSelector(step.selector);
    const isHidden = await page.locator(selector).isHidden();
    if (!isHidden) {
      throw new Error(
        `Element with selector "${selector}" should be hidden but is visible`
      );
    }
  },
  assertElementEnabled: async (page, step) => {
    if (!step.selector)
      throw new Error(`Missing selector for assertElementEnabled step`);
    const selector = normalizeSelector(step.selector);
    const isEnabled = await page.locator(selector).isEnabled();
    if (!isEnabled) {
      throw new Error(`Element with selector "${selector}" is not enabled`);
    }
  },
  assertElementDisabled: async (page, step) => {
    if (!step.selector)
      throw new Error(`Missing selector for assertElementDisabled step`);
    const selector = normalizeSelector(step.selector);
    const isDisabled = await page.locator(selector).isDisabled();
    if (!isDisabled) {
      throw new Error(
        `Element with selector "${selector}" should be disabled but is enabled`
      );
    }
  },
  assertElementSelected: async (page, step) => {
    if (!step.selector)
      throw new Error(`Missing selector for assertElementSelected step`);
    const selector = normalizeSelector(step.selector);
    const isSelected = await page.locator(selector).isSelected();
    if (!isSelected) {
      throw new Error(`Element with selector "${selector}" is not selected`);
    }
  },
  assertElementNotSelected: async (page, step) => {
    if (!step.selector)
      throw new Error(`Missing selector for assertElementNotSelected step`);
    const selector = normalizeSelector(step.selector);
    const isSelected = await page.locator(selector).isSelected();
    if (isSelected) {
      throw new Error(
        `Element with selector "${selector}" should not be selected but is selected`
      );
    }
  },
  assertElementContainsText: async (page, step) => {
    const value = resolveValue(step.value || "");
    if (!step.selector)
      throw new Error(`Missing selector for assertElementContainsText step`);
    const selector = normalizeSelector(step.selector);
    const text = await page.locator(selector).innerText();
    if (!text.includes(value)) {
      throw new Error(
        `Expected element to contain text "${value}" but got "${text}"`
      );
    }
  },
  assertElementNotContainsText: async (page, step) => {
    const value = resolveValue(step.value || "");
    if (!step.selector)
      throw new Error(`Missing selector for assertElementNotContainsText step`);
    const selector = normalizeSelector(step.selector);
    const text = await page.locator(selector).innerText();
    if (text.includes(value)) {
      throw new Error(
        `Expected element not to contain text "${value}" but got "${text}"`
      );
    }
  },
  assertElementAttributeContains: async (page, step) => {
    const value = resolveValue(step.value || "");
    if (!step.selector || !step.attribute) {
      throw new Error(
        `Missing selector or attribute for assertElementAttributeContains step`
      );
    }
    const selector = normalizeSelector(step.selector);
    const attributeValue = await page
      .locator(selector)
      .getAttribute(step.attribute);
    if (!attributeValue.includes(value)) {
      throw new Error(
        `Expected attribute "${step.attribute}" to contain "${value}" but got "${attributeValue}"`
      );
    }
  },
  assertElementAttributeNotContains: async (page, step) => {
    const value = resolveValue(step.value || "");
    if (!step.selector || !step.attribute) {
      throw new Error(
        `Missing selector or attribute for assertElementAttributeNotContains step`
      );
    }
    const selector = normalizeSelector(step.selector);
    const attributeValue = await page
      .locator(selector)
      .getAttribute(step.attribute);
    if (attributeValue.includes(value)) {
      throw new Error(
        `Expected attribute "${step.attribute}" not to contain "${value}" but got "${attributeValue}"`
      );
    }
  },
  assertElementStyle: async (page, step) => {
    const value = resolveValue(step.value || "");
    if (!step.selector || !step.styleProperty) {
      throw new Error(
        `Missing selector or style property for assertElementStyle step`
      );
    }
    const selector = normalizeSelector(step.selector);
    const styleValue = await page
      .locator(selector)
      .evaluate((el) => getComputedStyle(el)[step.styleProperty]);
    if (styleValue !== value) {
      throw new Error(
        `Expected style "${step.styleProperty}" to be "${value}" but got "${styleValue}"`
      );
    }
  },
  assertElementStyleContains: async (page, step) => {
    const value = resolveValue(step.value || "");
    if (!step.selector || !step.styleProperty) {
      throw new Error(
        `Missing selector or style property for assertElementStyleContains step`
      );
    }
    const selector = normalizeSelector(step.selector);
    const styleValue = await page
      .locator(selector)
      .evaluate((el) => getComputedStyle(el)[step.styleProperty]);
    if (!styleValue.includes(value)) {
      throw new Error(
        `Expected style "${step.styleProperty}" to contain "${value}" but got "${styleValue}"`
      );
    }
  },
  assertElementStyleNotContains: async (page, step) => {
    const value = resolveValue(step.value || "");
    if (!step.selector || !step.styleProperty) {
      throw new Error(
        `Missing selector or style property for assertElementStyleNotContains step`
      );
    }
    const selector = normalizeSelector(step.selector);
    const styleValue = await page
      .locator(selector)
      .evaluate((el) => getComputedStyle(el)[step.styleProperty]);
    if (styleValue.includes(value)) {
      throw new Error(
        `Expected style "${step.styleProperty}" not to contain "${value}" but got "${styleValue}"`
      );
    }
  },
  close: async (page) => {
    await page.close();
  },
  setViewportSize: async (page, step) => {
    const value = resolveValue(step.value || "");
    if (!value || !value.width || !value.height) {
      throw new Error(`Missing viewport size for setViewportSize step`);
    }
    await page.setViewportSize({
      width: value.width,
      height: value.height,
    });
  },
  assertElementAttributeStartsWith: async (page, step) => {
    const value = resolveValue(step.value || "");
    if (!step.selector || !step.attribute) {
      throw new Error(
        `Missing selector or attribute for assertElementAttributeStartsWith step`
      );
    }
    const selector = normalizeSelector(step.selector);
    const attributeValue = await page
      .locator(selector)
      .getAttribute(step.attribute);
    if (!attributeValue.startsWith(value)) {
      throw new Error(
        `Expected attribute "${step.attribute}" to start with "${value}" but got "${attributeValue}"`
      );
    }
  },
  assertElementAttributeEndsWith: async (page, step) => {
    const value = resolveValue(step.value || "");
    if (!step.selector || !step.attribute) {
      throw new Error(
        `Missing selector or attribute for assertElementAttributeEndsWith step`
      );
    }
    const selector = normalizeSelector(step.selector);
    const attributeValue = await page
      .locator(selector)
      .getAttribute(step.attribute);
    if (!attributeValue.endsWith(value)) {
      throw new Error(
        `Expected attribute "${step.attribute}" to end with "${value}" but got "${attributeValue}"`
      );
    }
  },
  assertElementAttributeMatches: async (page, step) => {
    const value = resolveValue(step.value || "");
    if (!step.selector || !step.attribute || !value) {
      throw new Error(
        `Missing selector, attribute or value for assertElementAttributeMatches step`
      );
    }
    const selector = normalizeSelector(step.selector);
    const attributeValue = await page
      .locator(selector)
      .getAttribute(step.attribute);
    const regex = new RegExp(value);
    if (!regex.test(attributeValue)) {
      throw new Error(
        `Expected attribute "${step.attribute}" to match "${value}" but got "${attributeValue}"`
      );
    }
  },
  assertElementAttributeDoesNotMatch: async (page, step) => {
    const value = resolveValue(step.value || "");
    if (!step.selector || !step.attribute || !value) {
      throw new Error(
        `Missing selector, attribute or value for assertElementAttributeDoesNotMatch step`
      );
    }
    const selector = normalizeSelector(step.selector);
    const attributeValue = await page
      .locator(selector)
      .getAttribute(step.attribute);
    const regex = new RegExp(value);
    if (regex.test(attributeValue)) {
      throw new Error(
        `Expected attribute "${step.attribute}" not to match "${value}" but got "${attributeValue}"`
      );
    }
  },
  assertElementAttributeContainsValue: async (page, step) => {
    const value = resolveValue(step.value || "");
    if (!step.selector || !step.attribute || !value) {
      throw new Error(
        `Missing selector, attribute or value for assertElementAttributeContainsValue step`
      );
    }
    const selector = normalizeSelector(step.selector);
    const attributeValue = await page
      .locator(selector)
      .getAttribute(step.attribute);
    if (!attributeValue.includes(value)) {
      throw new Error(
        `Expected attribute "${step.attribute}" to contain "${value}" but got "${attributeValue}"`
      );
    }
  },
  assertElementAttributeDoesNotContainValue: async (page, step) => {
    const value = resolveValue(step.value || "");
    if (!step.selector || !step.attribute || !value) {
      throw new Error(
        `Missing selector, attribute or value for assertElementAttributeDoesNotContainValue step`
      );
    }
    const selector = normalizeSelector(step.selector);
    const attributeValue = await page
      .locator(selector)
      .getAttribute(step.attribute);
    if (attributeValue.includes(value)) {
      throw new Error(
        `Expected attribute "${step.attribute}" not to contain "${value}" but got "${attributeValue}"`
      );
    }
  },
  assertElementAttributeIsEmpty: async (page, step) => {
    if (!step.selector || !step.attribute) {
      throw new Error(
        `Missing selector or attribute for assertElementAttributeIsEmpty step`
      );
    }
    const selector = normalizeSelector(step.selector);
    const attributeValue = await page
      .locator(selector)
      .getAttribute(step.attribute);
    if (attributeValue !== "") {
      throw new Error(
        `Expected attribute "${step.attribute}" to be empty but got "${attributeValue}"`
      );
    }
  },
  assertElementAttributeIsNotEmpty: async (page, step) => {
    if (!step.selector || !step.attribute) {
      throw new Error(
        `Missing selector or attribute for assertElementAttributeIsNotEmpty step`
      );
    }
    const selector = normalizeSelector(step.selector);
    const attributeValue = await page
      .locator(selector)
      .getAttribute(step.attribute);
    if (attributeValue === "") {
      throw new Error(
        `Expected attribute "${step.attribute}" not to be empty but it is`
      );
    }
  },
  assertElementAttributeIsNull: async (page, step) => {
    if (!step.selector || !step.attribute) {
      throw new Error(
        `Missing selector or attribute for assertElementAttributeIsNull step`
      );
    }
    const selector = normalizeSelector(step.selector);
    const attributeValue = await page
      .locator(selector)
      .getAttribute(step.attribute);
    if (attributeValue !== null) {
      throw new Error(
        `Expected attribute "${step.attribute}" to be null but got "${attributeValue}"`
      );
    }
  },
  assertElementAttributeIsNotNull: async (page, step) => {
    if (!step.selector || !step.attribute) {
      throw new Error(
        `Missing selector or attribute for assertElementAttributeIsNotNull step`
      );
    }
    const selector = normalizeSelector(step.selector);
    const attributeValue = await page
      .locator(selector)
      .getAttribute(step.attribute);
    if (attributeValue === null) {
      throw new Error(
        `Expected attribute "${step.attribute}" not to be null but it is`
      );
    }
  },
  closeBrowser: async (browser) => {
    await browser.close();
  },
  assertElementHasClass: async (page, step) => {
    if (!step.selector || !step.className) {
      throw new Error(
        `Missing selector or className for assertElementHasClass step`
      );
    }
    const selector = normalizeSelector(step.selector);
    const hasClass = await page
      .locator(selector)
      .evaluate(
        (el, className) => el.classList.contains(className),
        step.className
      );
    if (!hasClass) {
      throw new Error(
        `Element with selector "${selector}" does not have class "${step.className}"`
      );
    }
  },
  assertElementDoesNotHaveClass: async (page, step) => {
    if (!step.selector || !step.className) {
      throw new Error(
        `Missing selector or className for assertElementDoesNotHaveClass step`
      );
    }
    const selector = normalizeSelector(step.selector);
    const hasClass = await page
      .locator(selector)
      .evaluate(
        (el, className) => el.classList.contains(className),
        step.className
      );
    if (hasClass) {
      throw new Error(
        `Element with selector "${selector}" should not have class "${step.className}" but it does`
      );
    }
  },
  assertElementIsFocused: async (page, step) => {
    if (!step.selector)
      throw new Error(`Missing selector for assertElementIsFocused step`);
    const selector = normalizeSelector(step.selector);
    const isFocused = await page.locator(selector).isFocused();
    if (!isFocused) {
      throw new Error(`Element with selector "${selector}" is not focused`);
    }
  },
  assertElementIsNotFocused: async (page, step) => {
    if (!step.selector)
      throw new Error(`Missing selector for assertElementIsNotFocused step`);
    const selector = normalizeSelector(step.selector);
    const isFocused = await page.locator(selector).isFocused();
    if (isFocused) {
      throw new Error(
        `Element with selector "${selector}" should not be focused but it is`
      );
    }
  },
  assertElementHasAttribute: async (page, step) => {
    if (!step.selector || !step.attribute) {
      throw new Error(
        `Missing selector or attribute for assertElementHasAttribute step`
      );
    }
    const selector = normalizeSelector(step.selector);
    const attributeValue = await page
      .locator(selector)
      .getAttribute(step.attribute);
    if (attributeValue === null) {
      throw new Error(
        `Element with selector "${selector}" does not have attribute "${step.attribute}"`
      );
    }
  },
  pressByRole: async (page, step) => {
    const value = resolveValue(step.value || "");
    if (!step.options) throw new Error(`Missing role for pressByRole step`);
    const role = step.options;
    if (!value) throw new Error(`Missing value for pressByRole step`);
    await page.getByRole(role, { name: step.selector || "" }).press(value);
  },
  fillByText: async (page, step) => {
    const value = resolveValue(step.value || "");
    if (!step.selector) throw new Error(`Missing text for getByText step`);
    const text = step.selector;
    // const selector = `text=${text}`;
    await page.getByText(text).fill(value || "");

  },
  fillByRole: async (page, step) => {
    const value = resolveValue(step.value || "");
    if (!step.options) throw new Error(`Missing role for getByRole step`);
    const role = step.options;
    // const options = step.options || {};
    await page.getByRole(role, { name: step.selector || "" }).fill(value || "");

  },
  clickByRole: async (page, step) => {
    if (!step.options) throw new Error(`Missing role for clickByRole step`);
    const role = step.options;
    await page.getByRole(role, { name: step.selector || "" }).click();
  },
  clickByText: async (page, step) => {
    if (!step.selector) throw new Error(`Missing text for clickByText step`);
    const text = step.selector;
    // const selector = `text=${text}`;
    await page.getByText(text).click();
  },
  fillByLabel: async (page, step) => {
    const value = resolveValue(step.value || "");
    if (!step.options) throw new Error(`Missing label for getByLabel step`);
    const label = step.options;
    await page.getByLabel(label, { exact: true }).fill(value || "");
  },
  clickByLabel: async (page, step) => {
    if (!step.options) throw new Error(`Missing label for clickByLabel step`);
    const label = step.options;
    await page.getByLabel(label, { exact: true }).click();
  },
  pressByLabel: async (page, step) => {
    const value = resolveValue(step.value || "");
    if (!step.options) throw new Error(`Missing label for pressByLabel step`);
    const label = step.options;
    if (!value) throw new Error(`Missing value for pressByLabel step`);
    await page.getByLabel(label, { exact: true }).press(value);
  },
  fillByPlaceholder: async (page, step) => {
    const value = resolveValue(step.value || "");
    if (!step.options) throw new Error(`Missing placeholder for getByPlaceholder step`);
    const placeholder = step.options;
    await page.getByPlaceholder(placeholder).fill(value || "");
  },
  clickByPlaceholder: async (page, step) => {
    if (!step.options) throw new Error(`Missing placeholder for clickByPlaceholder step`);
    const placeholder = step.options;
    await page.getByPlaceholder(placeholder).click();
  },
  pressByPlaceholder: async (page, step) => {
    const value = resolveValue(step.value || "");
    if (!step.options) throw new Error(`Missing placeholder for pressByPlaceholder step`);
    const placeholder = step.options;
    if (!value) throw new Error(`Missing value for pressByPlaceholder step`);
    await page.getByPlaceholder(placeholder).press(value);
  },
  assertElementDoesNotHaveAttribute: async (page, step) => {
    if (!step.selector || !step.attribute) {
      throw new Error(
        `Missing selector or attribute for assertElementDoesNotHaveAttribute step`
      );
    }
    const selector = normalizeSelector(step.selector);
    const attributeValue = await page
      .locator(selector)
      .getAttribute(step.attribute);
    if (attributeValue !== null) {
      throw new Error(
        `Element with selector "${selector}" should not have attribute "${step.attribute}" but it does`
      );
    }
  },
  assertElementHasText: async (page, step) => {
    if (!step.selector)
      throw new Error(`Missing selector for assertElementHasText step`);
    const selector = normalizeSelector(step.selector);
    const text = await page.locator(selector).innerText();
    if (text === "") {
      throw new Error(
        `Element with selector "${selector}" does not have any text`
      );
    }
  },
  assertElementDoesNotHaveText: async (page, step) => {
    if (!step.selector)
      throw new Error(`Missing selector for assertElementDoesNotHaveText step`);
    const selector = normalizeSelector(step.selector);
    const text = await page.locator(selector).innerText();
    if (text !== "") {
      throw new Error(
        `Element with selector "${selector}" should not have any text but it does`
      );
    }
  },
  assertElementHasValue: async (page, step) => {
    if (!step.selector)
      throw new Error(`Missing selector for assertElementHasValue step`);
    const selector = normalizeSelector(step.selector);
    const value = await page.locator(selector).inputValue();
    if (value === "") {
      throw new Error(
        `Element with selector "${selector}" does not have any value`
      );
    }
  },
  type: async (page, step) => {
    const value = resolveValue(step.value || "");
    if (!step.selector) throw new Error(`Missing selector for type step`);
    const selector = normalizeSelector(step.selector);
    if (!value) throw new Error(`Missing value for type step`);
    await page.locator(selector).type(value);
  },
  check: async (page, step) => {
    if (!step.selector) throw new Error(`Missing selector for check step`);
    const selector = normalizeSelector(step.selector);
    await page.locator(selector).check();
  },
  uncheck: async (page, step) => {
    if (!step.selector) throw new Error(`Missing selector for uncheck step`);
    const selector = normalizeSelector(step.selector);
    await page.locator(selector).uncheck();
  },
  selectOption: async (page, step) => {
    const value = resolveValue(step.value || "");
    if (!step.selector)
      throw new Error(`Missing selector for selectOption step`);
    const selector = normalizeSelector(step.selector);
    if (!value) throw new Error(`Missing value for selectOption step`);
    await page.locator(selector).selectOption(value);
  },
  hover: async (page, step) => {
    if (!step.selector) throw new Error(`Missing selector for hover step`);
    const selector = normalizeSelector(step.selector);
    await page.locator(selector).hover();
  },
  focus: async (page, step) => {
    if (!step.selector) throw new Error(`Missing selector for focus step`);
    const selector = normalizeSelector(step.selector);
    await page.locator(selector).focus();
  },
  setInputFiles: async (page, step) => {
    if (!step.selector)
      throw new Error(`Missing selector for setInputFiles step`);
    const selector = normalizeSelector(step.selector);
    if (!step.files) throw new Error(`Missing files for setInputFiles step`);
    await page.locator(selector).setInputFiles(step.files);
  },
  dragAndDrop: async (page, step) => {
    if (!step.sourceSelector)
      throw new Error(`Missing sourceSelector for dragAndDrop step`);
    if (!step.targetSelector)
      throw new Error(`Missing targetSelector for dragAndDrop step`);
    const source = normalizeSelector(step.sourceSelector);
    const target = normalizeSelector(step.targetSelector);
    await page.locator(source).dragTo(target);
  },
  toHaveUrl: async (page, step) => {
    const value = resolveValue(step.value || "");
    await expect(page).toHaveURL(value || "", {
      timeout: step.timeout || 5000,
    });
  },
  toHaveTitle: async (page, step) => {
    const value = resolveValue(step.value || "");
    await expect(page).toHaveTitle(value || "", {
      timeout: step.timeout || 5000,
    });
  },
  toHaveText: async (page, step) => {
    const value = resolveValue(step.value || "");
    if (!step.selector) throw new Error(`Missing selector for toHaveText step`);
    const selector = normalizeSelector(step.selector);
    await expect(page.locator(selector)).toHaveText(value || "", {
      timeout: step.timeout || 5000,
    });
  },
  toHaveCount: async (page, step) => {
    const value = resolveValue(step.value || "");
    if (!step.selector)
      throw new Error(`Missing selector for toHaveCount step`);
    const selector = normalizeSelector(step.selector);
    await expect(page.locator(selector)).toHaveCount(value || 1, {
      timeout: step.timeout || 5000,
    });
  },
  toBeVisible: async (page, step) => {
    if (!step.selector)
      throw new Error(`Missing selector for toBeVisible step`);
    const selector = normalizeSelector(step.selector);
    await expect(page.locator(selector)).toBeVisible({
      timeout: step.timeout || 5000,
    });
  },
  toBeHidden: async (page, step) => {
    if (!step.selector) throw new Error(`Missing selector for toBeHidden step`);
    const selector = normalizeSelector(step.selector);
    await expect(page.locator(selector)).toBeHidden({
      timeout: step.timeout || 5000,
    });
  },
  toBeEnabled: async (page, step) => {
    if (!step.selector)
      throw new Error(`Missing selector for toBeEnabled step`);
    const selector = normalizeSelector(step.selector);
    await expect(page.locator(selector)).toBeEnabled({
      timeout: step.timeout || 5000,
    });
  },
  toBeDisabled: async (page, step) => {
    if (!step.selector)
      throw new Error(`Missing selector for toBeDisabled step`);
    const selector = normalizeSelector(step.selector);
    await expect(page.locator(selector)).toBeDisabled({
      timeout: step.timeout || 5000,
    });
  },
  toBeChecked: async (page, step) => {
    if (!step.selector)
      throw new Error(`Missing selector for toBeChecked step`);
    const selector = normalizeSelector(step.selector);
    await expect(page.locator(selector)).toBeChecked({
      timeout: step.timeout || 5000,
    });
  },
  toBeUnchecked: async (page, step) => {
    if (!step.selector)
      throw new Error(`Missing selector for toBeUnchecked step`);
    const selector = normalizeSelector(step.selector);
    await expect(page.locator(selector)).toBeUnchecked({
      timeout: step.timeout || 5000,
    });
  },
  toHaveClass: async (page, step) => {
    if (!step.selector || !step.className) {
      throw new Error(`Missing selector or className for toHaveClass step`);
    }
    const selector = normalizeSelector(step.selector);
    await expect(page.locator(selector)).toHaveClass(step.className, {
      timeout: step.timeout || 5000,
    });
  },
  toHaveAttribute: async (page, step) => {
    const value = resolveValue(step.value || "");
    if (!step.selector || !step.attribute) {
      throw new Error(`Missing selector or attribute for toHaveAttribute step`);
    }
    const selector = normalizeSelector(step.selector);
    await expect(page.locator(selector)).toHaveAttribute(
      step.attribute,
      value || "",
      {
        timeout: step.timeout || 5000,
      }
    );
  },
  toHaveValue: async (page, step) => {
    const value = resolveValue(step.value || "");
    if (!step.selector)
      throw new Error(`Missing selector for toHaveValue step`);
    const selector = normalizeSelector(step.selector);
    await expect(page.locator(selector)).toHaveValue(value || "", {
      timeout: step.timeout || 5000,
    });
  },
  toHaveScreenshot: async (page, step) => {
    const value = resolveValue(step.value || "");
    const screenshotPath = value || "screenshot.png";
    await expect(page).toHaveScreenshot(screenshotPath, {
      timeout: step.timeout || 5000,
    });
  },
  toHaveFocus: async (page, step) => {
    if (!step.selector)
      throw new Error(`Missing selector for toHaveFocus step`);
    const selector = normalizeSelector(step.selector);
    await expect(page.locator(selector)).toHaveFocus({
      timeout: step.timeout || 5000,
    });
  },
  toHaveStyle: async (page, step) => {
    const value = resolveValue(step.value || "");
    if (!step.selector || !step.styleProperty) {
      throw new Error(`Missing selector or styleProperty for toHaveStyle step`);
    }
    const selector = normalizeSelector(step.selector);
    await expect(page.locator(selector)).toHaveCSS(
      step.styleProperty,
      value || "",
      {
        timeout: step.timeout || 5000,
      }
    );
  },
  clearInput: async (page, step) => {
    if (!step.selector) {
      throw new Error(`Missing selector for clearInput step`);
    }
    const selector = normalizeSelector(step.selector);
    await page.locator(selector).fill("");
  },
  verifyText: async (page, step) => {
    const value = resolveValue(step.value || "");
    console.log("Verify font Starts for : ", step.options)
    const locatorVal_count = await step.selector.count();  // Actual locator found 
    // rowData = this.getDataByKey(locatorName) as any;
    // testData = rowData["Test data"];  //Expected locator from excel sheet
    const expectedCount = value || 0;  // Expected count from step value
    console.log("list_count for ", step.options, " is : ", locatorVal_count);
    let fail_count = 0;
    for (let i = 0; i < locatorVal_count; i++) {
      const ele = step.selector.nth(i);
      await ele.evaluate(elem => {
        elem.style.border = '1.5px solid limegreen';   //highlight locator found in green color
      })
      const fnntFamily = await ele?.evaluate(el => getComputedStyle(el).fontFamily);
      // console.log(fnntFamily);
      expect.soft(fnntFamily).not.toContain('Univers');
      expect.soft(fnntFamily).toContain('MorningstarIntrinsic');
      if (!fnntFamily.includes("MorningstarIntrinsic") && !fnntFamily.includes("Intrinsic")) {
        await ele.evaluate(elem => {
          elem.style.border = '1.5px solid red';  //highlight locator font mismatch 
        })
        fail_count = fail_count + 1;   //how much failed
      }
    }
    console.log("Verify font Completed for : ", step.options);
    console.log("Passed font verification : ", locatorVal_count - fail_count, " and Failed font verification : ", fail_count);
    //Verify Expected and actual list count
    if (expectedCount) {  //testData is expected Test data column (Test Data) from excel
      console.log("Actual Count: ", locatorVal_count, " and Expected Count: ", expectedCount);
      expect.soft(locatorVal_count).toBe(Number(expectedCount));
    }

    console.log("------------------------------------------------------------------------------------------------\n");
  },
  verifyFontWholePage: async (page, step) => {
    const value = resolveValue(step.value || "");
    console.log("Verify font Starts for : ", value);
    const highlight = step.options || 'no'; // Get highlight option from step, default is 'no'
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-'); // Generate timestamp for report file name
    const pageName = value || 'Font Verification'; // Get page name from step value, default is 'Font Verification'
    const reportFolderPath = path.join(__dirname, 'Excel_Report'); // Define report folder path
    const expectedFont1 = "MorningstarIntrinsic";
    const expectedFont2 = "Intrinsic";
    const mismatchedFonts = await this.page.evaluate(({ expectedFont1, expectedFont2, highlight }) => {
      const mismatches = []; //Array to store mismatched font elements
      const elements = document.querySelectorAll("*");//Find and store all element
      elements.forEach(el => {
        const style = window.getComputedStyle(el);  //Get computed style of element
        const font = style.fontFamily; //Get font-family of element
        //Check for visibility in page
        const isVisible = style.display !== "none" &&
          style.visibility !== "hidden" &&
          el.offsetParent !== null &&
          style.opacity !== '0' &&
          el.offsetWidth > 0 &&
          el.offsetHeight > 0;  //Check if element is visible in page
        if (isVisible) {
          if (highlight.toLowerCase() === 'yes') {
            el.style.border = '1.5px solid limegreen'; //Highlight element if visible
          }

          if (!font.includes(expectedFont1) && !font.includes(expectedFont2)) { //Check if font-family is not equal to expected font
            //push tagname, classname, id, font-family and text if available 
            if (!el.className.includes("checkbox") && !el.className.includes("radio-button")) { //Exclude checkbox and radio button elements
              mismatches.push({
                tag: el.tagName,
                class: el.className,
                id: el.id,
                font,
                text: el.innerText?.trim().slice(0, 60)
              });  //Store element details in mismatches array
              // CHeck if font-family is different than MorningstarIntrinsic
              if (highlight.toLowerCase() === 'yes') {
                el.style.border = '1.5px solid red'; //Highlight element if font-family is not equal to expected font
              }

            }

          }
        }
      });
      return mismatches;
    }, { expectedFont1, expectedFont2, highlight });  //Evaluate the page and get mismatched fonts

    mismatchedFonts.forEach(({ font }) => {
      expect.soft(font).not.toContain('Univers'); //Verify if font-family does not contain 'Univers'
      expect.soft(
        font.includes(expectedFont1) || font.includes(expectedFont2),
        `\nExpected substring: "${expectedFont1}" or "${expectedFont2}"\nReceived string: "${font}"`
      ).toBeTruthy();  //Verify if font-family is equal to expected font
    });
    console.log("Verify font Completed for : ", step.options);
    console.log("Total Element found which not having font", expectedFont1, "Or", expectedFont2, ":", mismatchedFonts.length);

    // Mismatch report in excel file

    if (!fs.existsSync(reportFolderPath)) {
      fs.mkdirSync(reportFolderPath);
      console.log("Folder Created");
    }
    if (mismatchedFonts.length > 0) { // Create file if there is any mismatches, otherwise it will not create excel file
      const worksheet = XLSX.utils.json_to_sheet(mismatchedFonts); //Convert mismatched fonts to excel sheet
      XLSX.utils.book_append_sheet(workbook, worksheet, pageName.substring(0, 30)); //Append sheet to workbook with page name as sheet name
      const report_fileName = `Font_Mismatches_for-${this.testName}_${timestamp}.xlsx`; //Set report file name with test name and timestamp
      const filePath = path.join(reportFolderPath, report_fileName); //Create file path for report
      console.log("File Created: ", report_fileName);
      XLSX.writeFile(workbook, filePath); //Write workbook to file
      console.log("Added mismatches font into excel sheet");
    }
    console.log("-----------------------------------------------------------------------------------------\n");
  },
};

function normalizeSelector(raw) {
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
  // Fallback: treat as CSS selector
  return raw;
}
async function elementToBevisible(page, selector, test) {
  try {
    // await page.locator(selector).evaluate((el) => {
    //   el.style.border = "1.5px solid green";
    // });
    await expect(page.locator(selector), `Element Not Found: ${selector}`).toBeVisible({ timeout: 10000 });
  } catch (error) {
    const screenShot = await page.screenshot();
    await test.info().attach(`Failed_Screenshot`, {
      body: screenShot,
      contentType: "image/png",
    });
    throw error;
  }
}

