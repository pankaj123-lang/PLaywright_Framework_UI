import { test } from "@playwright/test";
import fs from "fs";
import path from "path";
import { runWithPage } from "../runner/runTest.js";
const { logEmitter } = require("../../backend/logEmitter.js"); // ✅ use EventEmitter
import { setLogger } from "../utils/logger.js";
const data = JSON.parse(fs.readFileSync("./runner/runSuiteData.json", "utf-8"));
const projectName = Object.keys(data)[0]; // Get the first project name

test(`Suite run for: ${projectName}`, async ({ page }) => {
  setLogger((log) => logEmitter.emit("log", log)); // ✅

  const configPath = path.resolve(
    __dirname,
    "../../frontend/public/saved_configs/test_config.json"
  );

const tests = data[projectName]; // Get the tests for the first project

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
        projectName,
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
// import { test } from "@playwright/test";
// import fs from "fs";
// import path from "path";
// import { runWithPage } from "../runner/runTest.js";
// const { logEmitter } = require("../../backend/logEmitter.js"); // ✅ use EventEmitter
// import { setLogger } from "../utils/logger.js";

// // Load and parse the test suite data
// const runDataPath = path.resolve(__dirname, "../runner/runSuiteData.json");
// let runData: Record<string, any>;

// try {
//   const raw = fs.readFileSync(runDataPath, "utf-8");
//   runData = JSON.parse(raw);
// } catch (err) {
//   console.error(`❌ Failed to load test suite data: ${err.message}`);
//   throw new Error("Test suite data could not be loaded.");
// }

// // Extract project and test details
// const projectName = Object.keys(runData)[0]; // Get the first project name
// if (!projectName) {
//   throw new Error("❌ No project found in the test suite data.");
// }

// const project = runData[projectName];
// if (!project) {
//   throw new Error(`❌ Project "${projectName}" is missing or invalid.`);
// }

// test(`Suite run for: ${projectName}`, async ({ page }) => {
//   setLogger((log) => logEmitter.emit("log", log)); // ✅ Set up logger

//   const configPath = path.resolve(
//     __dirname,
//     "../../frontend/public/saved_configs/test_config.json"
//   );
// //   const { ...tests } = runData;
//   const tests = data[projectName];
//   for (const testName of Object.keys(tests)) {
//     const steps = tests[testName]?.steps;

//     if (!steps?.length) {
//       logMessage(`⚠️ No steps for test "${testName}". Skipping.`);
//       continue;
//     }

//     logMessage(`🚀 Running test: ${testName}`);

//     try {
//       await runWithPage(
//         page,
//         project,
//         testName,
//         steps,
//         configPath,
//         (msg) => logEmitter.emit("log", msg) // ✅ Log from runWithPage
//       );
//       logMessage(`✅ Completed test: ${testName}`);
//     } catch (err) {
//       logMessage(`❌ Error in test "${testName}": ${err.message}`, true);
//     }
//   }

//   logMessage(`🎉 All tests completed.`);
// });

// // Helper function for logging
// function logMessage(message: string, isError: boolean = false) {
//   if (isError) {
//     console.error(message);
//   } else {
//     console.log(message);
//   }
//   logEmitter.emit("log", message); // ✅ Emit log
// }