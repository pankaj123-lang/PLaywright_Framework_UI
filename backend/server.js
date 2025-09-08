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

const { extractSteps } = require("../Playwright_Framework/utils/extract_steps.js");
let childProcessId;
let childProcess;

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
app.post("/api/saveSuiteConfig", (req, res) => {
  const { project, config } = req.body;

  if (!project || !config) {
    return res.status(400).json({ error: "Missing project, or config" });
  }

  try {
    const configDir = path.join(__dirname, "../frontend/public/saved_configs");
    const configFilePath = path.join(configDir, "suite_config.json");

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

    existingData[project] = config;

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
app.get("/api/getSuiteConfig", (req, res) => {
  const { project } = req.query;

  if (!project) {
    return res.status(400).json({ error: "Missing project name" });
  }

  const configPath = path.join(
    __dirname,
    "../frontend/public/saved_configs/suite_config.json"
  );

  try {
    if (!fs.existsSync(configPath)) {
      return res.status(404).json({ error: "Config file not found" });
    }

    const raw = fs.readFileSync(configPath);
    const allConfigs = JSON.parse(raw);

    const config = allConfigs?.[project];
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
const { time, trace } = require("console");

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
    screenshot = config.screenshot ?? 'off'; // Default to false if not specified
    recordVideo = config.recording ?? 'off'; // Default to false if not specified
    browser = config.browser ?? "chromium";
    retries = config.retries ?? 0;
    traceVal = config.trace ?? 'off';
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
  const relativeReportPath = `/reports/${project}`;
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
retries: ${retries},
timeout:${timeoutForTest || 300000}, // Default to 5 minutes

   projects: [
    ${browser === 'chromium' || browser === 'all' ? `
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        headless: ${headless},
        screenshot: '${screenshot}',
        video: '${recordVideo}',
        trace: '${traceVal}',
      },
    },` : ''}
    ${browser === 'firefox' || browser === 'all' ? `
    {
      name: 'firefox',
      use: {
        browserName: 'firefox',
        headless: ${headless},
         screenshot: '${screenshot}',
        video: '${recordVideo}',
        trace: '${traceVal}',
      },
    },` : ''}
    ${browser === 'webkit' || browser === 'all' ? `
    {
      name: 'webkit',
      use: {
        browserName: 'webkit',
        headless: ${headless},
        screenshot: '${screenshot}',
        video: '${recordVideo}',
        trace: '${traceVal}',
      },
    },` : ''}
  ],
  reporter: [
    ['list'],
    ['html', { outputFolder: '${reportDir}', open: 'never' }],
    ['json', { outputFile: 'test-report/report.json' }]
  ]
});
`;
  fs.writeFileSync(tempConfigPath, tempConfigContent);

  // saveReportMetadata(project, testName, timestamp, relativeReportPath);

  // Spawn process
  child = spawn(
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
  // childProcess = child
  childProcessId = child.pid; // Store the process ID for later use
  console.log(`Child process started with PID: ${childProcessId}`);
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

    const srcDataPath = path.join(reportPath, "data");
    const destDataPath = path.join(finalReportPath, project, "data");
    const srcTracePath = path.join(reportPath, "trace");
    const destTracePath = path.join(finalReportPath, project, "trace");
    // Copy data folder if it exists

    if (!fs.existsSync(`${finalReportPath}/${project}`)) {
      fs.mkdirSync(`${finalReportPath}/${project}`, { recursive: true });
    }
    if (fs.existsSync(oldReportPath)) {
      // console.log(`Copying report from ${oldReportPath} to ${newReportPath}`);
      fs.copyFileSync(oldReportPath, newReportPath);
    } else {
      console.log(`No report found at ${oldReportPath}, skipping rename.`);
    }
    if (!fs.existsSync(destDataPath) && fs.existsSync(srcDataPath)) {
      fs.cpSync(srcDataPath, destDataPath, { recursive: true });
    } else {
      if (fs.existsSync(srcDataPath)) {
        const entries = fs.readdirSync(srcDataPath);
        entries
          .filter((entry) => entry.endsWith('.png') || entry.endsWith('.webm') || entry.endsWith('.zip')) // Filter for .png files
          .forEach((entry) => {
            const filePath = path.join(srcDataPath, entry);
            const destFilePath = path.join(destDataPath, entry);
            // console.log(`Copying file from ${filePath} to ${destFilePath}`);
            fs.copyFileSync(filePath, destFilePath); // Copy each .png file
          });
      }
    }
    if (!fs.existsSync(destTracePath) && fs.existsSync(srcTracePath)) {
      fs.cpSync(srcTracePath, destTracePath, { recursive: true });
    } else {
      if (fs.existsSync(srcTracePath)) {
        try {
          const entries = fs.readdirSync(srcTracePath);
          entries.forEach((entry) => {
            const entryPath = path.join(srcTracePath, entry);

            try {
              const stats = fs.statSync(entryPath);

              if (stats.isDirectory()) {
                const innerEntries = fs.readdirSync(entryPath);
                innerEntries.forEach((innerEntry) => {
                  const innerFilePath = path.join(entryPath, innerEntry);
                  const destInnerFilePath = path.join(destTracePath, entry, innerEntry);

                  // Ensure destination directory exists
                  const destInnerDir = path.dirname(destInnerFilePath);
                  if (!fs.existsSync(destInnerDir)) {
                    fs.mkdirSync(destInnerDir, { recursive: true });
                  }

                  // console.log(`Copying file from ${innerFilePath} to ${destInnerFilePath}`);
                  fs.copyFileSync(innerFilePath, destInnerFilePath);
                });
              } else if (stats.isFile()) {
                const sourceFilePath = path.join(srcTracePath, entry);
                const destFilePath = path.join(destTracePath, entry);

                // Ensure destination directory exists
                const destDir = path.dirname(destFilePath);
                if (!fs.existsSync(destDir)) {
                  fs.mkdirSync(destDir, { recursive: true });
                }

                // console.log(`Copying file from ${sourceFilePath} to ${destFilePath}`);
                fs.copyFileSync(sourceFilePath, destFilePath);
              }
            } catch (entryError) {
              console.error(`Error processing entry ${entry}:`, entryError);
            }
          });
        } catch (error) {
          console.error(`Error reading source trace path ${srcTracePath}:`, error);
        }
      } else {
        console.log(`Source trace path does not exist: ${srcTracePath}`);
      }

    }
    // broadcastLog(endMsg);
    logEmitter.emit("log", endMsg.toString());

    saveReportMetadata(project, testName, timestamp, relativeReportPath, status);

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
  const configPath = path.join(
    __dirname,
    "../frontend/public/saved_configs/suite_config.json"
  );
  try {
    if (!fs.existsSync(configPath)) {
      return res.status(404).json({ error: "Config file not found" });
    }

    const raw = fs.readFileSync(configPath);
    const allConfigs = JSON.parse(raw);

    const config = allConfigs?.[project];
    if (!config) {
      return res.status(404).json({ error: "No config found for this test" });
    }
    headless = config.headless ?? true;
    workers = config.workers ?? 1; // Default to 1 worker if not specified
    repeatEach = config.repeatEach ?? 1; // Default to 1 repeat if not specified
    timeoutForTest = config.timeoutForTest ?? 300000; // Default to 5 minutes if not specified
    screenshot = config.screenshot ?? 'off'; // Default to false if not specified
    recordVideo = config.recording ?? 'off'; // Default to false if not specified
    browser = config.browser ?? "chromium";
    retries = config.retries ?? 0;
    traceVal = config.trace ?? 'off';

  } catch (error) {
    error.message = `Failed to read config: ${error.message}`;
    return res.status(500).json({ error: error.message });
  }

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

      fs.writeFileSync(
        path.join(
          __dirname,
          "../Playwright_framework/runner/runSuiteData.json"
        ),
        JSON.stringify(testData, null, 2)
      );
    }
    const reportDir = `playwright-report`;
    const tempConfigPath = path.join(
      __dirname,
      "../Playwright_Framework/temp.config.ts"
    );
    const tempConfigContent = `
import { defineConfig } from '@playwright/test';

export default defineConfig({
fullyParallel: true,
workers: ${workers},
repeatEach: ${repeatEach},
retries: ${retries},
timeout:${timeoutForTest || 300000}, // Default to 5 minutes

projects: [
    ${browser === 'chromium' || browser === 'all' ? `
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        headless: ${headless},
        screenshot: '${screenshot}',
        video: '${recordVideo}',
        trace: '${traceVal}',
      },
    },` : ''}
    ${browser === 'firefox' || browser === 'all' ? `
    {
      name: 'firefox',
      use: {
        browserName: 'firefox',
        headless: ${headless},
        screenshot: '${screenshot}',
        video: '${recordVideo}',
        trace: '${traceVal}',
      },
    },` : ''}
    ${browser === 'webkit' || browser === 'all' ? `
    {
      name: 'webkit',
      use: {
        browserName: 'webkit',
        headless: ${headless},
        screenshot: '${screenshot}',
        video: '${recordVideo}',
        trace: '${traceVal}',
      },
    },` : ''}
  ],
  reporter: [
    ['list'],
    ['html', { outputFolder: '${reportDir}', open: 'never' }],
    ['json', { outputFile: 'test-report/report.json' }]
  ]
});
`;
    fs.writeFileSync(tempConfigPath, tempConfigContent);
    // 2️⃣ Run Playwright
    const child = spawn(
      "npx",
      [
        "playwright",
        "test",
        "tests/suiteRunner.spec.ts",
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
        const newReportPath = path.join(suiteReportDir, `suite_${project}-${timestamp}.html`);

        // fs.mkdirSync(reportDirPerTest, { recursive: true });
        if (!fs.existsSync(`${suiteReportDir}`)) {
          fs.mkdirSync(`${suiteReportDir}`, { recursive: true });
        }
        fs.cpSync(htmlReportDir, newReportPath, { recursive: true });
        const reportPath = path.join("../Playwright_Framework/playwright-report");
        const srcDataPath = path.join(reportPath, "data");
        const destDataPath = path.join(suiteReportDir, "data");
        const srcTracePath = path.join(reportPath, "trace");
        const destTracePath = path.join(suiteReportDir, "trace");
        if (!fs.existsSync(destDataPath) && fs.existsSync(srcDataPath)) {
          fs.cpSync(srcDataPath, destDataPath, { recursive: true });
        } else {
          if (fs.existsSync(srcDataPath)) {

            const entries = fs.readdirSync(srcDataPath);
            entries
              .filter((entry) => entry.endsWith('.png') || entry.endsWith('.webm') || entry.endsWith('.zip')) // Filter for .png files
              .forEach((entry) => {
                const filePath = path.join(srcDataPath, entry);
                const destFilePath = path.join(destDataPath, entry);
                // console.log(`Copying file from ${filePath} to ${destFilePath}`);
                fs.copyFileSync(filePath, destFilePath); // Copy each .png file
              });
          }
        }
        if (!fs.existsSync(destTracePath) && fs.existsSync(srcTracePath)) {
          fs.cpSync(srcTracePath, destTracePath, { recursive: true });
        } else {
          if (fs.existsSync(srcTracePath)) {
            try {
              const entries = fs.readdirSync(srcTracePath);
              entries.forEach((entry) => {
                const entryPath = path.join(srcTracePath, entry);

                try {
                  const stats = fs.statSync(entryPath);

                  if (stats.isDirectory()) {
                    const innerEntries = fs.readdirSync(entryPath);
                    innerEntries.forEach((innerEntry) => {
                      const innerFilePath = path.join(entryPath, innerEntry);
                      const destInnerFilePath = path.join(destTracePath, entry, innerEntry);

                      // Ensure destination directory exists
                      const destInnerDir = path.dirname(destInnerFilePath);
                      if (!fs.existsSync(destInnerDir)) {
                        fs.mkdirSync(destInnerDir, { recursive: true });
                      }

                      // console.log(`Copying file from ${innerFilePath} to ${destInnerFilePath}`);
                      fs.copyFileSync(innerFilePath, destInnerFilePath);
                    });
                  } else if (stats.isFile()) {
                    const sourceFilePath = path.join(srcTracePath, entry);
                    const destFilePath = path.join(destTracePath, entry);

                    // Ensure destination directory exists
                    const destDir = path.dirname(destFilePath);
                    if (!fs.existsSync(destDir)) {
                      fs.mkdirSync(destDir, { recursive: true });
                    }

                    // console.log(`Copying file from ${sourceFilePath} to ${destFilePath}`);
                    fs.copyFileSync(sourceFilePath, destFilePath);
                  }
                } catch (entryError) {
                  console.error(`Error processing entry ${entry}:`, entryError);
                }
              });
            } catch (error) {
              console.error(`Error reading source trace path ${srcTracePath}:`, error);
            }
          } else {
            console.log(`Source trace path does not exist: ${srcTracePath}`);
          }

        }
        // 4️⃣ Save suite metadata
        saveReportMetadata(project, `suite_${project}`, timestamp, `${relativeReportPath}`, status);

        resolve();
      });
    });
    // }

    // 4️⃣ Save suite metadata
    // saveReportMetadata(project, "SUITE", timestamp, `${relativeReportPath}/`);

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
app.post("/api/runSuiteWithDataset", async (req, res) => {
  const { project, tests } = req.body;
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds
  const istTime = new Date(now.getTime() + istOffset);
  const timestamp = istTime.toISOString().replace(/[:.]/g, "-").replace("T", "_").slice(0, 19);
  const configPath = path.join(
    __dirname,
    "../frontend/public/saved_configs/suite_config.json"
  );
  try {
    if (!fs.existsSync(configPath)) {
      return res.status(404).json({ error: "Config file not found" });
    }

    const raw = fs.readFileSync(configPath);
    const allConfigs = JSON.parse(raw);

    const config = allConfigs?.[project];
    if (!config) {
      return res.status(404).json({ error: "No config found for this test" });
    }
    headless = config.headless ?? true;
    workers = config.workers ?? 1; // Default to 1 worker if not specified
    repeatEach = config.repeatEach ?? 1; // Default to 1 repeat if not specified
    timeoutForTest = config.timeoutForTest ?? 300000; // Default to 5 minutes if not specified
    screenshot = config.screenshot ?? 'off'; // Default to false if not specified
    recordVideo = config.recording ?? 'off'; // Default to false if not specified
    browser = config.browser ?? "chromium";
    retries = config.retries ?? 0;
    traceVal = config.trace ?? 'off';

  } catch (error) {
    error.message = `Failed to read config: ${error.message}`;
    return res.status(500).json({ error: error.message });
  }

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

      fs.writeFileSync(
        path.join(
          __dirname,
          "../Playwright_framework/runner/runSuiteData.json"
        ),
        JSON.stringify(testData, null, 2)
      );
    }
    const reportDir = `playwright-report`;
    const tempConfigPath = path.join(
      __dirname,
      "../Playwright_Framework/temp.config.ts"
    );
    const tempConfigContent = `
import { defineConfig } from '@playwright/test';

export default defineConfig({
fullyParallel: true,
workers: ${workers},
repeatEach: ${repeatEach},
timeout:${timeoutForTest || 300000}, // Default to 5 minutes
retries: ${retries},

projects: [
    ${browser === 'chromium' || browser === 'all' ? `
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        headless: ${headless},
        screenshot: '${screenshot}',
        video: '${recordVideo}',
        trace: '${traceVal}',
      },
    },` : ''}
    ${browser === 'firefox' || browser === 'all' ? `
    {
      name: 'firefox',
      use: {
        browserName: 'firefox',
        headless: ${headless},
        screenshot: '${screenshot}',
        video: '${recordVideo}',
        trace: '${traceVal}',
      },
    },` : ''}
    ${browser === 'webkit' || browser === 'all' ? `
    {
      name: 'webkit',
      use: {
        browserName: 'webkit',
        headless: ${headless},
        screenshot: '${screenshot}',
        video: '${recordVideo}',
        trace: '${traceVal}',
      },
    },` : ''}
  ],
  reporter: [
    ['list'],
    ['html', { outputFolder: '${reportDir}', open: 'never' }],
    ['json', { outputFile: 'test-report/report.json' }]
  ]
});
`;
    fs.writeFileSync(tempConfigPath, tempConfigContent);
    // 2️⃣ Run Playwright
    const child = spawn(
      "npx",
      [
        "playwright",
        "test",
        "tests/suiteRunnerWithDataset.spec.ts",
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
        const newReportPath = path.join(suiteReportDir, `suite_${project}-${timestamp}.html`);
        // fs.mkdirSync(reportDirPerTest, { recursive: true });
        if (!fs.existsSync(`${suiteReportDir}`)) {
          fs.mkdirSync(`${suiteReportDir}`, { recursive: true });
        }
        fs.cpSync(htmlReportDir, newReportPath, { recursive: true });
        const reportPath = path.join("../Playwright_Framework/playwright-report");
        const srcDataPath = path.join(reportPath, "data");
        const destDataPath = path.join(suiteReportDir, "data");
        const srcTracePath = path.join(reportPath, "trace");
        const destTracePath = path.join(suiteReportDir, "trace");
        if (!fs.existsSync(destDataPath) && fs.existsSync(srcDataPath)) {
          fs.cpSync(srcDataPath, destDataPath, { recursive: true });
        } else {
          if (fs.existsSync(srcDataPath)) {

            const entries = fs.readdirSync(srcDataPath);
            entries
              .filter((entry) => entry.endsWith('.png') || entry.endsWith('.webm') || entry.endsWith('.zip')) // Filter for .png files
              .forEach((entry) => {
                const filePath = path.join(srcDataPath, entry);
                const destFilePath = path.join(destDataPath, entry);
                // console.log(`Copying file from ${filePath} to ${destFilePath}`);
                fs.copyFileSync(filePath, destFilePath); // Copy each .png file
              });
          }
        }
        if (!fs.existsSync(destTracePath) && fs.existsSync(srcTracePath)) {
          fs.cpSync(srcTracePath, destTracePath, { recursive: true });
        }
        else {
          if (fs.existsSync(srcTracePath)) {
            try {
              const entries = fs.readdirSync(srcTracePath);
              entries.forEach((entry) => {
                const entryPath = path.join(srcTracePath, entry);

                try {
                  const stats = fs.statSync(entryPath);

                  if (stats.isDirectory()) {
                    const innerEntries = fs.readdirSync(entryPath);
                    innerEntries.forEach((innerEntry) => {
                      const innerFilePath = path.join(entryPath, innerEntry);
                      const destInnerFilePath = path.join(destTracePath, entry, innerEntry);

                      // Ensure destination directory exists
                      const destInnerDir = path.dirname(destInnerFilePath);
                      if (!fs.existsSync(destInnerDir)) {
                        fs.mkdirSync(destInnerDir, { recursive: true });
                      }

                      // console.log(`Copying file from ${innerFilePath} to ${destInnerFilePath}`);
                      fs.copyFileSync(innerFilePath, destInnerFilePath);
                    });
                  } else if (stats.isFile()) {
                    const sourceFilePath = path.join(srcTracePath, entry);
                    const destFilePath = path.join(destTracePath, entry);

                    // Ensure destination directory exists
                    const destDir = path.dirname(destFilePath);
                    if (!fs.existsSync(destDir)) {
                      fs.mkdirSync(destDir, { recursive: true });
                    }

                    // console.log(`Copying file from ${sourceFilePath} to ${destFilePath}`);
                    fs.copyFileSync(sourceFilePath, destFilePath);
                  }
                } catch (entryError) {
                  console.error(`Error processing entry ${entry}:`, entryError);
                }
              });
            } catch (error) {
              console.error(`Error reading source trace path ${srcTracePath}:`, error);
            }
          }
          else {
            console.log(`Source trace path does not exist: ${srcTracePath}`);
          }
        }
        // 4️⃣ Save suite metadata
        saveReportMetadata(project, `suite_${project}`, timestamp, `${relativeReportPath}`, status);

        resolve();
      });
    });
    // }

    // 4️⃣ Save suite metadata
    // saveReportMetadata(project, "SUITE", timestamp, `${relativeReportPath}/`);

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
    id: `${project}_${testName}-${timestamp}`,
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
app.get("/api/reportStatus", (req, res) => {
  const metadataPath = path.join(__dirname, "../Playwright_Framework/reports/metadata.json");
  if (!fs.existsSync(metadataPath)) {
    return res.status(404).json({ error: "Metadata file not found." });
  }

  // Read and parse metadata.json
  const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));

  const folders = {};

  metadata.forEach((entry) => {
    // Construct the report path based on testName
    let reportFilePath;
    if (entry.testName === entry.project) {
      reportFilePath = `${entry.reportPath}/suite_${entry.project}-${entry.timestamp}.html`;
    } else {
      reportFilePath = `${entry.reportPath}/${entry.testName}-${entry.timestamp}.html`;
    }

    const folderName = entry.reportPath.split("/").pop(); // Extract folder name from reportPath
    if (!folders[folderName]) {
      folders[folderName] = { open: true, passed: [], failed: [] };
    }

    // Add the report to the appropriate status array
    if (entry.status === "passed") {
      folders[folderName].passed.push(reportFilePath);
    } else if (entry.status === "failed") {
      folders[folderName].failed.push(reportFilePath);
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

const kill = require("tree-kill");
const { report } = require("process");

app.post("/api/terminate", (req, res) => {
  console.log("Received request to terminate process for childProcessId:", childProcessId);

  if (!childProcessId || !child) {
    return res.status(400).json({ error: "No process is currently running." });
  }

  try {
    // Use tree-kill to terminate the process and its children
    kill(childProcessId, "SIGINT", (err) => {
      if (err) {
        console.error("Error terminating process:", err);
        return res.status(500).json({ error: `Failed to terminate the process.` });
      }

      child = null; // Reset the child process reference
      childProcessId = null; // Reset the process ID
      res.json({ message: `Process terminated successfully.` });
    });
  } catch (error) {
    console.error("Error terminating process:", error);
    res.status(500).json({ error: `Failed to terminate the process.` });
  }
});
app.post('/api/start_recorder', (req, res) => {
  const { url, projectName, testName, appendSteps } = req.body;
  if (!url || !projectName || !testName) {
    return res.status(400).json({ message: 'URL, Project Name, and Test Name are required.' });
  }

  console.log(`Received request to start recorder for URL: ${url}, Project: ${projectName}, Test: ${testName}`);
  console.log(`Append mode: ${appendSteps ? 'ON' : 'OFF'}`);

  // Define the path to the JSON file where steps will be stored
  const outputDir = path.join(__dirname, '../frontend/public/saved_steps/', projectName);
  console.log(`Output directory for steps: ${outputDir}`);
  const outputFile = path.join(outputDir, `${testName}.json`);
  console.log(`Starting recorder for URL: ${url}, saving to: ${outputFile}`);

  // Ensure the output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const recorderProcess = exec(`npx playwright codegen ${url} --output=../Playwright_Framework/tests/recorder.spec.ts`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error starting recorder: ${error.message}`);
      return res.status(500).json({ message: 'Failed to start recorder.' });
    }
  });

  // Process steps after the recorder completes
  recorderProcess.on('close', (code) => {
    if (code === 0) {
      const recorderPath = path.join(__dirname, '../Playwright_Framework/tests/recorder.spec.ts');
      const newSteps = extractSteps(recorderPath);

      // Handle append vs. overwrite logic
      if (appendSteps && fs.existsSync(outputFile)) {
        // Append mode - read existing steps first
        fs.readFile(outputFile, 'utf8', (readErr, data) => {
          let existingSteps = [];

          if (!readErr) {
            try {
              existingSteps = JSON.parse(data);
              if (!Array.isArray(existingSteps)) {
                existingSteps = [];
              }
            } catch (parseErr) {
              console.error(`Error parsing existing steps: ${parseErr.message}`);
            }
          }

          // Combine existing and new steps
          const combinedSteps = existingSteps.concat(newSteps);

          // Write combined steps back to file
          fs.writeFile(outputFile, JSON.stringify(combinedSteps, null, 2), (writeErr) => {
            if (writeErr) {
              console.error(`Error saving steps: ${writeErr.message}`);
              return res.status(500).json({ message: 'Failed to save steps.' });
            }

            res.json({
              message: 'Recorder completed. Steps appended successfully!',
              steps: combinedSteps,
              filePath: outputFile
            });
          });
        });
      } else {
        // Overwrite mode (default)
        fs.writeFile(outputFile, JSON.stringify(newSteps, null, 2), (err) => {
          if (err) {
            console.error(`Error saving steps: ${err.message}`);
            return res.status(500).json({ message: 'Failed to save steps.' });
          }

          res.json({
            message: 'Recorder completed and steps saved successfully!',
            steps: newSteps,
            filePath: outputFile
          });
        });
      }
    } else {
      console.error('Recorder process exited with an error.');
      res.status(500).json({ message: 'Recorder process failed.' });
    }
  });
});

let keywords = [];

// Route to handle POST requests to save a keyword
app.post('/api/saveKeywords', (req, res) => {
  const { keyword } = req.body;
  // console.log(`Received keyword data: ${JSON.stringify(keyword)}`);
  if (!keyword || !keyword.name || !keyword.code) {
    return res.status(400).json({ error: 'Invalid keyword data' });
  }
  const keywordsFilePath = path.join(__dirname, '../Playwright_Framework/keywords/customKeyword.js');
  let existingKeywords = {};
  if (fs.existsSync(keywordsFilePath)) {
    try {
      delete require.cache[require.resolve(keywordsFilePath)]; // Clear the cache for the module
      existingKeywords = require(keywordsFilePath); // Load the existing keywords
    } catch (error) {
      console.error('Error reading existing keywords:', error.message);
      return res.status(500).json({ error: 'Failed to read existing keywords' });
    }
  }
  if (existingKeywords[keyword.name]) {
    console.warn(`Keyword with name "${keyword.name}" already exists.`);
    return res.status(400).json({ error: `Keyword with name "${keyword.name}" already exists.` });
  }
  existingKeywords[keyword.name] = keyword.code;
  const jsContent = `
    // Auto-generated file. Do not edit manually.
    const { resolveValue, elementToBevisible } = require("../utils/utils.js");
    module.exports = {
      ${Object.entries(existingKeywords)
      .map(([name, code]) => `${name}: ${code}`)
      .join(',\n')}
    };
  `;
  try {
    // Append the new keyword to the existing file content
    fs.writeFileSync(keywordsFilePath, jsContent.trim());
    console.log(`Keyword "${keyword.name}" added successfully.`);

    res.status(201).json({ message: 'Keyword saved successfully', keyword });
  } catch (error) {
    console.error('Error writing to keywords file:', error.message);
    res.status(500).json({ error: 'Failed to save keyword' });
  }
  const actionOptionPath = path.join(__dirname, '../frontend/src/constants/customActionOptions.js');

  let actionOptions = [];
  try {
    if (fs.existsSync(actionOptionPath)) {
      const fileContent = fs.readFileSync(actionOptionPath, 'utf8');
      const match = fileContent.match(/const customActionKeywords\s*=\s*(\[[\s\S]*?\])/); // Match the array assignment
      if (match) {
        actionOptions = JSON.parse(match[1]); // Parse the array from the file content
      }
    }
    if (!actionOptions.includes(keyword.name)) {
      actionOptions.push(keyword.name); // Add the new keyword name to the action options
      const newFileContent = `const customActionKeywords = ${JSON.stringify(actionOptions, null, 2)};
export default customActionKeywords;`.trim();
      fs.writeFileSync(actionOptionPath, newFileContent + "\n"); // Save updated action options
      console.log(`Action options updated with keyword: ${keyword.name}`);
    }
  } catch (error) {
    console.error('Error parsing action options:', error.message);
    return res.status(500).json({ error: 'Failed to parse action options' });
  }
});
app.put('/api/updateKeyword', (req, res) => {
  const { keyword } = req.body;
  if (!keyword || !keyword.name || !keyword.code) {
    return res.status(400).json({ error: 'Invalid keyword data' });
  }
  const keywordsFilePath = path.join(__dirname, '../Playwright_Framework/keywords/customKeyword.js');
  let existingKeywords = {};
  if (fs.existsSync(keywordsFilePath)) {
    try {
      delete require.cache[require.resolve(keywordsFilePath)]; // Clear the cache for the module
      existingKeywords = require(keywordsFilePath); // Load the existing keywords
    } catch (error) {
      console.error('Error reading existing keywords:', error.message);
      return res.status(500).json({ error: 'Failed to read existing keywords' });
    }
  }
  if (!existingKeywords[keyword.name]) {
    return res.status(404).json({ error: `Keyword with name "${keyword.name}" not found.` });
  }
  existingKeywords[keyword.name] = keyword.code;
  const jsContent = `
    // Auto-generated file. Do not edit manually.
    const { resolveAppropriately, elementToBevisible, saveVariables, normalizeSelector } = require("../utils/utils.js");
    module.exports = {
      ${Object.entries(existingKeywords)
      .map(([name, code]) => `${name}: ${code}`)
      .join(',\n')}
    };
  `;
  try {
    fs.writeFileSync(keywordsFilePath, jsContent.trim());
    console.log(`Keyword "${keyword.name}" updated successfully.`);
    res.status(200).json({ message: 'Keyword updated successfully', keyword });
  } catch (error) {
    console.error('Error writing to keywords file:', error.message);
    res.status(500).json({ error: 'Failed to update keyword' });
  }

})
app.get('/api/getKeywords', (req, res) => {
  const keywordsFilePath = path.join(__dirname, '../Playwright_Framework/keywords/customKeyword.js');

  // Check if the file exists
  if (!fs.existsSync(keywordsFilePath)) {
    return res.status(404).json({ error: 'Keywords file not found' });
  }

  try {
    // Clear the cache for the module
    delete require.cache[require.resolve(keywordsFilePath)];
    const existingKeywords = require(keywordsFilePath); // Load the existing keywords

    // Transform the keywords into the desired format
    const formattedKeywords = Object.entries(existingKeywords).map(([name, code]) => ({
      name,
      code: code.toString(), // Convert the function to a string
    }));
    // console.log(`Fetched ${formattedKeywords.length} keywords.`);
    res.status(200).json(formattedKeywords);
  } catch (error) {
    console.error('Error reading keywords file:', error.message);
    res.status(500).json({ error: 'Failed to read keywords' });
  }
});

const variblesFilePath = path.join(
  __dirname,
  "../frontend/src/constants/variables.js"
);
const variableJsonPath = path.join(
  __dirname,
  "../frontend/src/constants/variables.json"
);
app.post("/api/saveVariables", (req, res) => {
  const { newKey, newValue } = req.body;

  if (!newKey || !newValue) {
    return res.status(400).json({ error: "Variable name and value are required." });
  }

  let existingVariables = {};
  if (fs.existsSync(variblesFilePath)) {
    try {
      delete require.cache[require.resolve(variblesFilePath)]; // Clear the cache for the module
      existingVariables = require(variblesFilePath); // Load the existing variables
    } catch (error) {
      console.error("Error reading existing variables:", error.message);
      return res.status(500).json({ error: "Failed to read existing variables" });
    }
  }

  if (existingVariables[newKey]) {
    existingVariables[newKey] = newValue;
  } else if (Object.keys(existingVariables).length >= 20) {
    return res.status(400).json({ error: "Maximum of 20 variables reached." });
  } else {
    existingVariables[newKey] = newValue;
  }
  const jsContent = `
    // Auto-generated file. Do not edit manually.
    module.exports = ${JSON.stringify(existingVariables, null, 2)};
  `;
  try {
    fs.writeFileSync(variblesFilePath, jsContent.trim());
    // Write JSON file
    if (!fs.existsSync(variableJsonPath)) {
      fs.mkdirSync(path.dirname(variableJsonPath), { recursive: true });
    }
    fs.writeFileSync(
      variableJsonPath,
      JSON.stringify(existingVariables, null, 2)
    );
    res.status(201).json({ success: true, message: "Variable saved successfully", newKey });
  } catch (error) {
    console.error("Error writing to variables file:", error.message);
    res.status(500).json({ error: "Failed to save variable" });
  }
}
);
app.get("/api/getVariables", (req, res) => {
  // console.log(`Fetching variables from: ${variblesFilePath}`);
  if (!fs.existsSync(variblesFilePath)) {
    return res.status(404).json({ error: "Variables file not found" });
  }

  try {
    delete require.cache[require.resolve(variblesFilePath)]; // Clear the cache for the module
    const existingVariables = require(variblesFilePath); // Load the existing variables
    // Transform the variables into the desired format
    const formattedVariables = Object.entries(existingVariables).map(([key, value]) => ({
      key,
      value,
    }));

    res.status(200).json(existingVariables);
  } catch (error) {
    console.error("Error reading variables file:", error.message);
    res.status(500).json({ error: "Failed to read variables" });
  }
});
app.post("/api/deleteVariable", (req, res) => {
  const { key } = req.body;
  if (!key) {
    return res.status(400).json({ error: "Variable key is required." });
  }

  const variablesFilePath = path.join(
    __dirname,
    "../frontend/src/constants/variables.js"
  );
  const variableJsonPath = path.join(
    __dirname,
    "../frontend/src/constants/variables.json"
  );

  if (!fs.existsSync(variablesFilePath)) {
    return res.status(404).json({ error: "Variables file not found." });
  }

  try {
    delete require.cache[require.resolve(variablesFilePath)]; // Clear the cache for the module
    let existingVariables = require(variablesFilePath); // Load the existing variables

    if (!existingVariables[key]) {
      return res.status(404).json({ error: `Variable "${key}" not found.` });
    }

    delete existingVariables[key]; // Remove the variable

    const jsContent = `
      // Auto-generated file. Do not edit manually.
      module.exports = ${JSON.stringify(existingVariables, null, 2)};
    `;

    fs.writeFileSync(variablesFilePath, jsContent.trim());

    // Update JSON file
    if (fs.existsSync(variableJsonPath)) {
      fs.writeFileSync(
        variableJsonPath,
        JSON.stringify(existingVariables, null, 2)
      );
    }
    // console.log(`Variable "${key}" deleted successfully.`);
    res.status(200).json({ success: true, message: `Variable "${key}" deleted successfully.` });
  } catch (error) {
    console.error("Error deleting variable:", error.message);
    res.status(500).json({ error: "Failed to delete variable" });
  }
}
);
app.post("/api/deleteReport", async (req, res) => {
  const { folderPaths } = req.body; // Expecting an array of folder paths
  // console.log(`Received request to delete reports at: ${folderPaths}`);

  if (!Array.isArray(folderPaths) || folderPaths.length === 0) {
    return res.status(400).json({ error: "An array of folder paths is required." });
  }

  try {
    const metadataPath = path.resolve(__dirname, "../Playwright_Framework/reports/metadata.json");
    // console.log(`Metadata file path: ${metadataPath}`);

    if (!fs.existsSync(metadataPath)) {
      console.error("Metadata file does not exist:", metadataPath);
      return res.status(404).json({ error: "Metadata file not found." });
    }

    const metadataContent = await fs.promises.readFile(metadataPath, "utf8");
    // console.log("Metadata file content:", metadataContent);

    let metadata;
    try {
      metadata = JSON.parse(metadataContent);
    } catch (parseErr) {
      console.error("Error parsing metadata file:", parseErr);
      return res.status(500).json({ error: "Failed to parse metadata file." });
    }

    // Iterate over each folder path
    for (let folderPath of folderPaths) {

      const absolutePath = path.join(__dirname, "../Playwright_Framework", folderPath);
      // Check if folder exists
      if (!fs.existsSync(absolutePath)) {
        console.error("Folder does not exist:", absolutePath);
        continue; // Skip to the next folder path
      }

      // Delete the folder
      await fs.promises.rm(absolutePath, { recursive: true, force: true });
      // console.log(`Folder deleted successfully: ${absolutePath}`);

      let extractedFileName = path.basename(folderPath, ".html");
      if (extractedFileName.includes("suite_")) {
        extractedFileName = extractedFileName.replace("suite_", ""); // Remove 'suite_' prefix for suite reports
      }
      const projectName = path.basename(path.dirname(folderPath)); // Extract the project name from the folder path
      const cleanId = `${projectName}_${extractedFileName}`; // Construct the ID to match the metadata format
      // console.log(`Extracted ID for deletion: ${cleanId}`);
      const reportIndex = metadata.findIndex((entry) => entry.id === cleanId);
      if (reportIndex === -1) {
        console.warn(`No metadata entry found for ID: ${cleanId}`);
      }
      const report = metadata[reportIndex];
      if (report) {
        // console.log(`Deleting metadata entry: ${JSON.stringify(report)}`);
        metadata.splice(reportIndex, 1); // Remove the metadata entry
      } else {
        console.warn(`No report found for ID: ${cleanId}`);
      }
    }
    // console.log("Metadata after deletion:", JSON.stringify(metadata, null, 2));
    // Write updated metadata back to the file
    await fs.promises.writeFile(metadataPath, JSON.stringify(metadata, null, 2), "utf8");
    // console.log("Metadata updated successfully.");

    res.status(200).json({ success: true, message: "Reports deleted and metadata updated successfully." });
  } catch (err) {
    console.error("An error occurred:", err);
    res.status(500).json({ error: "An unexpected error occurred." });
  }
});
app.post("/api/upadateVariable", (req, res) => {
  const { key, value } = req.body;
  if (!key || !value) {
    return res.status(400).json({ error: "Variable key and value are required." });
  }

  const variablesFilePath = path.join(
    __dirname,
    "../frontend/src/constants/variables.js"
  );

  if (!fs.existsSync(variablesFilePath)) {
    return res.status(404).json({ error: "Variables file not found." });
  }

  try {
    delete require.cache[require.resolve(variablesFilePath)]; // Clear the cache for the module
    let existingVariables = require(variablesFilePath); // Load the existing variables

    if (!existingVariables[key]) {
      return res.status(404).json({ error: `Variable "${key}" not found.` });
    }

    existingVariables[key] = value; // Update the variable value

    const jsContent = `
      // Auto-generated file. Do not edit manually.
      module.exports = ${JSON.stringify(existingVariables, null, 2)};
    `;

    fs.writeFileSync(variablesFilePath, jsContent.trim());
    res.status(200).json({ success: true, message: `Variable "${key}" updated successfully.` });
  } catch (error) {
    console.error("Error updating variable:", error.message);
    res.status(500).json({ error: "Failed to update variable" });
  }
});

app.get("/api/datasets", (req, res) => {
  try {
    const datasetsDir = path.join(__dirname, '../frontend/public/dataset');
    if (!fs.existsSync(datasetsDir)) {
      fs.mkdirSync(datasetsDir, { recursive: true });
    }

    // Make sure we're just returning file names as strings
    const files = fs.readdirSync(datasetsDir)
      .filter(file => file.endsWith('.json') || file.endsWith('.csv'));
    // console.log(`Found ${files.length} dataset files.`);


    res.status(200).json(files);
  } catch (error) {
    console.error('Error reading datasets directory:', error);
    res.status(500).json({ error: 'Failed to read datasets' });
  }
});
app.get('/api/getDataset', (req, res) => {
  const { project, test } = req.query;
  let datasetName;
  try {
    const configPath = path.join(__dirname, '../frontend/public/saved_configs/test_config.json');

    if (!fs.existsSync(configPath)) {
      return res.status(404).json({ error: 'Configuration file not found' });
    }

    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const testConfig = configData[project]?.[test];

    if (!testConfig) {
      return res.status(404).json({ error: 'Test configuration not found' });
    }
    datasetName = testConfig.dataset;
  } catch (error) {
    console.error('Error fetching test configuration:', error);
    res.status(500).json({ error: 'Failed to fetch test configuration' });
  }
  if (!datasetName) {
    return res.status(400).json({ error: 'Dataset name is required, you can select from config' });
  }
  try {
    // Check if dataset exists
    const datasetPath = path.join(__dirname, '../frontend/public/dataset', datasetName);
    if (!fs.existsSync(datasetPath)) {
      return res.status(404).json({ error: `Dataset '${datasetName}' not found` });
    }
    // Read dataset content
    const datasetContent = fs.readFileSync(datasetPath, 'utf8');
    let dataset;

    // Parse based on file extension
    if (datasetName.endsWith('.json')) {
      dataset = JSON.parse(datasetContent);
    } else if (datasetName.endsWith('.csv')) {
      // Basic CSV parsing - you might want to use a CSV library for more complex CSVs
      const lines = datasetContent.split('\n');
      const headers = lines[0].split(',');
      dataset = lines.slice(1).map(line => {
        const values = line.split(',');
        const entry = {};
        headers.forEach((header, i) => {
          entry[header] = values[i];
        });
        return entry;
      });
    } else {
      dataset = datasetContent; // Plain text
    }

    res.json({ project, test, datasetName, dataset });
  } catch (error) {
    console.error('Error fetching dataset:', error);
    res.status(500).json({ error: 'Failed to fetch dataset' });
  }
});
app.post('/api/saveDataset', async (req, res) => {
  try {
    const { project, test, dataset } = req.body;

    // Validate required fields
    if (!project || !test) {
      return res.status(400).json({ error: 'Project and test names are required' });
    }

    if (!dataset) {
      return res.status(400).json({ error: 'Dataset is required' });
    }

    // Define the directory where datasets are stored
    const datasetDir = path.join(__dirname, '../frontend/public/dataset');

    // Create directory if it doesn't exist
    if (!fs.existsSync(datasetDir)) {
      fs.mkdirSync(datasetDir, { recursive: true });
    }
    let datasetName;
    try {
      const configPath = path.join(__dirname, '../frontend/public/saved_configs/test_config.json');

      if (!fs.existsSync(configPath)) {
        return res.status(404).json({ error: 'Configuration file not found' });
      }

      const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const testConfig = configData[project]?.[test];

      if (!testConfig) {
        return res.status(404).json({ error: 'Test configuration not found' });
      }
      datasetName = testConfig.dataset;
    } catch (error) {
      console.error('Error fetching test configuration:', error);
      res.status(500).json({ error: 'Failed to fetch test configuration' });
    }

    // Define the file path for the dataset
    const datasetPath = path.join(datasetDir, datasetName);

    // Write the dataset to the file
    fs.writeFileSync(datasetPath, JSON.stringify(dataset, null, 2));

    res.json({ success: true, message: 'Dataset saved successfully' });
  } catch (err) {
    console.error('Error saving dataset:', err);
    res.status(500).json({ error: 'Failed to save dataset: ' + err.message });
  }
});
app.get('/api/checkDatasetSelected', (req, res) => {
  const { project, test } = req.query;

  if (!project || !test) {
    return res.status(400).json({ error: 'Project and test names are required' });
  }

  try {
    let configPath;
    let configData;
    let testConfig;
    let datasetSelected
    if (test === "suite") {
      configPath = path.join(__dirname, '../frontend/public/saved_configs/suite_config.json');
      if (!fs.existsSync(configPath)) {
        return res.status(404).json({ error: 'Configuration file not found' });
      }
      configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      testConfig = configData[project];

      if (!testConfig) {
        return res.status(404).json({ error: 'Test configuration not found' });
      }

      // Return the dataset name if it exists, or an empty string if not
      datasetSelected = testConfig.dataset || '';
    } else {
      configPath = path.join(__dirname, '../frontend/public/saved_configs/test_config.json');
      if (!fs.existsSync(configPath)) {
        return res.status(404).json({ error: 'Configuration file not found' });
      }
      configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      testConfig = configData[project]?.[test];

      if (!testConfig) {
        return res.status(404).json({ error: 'Test configuration not found' });
      }

      // Return the dataset name if it exists, or an empty string if not
      datasetSelected = testConfig.dataset || '';
    }


    res.json({ project, test, datasetSelected });
  } catch (error) {
    console.error('Error checking dataset selection:', error);
    res.status(500).json({ error: 'Failed to check dataset selection' });
  }
});


app.post('/api/createDataset', (req, res) => {
  const { project, test, datasetName, initialData } = req.body;
  if (!project || !test || !datasetName) {
    return res.status(400).json({ error: 'Project, test names, and dataset name are required' });
  }
  try {
    // Define the directory where datasets are stored
    const datasetDir = path.join(__dirname, '../frontend/public/dataset');
    // Create directory if it doesn't exist
    if (!fs.existsSync(datasetDir)) {
      fs.mkdirSync(datasetDir, { recursive: true });
    }
    // Define the file path for the new dataset
    const datasetPath = path.join(datasetDir, datasetName);
    // Check if the dataset file already exists
    if (fs.existsSync(datasetPath)) {
      return res.status(400).json({ error: 'Dataset with this name already exists' });
    }
    // Write the initial data to the new dataset file
    fs.writeFileSync(datasetPath, JSON.stringify(initialData || [], null, 2));

    try {
      const configPath = path.join(__dirname, '../frontend/public/saved_configs/test_config.json');
      if (!fs.existsSync(configPath)) {
        return res.status(404).json({ error: 'Configuration file not found' });
      }

      const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const testConfig = configData[project]?.[test];

      if (!testConfig) {
        return res.status(404).json({ error: 'Test configuration not found' });
      }
      testConfig.dataset = datasetName;
      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));

    } catch (error) {
      console.error('Error updating test configuration with new dataset:', error);
      return res.status(500).json({ error: 'Failed to update test configuration' });
    }
    res.json({ success: true, message: 'Dataset created successfully', datasetName });
  } catch (err) {
    console.error('Error creating dataset:', err);
    res.status(500).json({ error: 'Failed to create dataset' });
  }
});

app.post("/api/runTestwithDataset", async (req, res) => {
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
    screenshot = config.screenshot ?? 'off'; // Default to false if not specified
    recordVideo = config.recording ?? 'off'; // Default to false if not specified
    browser = config.browser ?? "chromium";
    datasetName = config.dataset ?? null;
    retries = config.retries ?? 0;
    traceVal = config.trace ?? 'off';
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
  const relativeReportPath = `/reports/${project}`;
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
timeout:${timeoutForTest || 300000}, // Default to 5 minutes
retries: ${retries}, // Number of retries for failed tests

   projects: [
    ${browser === 'chromium' || browser === 'all' ? `
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        headless: ${headless},
        screenshot: '${screenshot}',
        video: '${recordVideo}',
        trace: '${traceVal}'
      },
    },` : ''}
    ${browser === 'firefox' || browser === 'all' ? `
    {
      name: 'firefox',
      use: {
        browserName: 'firefox',
        headless: ${headless},
         screenshot: '${screenshot}',
        video: '${recordVideo}',
        trace: '${traceVal}'
      },
    },` : ''}
    ${browser === 'webkit' || browser === 'all' ? `
    {
      name: 'webkit',
      use: {
        browserName: 'webkit',
        headless: ${headless},
        screenshot: '${screenshot}',
        video: '${recordVideo}',
        trace: '${traceVal}'
      },
    },` : ''}
  ],
  reporter: [
    ['list'],
    ['html', { outputFolder: '${reportDir}', open: 'never' }],
    ['json', { outputFile: 'test-report/report.json' }]
  ]
});
`;
  fs.writeFileSync(tempConfigPath, tempConfigContent);

  // Spawn process
  child = spawn(
    "npx",
    [
      "playwright",
      "test",
      "tests/testRunnerDataset.spec.ts",
      "--config=temp.config.ts",
    ],
    {
      cwd: path.resolve(__dirname, "../Playwright_Framework"),
      shell: true,
    }
  );
  childProcessId = child.pid; // Store the process ID for later use
  console.log(`Child process started with PID: ${childProcessId}`);
  child.stdout.on("data", (data) => {
    const msg = data.toString();
    logEmitter.emit("log", data.toString());
  });

  child.stderr.on("data", (data) => {
    const err = data.toString();
    logEmitter.emit("log", data.toString());
  });

  child.on("close", (code) => {
    const status = code === 0 ? "passed" : "failed";
    const endMsg = `✅ Test finished with exit code ${code}`;
    const oldReportPath = path.join(reportPath, "index.html");
    const newReportPath = path.join(finalReportPath, project, `${testName}-${timestamp}.html`);

    const srcDataPath = path.join(reportPath, "data");
    const destDataPath = path.join(finalReportPath, project, "data");
    const srcTracePath = path.join(reportPath, "trace");
    const destTracePath = path.join(finalReportPath, project, "trace");
    // Copy data folder if it exists

    if (!fs.existsSync(`${finalReportPath}/${project}`)) {
      fs.mkdirSync(`${finalReportPath}/${project}`, { recursive: true });
    }
    if (fs.existsSync(oldReportPath)) {
      console.log(`Copying report from ${oldReportPath} to ${newReportPath}`);
      fs.copyFileSync(oldReportPath, newReportPath);
    } else {
      console.log(`No report found at ${oldReportPath}, skipping rename.`);
    }
    if (!fs.existsSync(destDataPath) && fs.existsSync(srcDataPath)) {
      fs.cpSync(srcDataPath, destDataPath, { recursive: true });
    } else {
      if (fs.existsSync(srcDataPath)) {
        const entries = fs.readdirSync(srcDataPath);
        entries
          .filter((entry) => entry.endsWith('.png') || entry.endsWith('.webm') || entry.endsWith('.zip')) // Filter for .png files
          .forEach((entry) => {
            const filePath = path.join(srcDataPath, entry);
            const destFilePath = path.join(destDataPath, entry);
            // console.log(`Copying file from ${filePath} to ${destFilePath}`);
            fs.copyFileSync(filePath, destFilePath); // Copy each .png file
          });
      }
    }
    if (!fs.existsSync(destTracePath) && fs.existsSync(srcTracePath)) {
      fs.cpSync(srcTracePath, destTracePath, { recursive: true });
    } else {
      if (fs.existsSync(srcTracePath)) {
        try {
          const entries = fs.readdirSync(srcTracePath);
          entries.forEach((entry) => {
            const entryPath = path.join(srcTracePath, entry);

            try {
              const stats = fs.statSync(entryPath);

              if (stats.isDirectory()) {
                const innerEntries = fs.readdirSync(entryPath);
                innerEntries.forEach((innerEntry) => {
                  const innerFilePath = path.join(entryPath, innerEntry);
                  const destInnerFilePath = path.join(destTracePath, entry, innerEntry);

                  // Ensure destination directory exists
                  const destInnerDir = path.dirname(destInnerFilePath);
                  if (!fs.existsSync(destInnerDir)) {
                    fs.mkdirSync(destInnerDir, { recursive: true });
                  }

                  // console.log(`Copying file from ${innerFilePath} to ${destInnerFilePath}`);
                  fs.copyFileSync(innerFilePath, destInnerFilePath);
                });
              } else if (stats.isFile()) {
                const sourceFilePath = path.join(srcTracePath, entry);
                const destFilePath = path.join(destTracePath, entry);

                // Ensure destination directory exists
                const destDir = path.dirname(destFilePath);
                if (!fs.existsSync(destDir)) {
                  fs.mkdirSync(destDir, { recursive: true });
                }

                // console.log(`Copying file from ${sourceFilePath} to ${destFilePath}`);
                fs.copyFileSync(sourceFilePath, destFilePath);
              }
            } catch (entryError) {
              console.error(`Error processing entry ${entry}:`, entryError);
            }
          });
        } catch (error) {
          console.error(`Error reading source trace path ${srcTracePath}:`, error);
        }
      } else {
        console.log(`Source trace path does not exist: ${srcTracePath}`);
      }

    }
    logEmitter.emit("log", endMsg.toString());

    saveReportMetadata(project, testName, timestamp, relativeReportPath, status);

    // ⏳ Slight delay to allow broadcast to complete
    setTimeout(() => {
      res.json({
        message: `✅ Test ${testName} from ${project} completed.`,
        reportPath: `/reports/${project}/index-${timestamp}.html`,
      });
    }, 300);
  });
});

app.post("/api/debugTest", async (req, res) => {
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
    headless = false; // Always run in headed mode for debugging
    workers = 1; // Single worker for debugging
    repeatEach = 1; // No repeats for debugging
    timeoutForTest = config.timeoutForTest ?? 300000; // Default to 5 minutes if not specified
    screenshot = true; // Always take screenshots for debugging
    recordVideo = false; // Disable video recording for debugging
    browser = config.browser ?? "chromium";
  } catch (error) {
    error.message = `Failed to read config: ${error.message}`;
    return res.status(500).json({ error: error.message });
  }

  const testData = {
    project,
    [testName]: { steps },
  };
  const runDataPath = path.join(
    __dirname,
    "../Playwright_Framework/runner/runData.json"
  );
  fs.writeFileSync(runDataPath, JSON.stringify(testData, null, 2));

  // Write temp config file
  const tempConfigPath = path.join(
    __dirname,
    "../Playwright_Framework/temp.config.ts"
  );
  const tempConfigContent = `
import { defineConfig } from '@playwright/test';
export default defineConfig({
  fullyParallel: false,
  workers: ${workers},
  repeatEach: ${repeatEach},
  timeout:${timeoutForTest || 300000}, // Default to 5 minutes
  use: {
    headless: ${headless}, // Dynamically set headless mode
    screenshot: 'on', // retain-on-failire/disable screenshots
    video: 'off', // retain-on-failure/disable video recording
  },
   projects: [
    ${browser === 'chromium' || browser === 'all' ? `
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        headless: ${headless},
        screenshot: 'on',
        video: 'off',
      },
    },` : ''}
    ${browser === 'firefox' || browser === 'all' ? `
    {
      name: 'firefox',
      use: {
        browserName: 'firefox',
        headless: ${headless},
        screenshot: 'on',
        video: 'off',
      },
    },` : ''}
    ${browser === 'webkit' || browser === 'all' ? `
    {
      name: 'webkit',
      use: {
        browserName: 'webkit',
        headless: ${headless},
        screenshot: 'on',
        video: 'off',
      },
    },` : ''}
  ],
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-report/report.json' }]
  ]
}
);
`;
  fs.writeFileSync(tempConfigPath, tempConfigContent);

  // Spawn process
  child = spawn(
    "npx",
    [
      "playwright",
      "test",
      "tests/testRunner.spec.ts",
      "--config=temp.config.ts",
      "--debug",
    ],
    {
      cwd: path.resolve(__dirname, "../Playwright_Framework"),
      shell: true,
    }
  );
  childProcessId = child.pid; // Store the process ID for later use
  console.log(`Child process started with PID: ${childProcessId}`);
  child.stdout.on("data", (data) => {
    const msg = data.toString();
    logEmitter.emit("log", data.toString());
  });

  child.stderr.on("data", (data) => {
    const err = data.toString();
    logEmitter.emit("log", data.toString());
  });

  child.on("close", (code) => {
    const status = code === 0 ? "passed" : "failed";
    const endMsg = `✅ Debug session finished with exit code ${code}`;
    logEmitter.emit("log", endMsg.toString());

    // ⏳ Slight delay to allow broadcast to complete
    setTimeout(() => {
      res.json({
        message: `✅ Debug session for ${testName} from ${project} completed.`,
      });
    }, 300);
  });
});
app.post("/api/debugSuite", async (req, res) => {
  const { project, tests } = req.body;
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds
  const istTime = new Date(now.getTime() + istOffset);
  const timestamp = istTime.toISOString().replace(/[:.]/g, "-").replace("T", "_").slice(0, 19);
  const configPath = path.join(
    __dirname,
    "../frontend/public/saved_configs/suite_config.json"
  );
  try {
    if (!fs.existsSync(configPath)) {
      return res.status(404).json({ error: "Config file not found" });
    }

    const raw = fs.readFileSync(configPath);
    const allConfigs = JSON.parse(raw);

    const config = allConfigs?.[project];
    if (!config) {
      return res.status(404).json({ error: "No config found for this test" });
    }
    headless = false; // Always run in headed mode for debugging
    workers = 1; // Single worker for debugging
    repeatEach = 1; // No repeats for debugging
    timeoutForTest = config.timeoutForTest ?? 300000; // Default to 5 minutes if not specified
    screenshot = true; // Always take screenshots for debugging
    recordVideo = false; // Disable video recording for debugging
    browser = config.browser ?? "chromium";

  } catch (error) {
    error.message = `Failed to read config: ${error.message}`;
    return res.status(500).json({ error: error.message });
  }

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

      fs.writeFileSync(
        path.join(
          __dirname,
          "../Playwright_framework/runner/runSuiteData.json"
        ),
        JSON.stringify(testData, null, 2)
      );
    }
    const reportDir = `playwright-report`;
    const tempConfigPath = path.join(
      __dirname,
      "../Playwright_Framework/temp.config.ts"
    );
    const tempConfigContent = `
import { defineConfig } from '@playwright/test';

export default defineConfig({
fullyParallel: true,
workers: ${workers},
repeatEach: ${repeatEach},
timeout:${timeoutForTest || 300000}, // Default to 5 minutes

projects: [
    ${browser === 'chromium' || browser === 'all' ? `
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        headless: ${headless},
        screenshot: '${screenshot ? 'on' : 'off'}',
        video: '${recordVideo ? 'on' : 'off'}',
      },
    },` : ''}
    ${browser === 'firefox' || browser === 'all' ? `
    {
      name: 'firefox',
      use: {
        browserName: 'firefox',
        headless: ${headless},
        screenshot: '${screenshot ? 'on' : 'off'}',
        video: '${recordVideo ? 'on' : 'off'}',
      },
    },` : ''}
    ${browser === 'webkit' || browser === 'all' ? `
    {
      name: 'webkit',
      use: {
        browserName: 'webkit',
        headless: ${headless},
        screenshot: '${screenshot ? 'on' : 'off'}',
        video: '${recordVideo ? 'on' : 'off'}',
      },
    },` : ''}
  ],
  reporter: [
    ['list'],
    ['html', { outputFolder: '${reportDir}', open: 'never' }],
    ['json', { outputFile: 'test-report/report.json' }]
  ]
});
`;
    fs.writeFileSync(tempConfigPath, tempConfigContent);
    // 2️⃣ Run Playwright
    const child = spawn(
      "npx",
      [
        "playwright",
        "test",
        "tests/suiteRunner.spec.ts",
        "--config=temp.config.ts",
        "--debug",
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
        const newReportPath = path.join(suiteReportDir, `suite_${project}-${timestamp}.html`);
        // fs.mkdirSync(reportDirPerTest, { recursive: true });
        if (!fs.existsSync(`${suiteReportDir}`)) {
          fs.mkdirSync(`${suiteReportDir}`, { recursive: true });
        }
        fs.cpSync(htmlReportDir, newReportPath, { recursive: true });
        const reportPath = path.join("../Playwright_Framework/playwright-report");
        const srcDataPath = path.join(reportPath, "data");
        const destDataPath = path.join(suiteReportDir, "data");
        if (!fs.existsSync(destDataPath) && fs.existsSync(srcDataPath)) {
          fs.cpSync(srcDataPath, destDataPath, { recursive: true });
        } else {
          if (fs.existsSync(srcDataPath)) {

            const entries = fs.readdirSync(srcDataPath);
            entries
              .filter((entry) => entry.endsWith('.png') || entry.endsWith('.webm')) // Filter for .png files
              .forEach((entry) => {
                const filePath = path.join(srcDataPath, entry);
                const destFilePath = path.join(destDataPath, entry);
                console.log(`Copying file from ${filePath} to ${destFilePath}`);
                fs.copyFileSync(filePath, destFilePath); // Copy each .png file
              });
          }
        }
        // 4️⃣ Save suite metadata
        saveReportMetadata(project, `suite_${project}`, timestamp, `${relativeReportPath}`, status);

        resolve();
      });
    });
    // }

    // 4️⃣ Save suite metadata
    // saveReportMetadata(project, "SUITE", timestamp, `${relativeReportPath}/`);

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
app.post('/api/runTestsByTags', async (req, res) => {
  const { projects, tags, runType } = req.body;
  console.log('Received runTestsByTags request with:', { projects, tags, runType });

  if (!projects || !tags || !Array.isArray(tags) || tags.length === 0 || !runType || projects.length === 0) {
    return res.status(400).json({ error: 'Projects and tags are required' });
  }

  const configPath = path.join(
    __dirname,
    "../frontend/public/saved_configs/test_config.json"
  );

  try {
    if (!fs.existsSync(configPath)) {
      return res.status(404).json({ error: "Config file not found" });
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    // Find tests that match the selected tags across selected projects
    const matchingTests = [];

    for (const projectName of projects) {
      if (!config[projectName]) {
        console.log(`⚠️ Project "${projectName}" not found in config`);
        continue;
      }

      const projectTests = config[projectName];

      for (const [testName, testConfig] of Object.entries(projectTests)) {
        // Check if test has tags and if any of them match the selected tags
        if (testConfig.tags && Array.isArray(testConfig.tags)) {
          const hasMatchingTag = testConfig.tags.some(tag => tags.includes(tag));

          if (hasMatchingTag) {
            matchingTests.push({
              project: projectName,
              test: testName,
              config: testConfig,
              matchedTags: testConfig.tags.filter(tag => tags.includes(tag))
            });
          }
        }
      }
    }

    if (matchingTests.length === 0) {
      return res.status(404).json({
        error: `No tests found with tags [${tags.join(', ')}] in selected projects [${projects.join(', ')}]`
      });
    }

    console.log(`🏷️ Found ${matchingTests.length} tests matching tags: ${tags.join(', ')}`);

    // Log the matched tests
    matchingTests.forEach(test => {
      console.log(`📋 ${test.project}/${test.test} - Tags: [${test.matchedTags.join(', ')}]`);
    });

    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds
    const istTime = new Date(now.getTime() + istOffset);
    const timestamp = istTime.toISOString().replace(/[:.]/g, "-").replace("T", "_").slice(0, 19);

    // Execute all matching tests sequentially
    const results = [];
    let totalPassed = 0;
    let totalFailed = 0;

    for (const testInfo of matchingTests) {
      const { project, test, config: testConfig } = testInfo;

      console.log(`🚀 Running test: ${project}/${test}`);
      logEmitter.emit("log", `🚀 Starting test: ${project}/${test} with tags: [${testInfo.matchedTags.join(', ')}]`);

      try {
        // Run the individual test using the same approach as single test
        const result = await runTestWithFramework(project, test, testConfig, timestamp, testInfo.matchedTags);

        results.push({
          project,
          test,
          status: result.success ? 'passed' : 'failed',
          matchedTags: testInfo.matchedTags,
          duration: result.duration || 'unknown',
          error: result.error || null,
          reportPath: result.reportPath || null
        });

        if (result.success) {
          totalPassed++;
        } else {
          totalFailed++;
        }

      } catch (error) {
        console.error(`❌ Error running test ${project}/${test}:`, error);
        logEmitter.emit("log", `❌ Error in test ${project}/${test}: ${error.message}`);

        results.push({
          project,
          test,
          status: 'error',
          matchedTags: testInfo.matchedTags,
          error: error.message
        });
        totalFailed++;
      }
    }

    // Summary
    const summary = {
      totalTests: matchingTests.length,
      passed: totalPassed,
      failed: totalFailed,
      tags: tags,
      projects: projects,
      timestamp,
      results
    };

    console.log(`📊 Test execution summary: ${totalPassed} passed, ${totalFailed} failed out of ${matchingTests.length} tests`);
    logEmitter.emit("log", `📊 Tag-based test run completed: ${totalPassed} passed, ${totalFailed} failed`);

    res.json({
      success: true,
      message: `Executed ${matchingTests.length} tests with tags: ${tags.join(', ')}`,
      summary
    });

  } catch (err) {
    console.error("❌ Error in runTestsByTags:", err);
    logEmitter.emit("log", `❌ Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// New function to run test using the same framework approach as single test
async function runTestWithFramework(project, testName, testConfig, timestamp, matchedTags) {
  return new Promise(async (resolve) => {
    const startTime = Date.now();

    try {
      // Get test steps from the test file (you'll need to implement this)
      const steps = await getTestSteps(project, testName);

      if (!steps || steps.length === 0) {
        return resolve({
          success: false,
          error: `No test steps found for ${project}/${testName}`,
          duration: '0s'
        });
      }

      // Set up configuration variables (same as single test runner)
      const headless = testConfig.headless ?? true;
      const workers = testConfig.workers ?? 1;
      const repeatEach = testConfig.repeatEach ?? 1;
      const timeoutForTest = testConfig.timeoutForTest ?? 300000;
      const screenshot = testConfig.screenshot ?? 'off';
      const recordVideo = testConfig.recording ?? 'off';
      const browser = testConfig.browser ?? "chromium";
      const retries = testConfig.retries ?? 0;
      const traceVal = testConfig.trace ?? 'off';

      const useDataset = testConfig.useDataset ?? false;
      const datasetSelected = testConfig.dataset && testConfig.dataset !== "" && useDataset;

      // Create run data
      const runDataPath = path.join(
        __dirname,
        "../Playwright_Framework/runner/runData.json"
      );

      const testData = {
        project,
        [testName]: { steps },
      };
      fs.writeFileSync(runDataPath, JSON.stringify(testData, null, 2));

      // Create temp config
      const tempConfigPath = path.join(
        __dirname,
        "../Playwright_Framework/temp.config.ts"
      );

      const reportDir = `playwright-report`;

      const tempConfigContent = `
import { defineConfig } from '@playwright/test';

export default defineConfig({
  fullyParallel: true,
  workers: ${workers},
  repeatEach: ${repeatEach},
  retries: ${retries},
  timeout: ${timeoutForTest || 300000},

  projects: [
    ${browser === 'chromium' || browser === 'all' ? `
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        headless: ${headless},
        screenshot: '${screenshot}',
        video: '${recordVideo}',
        trace: '${traceVal}',
      },
    },` : ''}
    ${browser === 'firefox' || browser === 'all' ? `
    {
      name: 'firefox',
      use: {
        browserName: 'firefox',
        headless: ${headless},
        screenshot: '${screenshot}',
        video: '${recordVideo}',
        trace: '${traceVal}',
      },
    },` : ''}
    ${browser === 'webkit' || browser === 'all' ? `
    {
      name: 'webkit',
      use: {
        browserName: 'webkit',
        headless: ${headless},
        screenshot: '${screenshot}',
        video: '${recordVideo}',
        trace: '${traceVal}',
      },
    },` : ''}
  ],
  reporter: [
    ['list'],
    ['html', { outputFolder: '${reportDir}', open: 'never' }],
    ['json', { outputFile: 'test-report/report.json' }]
  ]
});
`;
      fs.writeFileSync(tempConfigPath, tempConfigContent);
      const testRunnerFile = datasetSelected ? "tests/testRunnerDataset.spec.ts" : "tests/testRunner.spec.ts";


      // Run the test
      const child = spawn(
        "npx",
        [
          "playwright",
          "test",
          testRunnerFile,
          "--config=temp.config.ts",
        ],
        {
          cwd: path.resolve(__dirname, "../Playwright_Framework"),
          shell: true,
        }
      );

      let output = '';
      let errorOutput = '';

      child.stdout.on("data", (data) => {
        const message = data.toString();
        output += message;
        logEmitter.emit("log", message);
      });

      child.stderr.on("data", (data) => {
        const message = data.toString();
        errorOutput += message;
        logEmitter.emit("log", message);
      });

      child.on("close", (code) => {
        const duration = Date.now() - startTime;
        const success = code === 0;
        const status = success ? "passed" : "failed";

        // Handle report files (same as single test runner)
        const reportPath = path.join(__dirname, "../Playwright_Framework/playwright-report");
        const finalReportPath = path.join(__dirname, "../Playwright_Framework/reports");
        const oldReportPath = path.join(reportPath, "index.html");
        const newReportPath = path.join(finalReportPath, project, `${testName}-${timestamp}.html`);

        // Copy report files
        if (!fs.existsSync(`${finalReportPath}/${project}`)) {
          fs.mkdirSync(`${finalReportPath}/${project}`, { recursive: true });
        }

        let reportFilePath = null;
        if (fs.existsSync(oldReportPath)) {
          fs.copyFileSync(oldReportPath, newReportPath);
          reportFilePath = `/reports/${project}/${testName}-${timestamp}.html`;
        }

        // Copy data and trace folders (same logic as single test runner)
        copyReportAssets(reportPath, finalReportPath, project);

        // Save report metadata
        saveReportMetadata(project, testName, timestamp, `/reports/${project}`, status);

        const endMsg = `✅ Test ${project}/${testName} finished with exit code ${code} (Tags: ${matchedTags.join(', ')})`;
        logEmitter.emit("log", endMsg);

        resolve({
          success,
          duration: `${(duration / 1000).toFixed(2)}s`,
          error: success ? null : errorOutput || 'Test execution failed',
          output,
          reportPath: reportFilePath
        });
      });

      child.on("error", (error) => {
        resolve({
          success: false,
          duration: `${(Date.now() - startTime) / 1000}s`,
          error: error.message
        });
      });

    } catch (error) {
      resolve({
        success: false,
        duration: `${(Date.now() - startTime) / 1000}s`,
        error: error.message
      });
    }
  });
}

// Helper function to get test steps from project/test
async function getTestSteps(project, testName) {
  try {
    const stepsPath = path.join(__dirname, "../frontend/public/saved_steps", project, `${testName}.json`);

    if (!fs.existsSync(stepsPath)) {
      console.log(`⚠️ Steps file not found: ${stepsPath}`);
      return [];
    }

    const stepsData = JSON.parse(fs.readFileSync(stepsPath, 'utf8'));
    if (Array.isArray(stepsData)) {
      return stepsData;
    }

    // Fallback in case the structure is different
    return stepsData.steps || [];
  } catch (error) {
    console.error(`Error reading steps for ${project}/${testName}:`, error);
    return [];
  }
}

// Helper function to copy report assets
function copyReportAssets(reportPath, finalReportPath, project) {
  const srcDataPath = path.join(reportPath, "data");
  const destDataPath = path.join(finalReportPath, project, "data");
  const srcTracePath = path.join(reportPath, "trace");
  const destTracePath = path.join(finalReportPath, project, "trace");

  // Copy data folder
  if (!fs.existsSync(destDataPath) && fs.existsSync(srcDataPath)) {
    fs.cpSync(srcDataPath, destDataPath, { recursive: true });
  } else if (fs.existsSync(srcDataPath)) {
    const entries = fs.readdirSync(srcDataPath);
    entries
      .filter((entry) => entry.endsWith('.png') || entry.endsWith('.webm') || entry.endsWith('.zip'))
      .forEach((entry) => {
        const filePath = path.join(srcDataPath, entry);
        const destFilePath = path.join(destDataPath, entry);
        if (!fs.existsSync(destDataPath)) {
          fs.mkdirSync(destDataPath, { recursive: true });
        }
        fs.copyFileSync(filePath, destFilePath);
      });
  }

  // Copy trace folder
  if (!fs.existsSync(destTracePath) && fs.existsSync(srcTracePath)) {
    fs.cpSync(srcTracePath, destTracePath, { recursive: true });
  } else if (fs.existsSync(srcTracePath)) {
    try {
      const entries = fs.readdirSync(srcTracePath);
      entries.forEach((entry) => {
        const entryPath = path.join(srcTracePath, entry);
        const stats = fs.statSync(entryPath);

        if (stats.isDirectory()) {
          const innerEntries = fs.readdirSync(entryPath);
          innerEntries.forEach((innerEntry) => {
            const innerFilePath = path.join(entryPath, innerEntry);
            const destInnerFilePath = path.join(destTracePath, entry, innerEntry);
            const destInnerDir = path.dirname(destInnerFilePath);

            if (!fs.existsSync(destInnerDir)) {
              fs.mkdirSync(destInnerDir, { recursive: true });
            }
            fs.copyFileSync(innerFilePath, destInnerFilePath);
          });
        } else if (stats.isFile()) {
          const destFilePath = path.join(destTracePath, entry);
          const destDir = path.dirname(destFilePath);

          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }
          fs.copyFileSync(entryPath, destFilePath);
        }
      });
    } catch (error) {
      console.error(`Error copying trace files:`, error);
    }
  }
}
app.post('/api/runSuitesByTags', async (req, res) => {
  const { projects, tags, runType } = req.body;

  if (!tags || !Array.isArray(tags) || tags.length === 0 || !runType) {
    return res.status(400).json({ error: 'Tags are required for suite execution' });
  }

  // If projects are specified, use them; otherwise use all projects
  const selectedProjects = projects && projects.length > 0 ? projects : null;

  const testConfigPath = path.join(
    __dirname,
    "../frontend/public/saved_configs/test_config.json"
  );

  const suiteConfigPath = path.join(
    __dirname,
    "../frontend/public/saved_configs/suite_config.json"
  );

  try {
    if (!fs.existsSync(testConfigPath)) {
      return res.status(404).json({ error: "Test config file not found" });
    }

    if (!fs.existsSync(suiteConfigPath)) {
      return res.status(404).json({ error: "Suite config file not found" });
    }

    const testConfig = JSON.parse(fs.readFileSync(testConfigPath, 'utf8'));
    const suiteConfig = JSON.parse(fs.readFileSync(suiteConfigPath, 'utf8'));

    // Find projects that have tests with matching tags AND have suite configurations
    const matchingProjects = [];

    const projectsToCheck = selectedProjects || Object.keys(testConfig);

    for (const projectName of projectsToCheck) {
      if (!testConfig[projectName]) {
        console.log(`⚠️ Project "${projectName}" not found in test config`);
        continue;
      }

      if (!suiteConfig[projectName]) {
        console.log(`⚠️ Project "${projectName}" not found in suite config`);
        continue;
      }

      const projectTests = testConfig[projectName];
      const projectSuiteConfig = suiteConfig[projectName];
      const testsWithMatchingTags = [];

      // Check if suite itself has matching tags
      const suiteHasMatchingTags = projectSuiteConfig.tags &&
        Array.isArray(projectSuiteConfig.tags) &&
        projectSuiteConfig.tags.some(tag => tags.includes(tag));

      // Find all tests in this project that have matching tags
      for (const [testName, testConfigData] of Object.entries(projectTests)) {
        if (testConfigData.tags && Array.isArray(testConfigData.tags)) {
          const hasMatchingTag = testConfigData.tags.some(tag => tags.includes(tag));
          if (hasMatchingTag) {
            testsWithMatchingTags.push({
              testName,
              config: testConfigData,
              matchedTags: testConfigData.tags.filter(tag => tags.includes(tag))
            });
          }
        }
      }

      // Include project if either suite has matching tags OR tests have matching tags
      if (suiteHasMatchingTags || testsWithMatchingTags.length > 0) {
        matchingProjects.push({
          projectName,
          suiteConfig: projectSuiteConfig,
          testsWithTags: testsWithMatchingTags,
          totalTests: testsWithMatchingTags.length,
          suiteMatchedTags: suiteHasMatchingTags ?
            projectSuiteConfig.tags.filter(tag => tags.includes(tag)) : [],
          matchType: suiteHasMatchingTags ? 'suite' : 'tests'
        });
      }
    }

    if (matchingProjects.length === 0) {
      const searchScope = selectedProjects ? `in selected projects [${selectedProjects.join(', ')}]` : 'in any project';
      return res.status(404).json({
        error: `No test suites found with tags [${tags.join(', ')}] ${searchScope}`
      });
    }

    console.log(`🏷️ Found ${matchingProjects.length} suites with matching tags: ${tags.join(', ')}`);

    // Log details about matching projects and tests
    matchingProjects.forEach(project => {
      if (project.matchType === 'suite') {
        console.log(`📋 Suite: ${project.projectName} - Suite tags: [${project.suiteMatchedTags.join(', ')}]`);
      } else {
        console.log(`📋 Suite: ${project.projectName} (${project.totalTests} tests with matching tags)`);
        project.testsWithTags.forEach(test => {
          console.log(`   - ${test.testName}: [${test.matchedTags.join(', ')}]`);
        });
      }
    });

    if (selectedProjects) {
      console.log(`🎯 Filtered to selected projects: ${selectedProjects.join(', ')}`);
    }

    logEmitter.emit("log", `🏷️ Running ${matchingProjects.length} suites with tags: ${tags.join(', ')}`);

    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    const timestamp = istTime.toISOString().replace(/[:.]/g, "-").replace("T", "_").slice(0, 19);

    // Run each matching project as a suite
    const results = [];
    let totalPassed = 0;
    let totalFailed = 0;

    for (const projectInfo of matchingProjects) {
      const { projectName, suiteConfig, testsWithTags, suiteMatchedTags, matchType } = projectInfo;

      try {
        console.log(`🚀 Running suite: ${projectName} (Match type: ${matchType})`);
        logEmitter.emit("log", `🚀 Running suite: ${projectName} - ${matchType === 'suite' ? 'Suite-level tags' : testsWithTags.length + ' tests with matching tags'}`);

        // Run the entire suite using the framework approach
        const result = await runSuiteWithFrameworkConfig(
          projectName,
          suiteConfig,
          testsWithTags,
          timestamp,
          tags,
          matchType
        );

        results.push({
          project: projectName,
          status: result.success ? 'passed' : 'failed',
          matchType: matchType,
          testsWithTags: testsWithTags.length,
          suiteMatchedTags: suiteMatchedTags,
          duration: result.duration || 'unknown',
          error: result.error || null,
          reportPath: result.reportPath || null,
          datasetUsed: result.datasetUsed || null,
          testsDetails: testsWithTags.map(test => ({
            testName: test.testName,
            matchedTags: test.matchedTags
          }))
        });

        if (result.success) {
          totalPassed++;
        } else {
          totalFailed++;
        }

      } catch (error) {
        console.error(`❌ Error running suite ${projectName}:`, error);
        logEmitter.emit("log", `❌ Error in suite ${projectName}: ${error.message}`);

        results.push({
          project: projectName,
          status: 'error',
          matchType: matchType,
          testsWithTags: testsWithTags.length,
          suiteMatchedTags: suiteMatchedTags,
          error: error.message,
          testsDetails: testsWithTags.map(test => ({
            testName: test.testName,
            matchedTags: test.matchedTags
          }))
        });
        totalFailed++;
      }
    }

    const summary = {
      totalSuites: matchingProjects.length,
      passed: totalPassed,
      failed: totalFailed,
      tags: tags,
      selectedProjects: selectedProjects,
      matchingProjects: matchingProjects.map(p => ({
        projectName: p.projectName,
        matchType: p.matchType,
        testsCount: p.totalTests,
        suiteMatchedTags: p.suiteMatchedTags,
        tests: p.testsWithTags.map(t => t.testName)
      })),
      timestamp,
      results
    };

    console.log(`📊 Suite execution summary: ${totalPassed} passed, ${totalFailed} failed out of ${matchingProjects.length} suites`);
    logEmitter.emit("log", `📊 Tag-based suite run completed: ${totalPassed} passed, ${totalFailed} failed`);

    res.json({
      success: true,
      message: `Executed ${matchingProjects.length} suites with tags: ${tags.join(', ')}`,
      summary
    });

  } catch (err) {
    console.error("❌ Error in runSuitesByTags:", err);
    logEmitter.emit("log", `❌ Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Updated function to run suite with suite-level configuration
async function runSuiteWithFrameworkConfig(projectName, suiteConfig, testsWithTags, timestamp, selectedTags, matchType) {
  return new Promise(async (resolve) => {
    const startTime = Date.now();

    try {
      // Collect all test steps for the entire suite
      const allTestsData = {};

      // If matchType is 'suite', we need to get ALL tests in the project
      // If matchType is 'tests', we only get tests with matching tags
      let testsToRun = testsWithTags;

      if (matchType === 'suite') {
        // Get all tests in the project since suite-level tags match
        const testConfigPath = path.join(__dirname, "../frontend/public/saved_configs/test_config.json");
        const testConfig = JSON.parse(fs.readFileSync(testConfigPath, 'utf8'));

        if (testConfig[projectName]) {
          testsToRun = Object.keys(testConfig[projectName]).map(testName => ({
            testName,
            config: testConfig[projectName][testName],
            matchedTags: selectedTags // All tests inherit suite tags
          }));
        }
      }

      for (const testInfo of testsToRun) {
        const { testName } = testInfo;

        // Get test steps
        const steps = await getTestSteps(projectName, testName);
        if (steps && steps.length > 0) {
          allTestsData[testName] = { steps };
        }
      }

      if (Object.keys(allTestsData).length === 0) {
        return resolve({
          success: false,
          error: `No test steps found for any tests in project ${projectName}`,
          duration: '0s'
        });
      }

      // Check if suite config indicates dataset usage
      const useDataset = suiteConfig.useDataset ?? false;
      const datasetSelected = suiteConfig.dataset && suiteConfig.dataset !== "" && useDataset;

      console.log(`📊 Suite ${projectName}: ${Object.keys(allTestsData).length} tests, dataset: ${datasetSelected ? 'Yes (' + suiteConfig.dataset + ')' : 'No'}`);
      logEmitter.emit("log", `📊 Suite ${projectName}: ${Object.keys(allTestsData).length} tests, dataset: ${datasetSelected ? 'Yes' : 'No'}`);

      // Set up configuration variables from suite config
      const headless = suiteConfig.headless ?? true;
      const workers = suiteConfig.workers ?? 1;
      const repeatEach = suiteConfig.repeatEach ?? 1;
      const timeoutForTest = suiteConfig.timeoutForTest ?? 300000;
      const screenshot = suiteConfig.screenshot ?? 'off';
      const recordVideo = suiteConfig.recording ?? 'off';
      const browser = suiteConfig.browser ?? "chromium";
      const retries = suiteConfig.retries ?? 0;
      const traceVal = suiteConfig.trace ?? 'off';

      // Create run data for entire suite
      const runDataPath = path.join(
        __dirname,
        "../Playwright_Framework/runner/runData.json"
      );

      const suiteData = {
        project: projectName,
        ...allTestsData
      };
      fs.writeFileSync(runDataPath, JSON.stringify(suiteData, null, 2));

      // Create temp config
      const tempConfigPath = path.join(
        __dirname,
        "../Playwright_Framework/temp.config.ts"
      );

      const reportDir = `playwright-report`;

      const tempConfigContent = `
import { defineConfig } from '@playwright/test';

export default defineConfig({
  fullyParallel: true,
  workers: ${workers},
  repeatEach: ${repeatEach},
  retries: ${retries},
  timeout: ${timeoutForTest || 300000},

  projects: [
    ${browser === 'chromium' || browser === 'all' ? `
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        headless: ${headless},
        screenshot: '${screenshot}',
        video: '${recordVideo}',
        trace: '${traceVal}',
      },
    },` : ''}
    ${browser === 'firefox' || browser === 'all' ? `
    {
      name: 'firefox',
      use: {
        browserName: 'firefox',
        headless: ${headless},
        screenshot: '${screenshot}',
        video: '${recordVideo}',
        trace: '${traceVal}',
      },
    },` : ''}
    ${browser === 'webkit' || browser === 'all' ? `
    {
      name: 'webkit',
      use: {
        browserName: 'webkit',
        headless: ${headless},
        screenshot: '${screenshot}',
        video: '${recordVideo}',
        trace: '${traceVal}',
      },
    },` : ''}
  ],
  reporter: [
    ['list'],
    ['html', { outputFolder: '${reportDir}', open: 'never' }],
    ['json', { outputFile: 'test-report/report.json' }]
  ]
});
`;
      fs.writeFileSync(tempConfigPath, tempConfigContent);

      // Determine which test runner to use based on dataset usage
      const testRunnerFile = datasetSelected ? "tests/testRunnerDataset.spec.ts" : "tests/testRunner.spec.ts";

      console.log(`🏃 Running suite ${projectName} with ${testRunnerFile}`);
      logEmitter.emit("log", `🏃 Suite ${projectName} using: ${testRunnerFile}`);

      // Run the entire suite
      const child = spawn(
        "npx",
        [
          "playwright",
          "test",
          testRunnerFile,
          "--config=temp.config.ts",
        ],
        {
          cwd: path.resolve(__dirname, "../Playwright_Framework"),
          shell: true,
        }
      );

      let output = '';
      let errorOutput = '';

      child.stdout.on("data", (data) => {
        const message = data.toString();
        output += message;
        logEmitter.emit("log", message);
      });

      child.stderr.on("data", (data) => {
        const message = data.toString();
        errorOutput += message;
        logEmitter.emit("log", message);
      });

      child.on("close", (code) => {
        const duration = Date.now() - startTime;
        const success = code === 0;
        const status = success ? "passed" : "failed";

        // Handle report files
        const reportPath = path.join(__dirname, "../Playwright_Framework/playwright-report");
        const finalReportPath = path.join(__dirname, "../Playwright_Framework/reports");
        const oldReportPath = path.join(reportPath, "index.html");
        const newReportPath = path.join(finalReportPath, `${projectName}_suite`, `suite_${projectName}-${timestamp}.html`);

        // Copy report files
        if (!fs.existsSync(`${finalReportPath}/${projectName}_suite`)) {
          fs.mkdirSync(`${finalReportPath}/${projectName}_suite`, { recursive: true });
        }

        let reportFilePath = null;
        if (fs.existsSync(oldReportPath)) {
          fs.copyFileSync(oldReportPath, newReportPath);
          reportFilePath = `/reports/${projectName}_suite/suite_${projectName}-${timestamp}.html`;
        }

        // Copy data and trace folders
        copyReportAssets(reportPath, finalReportPath, `${projectName}_suite`);

        // Save report metadata for the suite
        saveReportMetadata(projectName, `suite_${projectName}`, timestamp, `/reports/${projectName}_suite`, status);

        const tagsInfo = selectedTags.join(', ');
        const datasetInfo = datasetSelected ? ` (Dataset: ${suiteConfig.dataset})` : '';
        const matchInfo = matchType === 'suite' ? ' (Suite-level match)' : ' (Test-level match)';
        const endMsg = `✅ Suite ${projectName} finished with exit code ${code} (Tags: ${tagsInfo})${datasetInfo}${matchInfo}`;
        logEmitter.emit("log", endMsg);

        resolve({
          success,
          duration: `${(duration / 1000).toFixed(2)}s`,
          error: success ? null : errorOutput || 'Suite execution failed',
          output,
          reportPath: reportFilePath,
          datasetUsed: datasetSelected ? suiteConfig.dataset : null
        });
      });

      child.on("error", (error) => {
        resolve({
          success: false,
          duration: `${(Date.now() - startTime) / 1000}s`,
          error: error.message
        });
      });

    } catch (error) {
      resolve({
        success: false,
        duration: `${(Date.now() - startTime) / 1000}s`,
        error: error.message
      });
    }
  });
}


// Save custom file
app.post('/api/saveCustomFile', async (req, res) => {
  try {
    const { fileName, content, fileId } = req.body;

    if (!fileName || content === undefined) {
      return res.status(400).json({ error: 'File name and content are required' });
    } else if (!fileName.includes('spec.ts')) {
      return res.status(400).json({ error: 'File name must include spec.ts extension' });
    }

    // Create custom codes directory if it doesn't exist
    const customCodesDir = path.join(__dirname, '../Playwright_Framework/custom_codes');
    if (!fs.existsSync(customCodesDir)) {
      fs.mkdirSync(customCodesDir, { recursive: true });
    }

    // Sanitize filename to prevent path traversal
    const sanitizedFileName = path.basename(fileName);
    const filePath = path.join(customCodesDir, sanitizedFileName);

    // Save file content
    fs.writeFileSync(filePath, content, 'utf8');

    // Save metadata
    const metadataPath = path.join(customCodesDir, 'files_metadata.json');
    let metadata = {};

    if (fs.existsSync(metadataPath)) {
      metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    }

    metadata[sanitizedFileName] = {
      id: fileId,
      name: sanitizedFileName,
      path: filePath,
      lastModified: new Date().toISOString(),
      size: content.length
    };

    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    console.log(`✅ Custom file saved: ${sanitizedFileName}`);

    res.json({
      success: true,
      message: 'File saved successfully',
      fileName: sanitizedFileName,
      filePath: `/custom_codes/${sanitizedFileName}`,
      fileId: fileId,
      size: content.length
    });

  } catch (error) {
    console.error('Error saving custom file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all custom files
app.get('/api/getCustomFiles', async (req, res) => {
  try {
    const customCodesDir = path.join(__dirname, '../Playwright_Framework/custom_codes');

    if (!fs.existsSync(customCodesDir)) {
      return res.json({ files: [] });
    }

    const metadataPath = path.join(customCodesDir, 'files_metadata.json');
    let files = [];

    if (fs.existsSync(metadataPath)) {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

      for (const [fileName, fileInfo] of Object.entries(metadata)) {
        const filePath = path.join(customCodesDir, fileName);

        if (fs.existsSync(filePath)) {
          try {
            // Read content as text and ensure it's properly encoded
            let content = fs.readFileSync(filePath, 'utf8');

            // Sanitize content to prevent any execution issues
            // Remove any potential script injections or malformed content
            content = content.replace(/\0/g, ''); // Remove null bytes

            // Validate that content is valid UTF-8 text
            if (typeof content !== 'string') {
              content = String(content);
            }

            files.push({
              id: fileInfo.id || Date.now(), // Ensure ID exists
              name: fileName,
              content: content,
              path: fileInfo.path || fileName,
              lastModified: fileInfo.lastModified || new Date().toISOString(),
              size: fileInfo.size || content.length,
              type: path.extname(fileName).toLowerCase() // Add file type
            });
          } catch (fileError) {
            console.error(`Error reading file ${fileName}:`, fileError);
            // Skip corrupted files instead of failing the entire request
            continue;
          }
        }
      }
    }

    // console.log(`📂 Retrieved ${files.length} custom files`);

    // Ensure response headers are set correctly
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json({
      success: true,
      files: files
    });

  } catch (error) {
    console.error('Error getting custom files:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      files: []
    });
  }
});
// Delete custom file
app.delete('/api/deleteCustomFile', async (req, res) => {
  try {
    const { fileName, fileId, filePath } = req.body;

    if (!fileName) {
      return res.status(400).json({ error: 'File name is required' });
    }

    const customCodesDir = path.join(__dirname, '../Playwright_Framework/custom_codes');
    const sanitizedFileName = path.basename(fileName);
    const filePathToDelete = path.join(customCodesDir, sanitizedFileName);

    // Delete file if exists
    if (fs.existsSync(filePathToDelete)) {
      fs.unlinkSync(filePathToDelete);
    }

    // Update metadata
    const metadataPath = path.join(customCodesDir, 'files_metadata.json');
    if (fs.existsSync(metadataPath)) {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      delete metadata[sanitizedFileName];
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    }

    console.log(`🗑️ Custom file deleted: ${sanitizedFileName}`);

    res.json({
      success: true,
      message: 'File deleted successfully',
      fileName: sanitizedFileName
    });

  } catch (error) {
    console.error('Error deleting custom file:', error);
    res.status(500).json({ error: error.message });
  }
});
// Add this to your server.js
app.put('/api/renameCustomFile', async (req, res) => {
  try {
    const { oldFileName, newFileName, fileId } = req.body;

    if (!oldFileName || !newFileName) {
      return res.status(400).json({
        success: false,
        error: 'Both old and new file names are required'
      });
    }
    if (!newFileName.includes('spec.ts')) {
      return res.status(400).json({
        success: false,
        error: 'New file name must include spec.ts extension'
      });
    }

    const customCodesDir = path.join(__dirname, '../Playwright_Framework/custom_codes');
    const sanitizedOldName = path.basename(oldFileName);
    const sanitizedNewName = path.basename(newFileName);

    const oldFilePath = path.join(customCodesDir, sanitizedOldName);
    const newFilePath = path.join(customCodesDir, sanitizedNewName);

    // Check if old file exists
    if (!fs.existsSync(oldFilePath)) {
      return res.status(404).json({
        success: false,
        error: 'Original file not found'
      });
    }

    // Check if new filename already exists
    if (fs.existsSync(newFilePath) && sanitizedOldName !== sanitizedNewName) {
      return res.status(409).json({
        success: false,
        error: 'A file with that name already exists'
      });
    }

    // Rename the file
    fs.renameSync(oldFilePath, newFilePath);

    // Update metadata
    const metadataPath = path.join(customCodesDir, 'files_metadata.json');
    if (fs.existsSync(metadataPath)) {
      try {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

        if (metadata[sanitizedOldName]) {
          // Copy metadata to new name and delete old entry
          metadata[sanitizedNewName] = {
            ...metadata[sanitizedOldName],
            name: sanitizedNewName,
            path: newFilePath,
            lastModified: new Date().toISOString()
          };
          delete metadata[sanitizedOldName];

          fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
        }
      } catch (parseError) {
        console.log('Error updating metadata after rename');
      }
    }

    console.log(`📝 Custom file renamed: ${sanitizedOldName} → ${sanitizedNewName}`);

    res.json({
      success: true,
      message: 'File renamed successfully',
      oldFileName: sanitizedOldName,
      newFileName: sanitizedNewName
    });

  } catch (error) {
    console.error('Error renaming custom file:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
app.post('/api/runCustomFile', async (req, res) => {
  const { fileName, content, fileId } = req.body;
  console.log(`🏃 Request to run custom file: ${fileName}`);


  if (!fileName) {
    return res.status(400).json({ error: 'File name is required to run custom file' });
  }

  const customCodesDir = path.join(__dirname, '../Playwright_Framework/custom_codes');
  const sanitizedFileName = path.basename(fileName);
  const filePath = path.join(customCodesDir, sanitizedFileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Custom file not found' });
  }

  try {
    // Create a temporary config for running the custom file
    const tempConfigPath = path.join(__dirname, "../Playwright_Framework/temp.config.ts");

    const tempConfigContent = `
import { defineConfig } from '@playwright/test';
export default defineConfig({
  fullyParallel: true,
  workers: 1,
  repeatEach: 1,
  retries: 0,
  timeout: 300000,

  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        headless: false,
        screenshot: 'off',
        video: 'off',
        trace: 'off',
      },
    }
  ],
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-report/report.json' }]
  ]
});
`;
    fs.writeFileSync(tempConfigPath, tempConfigContent);

    console.log(`🏃 Running custom file: ${sanitizedFileName}`);
    logEmitter.emit("log", `🏃 Running custom file: ${sanitizedFileName}`);

    const startTime = Date.now();

    const child = spawn(
      "npx",
      [
        "playwright",
        "test",
        "custom_codes/" + sanitizedFileName,
        "--config=temp.config.ts",
      ],
      {
        cwd: path.resolve(__dirname, "../Playwright_Framework"),
        shell: true,
      }
    );

    let output = '';
    let errorOutput = '';

    child.stdout.on("data", (data) => {
      const message = data.toString();
      output += message;
      logEmitter.emit("log", message);
    });

    child.stderr.on("data", (data) => {
      const message = data.toString();
      errorOutput += message;
      logEmitter.emit("log", message);
    });

    child.on("close", (code) => {
      const duration = Date.now() - startTime;
      const success = code === 0;
      const status = success ? "passed" : "failed";
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds
      const istTime = new Date(now.getTime() + istOffset);
      const timeStamp = istTime.toISOString().replace(/[:.]/g, "-").replace("T", "_").slice(0, 19);

      // Handle report files
      const reportPath = path.join(__dirname, "../Playwright_Framework/playwright-report");
      const finalReportPath = path.join(__dirname, `../Playwright_Framework/reports/custom_${sanitizedFileName.replace('.ts', '')}`);
      const oldReportPath = path.join(reportPath, "index.html");
      const newReportPath = path.join(finalReportPath, `${sanitizedFileName.replace('.ts', '')}-${timeStamp}.html`);

      // Copy report files
      if (!fs.existsSync(finalReportPath)) {
        fs.mkdirSync(finalReportPath, { recursive: true });
      }
      let reportFilePath = null;

      if (fs.existsSync(oldReportPath)) {
        fs.copyFileSync(oldReportPath, newReportPath);
        reportFilePath = `/reports/custom_${sanitizedFileName.replace('.ts', '')}/${sanitizedFileName.replace('.ts', '')}-${timeStamp}.html`;
      }
      // Copy data and trace folders
      copyReportAssets(reportPath, finalReportPath, `custom_${sanitizedFileName.replace('.ts', '')}`);
      // Save report metadata

      saveReportMetadata('custom', sanitizedFileName.replace('.ts', ''), timeStamp, `/reports/custom_${sanitizedFileName.replace('.ts', '')}`, status);
      const endMsg = `✅ Custom file ${sanitizedFileName} finished with exit code ${code}`;
      logEmitter.emit("log", endMsg);
      res.json({
        success,
        duration: `${(duration / 1000).toFixed(2)}s`,
        error: success ? null : errorOutput || 'Custom file execution failed',
        output,
        reportPath: reportFilePath
      });
    }
    );
    child.on("error", (error) => {
      res.status(500).json({
        success: false,
        duration: `${(Date.now() - startTime) / 1000}s`,
        error: error.message
      });
    });
  } catch (error) {
    console.error('Error running custom file:', error);
    res.status(500).json({ error: error.message });
  }
}
);

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
