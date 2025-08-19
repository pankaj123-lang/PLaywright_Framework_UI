// Auto-generated file. Do not edit manually.
    const { resolveValue } = require("../utils/utils.js");
    module.exports = {
      pankajgoto: async (page, step, test) => {
        const value = resolveValue(step.value || "");
        if (!value) throw new Error(`Missing selector for goto step`);
        try {
            await page.goto(value);
        } catch (error) {
            throw new Error(`Failed to navigate to ${value}: ${error.message}`);
        }
    },
Testing: async (page, step, test) => {
        if (!step.selector) throw new Error(`Missing selector for dblclick step`);
        const selector = normalizeSelector(step.selector);
        await page.locator(selector).dblclick();
    },
custom_navigate: async (page, step, test) => {
        const value = resolveValue(step.value || "");
        if (!value) throw new Error(`Missing url for goto step`);
        try {
            await page.goto(value);
        } catch (error) {
            throw new Error(`Failed to navigate to ${value}: ${error.message}`);
        }
    }

    };