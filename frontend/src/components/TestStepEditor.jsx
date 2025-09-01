import React, { useEffect } from "react";
import { FaTrash, FaPlus, FaSave, FaFileImport, FaCopy, FaGripVertical, FaDatabase } from "react-icons/fa";
import styles from "./css/TestStepEditor.module.css";
import actionOptionsData from "../constants/actionOptions";
import customActionOptions from "../constants/customActionOptions";
import { useNavigate } from "react-router-dom";

const { actionOptions, execute } = actionOptionsData;
const mergedActionOptions = [...actionOptions, ...customActionOptions];
export default function TestStepEditor({ selectedTest, testSteps, setTestSteps }) {
  const { name, project, steps } = selectedTest;
  // const [testSteps, setTestSteps] = useState([]);
  const navigate = useNavigate();
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
  const handleDatasetClick = (project, test) => async () => {
    if (!project || !test) {
      alert("❌ Please select a project and test first.");
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/checkDatasetSelected?project=${project}&test=${test}`);
      const data = await res.json();

      if (res.ok && data?.datasetSelected === '') {
        // No dataset selected, ask user what they want to do
        const userChoice = window.confirm(
          "No dataset is currently selected for this test.\n\n" +
          "Click 'OK' to create a new dataset.\n" +
          "Click 'Cancel' to select an existing dataset."
        );

        if (userChoice) {
          // User chose to create a new dataset
          const datasetName = prompt("Enter a name for the new dataset:", `${test}_dataset.json`);

          if (!datasetName) return; // User cancelled the prompt

          try {
            const createResponse = await fetch(`http://localhost:5000/api/createDataset`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                project,
                test,
                datasetName,
                initialData: {} // Empty dataset to start with
              })
            });

            const createResult = await createResponse.json();

            if (createResponse.ok) {
              // Store dataset in sessionStorage to access it in the modal route
              sessionStorage.setItem('datasetModalContent', JSON.stringify({
                project,
                test,
                dataset: {}
              }));
              // Navigate to dataset modal route to edit the new dataset
              navigate('/dataset-modal');
              return;
            } else {
              alert(`❌ Failed to create dataset: ${createResult.error}`);
              return;
            }
          } catch (err) {
            console.error(err);
            alert("❌ Error creating dataset");
            return;
          }
        } else {
          return; // User cancelled the operation
        }
      }
    } catch (error) {
      console.error("Error checking dataset selection:", error);
    }
    try {
      const response = await fetch(`http://localhost:5000/api/getDataset?project=${project}&test=${test}`);
      const data = await response.json();
      if (response.ok) {
        const dataset = data.dataset || {};
        // Store dataset in sessionStorage to access it in the modal route
        sessionStorage.setItem('datasetModalContent', JSON.stringify({
          project,
          test,
          dataset
        }));
        // Navigate to dataset modal route
        navigate('/dataset-modal');
      } else {
        alert("❌ Failed to fetch dataset: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error fetching dataset");
    }
  }
  return (
    <div className={styles.testStepEditorContainer}>
      <h3 className={styles.testStepHeader}>
        Test Steps for Project :{" "}
        <span className={styles.prName}>{selectedTest.project}</span> and test :{" "}
        <span className={styles.prName}>{selectedTest.name}</span>
      </h3>
      <button
        className={styles.datasetButton}
        onClick={handleDatasetClick(project, name)}
        title="Open Dataset"
      >
        <FaDatabase className="text-green-400 w-4 h-4" />
      </button>
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
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={(step.execute ?? 'Y').toUpperCase() === 'Y'}
                      onChange={(e) => {
                        const newSteps = [...testSteps];
                        newSteps[idx].execute = e.target.checked ? 'Y' : 'N';
                        setTestSteps(newSteps);
                      }}
                      aria-label="Execute Step"
                    />

                    <span className={styles.checkboxText}>
                      {((step.execute ?? 'Y').toUpperCase() === 'Y') ? 'Run' : "Skip"}

                    </span>
                  </label>

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
