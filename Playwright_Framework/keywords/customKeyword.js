// Auto-generated file. Do not edit manually.
    const { resolveValue, elementToBevisible } = require("../utils/utils.js");
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
    },
keyword_name: async (page, step, test) => {
    //Replace "keyword_name" with actual keyword name
    // Resolve variable (i.e. ${variableName})
    const value= resolveValue(step.value || ""); 
    //Normalize selector 
    const selector = normalizeSelector(step.selector);
    const options = step.options || {};
    if (selector!== "") {
    await elementToBevisible(page, selector, test, 10000);// 10 seconds timeout(i.e. 10000ms)
    }
    // Your custom logic here
    await page.locator(selector).fill("tetsing");
}
    };