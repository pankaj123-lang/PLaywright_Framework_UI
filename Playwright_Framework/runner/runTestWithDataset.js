const fs = require("fs");
const path = require("path");
const webKeywords = require("../keywords/webKeywords.js");
const customKeywords = require("../keywords/customKeyword.js");
const { getLogger } = require("../utils/logger.js");
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
  let config = configData[project]?.[testName];
  if (!config) {
    config = configData[project] || {};
    }
  console.log(`📄 Loaded config: ${JSON.stringify(config)}`);
  console.log(`🧪 Steps to execute: ${steps.length}`);
  console.log(`🧪 Test: ${testName} | Project: ${project}`);
  let dataset = [];
  if (config.useDataset && config.dataset) {
    try {
      dataset = JSON.parse(fs.readFileSync(path.join(__dirname, "../../frontend/public", "dataset", config.dataset), "utf-8"));
      console.log(`📊 Loaded dataset with ${dataset.length} rows`);
    } catch (error) {
      console.error(`❌ Failed to load dataset: ${error.message}`);
      log(`❌ Failed to load dataset: ${error.message}`);
      dataset = []; // Reset to empty if there was an error
    }
  }
  const dataRows = Array.isArray(dataset) && dataset.length > 0 ? dataset : [null];
  // console.log(`🧪 Dataset rows to execute: ${dataset}`);
  for (const dataRow of dataRows) {
    console.log(`🧪 Executing with dataset row: ${JSON.stringify(dataRow)}`);
    const testContext = {
      ...test,
      datarow: dataRow,
      config: config
    };
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

          await func(page, step, testContext);
          console.log(`✅ Step ${i + 1} PASSED`);
        }
      } catch (err) {
        console.error(`❌ Step ${i + 1} FAILED: ${err.message}`);
        throw err;
      }
    }
  }
}

module.exports = { runWithPage };
