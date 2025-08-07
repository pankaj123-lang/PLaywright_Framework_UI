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

export default function Header({
  setIsTerminalOpen,
  selectedTest,
  selectedTestsForRun,
  activeProject,
  setTerminalLogs,
}) {
  const [isRunning, setIsRunning] = useState(false);

  const navigate = useNavigate();

  const handleRunClick = async () => {
    try {
      // Ensure EventSource is connected before triggering backend
      const eventSource = new EventSource("http://localhost:5000/api/testLogs");
      setTerminalLogs([]); // clear terminal logs

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

        console.log("Running suite with payload:", payload);

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

        console.log("Running single test with payload:", payload);

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
        <button className={styles.stopButton}>⏹ Stop</button>
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
          onClick={() => navigate("/reports")}
        >
          📊 Reports
        </button>
      </div>
    </div>
  );
}