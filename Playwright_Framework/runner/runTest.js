const fs = require("fs");
const path = require("path");
const webKeywords = require("../keywords/webKeywords");
const customKeywords = require("../keywords/customKeyword");
const { getLogger } = require("../utils/logger");
const { startTracing, stopTracing } = require("../utils/traceHelper");
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

  const browserContext = await page.context();
  // await startTracing(browserContext, testName);
  try {

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const action = step.action;
      const selector = step.selector || "";
      
      const execute = step.execute || "Y";
      console.log(
        `➡️ Step ${i + 1}: ${action} | Selector: ${selector} | Value: ${step.value || ""}`
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
        throw err;
      }

    }
  } finally {
    // const tracePath = await stopTracing(browserContext, testName);
    // console.log(`📝 Trace saved at: ${tracePath}`);
  }
}

module.exports = { runWithPage };
