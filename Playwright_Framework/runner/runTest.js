const fs = require("fs");
const path = require("path");
const webKeywords = require("../keywords/webKeywords");
const customKeywords = require("../keywords/customKeyword");
const { getLogger } = require("../utils/logger.js");
const { resolveValue } = require("../utils/utils.js");
async function runWithPage(
  page,
  project,
  testName,
  steps,
  configJsonPath,
  broadcastLog,
  test
) {
  const log = getLogger(); // get global logger

  const configData = JSON.parse(fs.readFileSync(configJsonPath, "utf-8"));
  const config = configData[project]?.[testName];

  console.log(`📄 Loaded config: ${JSON.stringify(config)}`);
  console.log(`🧪 Steps to execute: ${steps.length}`);
  console.log(`🧪 Test: ${testName} | Project: ${project}`);

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const action = step.action;
    const selector = step.selector || "";
    const value = resolveValue(step.value || ""); // Resolve variable if present
    const options = step.options || {};
    const execute = step.execute || "Y";
    console.log(
      `➡️ Step ${i + 1}: ${action} | Selector: ${selector} | Value: ${value}`
    );

    const keywords = {
      ...webKeywords,
      ...customKeywords,
    };
    const func = keywords[action];
    if (!func) {
      log(`⚠️ Unknown action: ${action}`);
      console.log(`⚠️ Unknown action: ${action} — Skipping`);
      continue;
    }

    try {
      // Check if the step should be executed
      if (execute.toUpperCase() === "N") {
        console.log(`➡️ Step ${i + 1} skipped`);
        continue;
      } else {

        await func(page, step, test);
        console.log(`✅ Step ${i + 1} PASSED`);
      }
    } catch (err) {
      console.error(`❌ Step ${i + 1} FAILED: ${err.message}`);

      // const screenShot = await page.screenshot();
      // await test.info().attach(`Step_${i + 1}_Screenshot`, {
      //   body: screenShot,
      //   contentType: "image/png",
      // });
      throw err;
    }
  }
}

module.exports = { runWithPage };
