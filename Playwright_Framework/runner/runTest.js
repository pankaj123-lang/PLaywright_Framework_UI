// // runner/runTest.js or similar
// const { exec } = require("child_process");
// const path = require("path");

// async function runTest(project, testName, steps, configPath, logFn) {
//   return new Promise((resolve, reject) => {
//     const testScript = "keywordRunner.spec.ts";
//     const resultsDir = path.join(__dirname, "../../test-results");
//     const cmd = `npx playwright test ${testScript} --reporter=html --output=${resultsDir}`;

//     logFn(`▶️ Running: ${cmd}`);

//     exec(cmd, { cwd: path.join(__dirname, "../../PlaywrightFramework") }, (error, stdout, stderr) => {
//       if (stdout) logFn(stdout);
//       if (stderr) logFn(stderr);

//       if (error) {
//         logFn(`❌ Test execution failed: ${error.message}`);
//         return reject(error);
//       }

//       logFn("✅ Test execution finished.");
//       resolve();
//     });
//   });
// }

// module.exports = runTest;

const fs = require("fs");
const path = require("path");
const keywords = require("../keywords/webKeywords");
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
  const config = configData[project]?.[testName];

  // log(`📄 Loaded config: ${JSON.stringify(config)}`);
  console.log(`📄 Loaded config: ${JSON.stringify(config)}`);

  // broadcastLog(`🧪 Steps to execute: ${steps.length}`);
  console.log(`🧪 Steps to execute: ${steps.length}`);

  // broadcastLog(`🧪 Test: ${testName} | Project: ${project}`);
  console.log(`🧪 Test: ${testName} | Project: ${project}`);

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const action = step.action;
    const selector = step.selector || "";
    const value = step.value || "";

    // broadcastLog(
    //   `➡️ Step ${i + 1}: ${action} | Selector: ${selector} | Value: ${value}`
    // );
    console.log(
      `➡️ Step ${i + 1}: ${action} | Selector: ${selector} | Value: ${value}`
    );

    const func = keywords[action];
    if (!func) {
      log(`⚠️ Unknown action: ${action}`);
      console.log(`⚠️ Unknown action: ${action} — Skipping`);
      continue;
    }

    try {
      await func(page, step);
      // broadcastLog(`✅ Step ${i + 1} PASSED`);
      console.log(`✅ Step ${i + 1} PASSED`);
    } catch (err) {
      // log(`❌ Step ${i + 1} FAILED: ${err.message}`);
      console.error(`❌ Step ${i + 1} FAILED: ${err.message}`);
  
      const screenShot = await page.screenshot();
      await test.info().attach(`Step_${i+1}_Screenshot`, {
        body: screenShot,
        contentType: "image/png",
      });
      throw err;
    }
  }
}

module.exports = { runWithPage };

// const fs = require("fs");
// const path = require("path");
// const { chromium, firefox, webkit } = require("playwright");
// const keywords = require("../keywords/webKeywords");

// async function runTest(project, testName, steps, configJsonPath, logCallback) {
//   const configData = JSON.parse(fs.readFileSync(configJsonPath, "utf-8"));
//   const config = configData[project]?.[testName];

//   logCallback?.(
//     `📄 Loading config for ${project}/${testName}: ${JSON.stringify(config)}`
//   );
//   logCallback?.(`🧪 Steps to execute: ${steps.length}`);

//   if (!Array.isArray(steps) || steps.length === 0) {
//     throw new Error("Steps are required to run the test.");
//   }

//   if (!config) throw new Error(`No config found for ${project}/${testName}`);

//   const browserType = config.browser || "chromium";
//   const workers = Number(config.workers) || 1;
//   const headless = config.headless !== false; // default to true if undefined

//   logCallback?.(`🚀 Launching browser: ${browserType}`);
//   const browser = await { chromium, firefox, webkit }[browserType].launch({
//     headless: headless,
//     slowMo: 50,
//   });

//   const context = await browser.newContext();
//   const page = await context.newPage();
//   // page.timeout(60000); // Set a timeout for each step

//   logCallback?.(
//     `🧪 Test: ${testName} | Project: ${project} | Workers: ${workers}`
//   );
//   logCallback?.(`Steps: ${steps}`);
//   for (let i = 0; i < steps.length; i++) {
//     const step = steps[i];
//     const action = step.action;
//     const selector = step.selector || "";
//     const value = step.value || "";

//     logCallback?.(
//       `➡️ Step ${i + 1}: ${action} | Selector: ${selector} | Value: ${value}`
//     );

//     const func = keywords[action];
//     if (!func) {
//       logCallback?.(`⚠️ Unknown action: ${action} — Skipping`);
//       continue;
//     }

//     try {
//       await func(page, step);
//       logCallback?.(`✅ Step ${i + 1} PASSED`);
//     } catch (err) {
//       logCallback?.(`❌ Step ${i + 1} FAILED: ${err.message}`);
//       await browser.close(); // Ensure browser is closed on error
//       throw err; // Re-throw to be caught by API caller
//     }
//   }

//   if (config.screenshot) {
//     const screenshotPath = `${testName}.png`;
//     await page.screenshot({ path: screenshotPath });
//     logCallback?.(`📸 Screenshot saved to ${screenshotPath}`);
//   }

//   if (config.recording) {
//     logCallback?.(`🎥 Recording enabled (not implemented)`);
//   }

//   await browser.close();
//   logCallback?.(`🏁 Test execution completed for ${testName}`);
// }

// module.exports = { runTest };
