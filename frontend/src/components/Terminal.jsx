import React, { useEffect, useRef } from "react";
import styles from "./Terminal.module.css";
import { FaEraser, FaTimes } from "react-icons/fa";

export default function Terminal({
  selectedTest,
  setIsTerminalOpen,
  terminalLogs,
  setTerminalLogs,
  activeProject,
}) {
  const logEndRef = useRef(null);

  useEffect(() => {
    if (!selectedTest) return;

    const eventSource = new EventSource("http://localhost:5000/api/testLogs");

    eventSource.onmessage = (event) => {
      console.log("📦 Log:", event.data);
      setTerminalLogs((prevLogs) => [...prevLogs, event.data]);
    };

    eventSource.onerror = (err) => {
      console.error("SSE error:", err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [selectedTest]); // Depend on selectedTest

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLogs]);

  return (
    <div className={styles.terminalContainer}>
      <div className={styles.terminalHeader}>
        <span className={styles.terminalTitle}>🖥 Terminal - Running: </span>
        <strong>{activeProject ? activeProject : selectedTest.name}</strong>
        <div class={styles.stickyButtonContainer}>
          <button
            className={styles.eraseButton}
            onClick={() => setTerminalLogs([])}
          >
            <FaEraser className="text-gray-400 w-4 h-4" />
          </button>
          <button
            className={styles.closeButton}
            onClick={() => setIsTerminalOpen(false)}
            title="Close Terminal"
          >
            <FaTimes className="text-red-400 w-4 h-4" />
          </button>
        </div>
      </div>
      <div className={styles.logOutput}>
        {terminalLogs.map((line, index) => (
          <div key={index} className={styles.logLine}>
            {line}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}
