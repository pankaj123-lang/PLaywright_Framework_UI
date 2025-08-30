import React, { useState } from "react";
import Sidebar from "./components/Sidebars";
import TestStepEditor from "./components/TestStepEditor";
import Terminal from "./components/Terminal";
import styles from "./App.module.css";
import Header from "./components/Header";
import TestConfigModal from "./components/TestConfigModal";
export default function App() {
  const [selectedTest, setSelectedTest] = useState("");
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [selectedTestsForRun, setSelectedTestsForRun] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [testSteps, setTestSteps] = useState([]);
  const [configModal, setConfigModal] = useState({
    isOpen: false,
    project: "",
    test: "",
  });

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
      <Sidebar
        selectedTest={selectedTest}
        setSelectedTest={setSelectedTest}
        setConfigModal={setConfigModal}
        configModal={configModal}
        selectedTestsForRun={selectedTestsForRun}
        setSelectedTestsForRun={setSelectedTestsForRun}
        activeProject={activeProject}
        setActiveProject={setActiveProject}
      />
      </div>
      <div className={styles.main}>
        <Header
          setIsTerminalOpen={setIsTerminalOpen}
          selectedTest={selectedTest}
          selectedTestsForRun={selectedTestsForRun}
          activeProject={activeProject}
          setTerminalLogs={setTerminalLogs}
          testSteps={testSteps}
        />
        <TestStepEditor selectedTest={selectedTest}
        testSteps={testSteps}
        setTestSteps={setTestSteps}
        />
        {isTerminalOpen && (
          <Terminal
            selectedTest={selectedTest}
            setIsTerminalOpen={setIsTerminalOpen}
            terminalLogs={terminalLogs}
            setTerminalLogs={setTerminalLogs}
            activeProject={activeProject} // Pass activeProject to Terminal component
          />
        )}
        <TestConfigModal
          isOpen={configModal.isOpen}
          onClose={() => setConfigModal({ isOpen: false })}
          project={configModal.project}
          test={configModal.test}
          config={configModal.config}
        />
      </div>
    </div>
  );
}
