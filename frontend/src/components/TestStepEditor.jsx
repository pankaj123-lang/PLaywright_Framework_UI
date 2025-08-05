import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaPlus, FaSave } from "react-icons/fa";
import styles from "./TestStepEditor.module.css";
import actionOptions from "../constants/actionOptions";
export default function TestStepEditor({ selectedTest }) {
  const { name, project, steps } = selectedTest;

  const [testSteps, setTestSteps] = useState([]);

  // Update local state when a new test is selected
  useEffect(() => {
    setTestSteps(Array.isArray(steps) ? steps : []);
  }, [steps]);

  const handleSaveSteps = async () => {
    if (!selectedTest?.project || !selectedTest?.name) {
      alert("❌ Please select a test.");
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

  return (
    <div className={styles.testStepEditorContainer}>
      <h3 className={styles.testStepHeader}>
        Test Steps for Project :{" "}
        <span className="text-blue-400">{selectedTest.project}</span> and test :{" "}
        <span className="text-blue-400">{selectedTest.name}</span>
      </h3>
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
              <th>Action</th>
              <th>Selector</th>
              <th>Value</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {testSteps.map((step, idx) => (
              <tr key={idx}>
                <td>
                  <input
                    className={styles.testStepInput}
                    value={step.action}
                    placeholder="Action"
                    list="actionOptions" // This links to the datalist below
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
                    value={step.selector}
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
                    value={step.value}
                    placeholder="Value"
                    onChange={(e) => {
                      const newSteps = [...testSteps];
                      newSteps[idx].value = e.target.value;
                      setTestSteps(newSteps);
                    }}
                  />
                </td>
                <td className="text-right">
                  <button
                    className={styles.deleteStepButton}
                    onClick={() => {
                      const newSteps = testSteps.filter(
                        (_, index) => index !== idx
                      );
                      setTestSteps(newSteps);
                    }}
                    title="Delete Step"
                  >
                    <FaTrash className="text-red-400 w-4 h-4" />
                  </button>

                  <button
                    className={styles.addStepButton}
                    onClick={() => {
                      const newStep = { action: "", selector: "", value: "" };
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
            const newStep = { action: "", selector: "", value: "" };
            setTestSteps([...testSteps, newStep]);
          }}
          title="Add Step"
        >
          + Add Step
        </button>
        <datalist id="actionOptions">
          {actionOptions.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </div>
    </div>
  );
}
