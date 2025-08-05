const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const { exec } = require("child_process");
const app = express();
const PORT = 5000;
const { runTest } = require("../Playwright_Framework/runner/runTest");
const { addClient, broadcastLog } = require("./logEvents");
const { logEmitter } = require("./logEmitter.js");
// const { spawn } = require("child_process");
// Middleware
app.use(cors());
app.use(bodyParser.json());

// Folder to store test steps
const stepsDir = path.join(__dirname, "../frontend/public/", "saved_steps");
if (!fs.existsSync(stepsDir)) {
  fs.mkdirSync(stepsDir);
}
const metadataPath = path.join("../Playwright_Framework/reports/metadata.json");
app.post("/api/saveTestSteps", (req, res) => {
  const { project, test, steps } = req.body;
  const projectName = project;
  const testName = test;

  if (!projectName || !testName || !Array.isArray(steps)) {
    return res.status(400).json({ error: "Invalid project/test/steps data" });
  }

  const safeProject = projectName.replace(/\s+/g, "_");
  const safeTestName = testName.replace(/\s+/g, "_") + ".json";

  const projectPath = path.join(stepsDir, safeProject);

  // Ensure the project folder exists
  if (!fs.existsSync(projectPath)) {
    fs.mkdirSync(projectPath, { recursive: true });
  }

  const filePath = path.join(projectPath, safeTestName);

  fs.writeFile(filePath, JSON.stringify(steps, null, 2), (err) => {
    if (err) {
      console.error("Error writing file:", err);
      return res.status(500).json({ error: "Failed to save test steps" });
    }
    res.json({ message: `Test steps saved to ${safeProject}/${safeTestName}` });
  });
});
app.get("/api/folders", (req, res) => {
  const baseDir = path.join(__dirname, "../frontend/public/saved_steps/");
  const folders = {};

  fs.readdirSync(baseDir).forEach((project) => {
    const projectPath = path.join(baseDir, project);
    if (fs.statSync(projectPath).isDirectory()) {
      const testFiles = fs
        .readdirSync(projectPath)
        .filter((f) => f.endsWith(".json"));
      folders[project] = {
        open: true,
        tests: testFiles.map((file) => path.basename(file, ".json")),
      };
    }
  });

  res.json(folders);
});

app.get("/api/testSteps", (req, res) => {
  const { project, test } = req.query;
  const testPath = path.join(
    __dirname,
    "../frontend/public/saved_steps/",
    project,
    `${test}.json`
  );

  if (fs.existsSync(testPath)) {
    const data = fs.readFileSync(testPath, "utf-8");
    res.json({ steps: JSON.parse(data) });
  } else {
    res.status(404).json({ error: "Test steps not found." });
  }
});
app.post("/api/createProject", (req, res) => {
  const { projectName } = req.body;

  if (!projectName) {
    return res.status(400).json({ error: "Project name is required" });
  }
  const basePath = path.join(__dirname, "../frontend/public/saved_steps/");
  const projectPath = path.join(basePath, projectName.replace(/\s+/g, "_")); // basePath = where all projects are stored

  if (!fs.existsSync(projectPath)) {
    fs.mkdirSync(projectPath, { recursive: true });
    res.json({ message: "Project created" });
  } else {
    res.status(400).json({ error: "Project already exists" });
  }
});
app.post("/api/createTest", (req, res) => {
  const { projectName, testName } = req.body;

  if (!projectName || !testName) {
    return res.status(400).json({ error: "Project and test name required" });
  }
  const basePath = path.join(__dirname, "../frontend/public/saved_steps/");
  const testFilePath = path.join(basePath, projectName, `${testName}.json`);

  if (fs.existsSync(testFilePath)) {
    return res.status(400).json({ error: "Test already exists" });
  }

  try {
    fs.writeFileSync(testFilePath, JSON.stringify({ steps: [] }, null, 2));
    res.json({ message: "Test created successfully" });
  } catch (error) {
    console.error("Error writing test file:", error);
    res.status(500).json({ error: "Failed to create test file" });
  }
});

app.delete("/api/deleteTest", (req, res) => {
  const { project, test } = req.query;

  const testFilePath = path.join(
    __dirname,
    "../frontend/public/saved_steps/",
    project,
    `${test}.json`
  );
  if (fs.existsSync(testFilePath)) {
    fs.unlinkSync(testFilePath);
    res.json({ message: "Test deleted successfully" });
  } else {
    res.status(404).json({ error: "Test not found" });
  }
});
app.delete("/api/deleteFolder", (req, res) => {
  const { folder } = req.query;

  const folderPath = path.join(
    __dirname,
    "../frontend/public/saved_steps/",
    folder
  );
  if (fs.existsSync(folderPath)) {
    fs.rmdirSync(folderPath, { recursive: true });
    res.json({ message: "Folder deleted successfully" });
  } else {
    res.status(404).json({ error: "Folder not found" });
  }
});

app.post("/api/saveTestConfig", (req, res) => {
  const { project, test, config } = req.body;

  if (!project || !test || !config) {
    return res.status(400).json({ error: "Missing project, test, or config" });
  }

  try {
    const configDir = path.join(__dirname, "../frontend/public/saved_configs");
    const configFilePath = path.join(configDir, "test_config.json");

    // ✅ Create folder if it doesn't exist
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    let existingData = {};

    if (fs.existsSync(configFilePath)) {
      const raw = fs.readFileSync(configFilePath);
      existingData = JSON.parse(raw);
    }

    if (!existingData[project]) {
      existingData[project] = {};
    }

    existingData[project][test] = config;

    fs.writeFileSync(configFilePath, JSON.stringify(existingData, null, 2));
    res.status(200).json({ message: "✅ Configuration saved successfully" });
  } catch (error) {
    console.error("❌ Error saving config:", error);
    res.status(500).json({ error: "Failed to save config" });
  }
});

app.get("/api/getTestConfig", (req, res) => {
  const { project, test } = req.query;

  if (!project || !test) {
    return res.status(400).json({ error: "Missing project or test name" });
  }

  const configPath = path.join(
    __dirname,
    "../frontend/public/saved_configs/test_config.json"
  );

  try {
    if (!fs.existsSync(configPath)) {
      return res.status(404).json({ error: "Config file not found" });
    }

    const raw = fs.readFileSync(configPath);
    const allConfigs = JSON.parse(raw);

    const config = allConfigs?.[project]?.[test];
    if (!config) {
      return res.status(404).json({ error: "No config found for this test" });
    }

    res.status(200).json({ config });
  } catch (err) {
    console.error("Error reading config:", err);
    res.status(500).json({ error: "Failed to read config" });
  }
});
const { spawn } = require("child_process");

app.post("/api/runTest", async (req, res) => {
  const { project, testName, steps } = req.body;

  const timestamp = Date.now();
  const runDataPath = path.join(
    __dirname,
    "../Playwright_Framework/runner/runSuiteData.json"
  );
  const reportPath = path.join(__dirname, "../Playwright_Framework/reports");
  const reportDir = `reports/${project}_${timestamp}`;
  const tempConfigPath = path.join(
    __dirname,
    "../Playwright_Framework/temp.config.ts"
  );

  // Write test steps to JSON file
  const testData = {
    project,
    [testName]: { steps },
  };
  fs.writeFileSync(runDataPath, JSON.stringify(testData, null, 2));

  // Write temp config file
  const tempConfigContent = `
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['list'],
    ['html', { outputFolder: '${reportDir}', open: 'never' }],
    ['json', { outputFile: 'test-report/report.json' }]
  ]
});
`;
  fs.writeFileSync(tempConfigPath, tempConfigContent);

  saveReportMetadata(project, testName, timestamp, reportPath);

  // Spawn process
  const child = spawn(
    "npx",
    [
      "playwright",
      "test",
      "tests/keywordRunner.spec.ts",
      "--headed",
      "--config=temp.config.ts",
    ],
    {
      cwd: path.resolve(__dirname, "../Playwright_Framework"),
      shell: true,
    }
  );

  child.stdout.on("data", (data) => {
    const msg = data.toString();
    // console.log(msg);
    logEmitter.emit("log", data.toString());
    // broadcastLog(msg); // 🔁 Real-time log to WebSocket clients
  });

  child.stderr.on("data", (data) => {
    const err = data.toString();
    // console.error(err);
    // broadcastLog(err);
    logEmitter.emit("log", data.toString());
  });

  child.on("close", (code) => {
    const endMsg = `✅ Test finished with exit code ${code}`;
    // broadcastLog(endMsg);
    logEmitter.emit("log", endMsg.toString());

    // ⏳ Slight delay to allow broadcast to complete
    setTimeout(() => {
      res.json({
        message: `✅ Test ${testName} from ${project} completed.`,
        reportPath: `/reports/${project}_${timestamp}/index.html`,
      });
    }, 300);
  });
});

// app.post("/api/runTest", async (req, res) => {
//   const { project, testName, steps } = req.body;

//   const timestamp = Date.now();
//   const runDataPath = path.join(
//     __dirname,
//     "../Playwright_Framework/runner/runSuiteData.json"
//   );

//   const reportPath = path.join(__dirname, "../Playwright_Framework/reports");

//   const testData = {
//     project,
//     [testName]: { steps },
//   };
//   fs.writeFileSync(runDataPath, JSON.stringify(testData, null, 2));

//   const reportDir = `reports/${project}_${timestamp}`;
//   const tempConfigPath = path.join(
//     __dirname,
//     "../Playwright_Framework/temp.config.ts"
//   );

//   // 1. Write temp config
//   const tempConfigContent = `
// import { defineConfig } from '@playwright/test';

// export default defineConfig({
//   reporter: [
//     ['list'],
//     ['html', { outputFolder: '${reportDir}', open: 'never' }],
//     ['json', { outputFile: 'test-report/report.json' }]
//   ]
// });
// `;
//   fs.writeFileSync(tempConfigPath, tempConfigContent);

//   // 2. Run using --config
//   const cmd = `npx playwright test tests/keywordRunner.spec.ts --headed --config=temp.config.ts`;

//   const execOptions = {
//     cwd: path.resolve(__dirname, "../Playwright_Framework"),
//   };
//   saveReportMetadata(project, testName, timestamp, reportPath);
//   const child = exec(cmd, execOptions);

//   child.stdout.on("data", (data) => {
//     console.log(data.toString());
//     broadcastLog(data.toString());
//   });

//   child.stderr.on("data", (data) => {
//     console.error(data.toString());
//     broadcastLog(data.toString());
//   });

//   child.on("close", (code) => {
//     broadcastLog(`✅ Test finished with exit code ${code}`);
//     res.json({
//       message: `✅ Test ${testName} from ${project} completed.`,
//       reportPath: `/reports/${project}_${timestamp}/index.html`,
//     });
//   });
// });

// app.post("/api/runTest", async (req, res) => {
//   const { project, testName, steps } = req.body;
//   console.log("Processing steps:", steps);
//   const timestamp = Date.now();
//   const reportPath = `/reports/${project}_${testName}_${timestamp}/index.html`;
//   try {
//     if (!Array.isArray(steps)) {
//       throw new Error("Steps are required to run the test.");
//     }

// await runTest(
//   project,
//   testName,
//   steps,
//   path.join(__dirname, "../frontend/public/saved_configs/test_config.json"),
//   broadcastLog // 👈 log to SSE
// );
//     saveReportMetadata(project, testName, timestamp, reportPath);
//     broadcastLog(`✅ Test ${testName} from ${project} completed.`);
//     res.json({
//       message: `✅ Test ${testName} from ${project} executed.`,
//       reportPath,
//     });
//   } catch (err) {
//     console.error(err);
//     broadcastLog(`❌ Error: ${err.message}`);
//     res.status(500).json({ error: err.message });
//   }
// });

app.get("/api/testLogs", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  addClient(res, req);
});

// let clients = [];

// app.get("/api/testLogs", (req, res) => {
//   res.setHeader("Content-Type", "text/event-stream");
//   res.setHeader("Cache-Control", "no-cache");
//   res.setHeader("Connection", "keep-alive");

//   res.write("data: connected\n\n");

//   clients.push(res);

//   req.on("close", () => {
//     clients = clients.filter((c) => c !== res);
//   });
// });

// function broadcastLog(log) {
//   for (const client of clients) {
//     client.write(`data: ${log}\n\n`);
//   }
// }

// app.post("/api/runSuite", async (req, res) => {
//   const { project, tests } = req.body;
//   const timestamp = Date.now();
//   const reportPath = `/reports/${project}_${testName}_${timestamp}/index.html`;
//   console.log(
//     `Starting suite execution for project "${project}". Tests:`,
//     tests
//   );

//   if (!Array.isArray(tests) || tests.length === 0) {
//     return res.status(400).json({ error: "No tests specified." });
//   }

//   try {
//     for (const testName of tests) {
//       broadcastLog(`🚀 Running test "${testName}"...`);

//       // You need to get the steps for each test.
//       // Assuming you have a function that retrieves steps:
//       const steps = await getStepsForTest(project, testName);

//       if (!steps || !Array.isArray(steps)) {
//         broadcastLog(`⚠️ No steps found for "${testName}". Skipping.`);
//         continue;
//       }

//       await runTest(
//         project,
//         testName,
//         steps,
//         path.join(
//           __dirname,
//           "../frontend/public/saved_configs/test_config.json"
//         ),
//         broadcastLog
//       );
//       saveReportMetadata(project, testName, timestamp, reportPath);
//       broadcastLog(`✅ Completed test "${testName}".`);
//     }

//     broadcastLog(`🏁 Suite execution completed.`);
//     res.json({ message: `✅ Suite executed for project "${project}".` });
//   } catch (err) {
//     console.error(err);
//     broadcastLog(`❌ Error during suite execution: ${err.message}`);
//     res.status(500).json({ error: err.message });
//   }
// });
app.post("/api/runSuite", async (req, res) => {
  const { project, tests } = req.body;
  const timestamp = Date.now();
  const reportsBasePath = path.join(
    __dirname,
    "../Playwright_Framework/reports"
  );
  const suiteReportDir = path.join(
    reportsBasePath,
    `${project}_suite_${timestamp}`
  );
  const relativeReportPath = `/reports/${project}_suite_${timestamp}`;

  if (!Array.isArray(tests) || tests.length === 0) {
    return res.status(400).json({ error: "No tests specified." });
  }

  console.log(`📦 Starting suite for "${project}"`);
  logEmitter.emit(
    "log",
    `📦 Starting suite for "${project}" with ${tests.length} tests`
  );

  try {
    for (const testName of tests) {
      const steps = await getStepsForTest(project, testName);

      if (!steps || !Array.isArray(steps)) {
        const warn = `⚠️ No steps for "${testName}". Skipping.`;
        console.warn(warn);
        logEmitter.emit("log", warn);
        continue;
      }

      // 1️⃣ Save steps to runTestData.json
      const testData = {
        project,
        [testName]: { steps },
      };

      fs.writeFileSync(
        path.join(
          __dirname,
          "../Playwright_framework/runner/runSuiteData.json"
        ),
        JSON.stringify(testData, null, 2)
      );

      // 2️⃣ Run Playwright
      const child = spawn(
        "npx",
        [
          "playwright",
          "test",
          "tests/keywordRunner.spec.ts",
          "--headed",
          "--reporter",
          "html",
        ],
        {
          cwd: path.resolve(__dirname, "../Playwright_Framework"),
          shell: true,
        }
      );

      child.stdout.on("data", (data) => {
        const msg = data.toString();
        // console.log(msg);
        logEmitter.emit("log", msg);
      });

      child.stderr.on("data", (data) => {
        const err = data.toString();
        // console.error(err);
        logEmitter.emit("log", err);
      });

      await new Promise((resolve) => {
        child.on("close", (code) => {
          const endMsg = `✅ Test "${testName}" finished with code ${code}`;
          //   console.log(endMsg);
          logEmitter.emit("log", endMsg);

          // 3️⃣ Copy report
          const htmlReportDir = path.join(
            __dirname,
            "../Playwright_Framework/playwright-report"
          ); // ✅ NOT 'reports'

          const reportDirPerTest = path.join(suiteReportDir, testName);
          fs.mkdirSync(reportDirPerTest, { recursive: true });
          fs.cpSync(htmlReportDir, reportDirPerTest, { recursive: true });

          resolve();
        });
      });
    }

    // 4️⃣ Save suite metadata
    saveReportMetadata(project, "SUITE", timestamp, `${relativeReportPath}/`);

    logEmitter.emit("log", `🎯 All tests executed for project "${project}"`);
    res.json({
      message: `✅ Suite executed for project "${project}"`,
      reportPath: `${relativeReportPath}/`,
    });
  } catch (err) {
    console.error("❌ Error in runSuite:", err);
    logEmitter.emit("log", `❌ Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});
function getStepsForTest(projectName, testName) {
  const stepsPath = path.join(
    __dirname,
    `../frontend/public/saved_steps/${projectName}/${testName}.json`
  );
  if (!fs.existsSync(stepsPath)) {
    throw new Error(`Steps file not found for test: ${testName}`);
  }
  const fileContent = fs.readFileSync(stepsPath, "utf-8");
  return JSON.parse(fileContent);
}
function saveReportMetadata(project, testName, timestamp, reportPath) {
  let metadata = [];
  if (fs.existsSync(metadataPath)) {
    metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
  }

  metadata.push({
    id: `${project}_${testName}_${timestamp}`,
    project,
    testName,
    timestamp: new Date(timestamp).toISOString(),
    reportPath,
  });

  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
}
app.get("/api/reportHistory", (req, res) => {
  const { project, date } = req.query;
  const metadataPath = path.join(
    __dirname,
    "../frontend/public/saved_configs/report_metadata.json"
  );

  if (!fs.existsSync(metadataPath)) {
    return res.json([]);
  }

  let reports = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));

  if (project) {
    reports = reports.filter((r) => r.project === project);
  }
  if (date) {
    reports = reports.filter((r) => r.date.startsWith(date));
  }

  res.json(reports);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
app.use(
  "/reports",
  express.static(path.join(__dirname, "../Playwright_Framework/reports"))
);
app.use(
  "/playwright-report",
  express.static(
    path.join(__dirname, "../Playwright_Framework/playwright-report")
  )
);
