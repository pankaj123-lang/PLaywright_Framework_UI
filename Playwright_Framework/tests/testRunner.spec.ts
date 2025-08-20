// import { test } from "@playwright/test";
// import fs from "fs";
// import path from "path";
// import { runWithPage } from "../runner/runTest.js"; // ← updated path

// test("Run keyword-based test from CLI", async ({ page }) => {
//   const runDataPath = path.resolve(__dirname, "../runner/runData.json");
//   const configPath = path.resolve(
//     __dirname,
//     "../../frontend/public/saved_configs/test_config.json"
//   );

//   const runData = JSON.parse(fs.readFileSync(runDataPath, "utf-8"));
//   const { project, testName, steps } = runData;

//   await runWithPage(page, project, testName, steps, configPath, console.log);
// });
import { test } from "@playwright/test";
import fs from "fs";
import path from "path";
import { runWithPage } from "../runner/runTest.js";
const { logEmitter } = require("../../backend/logEmitter.js"); // ✅ use EventEmitter
import { setLogger } from "../utils/logger.js";
const data = JSON.parse(fs.readFileSync("./runner/runData.json", "utf-8"));
const projectName = Object.keys(data)[0]; // Get the first project name
const projectname = data[projectName];
const testName = Object.keys(data)[1]; // Get the first test name

test(`Test for ${projectname} - ${testName}`, async ({ page }) => {
  
  setLogger((log) => logEmitter.emit("log", log)); // ✅

  const runDataPath = path.resolve(__dirname, "../runner/runData.json");
  const configPath = path.resolve(
    __dirname,
    "../../frontend/public/saved_configs/test_config.json"
  );
  const confraw = fs.readFileSync(configPath, "utf-8");
  const allConfigs = JSON.parse(confraw);

  const config = allConfigs?.[projectname]?.[testName];
  
  const testTimeout = config.timeoutForTest ?? 300000;
  console.log(`Test timeout set to: ${testTimeout} ms`); 
  logEmitter.emit(`Test timeout set to: ${testTimeout} ms`);
  
  // test.setTimeout(testTimeout); // Set timeout for the test
  const browserContext = await page.context();
  browserContext.setDefaultTimeout(20000); // Set default timeout for the browser context
  // page.setDefaultTimeout(testTimeout); // Set default timeout for the page
  let runData;
  try {
    const raw = fs.readFileSync(runDataPath, "utf-8");
    runData = JSON.parse(raw);
  } catch (err) {
    const log = `❌ Failed to load test steps: ${err.message}`;
    console.error(log);
    logEmitter.emit("log", log); // ✅
    return;
  }

  const { project, ...tests } = runData;

  for (const testName of Object.keys(tests)) {
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
        project,
        testName,
        steps,
        configPath,
        (msg) => logEmitter.emit("log", msg), // ✅ log from runWithPage
        test,
      );
      const doneLog = `✅ Completed test: ${testName}`;
      console.log(doneLog);
      logEmitter.emit("log", doneLog); // ✅
    } catch (err) {
      const errorLog = `❌ Error in test "${testName}": ${err.message}`;
      console.error(errorLog);
      logEmitter.emit("log", errorLog); // ✅
      throw err; // Rethrow to fail the test
    }
  }

  logEmitter.emit("log", `🎉 All tests completed.`); // ✅
});
