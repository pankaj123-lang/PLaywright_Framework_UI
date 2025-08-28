// Auto-generated file. Do not edit manually.
    const { resolveValue, elementToBevisible, saveVariables, normalizeSelector } = require("../utils/utils.js");
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
saveVariable: async (page, step, test) => {

        await saveVariables(page, "saveVariableKey", "saveVariableValue");
    },
keyword_name: async (page, step, test) => {
    //Replace "keyword_name" with actual keyword name and remove or comment unnessesary code to avoid facing issues
    // Resolve variable if present (i.e. ${variableName})
    const value = resolveValue(step.value || "");
    //Normalize selector if locator present
    const selector = normalizeSelector(step.selector);
    //Use if options or role present
    const options = step.options || {};
    //Wait for element to be visible if selector present
    if (selector!== "") {
    await elementToBevisible(page, selector, test, 10000);// 10 seconds timeout(i.e. 10000ms)
    }
    // Your custom logic here
    await selector.click();
    await selector.fill(value);
    await saveVariables(page, "saveVariableKey", "saveVariableValue");
}
    };