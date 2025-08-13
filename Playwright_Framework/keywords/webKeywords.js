module.exports = {
  goto: async (page, step) => {
    if (!step.value) throw new Error(`Missing selector for goto step`);
    // console.log(`Navigating to URL: ${step.value}`);
    await page.goto(step.value);
  },
  fill: async (page, step) => {
    if (!step.selector) throw new Error(`Missing selector for fill step`);
    const selector = normalizeSelector(step.selector);
    await page.locator(selector).fill(step.value || "");
  },
  click: async (page, step) => {
    if (!step.selector) throw new Error(`Missing selector for click step`);
    const selector = normalizeSelector(step.selector);
    console.log(`Clicking on selector: ${selector}`);

    await page.locator(selector).click();
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
    if (!step.selector) throw new Error(`Missing selector for assertText step`);
    const selector = normalizeSelector(step.selector);
    const text = await page.locator(selector).innerText();
    if (text !== step.value) {
      throw new Error(`Expected text "${step.value}" but got "${text}"`);
    }
  },
  waitForSelector: async (page, step) => {
    if (!step.selector)
      throw new Error(`Missing selector for waitForSelector step`);
    const selector = normalizeSelector(step.selector);
    await page.waitForSelector(selector, { timeout: step.value || 5000 });
  },
  waitForTimeout: async (page, step) => {
    if (!step.value)
      throw new Error(`Missing timeout value for waitForTimeout step`);
    const timeout = parseInt(step.value, 10);
    if (isNaN(timeout)) throw new Error(`Invalid timeout value: ${step.value}`);
    await page.waitForTimeout(timeout);
  },
  waitForLoadState: async (page, step) => {
    const state = step.value || "load"; // Default to 'load' if not specified
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
    if (!step.selector) throw new Error(`Missing selector for press step`);
    const selector = normalizeSelector(step.selector);
    await page.locator(selector).press(step.value || "");
  },
  screenshot: async (page, step) => {
    const screenshotPath = step.value || "screenshot.png";
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
    if (!step.selector)
      throw new Error(`Missing selector for assertValue step`);
    const selector = normalizeSelector(step.selector);
    const value = await page.locator(selector).inputValue();
    if (value !== step.value) {
      throw new Error(`Expected value "${step.value}" but got "${value}"`);
    }
  },
  assertAttribute: async (page, step) => {
    if (!step.selector || !step.attribute) {
      throw new Error(`Missing selector or attribute for assertAttribute step`);
    }
    const selector = normalizeSelector(step.selector);
    const attributeValue = await page
      .locator(selector)
      .getAttribute(step.attribute);
    if (attributeValue !== step.value) {
      throw new Error(
        `Expected attribute "${step.attribute}" to be "${step.value}" but got "${attributeValue}"`
      );
    }
  },
  assertUrl: async (page, step) => {
    const currentUrl = page.url();
    if (currentUrl !== step.value) {
      throw new Error(`Expected URL "${step.value}" but got "${currentUrl}"`);
    }
  },
  assertTitle: async (page, step) => {
    const title = await page.title();
    if (title !== step.value) {
      throw new Error(`Expected title "${step.value}" but got "${title}"`);
    }
  },
  assertElementCount: async (page, step) => {
    if (!step.selector)
      throw new Error(`Missing selector for assertElementCount step`);
    const selector = normalizeSelector(step.selector);
    const count = await page.locator(selector).count();
    if (count !== step.value) {
      throw new Error(`Expected ${step.value} elements but found ${count}`);
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
    if (!step.selector)
      throw new Error(`Missing selector for assertElementContainsText step`);
    const selector = normalizeSelector(step.selector);
    const text = await page.locator(selector).innerText();
    if (!text.includes(step.value)) {
      throw new Error(
        `Expected element to contain text "${step.value}" but got "${text}"`
      );
    }
  },
  assertElementNotContainsText: async (page, step) => {
    if (!step.selector)
      throw new Error(`Missing selector for assertElementNotContainsText step`);
    const selector = normalizeSelector(step.selector);
    const text = await page.locator(selector).innerText();
    if (text.includes(step.value)) {
      throw new Error(
        `Expected element not to contain text "${step.value}" but got "${text}"`
      );
    }
  },
  assertElementAttributeContains: async (page, step) => {
    if (!step.selector || !step.attribute) {
      throw new Error(
        `Missing selector or attribute for assertElementAttributeContains step`
      );
    }
    const selector = normalizeSelector(step.selector);
    const attributeValue = await page
      .locator(selector)
      .getAttribute(step.attribute);
    if (!attributeValue.includes(step.value)) {
      throw new Error(
        `Expected attribute "${step.attribute}" to contain "${step.value}" but got "${attributeValue}"`
      );
    }
  },
  assertElementAttributeNotContains: async (page, step) => {
    if (!step.selector || !step.attribute) {
      throw new Error(
        `Missing selector or attribute for assertElementAttributeNotContains step`
      );
    }
    const selector = normalizeSelector(step.selector);
    const attributeValue = await page
      .locator(selector)
      .getAttribute(step.attribute);
    if (attributeValue.includes(step.value)) {
      throw new Error(
        `Expected attribute "${step.attribute}" not to contain "${step.value}" but got "${attributeValue}"`
      );
    }
  },
  assertElementStyle: async (page, step) => {
    if (!step.selector || !step.styleProperty) {
      throw new Error(
        `Missing selector or style property for assertElementStyle step`
      );
    }
    const selector = normalizeSelector(step.selector);
    const styleValue = await page
      .locator(selector)
      .evaluate((el) => getComputedStyle(el)[step.styleProperty]);
    if (styleValue !== step.value) {
      throw new Error(
        `Expected style "${step.styleProperty}" to be "${step.value}" but got "${styleValue}"`
      );
    }
  },
  assertElementStyleContains: async (page, step) => {
    if (!step.selector || !step.styleProperty) {
      throw new Error(
        `Missing selector or style property for assertElementStyleContains step`
      );
    }
    const selector = normalizeSelector(step.selector);
    const styleValue = await page
      .locator(selector)
      .evaluate((el) => getComputedStyle(el)[step.styleProperty]);
    if (!styleValue.includes(step.value)) {
      throw new Error(
        `Expected style "${step.styleProperty}" to contain "${step.value}" but got "${styleValue}"`
      );
    }
  },
  assertElementStyleNotContains: async (page, step) => {
    if (!step.selector || !step.styleProperty) {
      throw new Error(
        `Missing selector or style property for assertElementStyleNotContains step`
      );
    }
    const selector = normalizeSelector(step.selector);
    const styleValue = await page
      .locator(selector)
      .evaluate((el) => getComputedStyle(el)[step.styleProperty]);
    if (styleValue.includes(step.value)) {
      throw new Error(
        `Expected style "${step.styleProperty}" not to contain "${step.value}" but got "${styleValue}"`
      );
    }
  },
  close: async (page) => {
    await page.close();
  },
  setViewportSize: async (page, step) => {
    if (!step.value || !step.value.width || !step.value.height) {
      throw new Error(`Missing viewport size for setViewportSize step`);
    }
    await page.setViewportSize({
      width: step.value.width,
      height: step.value.height,
    });
  },
  assertElementAttributeStartsWith: async (page, step) => {
    if (!step.selector || !step.attribute) {
      throw new Error(
        `Missing selector or attribute for assertElementAttributeStartsWith step`
      );
    }
    const selector = normalizeSelector(step.selector);
    const attributeValue = await page
      .locator(selector)
      .getAttribute(step.attribute);
    if (!attributeValue.startsWith(step.value)) {
      throw new Error(
        `Expected attribute "${step.attribute}" to start with "${step.value}" but got "${attributeValue}"`
      );
    }
  },
  assertElementAttributeEndsWith: async (page, step) => {
    if (!step.selector || !step.attribute) {
      throw new Error(
        `Missing selector or attribute for assertElementAttributeEndsWith step`
      );
    }
    const selector = normalizeSelector(step.selector);
    const attributeValue = await page
      .locator(selector)
      .getAttribute(step.attribute);
    if (!attributeValue.endsWith(step.value)) {
      throw new Error(
        `Expected attribute "${step.attribute}" to end with "${step.value}" but got "${attributeValue}"`
      );
    }
  },
  assertElementAttributeMatches: async (page, step) => {
    if (!step.selector || !step.attribute || !step.value) {
      throw new Error(
        `Missing selector, attribute or value for assertElementAttributeMatches step`
      );
    }
    const selector = normalizeSelector(step.selector);
    const attributeValue = await page
      .locator(selector)
      .getAttribute(step.attribute);
    const regex = new RegExp(step.value);
    if (!regex.test(attributeValue)) {
      throw new Error(
        `Expected attribute "${step.attribute}" to match "${step.value}" but got "${attributeValue}"`
      );
    }
  },
  assertElementAttributeDoesNotMatch: async (page, step) => {
    if (!step.selector || !step.attribute || !step.value) {
      throw new Error(
        `Missing selector, attribute or value for assertElementAttributeDoesNotMatch step`
      );
    }
    const selector = normalizeSelector(step.selector);
    const attributeValue = await page
      .locator(selector)
      .getAttribute(step.attribute);
    const regex = new RegExp(step.value);
    if (regex.test(attributeValue)) {
      throw new Error(
        `Expected attribute "${step.attribute}" not to match "${step.value}" but got "${attributeValue}"`
      );
    }
  },
  assertElementAttributeContainsValue: async (page, step) => {
    if (!step.selector || !step.attribute || !step.value) {
      throw new Error(
        `Missing selector, attribute or value for assertElementAttributeContainsValue step`
      );
    }
    const selector = normalizeSelector(step.selector);
    const attributeValue = await page
      .locator(selector)
      .getAttribute(step.attribute);
    if (!attributeValue.includes(step.value)) {
      throw new Error(
        `Expected attribute "${step.attribute}" to contain "${step.value}" but got "${attributeValue}"`
      );
    }
  },
  assertElementAttributeDoesNotContainValue: async (page, step) => {
    if (!step.selector || !step.attribute || !step.value) {
      throw new Error(
        `Missing selector, attribute or value for assertElementAttributeDoesNotContainValue step`
      );
    }
    const selector = normalizeSelector(step.selector);
    const attributeValue = await page
      .locator(selector)
      .getAttribute(step.attribute);
    if (attributeValue.includes(step.value)) {
      throw new Error(
        `Expected attribute "${step.attribute}" not to contain "${step.value}" but got "${attributeValue}"`
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
  fillByText: async (page, step) => {
    if (!step.selector) throw new Error(`Missing text for getByText step`);
    const text = step.selector;
    // const selector = `text=${text}`;
    await page.getByText(text).fill(step.value || "");

  },
  fillByRole: async (page, step) => {
    if (!step.options) throw new Error(`Missing role for getByRole step`);
    const role = step.options;
    // const options = step.options || {};
    await page.getByRole(role, { name: step.selector || "" }).fill(step.value || "");

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
    if (!step.options) throw new Error(`Missing label for getByLabel step`);
    const label = step.options;
    await page.getByLabel(label, { exact: true }).fill(step.value || "");
  },
  clickByLabel: async (page, step) => {
    if (!step.options) throw new Error(`Missing label for clickByLabel step`);
    const label = step.options;
    await page.getByLabel(label, { exact: true }).click();
  },
  fillByPlaceholder: async (page, step) => {
    if (!step.options) throw new Error(`Missing placeholder for getByPlaceholder step`);
    const placeholder = step.options;
    await page.getByPlaceholder(placeholder).fill(step.value || "");
  },
  clickByPlaceholder: async (page, step) => {
    if (!step.options) throw new Error(`Missing placeholder for clickByPlaceholder step`);
    const placeholder = step.options;
    await page.getByPlaceholder(placeholder).click();
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
    if (!step.selector) throw new Error(`Missing selector for type step`);
    const selector = normalizeSelector(step.selector);
    if (!step.value) throw new Error(`Missing value for type step`);
    await page.locator(selector).type(step.value);
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
    if (!step.selector)
      throw new Error(`Missing selector for selectOption step`);
    const selector = normalizeSelector(step.selector);
    if (!step.value) throw new Error(`Missing value for selectOption step`);
    await page.locator(selector).selectOption(step.value);
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
    await expect(page).toHaveURL(step.value || "", {
      timeout: step.timeout || 5000,
    });
  },
  toHaveTitle: async (page, step) => {
    await expect(page).toHaveTitle(step.value || "", {
      timeout: step.timeout || 5000,
    });
  },
  toHaveText: async (page, step) => {
    if (!step.selector) throw new Error(`Missing selector for toHaveText step`);
    const selector = normalizeSelector(step.selector);
    await expect(page.locator(selector)).toHaveText(step.value || "", {
      timeout: step.timeout || 5000,
    });
  },
  toHaveCount: async (page, step) => {
    if (!step.selector)
      throw new Error(`Missing selector for toHaveCount step`);
    const selector = normalizeSelector(step.selector);
    await expect(page.locator(selector)).toHaveCount(step.value || 1, {
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
    if (!step.selector || !step.attribute) {
      throw new Error(`Missing selector or attribute for toHaveAttribute step`);
    }
    const selector = normalizeSelector(step.selector);
    await expect(page.locator(selector)).toHaveAttribute(
      step.attribute,
      step.value || "",
      {
        timeout: step.timeout || 5000,
      }
    );
  },
  toHaveValue: async (page, step) => {
    if (!step.selector)
      throw new Error(`Missing selector for toHaveValue step`);
    const selector = normalizeSelector(step.selector);
    await expect(page.locator(selector)).toHaveValue(step.value || "", {
      timeout: step.timeout || 5000,
    });
  },
  toHaveScreenshot: async (page, step) => {
    const screenshotPath = step.value || "screenshot.png";
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
    if (!step.selector || !step.styleProperty) {
      throw new Error(`Missing selector or styleProperty for toHaveStyle step`);
    }
    const selector = normalizeSelector(step.selector);
    await expect(page.locator(selector)).toHaveCSS(
      step.styleProperty,
      step.value || "",
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
