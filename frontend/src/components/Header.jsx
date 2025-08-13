// import styles from "./Header.module.css"; // Make sure this file exists
// import { useNavigate } from "react-router-dom";
// import { useState } from "react";
// export default function Header({
//   setIsTerminalOpen,
//   selectedTest,
//   selectedTestsForRun,
//   activeProject,
//   setTerminalLogs,
// }) {
//   const [isRunning, setIsRunning] = useState(false);

//   const navigate = useNavigate();
//   const handleRunClick = async () => {
//     try {
//       // Ensure EventSource is connected before triggering backend
//       const eventSource = new EventSource("http://localhost:5000/api/testLogs");
//       setTerminalLogs([]); // clear terminal logs

//       eventSource.onmessage = (event) => {
//         console.log("SSE Log:", event.data);
//         setTerminalLogs((prevLogs) => [...prevLogs, event.data]);
//       };

//       eventSource.onerror = (err) => {
//         console.error("SSE error:", err);
//         eventSource.close();
//       };

//       // Rest of your logic
//       if (selectedTestsForRun && selectedTestsForRun.length > 0) {
//         if (!activeProject) {
//           alert("No active project selected for suite run.");
//           return;
//         }

//         const payload = {
//           project: activeProject,
//           tests: selectedTestsForRun,
//         };

//         console.log("Running suite with payload:", payload);

//         const response = await fetch("http://localhost:5000/api/runSuite", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(payload),
//         });

//         const result = await response.json();
//         console.log("Run suite response:", result);

//         if (response.ok) {
//           alert(result.message || "✅ Suite executed successfully");
//           if (result.reportPath) {
//             window.open(result.reportPath, "_blank");
//           }
//         } else {
//           alert("❌ Failed to run suite: " + result.error);
//         }
//       } else if (selectedTest?.project && selectedTest?.name) {
//         const payload = {
//           project: selectedTest.project,
//           testName: selectedTest.name,
//           steps: selectedTest.steps,
//         };

//         console.log("Running single test with payload:", payload);

//         const response = await fetch("http://localhost:5000/api/runTest", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(payload),
//         });

//         const result = await response.json();
//         console.log("Run test response:", result);

//         if (response.ok) {
//           alert(result.message || "✅ Test executed successfully");
//           // if (result.reportPath) {
//           //   window.open(result.reportPath, "_blank"); // ✅ Add this
//           // }
//         } else {
//           alert("❌ Failed to run test: " + result.error);
//         }
//       } else {
//         alert("Please select a test or checkboxes to run.");
//       }

//       // Optionally close EventSource after some time
//       setTimeout(() => {
//         eventSource.close();
//         console.log("SSE connection closed after test.");
//       }, 20000); // close after 20 seconds
//     } catch (error) {
//       console.error("Error while running test:", error);
//       alert("❌ Error triggering test run");
//     }
//   };
// const handleExecutionHistoryClick = () => {
//   const navigate = useNavigate();

//   // Fetch and display execution history
//   fetch("http://localhost:5000/api/executionHistory")
//     .then((response) => response.json())
//     .then((data) => {
//       // Navigate to a new page and pass the data
//       navigate("/execution-history", { state: { executionHistory: data } });
//     })
//     .catch((error) => {
//       console.error("Error fetching execution history:", error);
//       alert("❌ Error fetching execution history");
//     });
// };
//   return (
//     <div className={styles.header}>
//       <div className={styles.controls}>
//         <button
//           className={styles.runButton}
//           onClick={handleRunClick}
//           disabled={isRunning}
//         >
//           {isRunning ? "⏳ Running..." : "▶ Run"}
//         </button>
//         <button className={styles.stopButton}>⏹ Stop</button>
//       </div>
//       <div className={styles.topRightButtons}>
//         <button
//           className={styles.linkButton}
//           onClick={() => setIsTerminalOpen(true)}
//         >
//           📟 Live Terminal
//         </button>
//         <button
//           className={styles.linkButton}
//           onClick={() => {
//           handleExecutionHistoryClick(); // Ensure this function is defined
//           }}
//         >
//           📈 Execution History
//         </button>
//         <button
//           className={styles.linkButton}
//           onClick={() => navigate("/reports")}
//         >
//           📊 Reports
//         </button>
//       </div>
//     </div>
//   );
// }
import styles from "./Header.module.css"; // Make sure this file exists
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { FaCircle, FaViadeoSquare, FaVideo, FaVideoSlash } from "react-icons/fa";

export default function Header({
  setIsTerminalOpen,
  selectedTest,
  selectedTestsForRun,
  activeProject,
  setTerminalLogs,
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [isRecording, setIsRecording] = useState(false); // State to track recording status

  const navigate = useNavigate();

  const handleRunClick = async () => {
    try {
      setIsRunning(true); // Set running state to true
      setIsTerminalOpen(true); // Open terminal when running starts
      // Ensure EventSource is connected before triggering backend
      const eventSource = new EventSource("http://localhost:5000/api/testLogs");
      // setTerminalLogs([]); // clear terminal logs

      eventSource.onmessage = (event) => {
        console.log("SSE Log:", event.data);
        setTerminalLogs((prevLogs) => [...prevLogs, event.data]);
      };

      eventSource.onerror = (err) => {
        console.error("SSE error:", err);
        eventSource.close();
      };

      // Rest of your logic
      if (selectedTestsForRun && selectedTestsForRun.length > 0) {
        if (!activeProject) {
          alert("No active project selected for suite run.");
          return;
        }

        const payload = {
          project: activeProject,
          tests: selectedTestsForRun,
        };

        // console.log("Running suite with payload:", payload);

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
      } else if (selectedTest?.project && selectedTest?.name) {
        const payload = {
          project: selectedTest.project,
          testName: selectedTest.name,
          steps: selectedTest.steps,
        };

        // console.log("Running single test with payload:", payload);

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
          // if (result.reportPath) {
          //   window.open(result.reportPath, "_blank"); // ✅ Add this
          // }
        } else {
          alert("❌ Failed to run test: " + result.error);
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
  const handleExecutionHistoryClick = () => {
    // Fetch and display execution history
    fetch("http://localhost:5000/api/executionHistory")
      .then((response) => response.json())
      .then((data) => {
        // Navigate to a new page and pass the data
        navigate("/execution-history", { state: { executionHistory: data } });
      })
      .catch((error) => {
        console.error("Error fetching execution history:", error);
        alert("❌ Error fetching execution history");
      });
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
    const testName = selectedTest?.name ;
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
            testName
          }
        ),
      });

      const result = await response.json();
      console.log("Recording response:", result);
      if (response.ok) {
        alert("Recording started successfully!");
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
  return (
    <div className={styles.header}>
      <div className={styles.controls}>
        <button
          className={styles.runButton}
          onClick={handleRunClick}
          disabled={isRunning}
        >
          {isRunning ? "⏳ Running..." : "▶ Run"}
        </button>
        <button className={styles.stopButton}
          disabled={!isRunning}
          onClick={() => {
            // Logic to stop the running test or suite
            alert("Stopping the current run is not implemented yet.");
            setIsRunning(false); // Reset running state
          }}>
          ⏹ Stop
        </button>
      </div>
      <div className={styles.topRightButtons}>
        <button
          className={styles.linkButton}
          onClick={() => setIsTerminalOpen(true)}
        >
          📟 Live Terminal
        </button>
        <button
          className={styles.linkButton}
          onClick={handleExecutionHistoryClick}
        >
          📈 Execution History
        </button>
        <button
          className={styles.linkButton}
          onClick={fetchReport}
        >
          📊 Reports
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