import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaPlus, FaSave, FaFileImport, FaCopy, FaGripVertical } from "react-icons/fa";
import styles from "./css/TestStepEditor.module.css";
import actionOptionsData from "../constants/actionOptions"; 
import customActionOptions from "../constants/customActionOptions";
const { actionOptions, execute } = actionOptionsData;
const mergedActionOptions = [...actionOptions, ...customActionOptions];
export default function TestStepEditor({ selectedTest }) {
  const { name, project, steps } = selectedTest;
  const [folders, setFolders] = useState({}); // Local state for folders  
  const [testSteps, setTestSteps] = useState([]);

  useEffect(() => {
    setTestSteps(Array.isArray(steps) ? steps : []);
  }, [steps]);
  if (!testSteps.length && !selectedTest) {
    return (
      <div className={styles.testStepEditorContainerBlank}>
        <h4 className={styles.testStepHeader}>
          Welcome to Automation Dashboard!
        </h4>
        <p className={styles.paraText}>Please select an existing test, or create a new one to start automating your workflow.</p>
        <p className={styles.paraText}>All of your test steps will be displayed here for easy review and editing.</p>
        <p className={styles.paraText}>Run yur tests, monitor execution history, test results, and detailed step-by-step execution reports.</p>
        <p className={styles.paraText}>If you are new here, click the <b>"Create Project"</b> button from left sidebar to begin building your first test suite.</p>
      </div>
    )
  }
  const handleSaveSteps = async () => {
    if (!selectedTest?.project || !selectedTest?.name) {
      alert("❌ Please Create Project and test first before saving steps.");
      return;
    }
    try {
      const response = await fetch("http://localhost:5000/api/saveTestSteps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project: selectedTest.project,
          test: selectedTest.name,
          steps: testSteps,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("✅ Steps saved!");
        fetchTestSteps(selectedTest.project, selectedTest.name); // ⬅️ Fetch updated steps
      } else {
        alert("❌ Failed to save: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error saving steps");
    }
  };
  const fetchTestSteps = async (project, test) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/testSteps?project=${project}&test=${test}`
      );
      const data = await res.json();

      if (res.ok && data?.steps) {
        setTestSteps(data.steps);
      } else {
        setTestSteps([]);
      }
    } catch (err) {
      console.error("❌ Failed to fetch test steps:", err);
      setTestSteps([]);
    }
  };
  const handleImportSteps = async (e) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importedSteps = JSON.parse(text);
        if (Array.isArray(importedSteps)) {
          setTestSteps((prevSteps) => [...prevSteps, ...importedSteps]);
          alert("✅ Test steps imported successfully!");
        } else {
          alert("❌ Invalid JSON format. Expected an array of steps.");
        }
      } catch (err) {
        console.error("❌ Error importing steps:", err);
        alert("❌ Failed to import steps. Please check the file format.");
      }
    };
    input.click();
  }
  return (
    <div className={styles.testStepEditorContainer}>
      <h3 className={styles.testStepHeader}>
        Test Steps for Project :{" "}
        <span className={styles.prName}>{selectedTest.project}</span> and test :{" "}
        <span className={styles.prName}>{selectedTest.name}</span>
      </h3>
      <button
        className={styles.copyButton}
        onClick={() => {
          navigator.clipboard.writeText(
            JSON.stringify(testSteps, null, 2)
          );
          alert("✅ Test steps copied to clipboard!");
        }
        }
        title="Copy Test Steps"
      >
        <FaCopy className="text-green-400 w-4 h-4" />
      </button>
      <button
        className={styles.importButton}
        onClick={(e) => { handleImportSteps(e) }}

        title="Import Test Steps from json"
      >
        <FaFileImport className="text-green-400 w-4 h-4" />
      </button>
      <button
        className={styles.saveButton}
        onClick={() => handleSaveSteps()}
        title="Save Test Steps"
      >
        <FaSave className="text-green-400 w-4 h-4" />
      </button>
      <div className={styles.tableScrollWrapper}>
        <table className={styles.testStepTable}>
          <thead>
            <tr>
              <th></th>
              <th>Execute</th>
              <th>Action</th>
              <th>Selector</th>
              <th>Value</th>
              <th>Options or Role</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {testSteps.map((step, idx) => (
              <tr
                key={idx}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", idx)}
                onDragOver={(e) => e.preventDefault()} // Allow dropping
                onDrop={(e) => {
                  e.preventDefault();
                  const draggedIdx = parseInt(e.dataTransfer.getData("text/plain"), 10);
                  if (draggedIdx !== idx) {
                    const newSteps = [...testSteps];
                    const [draggedStep] = newSteps.splice(draggedIdx, 1); // Remove dragged step
                    newSteps.splice(idx, 0, draggedStep); // Insert at new position
                    setTestSteps(newSteps);
                  }
                }}
                style={{ cursor: "grab" }} // Change cursor to grab
                title="Drag to reorder" // Tooltip for accessibility
              >
                <td>
                  <FaGripVertical />
                </td>
                <td>
                  <input
                    className={styles.testStepInput}
                    value={step.execute}
                    placeholder="Execute"
                    list="execute"
                    onChange={(e) => {
                      const newSteps = [...testSteps];
                      newSteps[idx].execute = e.target.value;
                      setTestSteps(newSteps);
                    }}
                  />
                </td>
                <td>
                  <input
                    className={styles.testStepInput}
                    value={step.action}
                    placeholder="Action"
                    list="mergedActionOptions"
                    onChange={(e) => {
                      const newSteps = [...testSteps];
                      newSteps[idx].action = e.target.value;
                      setTestSteps(newSteps);
                    }}
                  />
                </td>
                <td>
                  <input
                    className={styles.testStepInput}
                    value={step.selector || ""}
                    placeholder="Selector"
                    onChange={(e) => {
                      const newSteps = [...testSteps];
                      newSteps[idx].selector = e.target.value;
                      setTestSteps(newSteps);
                    }}
                  />
                </td>
                <td>
                  <input
                    className={styles.testStepInput}
                    value={step.value || ""}
                    placeholder="Value"
                    type={/password/i.test(step.selector) ? "password" : "text"}
                    onChange={(e) => {
                      const newSteps = [...testSteps];
                      newSteps[idx].value = e.target.value;
                      setTestSteps(newSteps);
                    }}
                  />
                </td>
                <td>
                  <input
                    className={styles.testStepInput}
                    value={step.options || ""}
                    placeholder="Options or role"
                    onChange={(e) => {
                      const newSteps = [...testSteps];
                      newSteps[idx].options = e.target.value;
                      setTestSteps(newSteps);
                    }}
                  />
                </td>
                <td className={styles.actionButtons}>
                  <button
                    className={styles.deleteStepButton}
                    onClick={() => {
                      const newSteps = testSteps.filter((_, index) => index !== idx);
                      setTestSteps(newSteps);
                    }}
                    title="Delete Step"
                  >
                    <FaTrash className="text-red-400 w-4 h-4" />
                  </button>

                  <button
                    className={styles.addStepButton}
                    onClick={() => {
                      const newStep = { action: "", selector: "", value: "", options: "" };
                      const updatedSteps = [...testSteps];
                      updatedSteps.splice(idx + 1, 0, newStep); // Insert after current
                      setTestSteps(updatedSteps);
                    }}
                    title="Add Step"
                  >
                    <FaPlus className="text-green-400 w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          className={styles.addTestStepButton}
          onClick={() => {
            const newStep = { action: "", selector: "", value: "", options: "" };
            setTestSteps([...testSteps, newStep]);
          }}
          title="Add Step"
        >
          + Add Step
        </button>
        <datalist id="mergedActionOptions">
          {mergedActionOptions.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
        <datalist id="execute">
          {execute.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </div>
    </div>
  );
}
