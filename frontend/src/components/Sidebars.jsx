import React, { useState } from "react";
import {
  FaFolder,
  FaChevronDown,
  FaChevronRight,
  FaTrash,
  FaPlus,
  FaCog,
  FaEdit,
  FaSearch,
  FaFile,
  FaJsfiddle,
  FaFileCode,
  FaRegClipboard,
  FaVideo,
} from "react-icons/fa";
import styles from "./Sidebar.module.css";
import { useEffect } from "react";
export default function Sidebar({
  selectedTest,
  setSelectedTest,
  setConfigModal,
  configModal,
  selectedTestsForRun,
  setSelectedTestsForRun,
  activeProject,
  setActiveProject,
}) {
  const [folders, setFolders] = useState({});
  const [filteredFolders, setFilteredFolders] = useState(folders);
  // const [selectedTestsForRun, setSelectedTestsForRun] = useState([]);
  // const [activeProject, setActiveProject] = useState(null);
  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/folders");
        const data = await res.json();
        setFolders(data);
        setFilteredFolders(data);
      } catch (err) {
        console.error("Failed to fetch folders:", err);
      }
    };

    fetchFolders();
  }, []);
  const toggleFolder = (folderName) => {
    setFolders((prev) => ({
      ...prev,
      [folderName]: {
        ...prev[folderName],
        open: !prev[folderName].open,
      },
    }));
    setFilteredFolders((prev) => ({
      ...prev,
      [folderName]: {
        ...prev[folderName],
        open: !prev[folderName].open,
      },
    }));
  };

  const toggleTestCheckbox = (testName, projectName) => {
    if (activeProject && activeProject !== projectName) return;

    setSelectedTestsForRun((prev) => {
      const isSelected = prev.includes(testName);
      const updated = isSelected
        ? prev.filter((t) => t !== testName)
        : [...prev, testName];

      // Clear activeProject if no checkboxes left selected
      if (updated.length === 0) {
        setActiveProject(null);
      } else {
        setActiveProject(projectName);
      }

      return updated;
    });
  };

  const handleTestClick = async (testName, projectName) => {
    if (!selectedTestsForRun.includes(testName)) {
      try {
        const res = await fetch(
          `http://localhost:5000/api/testSteps?project=${projectName}&test=${testName}`
        );
        const data = await res.json();

        setSelectedTest({
          name: testName,
          project: projectName,
          steps: data.steps || [],
        });
      } catch (error) {
        console.error("Failed to fetch test steps:", error);
      }
    }
  };

  const handleCreateProject = async () => {
    const newProjectName = prompt("Enter new project name:");
    if (!newProjectName || folders[newProjectName]) return;

    try {
      const res = await fetch("http://localhost:5000/api/createProject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectName: newProjectName }),
      });

      const data = await res.json();
      if (res.ok) {
        setFolders((prev) => ({
          ...prev,
          [newProjectName.replace(/\s+/g, "_")]: {
            open: true,
            tests: [],
          },
        }));
      } else {
        alert("❌ Failed to create project: " + data.error);
      }
    } catch (error) {
      console.error("🚨 Error creating project:", error);
      alert("🚨 Error connecting to server.");
    }
  };

  const handleCreateTest = async (projectName) => {
    const testName = prompt(`Enter new test name for ${projectName}:`).replace(
      /\s+/g,
      "_"
    );
    if (!testName || folders[projectName].tests.includes(testName)) return;

    try {
      const res = await fetch("http://localhost:5000/api/createTest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectName, testName }),
      });

      const data = await res.json();

      if (res.ok) {
        setFolders((prev) => ({
          ...prev,
          [projectName]: {
            ...prev[projectName],
            tests: [...prev[projectName].tests, testName],
          },
        }));
      } else {
        alert("❌ Failed to create test: " + data.error);
      }
    } catch (err) {
      console.error("🚨 Error creating test:", err);
      alert("🚨 Server error while creating test.");
    }
  };

  const handleDeleteTest = async (folderName, testName) => {
    const confirmed = window.confirm(
      `🗑️ Are you sure you want to delete "${testName}"?`
    );
    if (!confirmed) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/deleteTest?project=${folderName}&test=${testName}`,
        { method: "DELETE" }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete test");
      }

      // Remove test from local state
      setFolders((prev) => {
        const updatedTests = prev[folderName].tests.filter(
          (t) => t !== testName
        );
        return {
          ...prev,
          [folderName]: {
            ...prev[folderName],
            tests: updatedTests,
          },
        };
      });

      // Optional: Clear selected test if it was deleted
      if (
        selectedTest?.name === testName &&
        selectedTest?.project === folderName
      ) {
        setSelectedTest(null);
      }

      alert(`✅ Test "${testName}" deleted successfully.`);
    } catch (err) {
      console.error("Error deleting test:", err);
      alert(`❌ Failed to delete test: ${err.message}`);
    }
  };
  const handleDeleteFolder = async (folderName) => {
    const confirmed = window.confirm(
      `🗑️ Are you sure you want to delete the folder "${folderName}"?`
    );
    if (!confirmed) return;
    try {
      const response = await fetch(
        `http://localhost:5000/api/deleteFolder?folder=${folderName}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete folder");
      }

      // Remove folder from local state
      setFolders((prev) => {
        const { [folderName]: _, ...remainingFolders } = prev;
        return remainingFolders;
      });

      // Clear active project if it was deleted
      if (activeProject === folderName) {
        setActiveProject(null);
      }

      alert(`✅ Folder "${folderName}" deleted successfully.`);
    } catch (err) {
      console.error("Error deleting folder:", err);
      alert(`❌ Failed to delete folder: ${err.message}`);
    }
  };
  const handleConfigureTest = async (folderName, testName) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/getTestConfig?project=${folderName}&test=${testName}`
      );
      const data = await res.json();

      setConfigModal({
        isOpen: true,
        project: folderName,
        test: testName,
        config: res.ok ? data.config : null, // 👈 Pre-fill config
      });
    } catch (err) {
      console.error("Failed to fetch config:", err);
      setConfigModal({
        isOpen: true,
        project: folderName,
        test: testName,
        config: null,
      });
    }
  };
  const handleRenameProject = async (folderName) => {
    if (!folderName) return;
    const newName = prompt("Enter new project name:", folderName);
    if (!newName || newName === folderName || folders[newName]) return;
    try {
      const res = await fetch("http://localhost:5000/api/renameProject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ oldName: folderName, newName }),
      });

      const data = await res.json();
      if (res.ok) {
        setFolders((prev) => {
          const { [folderName]: oldFolder, ...rest } = prev;
          return {
            ...rest,
            [newName.replace(/\s+/g, "_")]: {
              ...oldFolder,
              open: true,
            },
          };
        });
        alert(`✅ Project renamed to "${newName}"`);
      } else {
        alert("❌ Failed to rename project: " + data.error);
      }
    } catch (err) {
      console.error("🚨 Error renaming project:", err);
      alert("🚨 Server error while renaming project.");
    }
  }
  const [searchQuery, setSearchQuery] = useState("");
  
  const handleSearch = (query) => {
    // setOriginalFolders(folders);
    query = query.toLowerCase();
    setSearchQuery(query);
    if (!query) {
      // Reset to original folders when the search query is cleared
      setFilteredFolders(folders);
      return;
    }
    // Filter tests based on search query
    const filtered = Object.entries(folders).reduce((acc, [folderName, folder]) => {
      const filteredTests = folder.tests.filter(test =>
        test.toLowerCase().includes(query)
      );
      if (filteredTests.length > 0 || folder.open) {
        acc[folderName] = { ...folder, tests: filteredTests };
      }
      return acc;
    }, {});
    setFilteredFolders(filtered);
  }
  return (
    <div className={styles.sidebarContainer}>
      <div className={styles.stickyTop}>
        <div className={styles.header}>
          <h2 className={styles.sidebarTitle}>Projects & Tests</h2>
          <button className={styles.createButton} onClick={handleCreateProject}>
            <FaPlus className="text-green-400 w-4 h-4" /> Create Project
          </button>
        </div>
        <div className={styles.searchContainer}>
          <input className={styles.searchInput}
            type="text"
            placeholder="Search tests..."
            value={searchQuery}
            onChange={(e) => {
              handleSearch(e.target.value);
            }} />
          
        </div>
      </div>
      {Object.entries(filteredFolders).map(([folderName, { open, tests }]) => (
        <div key={folderName} className={styles.folderBlock}>
          <div className={styles.folderHeader}>
            <div
              className={styles.folderToggle}
              onClick={() => toggleFolder(folderName)}
            >
              {open ? <FaChevronDown /> : <FaChevronRight />}
              <FaFolder className={styles.folderIcon} />
              <span>{folderName}</span>
            </div>

            <button
              className={styles.createTestButton}
              onClick={() => handleCreateTest(folderName)}
              title={`Add test to ${folderName}`}
            >
              <FaPlus className="text-green-400 w-4 h-4" />
            </button>
            <button
              className={styles.deleteFolderButton}
              onClick={() => handleDeleteFolder(folderName)}
              title={`Delete project ${folderName}`}
            >
              <FaTrash className="text-red-400 w-4 h-4" />
            </button>
            {/* <button
            className={styles.editProjectButton}
            onClick={() => handleRenameProject(folderName)}
            title="Edit Project Name">
              <FaEdit className="text-blue-400 w-4 h-4" />
            </button> */}
          </div>
          {open && (
            <div className={styles.folderContent}>
              {tests.map((test) => (
                <div key={test} className={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    checked={selectedTestsForRun.includes(test)}
                    onChange={() => toggleTestCheckbox(test, folderName)}
                    disabled={
                      activeProject !== null && activeProject !== folderName
                    }
                    className={styles.checkbox}
                  />
                  <FaFileCode className={styles.testIcon} />
                  <span
                    className={styles.testCaseLabel}
                    onClick={() => handleTestClick(test, folderName)}
                  >
                    {test}
                  </span>
                  <button
                    className={styles.deleteTestButton}
                    onClick={() => handleDeleteTest(folderName, test)}
                    title={`Delete test ${test}`}
                  >
                    <FaTrash className="text-red-400 w-4 h-4" />
                  </button>
                  <button
                    className={styles.configureTestButton}
                    onClick={() => handleConfigureTest(folderName, test)}
                    title={`Configure test ${test}`}
                  >
                    <FaCog className="text-blue-400 w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
