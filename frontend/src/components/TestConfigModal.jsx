import React, { useState, useEffect } from "react";
import styles from "./css/TestConfigModal.module.css";

export default function TestConfigModal({
  isOpen,
  onClose,
  project,
  test,
  config,
}) {
  const [browser, setBrowser] = useState("chromium");
  const [workers, setWorkers] = useState(1);
  const [repeatEach, setRepeatEach] = useState(1);
  const [timeoutForTest, setTimeoutForTest] = useState(1);
  const [recording, setRecording] = useState(false);
  const [screenshot, setScreenshot] = useState(false);
  const [headless, setHeadless] = useState(true);

  useEffect(() => {
    if (config) {
      setBrowser(config.browser || "chromium");
      setWorkers(config.workers || 1);
      setRepeatEach(config.repeatEach || 1);
      setTimeoutForTest(config.timeoutForTest || 300000);
      setRecording(config.recording || false);
      setScreenshot(config.screenshot || false);
      setHeadless(config.headless !== false); // default to true if undefined
    }
  }, [config, isOpen]);

  const handleSave = async () => {
    const config = {
      browser,
      workers: Number(workers) || 1, // fallback to 1 if empty
      repeatEach: Number(repeatEach) || 1, // fallback to 1 if empty
      timeoutForTest: Number(timeoutForTest) || 300000, // default to 5 minutes
      recording,
      screenshot,
      headless,
    };
    if(!test){
      try {
        await fetch("http://localhost:5000/api/saveSuiteConfig", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project,
            config,
          }),
        });
  
        console.log("✅ Configuration saved:", project, config);
        onClose();
      } catch (err) {
        console.error("❌ Failed to save configuration", err);
        alert("Failed to save configuration");
      }
    }else{
      try {
        await fetch("http://localhost:5000/api/saveTestConfig", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project,
            test,
            config,
          }),
        });
  
        console.log("✅ Configuration saved:", project, test, config);
        onClose();
      } catch (err) {
        console.error("❌ Failed to save configuration", err);
        alert("Failed to save configuration");
      }
    }
    
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h3>Configure Test: {test}</h3>

        <label>Browser:
        <select value={browser} onChange={(e) => setBrowser(e.target.value)}>
          <option value="chromium">Chromium</option>
          <option value="firefox">Firefox</option>
          <option value="webkit">Webkit</option>
        </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={headless}
            onChange={(e) => setHeadless(e.target.checked)}
          />
          Run in Headless Mode
        </label>
        <label>Workers:
          <input
            type="number"
            value={workers}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "") {
                setWorkers(""); // allow clearing input
              } else {
                const parsed = parseInt(val);
                if (!isNaN(parsed)) setWorkers(parsed);
              }
            }}
          />
        </label>
        <label>Repeat Each:
          <input
            type="number"
            value={repeatEach}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "") {
                setRepeatEach(""); // allow clearing input
              } else {
                const parsed = parseInt(val);
                if (!isNaN(parsed)) setRepeatEach(parsed);
              }
            }}
          />
        </label>
        <label>Timeout for Test in Milliseconds:
          <input
            type="number"
            value={timeoutForTest}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "") {
                setTimeoutForTest(""); // allow clearing input
              } else {
                const parsed = parseInt(val);
                if (!isNaN(parsed)) setTimeoutForTest(parsed);
              }
            }}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={recording}
            onChange={(e) => setRecording(e.target.checked)}
          />
          Enable Recording
        </label>

        <label>
          <input
            type="checkbox"
            checked={screenshot}
            onChange={(e) => setScreenshot(e.target.checked)}
          />
          Capture Screenshot
        </label>

        <div className={styles.buttonGroup}>
          <button onClick={handleSave}>💾 Save</button>
          <button onClick={onClose}>❌ Cancel</button>
        </div>
      </div>
    </div>
  );
}
