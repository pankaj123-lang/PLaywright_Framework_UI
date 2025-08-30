import React, { useState, useEffect, useRef, use } from "react";
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
  // const [datasetIterations, setDatasetIterations] = useState(1);
  const [timeoutForTest, setTimeoutForTest] = useState(1);
  const [recording, setRecording] = useState(false);
  const [screenshot, setScreenshot] = useState(false);
  const [headless, setHeadless] = useState(true);

  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState("");
  const [datasetQuery, setDatasetQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [useDataset, setUseDataset] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (config) {
      setBrowser(config.browser || "chromium");
      setWorkers(config.workers || 1);
      setRepeatEach(config.repeatEach || 1);
      // setDatasetIterations(config.datasetIterations || 1);
      setTimeoutForTest(config.timeoutForTest || 300000);
      setRecording(config.recording || false);
      setScreenshot(config.screenshot || false);
      setHeadless(config.headless !== false); // default to true if undefined
      setSelectedDataset(config.dataset || "");
      setUseDataset(!!config.dataset);
      setDatasetQuery(config.dataset || "");
    }
  }, [config, isOpen]);

  const datasetInputRef = useRef(null);

  // Fetch available datasets
  useEffect(() => {
    if (isOpen) {
      const fetchDatasets = async () => {
        try {
          const response = await fetch("http://localhost:5000/api/datasets");
          if (response.ok) {
            const data = await response.json();
            setDatasets(data);
          } else {
            console.error("Failed to fetch datasets");
          }
        } catch (error) {
          console.error("Error fetching datasets:", error);
        }
      };

      fetchDatasets();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredDatasets = datasets.filter(dataset =>
    typeof dataset === 'string' && dataset.toLowerCase().includes(datasetQuery.toLowerCase())
  );
  const handleSave = async () => {
    if (useDataset && !selectedDataset) {
      alert("Please select a dataset file or uncheck the 'Use Dataset File' option.");
      return;
    }
    const config = {
      browser,
      workers: Number(workers) || 1, // fallback to 1 if empty
      repeatEach: Number(repeatEach) || 1, // fallback to 1 if empty
      timeoutForTest: Number(timeoutForTest) || 300000, // default to 5 minutes
      recording,
      screenshot,
      headless,
      dataset: selectedDataset,
      // datasetIterations: Number(datasetIterations) || 1, // fallback to 1 if empty
      useDataset,
    };
    if (!test) {
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
    } else {
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
        <h3 className={styles.headerText}>Configure Test: {test}</h3>

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

        {/* Dataset selector */}
        <div className={styles.datasetSelector} ref={dropdownRef}>
          <label>
            <input
              type="checkbox"
              checked={useDataset}
              onChange={(e) => {
                setUseDataset(e.target.checked);
                if (!e.target.checked) {
                  // Clear dataset selection if checkbox is unchecked
                  setSelectedDataset("");
                  setDatasetQuery("");
                } else if (e.target.checked && !selectedDataset) {
                  // If checking the box and no dataset is selected, focus the input
                  // Remove this problematic line:
                  // setTimeout(() => document.querySelector(`.${styles.datasetInput}`).focus(), 0);

                  // We'll use the ref instead (handled below)
                  if (datasetInputRef.current) {
                    datasetInputRef.current.focus();
                  }
                }
              }}
            /> Use Dataset File:

            <input
              ref={datasetInputRef} // Add this ref
              type="text"
              value={datasetQuery}
              onChange={(e) => {
                setDatasetQuery(e.target.value);
                setShowDropdown(true);
              }}
              // onFocus={() => setShowDropdown(true)}
              placeholder={useDataset ? "Search for dataset files (required)" : "Search for dataset files"}
              className={styles.datasetInput}
              required={useDataset}
            />
          </label>
          {showDropdown && (
            <div className={styles.dropdown}>
              {filteredDatasets.length > 0 ? (
                filteredDatasets.map((dataset, idx) => (
                  <div
                    key={idx}
                    className={styles.dropdownItem}
                    onClick={() => {
                      setSelectedDataset(dataset);
                      setDatasetQuery(dataset);
                      setShowDropdown(false);
                    }}
                  >
                    {dataset}
                  </div>
                ))
              ) : (
                <div className={styles.dropdownItem}>No datasets found</div>
              )}
            </div>
          )}
          {selectedDataset && (
            <div className={styles.selectedDataset}>
              Selected: <strong>{selectedDataset}</strong>
            </div>
          )}
        </div>
        {/* End Dataset selector */}
        {/* <label>Dataset Iterations:
          <input
            type="number"
            value={datasetIterations}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "") {
                setDatasetIterations(""); // allow clearing input
              } else {
                const parsed = parseInt(val);
                if (!isNaN(parsed)) setDatasetIterations(parsed);
              }
            }}
          />
        </label> */}
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
