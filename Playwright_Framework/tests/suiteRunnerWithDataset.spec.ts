import { test } from "@playwright/test";
import fs from "fs";
import path from "path";
import { runWithPage } from "../runner/runTestWithDataset.js";
const { logEmitter } = require("../../backend/logEmitter.js"); // ✅ use EventEmitter
import { setLogger } from "../utils/logger.js";
const data = JSON.parse(fs.readFileSync("./runner/runSuiteData.json", "utf-8"));
const projectName = Object.keys(data)[0]; // Get the first project name

test(`Suite run for: ${projectName}`, async ({ page }) => {
  setLogger((log) => logEmitter.emit("log", log)); // ✅

  const configPath = path.resolve(
    __dirname,
    "../../frontend/public/saved_configs/suite_config.json"
  );

  const tests = data[projectName]; // Get the tests for the first project

  for (const testName of Object.keys(tests)) {
    const confraw = fs.readFileSync(configPath, "utf-8");
    const allConfigs = JSON.parse(confraw);

    const config = allConfigs?.[projectName];

    const testTimeout = config.timeoutForTest ?? 300000;
    test.setTimeout(testTimeout); // Set timeout for the test
    const browserContext = await page.context();
    browserContext.setDefaultTimeout(20000);
    const steps = tests[testName]?.steps;

    if (!steps?.length) {
      const log = `⚠️ No steps for test "${testName}". Skipping.`;
      console.log(log);
      logEmitter.emit("log", log); // ✅
      continue;
    }

    const log = `🚀 Running test: ${testName}`;
    logEmitter.emit("log", log); // ✅
    console.log(log); // ✅

    try {
      await runWithPage(
        page,
        projectName,
        testName,
        steps,
        configPath,
        (msg) => logEmitter.emit("log", msg), // ✅ log from runWithPage
        test
      );
      const doneLog = `✅ Completed test: ${testName}`;
      console.log(doneLog);
      logEmitter.emit("log", doneLog); // ✅
    } catch (err) {
      const errorLog = `❌ Error in test "${testName}": ${err.message}`;
      console.error(errorLog);
      logEmitter.emit("log", errorLog); // ✅
      throw err; // Rethrow to fail the test if there's an error
    }
  }

  logEmitter.emit("log", `🎉 All tests completed.`); // ✅
});
