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

test("Run keyword-based test(s) from CLI", async ({ page }) => {
  setLogger((log) => logEmitter.emit("log", log)); // ✅

  const runDataPath = path.resolve(__dirname, "../runner/runSuiteData.json");
  const configPath = path.resolve(
    __dirname,
    "../../frontend/public/saved_configs/test_config.json"
  );

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
        (msg) => logEmitter.emit("log", msg) // ✅ log from runWithPage
      );
      const doneLog = `✅ Completed test: ${testName}`;
      console.log(doneLog);
      logEmitter.emit("log", doneLog); // ✅
    } catch (err) {
      const errorLog = `❌ Error in test "${testName}": ${err.message}`;
      console.error(errorLog);
      logEmitter.emit("log", errorLog); // ✅
    }
  }

  logEmitter.emit("log", `🎉 All tests completed.`); // ✅
});
