import styles from "./css/Header.module.css"; // Make sure this file exists
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { FaBan, FaBug, FaDollarSign, FaKey, FaPause, FaPlay, FaStop, FaVideo, FaVideoSlash } from "react-icons/fa";

export default function Header({
  setIsTerminalOpen,
  selectedTest,
  selectedTestsForRun,
  activeProject,
  setTerminalLogs,
  testSteps,
  setIsRunning,
  isRunning,
}) {
  
  const [isRecording, setIsRecording] = useState(false); // State to track recording status
  const [isDebugging, setIsDebugging] = useState(false);

  const navigate = useNavigate();

  const handleRunClick = async () => {
    try {
      setIsRunning(true); // Set running state to true
      setIsTerminalOpen(true); // Open terminal when running starts
      // Ensure EventSource is connected before triggering backend
      const eventSource = new EventSource("http://localhost:5000/api/testLogs");

      eventSource.onmessage = (event) => {
        console.log("SSE Log:", event.data);
        setTerminalLogs((prevLogs) => [...prevLogs, event.data]);
      };

      eventSource.onerror = (err) => {
        console.error("SSE error:", err);
        eventSource.close();
      };

      //Code for running test or suite with dataset
      const project = selectedTest?.project || activeProject;
      const test = selectedTest?.name;


      // Rest of your logic
      if (selectedTestsForRun && selectedTestsForRun.length > 0) {
        const test = "suite";
        console.log("Checking dataset for project:", project);
        if (!activeProject) {
          alert("No active project selected for suite run.");
          return;
        }
        const res = await fetch(`http://localhost:5000/api/checkDatasetSelected?project=${project}&test=${test}`);
        const data = await res.json();
        if (res.ok && data?.datasetSelected === '') {

          const payload = {
            project: activeProject,
            tests: selectedTestsForRun,
          };

          const response = await fetch("http://localhost:5000/api/runSuite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const result = await response.json();
          console.log("Run suite response:", result);

          if (response.ok) {
            alert(result.message || "✅ Suite executed successfully");
            if (result.reportPath) {
              window.open(result.reportPath, "_blank");
            }
          } else {
            alert("❌ Failed to run suite: " + result.error);
          }
        } else {
          const payload = {
            project: activeProject,
            tests: selectedTestsForRun,
          };

          const response = await fetch("http://localhost:5000/api/runSuiteWithDataset", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const result = await response.json();
          console.log("Run suite response:", result);

          if (response.ok) {
            alert(result.message || "✅ Suite executed successfully");
            if (result.reportPath) {
              window.open(result.reportPath, "_blank");
            }
          } else {
            alert("❌ Failed to run suite: " + result.error);
          }
        }


      } else if (selectedTest?.project && selectedTest?.name) {
        console.log("Checking dataset for project:", project, "and test:", test);

        const res = await fetch(`http://localhost:5000/api/checkDatasetSelected?project=${project}&test=${test}`);
        const data = await res.json();
        if (res.ok && data?.datasetSelected === '') {
          const payload = {
            project: selectedTest.project,
            testName: selectedTest.name,
            steps: testSteps,
          };

          const response = await fetch("http://localhost:5000/api/runTest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const result = await response.json();
          console.log("Run test response:", result);

          if (response.ok) {
            // alert(result.message || "✅ Test executed successfully");
            console.log("✅ Test executed successfully:", result.message);

          } else {
            alert("❌ Failed to run test: " + result.error);
          }
        } else {
          const payload = {
            project: selectedTest.project,
            testName: selectedTest.name,
            steps: testSteps,
          };

          const response = await fetch("http://localhost:5000/api/runTestwithDataset", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const result = await response.json();
          console.log("Run test response:", result);

          if (response.ok) {
            // alert(result.message || "✅ Test executed successfully");
            console.log("✅ Test executed successfully:", result.message);

          } else {
            alert("❌ Failed to run test: " + result.error);
          }
        }

      } else {
        alert("Please select a test or checkboxes to run.");
      }

      // Optionally close EventSource after some time
      setTimeout(() => {
        eventSource.close();
        console.log("SSE connection closed after test.");
      }, 20000); // close after 20 seconds
    } catch (error) {
      console.error("Error while running test:", error);
      alert("❌ Error triggering test run");
    }
    setIsRunning(false); // Reset running state after operation
  };
  const fetchReport = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/report");
      const data = await res.json();

      if (res.ok) {
        navigate("/report", { state: { reportData: data } });
      } else {
        console.error(data.error);
        alert("Failed to fetch report data.");
      }
    } catch (err) {
      console.error("Error fetching report:", err);
      alert("An error occurred while fetching the report.");
    }
  };
  const handleExecutionHistoryClick = async () => {
    // Fetch and display execution history
    try {
      const res = await fetch("http://localhost:5000/api/reportStatus");
      const data = await res.json();

      if (res.ok) {
        console.log(data);
        navigate("/execution-history", { state: { reportData: data } });
      } else {
        console.error(data.error);
        alert("Failed to fetch total executions data.");
      }
    } catch (err) {
      console.error("Error fetching total executions:", err);
      alert("An error occurred while fetching total executions.");
    }
  };
  const handleRecordClick = async () => {
    // Logic to start or stop recording
    if (!activeProject && !selectedTest) {
      alert("No active project or test selected for recording.");
      return;
    }
    if (isRecording) {
      alert("Recording is already in progress.");
      return;
    }
    const projectName = selectedTest?.project || activeProject;
    const testName = selectedTest?.name;
    const appendSteps = window.confirm("Do you want to append steps to the existing test?");
    const url = prompt(`Enter URL for project- ${projectName} & test- ${testName}`);
    if (!testName) {
      alert("Recording cancelled. No test name provided.");
      return;
    }


    setIsRecording(true); // Set running state to true

    try {
      // Send data to the backend
      console.log("Starting recording for project:", projectName, " & test:", testName, "at URL:", url);
      const response = await fetch('http://localhost:5000/api/start_recorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          {
            url,
            projectName,
            testName,
            appendSteps  // To append: true, otherwise false
          }
        ),
      });

      const result = await response.json();
      console.log("Recording response:", result);
      if (response.ok) {
        alert("Recording completed successfully!");
      } else {
        alert(`Failed to start recording: ${result.message}`);
      }
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("An error occurred while starting the recording.");
    } finally {
      setIsRecording(false); // Reset running state
    }
  };
  const handleStopClick = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/terminate", {
        method: "POST",
      });

      if (response.ok) {
        alert("Process terminated successfully.");
      } else {
        const result = await response.json();
        alert("❌ Failed to terminate process: " + result.error);
      }
    } catch (error) {
      console.error("Error terminating process:", error);
      alert("❌ Error while terminating process");
    }
  }
  const handleDebugClick = async () => {
    if (selectedTestsForRun && selectedTestsForRun.length > 0) {
      setIsDebugging(true);
      if (!activeProject) {
        alert("No active project selected for suite run.");
        return;
      }
      const payload = {
        project: activeProject,
        tests: selectedTestsForRun,
      };

      const response = await fetch("http://localhost:5000/api/debugSuite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log("Debug suite response:", result);

      if (response.ok) {
        alert(result.message || "✅ Suite executed successfully");
        if (result.reportPath) {
          window.open(result.reportPath, "_blank");
        }
      } else {
        alert("❌ Failed to debug suite: " + result.error);
      }
      setIsDebugging(false);

    } else if (selectedTest?.project && selectedTest?.name) {

      setIsDebugging(true);
      if (!activeProject && !selectedTest) {
        alert("No active project or test selected for debugging.");
        return;
      }
      console.log(isDebugging);
      try {
        const payload = {
          project: selectedTest.project,
          testName: selectedTest.name,
          steps: testSteps,
        };

        fetch("http://localhost:5000/api/debugTest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
          .then((response) => response.json())
          .then((result) => {
            console.log("Debug test response:", result);
            if (result.message) {
              alert(result.message);
            } else if (result.error) {
              alert("❌ Failed to debug test: " + result.error);
            }
          });
      }
      catch (error) {
        console.error("Error while running test:", error);
        alert("❌ Error triggering test run");
      }
      setIsDebugging(false);
    } else {
      alert("Please select a test or checkboxes to run.");
      return;
    }
    
  }
  return (
    <div className={styles.header}>
      <div className={styles.controls}>
        <button
          className={styles.runButton}
          onClick={handleRunClick}
          disabled={isRunning || isDebugging}
          title={isRunning ? "Test is running..." : "Run Test"}
        >

          {isRunning ? <FaPause /> : <FaPlay />}
        </button>
        <button className={styles.stopButton}
          disabled={!isRunning && !isDebugging}
          onClick={() => {
            handleStopClick();
            setIsRunning(false); // Reset running state
            setIsDebugging(false);
          }}>
          <FaStop />
        </button>
        <button
          className={styles.debugButton}
          onClick={handleDebugClick}
          disabled={isDebugging || isRunning}
          title="Debug Test"
        >
          <FaBug />
        </button>
      </div>
      <div className={styles.topRightButtons}>

        {/* <button
          className={styles.linkButton}
          onClick={() => setIsTerminalOpen(true)}
        >
          📟 Live Terminal
        </button> */}
        {/* <button
          className={styles.linkButton}
          onClick={handleExecutionHistoryClick}
        >
          📈 Execution History
        </button> */}
        <button
          className={styles.linkButton}
          onClick={fetchReport}
        >
          📊 Reports
        </button>
        <button
          className={styles.linkButton}
          title="Custom Keywords & Functions"
          onClick={() => navigate("/keywords")}
        >
          <FaKey />
        </button>
        <button
          className={styles.linkButton}
          title="Variables & Tags"
          onClick={() => navigate("/variables")}
        >
          <FaDollarSign />
        </button>
        {isRecording ? (
          <button className={styles.linkButton} onClick={() => setIsRecording(false)}>
            <FaVideoSlash className={styles.recordIcon} />
          </button>
        ) : (
          <button className={styles.linkButton} onClick={handleRecordClick}>
            <FaVideo className={styles.recordIcon} />
          </button>
        )}

      </div>
    </div>
  );
}