import React from 'react';
import { FaHome, FaPlay, FaCog, FaFileAlt, FaCode, FaSearch, FaFilter } from 'react-icons/fa';
import styles from './css/UserGuide.module.css';

const UserGuide = () => {
  return (
    <div className={styles.guideContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Playwright Framework UI - User Guide</h1>
        <button 
          className={styles.homeButton}
          onClick={() => window.location.href = '/'}
        >
          <FaHome className={styles.homeIcon} />
          Back to Home
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.tableOfContents}>
          <h2>Table of Contents</h2>
          <ul>
            <li><a href="#overview">Overview</a></li>
            <li><a href="#getting-started">Getting Started</a></li>
            <li><a href="#test-suites">Creating Test Suites</a></li>
            <li><a href="#writing-tests">Writing Tests</a></li>
            <li><a href="#custom-keywords">Custom Keywords</a></li>
            <li><a href="#datasets">Datasets</a></li>
            <li><a href="#running-tests">Running Tests</a></li>
            <li><a href="#viewing-reports">Viewing Reports</a></li>
            <li><a href="#troubleshooting">Troubleshooting</a></li>
          </ul>
        </div>

        <div className={styles.guideContent}>
          <section id="overview" className={styles.section}>
            <h2><FaFileAlt className={styles.sectionIcon} /> Overview</h2>
            <p>
              The Playwright Framework UI is a comprehensive web-based test automation platform 
              that allows you to create, manage, and execute Playwright tests through an intuitive 
              graphical interface.
            </p>
            <div className={styles.featureList}>
              <h3>Key Features:</h3>
              <ul>
                <li>Visual Test Management</li>
                <li>Custom Keywords Development</li>
                <li>Real-time Test Execution</li>
                <li>Comprehensive Reporting</li>
                <li>Debug Support with Traces</li>
              </ul>
            </div>
          </section>

          <section id="getting-started" className={styles.section}>
            <h2><FaPlay className={styles.sectionIcon} /> Getting Started</h2>
            <div className={styles.stepByStep}>
              <h3>Quick Start Guide:</h3>
              <ol>
                <li>
                  <strong>Access the Application:</strong> Navigate to your application URL
                </li>
                <li>
                  <strong>Explore the Interface:</strong> Familiarize yourself with the sidebar and main content area
                </li>
                <li>
                  <strong>Create Your First Suite:</strong> Click "Create Suite" to start organizing your tests
                </li>
                <li>
                  <strong>Add Tests:</strong> Use the "+" button to add tests to your suite
                </li>
              </ol>
            </div>
          </section>

          <section id="test-suites" className={styles.section}>
            <h2><FaCog className={styles.sectionIcon} /> Creating and Managing Test Suites</h2>
            
            <div className={styles.subsection}>
              <h3>Creating a New Suite</h3>
              <div className={styles.instructionBox}>
                <ol>
                  <li>Click the <strong>"Create Suite"</strong> button in the sidebar header</li>
                  <li>Enter a descriptive name for your test suite</li>
                  <li>Click <strong>"Create"</strong> to confirm</li>
                </ol>
              </div>
            </div>

            <div className={styles.subsection}>
              <h3>Managing Suites</h3>
              <div className={styles.actionsList}>
                <div className={styles.action}>
                  <strong>Expand/Collapse:</strong> Click the chevron icon next to suite names
                </div>
                <div className={styles.action}>
                  <strong>Configure Suite:</strong> Click the gear icon to modify suite settings
                </div>
                <div className={styles.action}>
                  <strong>Delete Suite:</strong> Click the trash icon (⚠️ This action is irreversible)
                </div>
              </div>
            </div>
          </section>

          <section id="writing-tests" className={styles.section}>
            <h2><FaCode className={styles.sectionIcon} /> Writing and Managing Tests</h2>
            
            <div className={styles.subsection}>
              <h3>Creating a New Test</h3>
              <div className={styles.instructionBox}>
                <ol>
                  <li>Expand your desired test suite</li>
                  <li>Click the <strong>"+"</strong> (plus) icon next to the suite name</li>
                  <li>Enter a test name</li>
                  <li>Click <strong>"Create"</strong> to generate the test file</li>
                </ol>
              </div>
            </div>

            <div className={styles.subsection}>
              <h3>Basic Test Structure</h3>
              <div className={styles.codeBlock}>
                <pre>
{`test('test_name', async ({ page }) => {
  // Your test steps here
  await page.goto('https://example.com');
  await page.click('button');
  await expect(page).toHaveTitle('Expected Title');
});`}
                </pre>
              </div>
            </div>
          </section>

          <section id="custom-keywords" className={styles.section}>
            <h2><FaCode className={styles.sectionIcon} /> Custom Keywords</h2>
            <p>
              Custom keywords allow you to create reusable test actions that can be shared 
              across multiple tests.
            </p>
            
            <div className={styles.subsection}>
              <h3>Accessing Keywords</h3>
              <div className={styles.instructionBox}>
                <ol>
                  <li>Click the <strong>"Keywords"</strong> button in the header</li>
                  <li>This opens the Keywords editor interface</li>
                </ol>
              </div>
            </div>

            <div className={styles.subsection}>
              <h3>Keyword Template</h3>
              <div className={styles.codeBlock}>
                <pre>
{`keyword_name: async (page, step, test) => {
    // Replace "keyword_name" with actual keyword name
    
    // Resolve variable if present
    const value = resolveAppropriately(step.value || "", test);
    
    // Normalize selector if locator present
    const selector = normalizeSelector(step.selector);
    
    // Wait for element to be visible
    if (selector !== "") {
        await elementToBevisible(page, selector, test, 10000);
    }
    
    // Your custom logic here
    await selector.click();
    await selector.fill(value);
}`}
                </pre>
              </div>
            </div>
          </section>
          <section id="datasets" className={styles.section}>
            <h2><FaFilter className={styles.sectionIcon} /> Using Datasets for Data-Driven Testing</h2>
            <p>
                Datasets allow you to run the same test with different sets of data, enabling
                data-driven testing.
            </p>
            <div className={styles.subsection}>
                <h3>Creating a Dataset</h3>
                <div className={styles.instructionBox}>
                    <ol>
                        <li>Click the <strong>"Datasets"</strong> button in the header from test step editor</li>
                        <li>If dataset not selected <strong>"Click Ok"</strong> and provide a name</li>
                        <li>Add data entries in JSON format</li>
                        <li>Click <strong>"Save"</strong> to store the dataset</li>
                    </ol>
                </div>
            </div>
            <div className={styles.subsection}>
                <h3>Using a Dataset in Tests</h3>
                <div className={styles.instructionBox}>
                    <ol>
                        <li>In the config, select the desired dataset from the dropdown</li>
                        <li>Use <code>{`\${variable_name}`}</code> syntax in test steps to reference dataset variables</li>
                        <li>Run the test to execute it with all dataset entries</li>
                    </ol>
                </div>
            </div>
            </section>


          <section id="running-tests" className={styles.section}>
            <h2><FaPlay className={styles.sectionIcon} /> Running Tests</h2>
            
            <div className={styles.subsection}>
              <h3>Starting Test Execution</h3>
              <div className={styles.instructionBox}>
                <ol>
                  <li>Select the tests you want to run (checkboxes in sidebar)</li>
                  <li>Click the <strong>"Run"</strong> button (play icon) in the header</li>
                  <li>Monitor progress in the execution panel</li>
                </ol>
              </div>
            </div>

            <div className={styles.subsection}>
              <h3>Execution Controls</h3>
              <div className={styles.actionsList}>
                <div className={styles.action}>
                  <strong>Play:</strong> Start test execution
                </div>
                <div className={styles.action}>
                  <strong>Stop:</strong> Halt all running tests
                </div>
                <div className={styles.action}>
                  <strong>Debug:</strong> Run tests in debug mode with detailed tracing
                </div>
              </div>
            </div>
          </section>

          <section id="viewing-reports" className={styles.section}>
            <h2><FaFileAlt className={styles.sectionIcon} /> Viewing Test Reports</h2>
            
            <div className={styles.subsection}>
              <h3>Report Types</h3>
              <div className={styles.reportTypes}>
                <div className={styles.reportType}>
                  <h4>Total Execution Reports</h4>
                  <p>Shows all test results (passed and failed)</p>
                </div>
                <div className={styles.reportType}>
                  <h4>Failed Reports</h4>
                  <p>Shows only failed test results</p>
                </div>
                <div className={styles.reportType}>
                  <h4>Passed Reports</h4>
                  <p>Shows only passed test results</p>
                </div>
              </div>
            </div>
          </section>

          <section id="troubleshooting" className={styles.section}>
            <h2><FaCog className={styles.sectionIcon} /> Troubleshooting</h2>
            
            <div className={styles.troubleshootingList}>
              <div className={styles.troubleshootItem}>
                <h4>Syntax Errors in Keywords</h4>
                <p><strong>Problem:</strong> Red highlighting in keyword editor</p>
                <p><strong>Solution:</strong> Fix syntax errors before saving</p>
              </div>
              
              <div className={styles.troubleshootItem}>
                <h4>Test Selection Issues</h4>
                <p><strong>Problem:</strong> Cannot select tests from different suites</p>
                <p><strong>Solution:</strong> Tests must be from the same project for batch execution</p>
              </div>
              
              <div className={styles.troubleshootItem}>
                <h4>Test Execution Failures</h4>
                <p><strong>Problem:</strong> Tests fail unexpectedly</p>
                <p><strong>Solution:</strong> Check test configuration, especially timeouts and selectors</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default UserGuide;