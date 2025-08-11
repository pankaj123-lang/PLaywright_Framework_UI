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
const historyDir = path.join(__dirname, "../Playwright_Framework/reports/");

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
        open: false,
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
const e = require("express");
const { time } = require("console");

app.post("/api/runTest", async (req, res) => {
  const { project, testName, steps } = req.body;

  //Fetch headless mode from config file
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

    const config = allConfigs?.[project]?.[testName];
    if (!config) {
      return res.status(404).json({ error: "No config found for this test" });
    }
    headless = config.headless ?? true;
    workers = config.workers ?? 1; // Default to 1 worker if not specified
    repeatEach = config.repeatEach ?? 1; // Default to 1 repeat if not specified
    timeoutForTest = config.timeoutForTest ?? 300000; // Default to 5 minutes if not specified
  } catch (error) {
    error.message = `Failed to read config: ${error.message}`;
    return res.status(500).json({ error: error.message });
  }
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds
  const istTime = new Date(now.getTime() + istOffset);
  const timestamp = istTime.toISOString().replace(/[:.]/g, "-").replace("T", "_").slice(0, 19);
  const runDataPath = path.join(
    __dirname,
    "../Playwright_Framework/runner/runData.json"
  );
  const reportPath = path.join(__dirname, "../Playwright_Framework/playwright-report");
  const finalReportPath = path.join(__dirname, "../Playwright_Framework/reports");
  const reportDir = `playwright-report`;
  const tempConfigPath = path.join(
    __dirname,
    "../Playwright_Framework/temp.config.ts"
  );
  const testData = {
    project,
    [testName]: { steps },
  };
  fs.writeFileSync(runDataPath, JSON.stringify(testData, null, 2));

  // Write temp config file
  const tempConfigContent = `
import { defineConfig } from '@playwright/test';

export default defineConfig({
fullyParallel: true,
workers: ${workers},
repeatEach: ${repeatEach},
timeout:${timeoutForTest|| 300000}, // Default to 5 minutes
 use: {
    headless: ${headless}, // Dynamically set headless mode
  },
  reporter: [
    ['list'],
    ['html', { outputFolder: '${reportDir}', open: 'never' }],
    ['json', { outputFile: 'test-report/report.json' }]
  ]
});
`;
  fs.writeFileSync(tempConfigPath, tempConfigContent);

  saveReportMetadata(project, testName, timestamp, finalReportPath);

  // Spawn process
  const child = spawn(
    "npx",
    [
      "playwright",
      "test",
      "tests/testRunner.spec.ts",
      "--config=temp.config.ts",
      // "--repeat-each=5"
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
    const status = code === 0 ? "passed" : "failed";
    const endMsg = `✅ Test finished with exit code ${code}`;
    const oldReportPath = path.join(reportPath, "index.html");
    const newReportPath = path.join(finalReportPath, project, `${testName}-${timestamp}.html`);
    if (fs.existsSync(oldReportPath)) {
      console.log(`Copying report from ${oldReportPath} to ${newReportPath}`);
      fs.copyFileSync(oldReportPath, newReportPath);
    } else {
      console.log(`No report found at ${oldReportPath}, skipping rename.`);
    }
    // broadcastLog(endMsg);
    logEmitter.emit("log", endMsg.toString());

    saveReportMetadata(project, testName, timestamp, finalReportPath, status);

    // ⏳ Slight delay to allow broadcast to complete
    setTimeout(() => {
      res.json({
        message: `✅ Test ${testName} from ${project} completed.`,
        reportPath: `/reports/${project}/index-${timestamp}.html`,
      });
    }, 300);
  });
});


app.get("/api/testLogs", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  addClient(res, req);
});

app.post("/api/runSuite", async (req, res) => {
  const { project, tests } = req.body;
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds
  const istTime = new Date(now.getTime() + istOffset);
  const timestamp = istTime.toISOString().replace(/[:.]/g, "-").replace("T", "_").slice(0, 19);
  const reportsBasePath = path.join(
    __dirname,
    "../Playwright_Framework/reports"
  );
  const suiteReportDir = path.join(
    reportsBasePath,
    `${project}_suite`
  );
  const relativeReportPath = `/reports/${project}_suite`;

  if (!Array.isArray(tests) || tests.length === 0) {
    return res.status(400).json({ error: "No tests specified." });
  }

  console.log(`📦 Starting suite for "${project}"`);
  logEmitter.emit(
    "log",
    `📦 Starting suite for "${project}" with ${tests.length} tests`
  );
  let testName;
  try {
    const testData = {
      [project]: {}
    };
    for (testName of tests) {
      const steps = await getStepsForTest(project, testName);

      if (!steps || !Array.isArray(steps)) {
        const warn = `⚠️ No steps for "${testName}". Skipping.`;
        console.warn(warn);
        logEmitter.emit("log", warn);
        continue;
      }

      // 1️⃣ Save steps to runTestData.json
      testData[project][testName] = {
        steps: steps
      };
      // testData.push({
      //   project,
      //   testName,
      //   steps,
      // });

      fs.writeFileSync(
        path.join(
          __dirname,
          "../Playwright_framework/runner/runSuiteData.json"
        ),
        JSON.stringify(testData, null, 2)
      );
    }
    // 2️⃣ Run Playwright
    const child = spawn(
      "npx",
      [
        "playwright",
        "test",
        "tests/suiteRunner.spec.ts",
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
        const status = code === 0 ? "passed" : "failed";
        const endMsg = `✅ Test finished with code ${code}`;
        //   console.log(endMsg);
        logEmitter.emit("log", endMsg);

        // 3️⃣ Copy report
        const htmlReportDir = path.join(
          __dirname,
          "../Playwright_Framework/playwright-report/index.html"
        ); // ✅ NOT 'reports'

        // const reportDirPerTest = path.join(suiteReportDir, project);
        const newReportPath = path.join(suiteReportDir, `${project}-${timestamp}.html`);
        // fs.mkdirSync(reportDirPerTest, { recursive: true });
        fs.cpSync(htmlReportDir, newReportPath, { recursive: true });
        // 4️⃣ Save suite metadata
        saveReportMetadata(project, "SUITE", timestamp, `${relativeReportPath}/`, status);

        resolve();
      });
    });
    // }

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
function saveReportMetadata(project, testName, timestamp, reportPath, status) {
  let metadata = [];
  if (fs.existsSync(metadataPath)) {
    metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
  }

  metadata.push({
    id: `${project}_${testName}_${timestamp}`,
    project,
    testName,
    timestamp: timestamp,
    reportPath,
    status,
  });

  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
}
app.get("/api/report", (req, res) => {
  const metadataPath = path.join(__dirname, "../Playwright_Framework/reports/metadata.json");

  if (!fs.existsSync(metadataPath)) {
    return res.status(404).json({ error: "Metadata file not found." });
  }
  try {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));

    // Assuming metadata contains an array of test results
    const totalExecutions = metadata.length;
    const passed = metadata.filter((test) => test.status === "passed").length;
    const failed = metadata.filter((test) => test.status === "failed").length;
    const passedPercentage = ((passed / totalExecutions) * 100).toFixed(2);
    const failedPercentage = ((failed / totalExecutions) * 100).toFixed(2);

    res.json({
      totalExecutions,
      passed,
      failed,
      passedPercentage,
      failedPercentage,
    });
  } catch (err) {
    console.error("Error reading metadata:", err);
    res.status(500).json({ error: "Failed to process report data." });
  }
});

// API endpoint to fetch execution history
app.get("/api/executionHistory", (req, res) => {

  const baseDir = path.join(__dirname, "../Playwright_Framework/reports/");
  const folders = {};
  fs.readdirSync(baseDir).forEach((reportFolder) => {
    const reportPath = path.join(baseDir, reportFolder);
    if (fs.statSync(reportPath).isDirectory()) {
      const reportFiles = fs
        .readdirSync(reportPath)
        .filter((f) => f.endsWith(".html"));
      folders[reportFolder] = {
        open: true,
        report: reportFiles.map((file) => `reports/${reportFolder}/${file}`),
      };
    }
  });

  res.json(folders);
});
app.post("api/renameProject", (req, res) => {
  const { oldName, newName } = req.body;

  if (!oldName || !newName) {
    return res.status(400).json({ error: "Both old and new project names are required." });
  }

  const basePath = path.join(__dirname, "../frontend/public/saved_steps/");
  const oldPath = path.join(basePath, oldName.replace(/\s+/g, "_"));
  const newPath = path.join(basePath, newName.replace(/\s+/g, "_"));

  if (!fs.existsSync(oldPath)) {
    return res.status(404).json({ error: "Project not found." });
  }

  fs.rename(oldPath, newPath, (err) => {
    if (err) {
      console.error("Error renaming project:", err);
      return res.status(500).json({ error: "Failed to rename project." });
    }
    res.json({ message: `Project renamed from ${oldName} to ${newName}` });
  });
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
