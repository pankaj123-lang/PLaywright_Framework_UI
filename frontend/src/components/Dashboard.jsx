import React, { useState } from 'react';
import Sidebar from './Sidebars'; // Adjust the import paths as needed
import Header from './Header';
import TestStepEditor from './TestStepEditor';
import Terminal from './Terminal';
import TestConfigModal from './TestConfigModal';
import styles from './Dashboard.module.css'; // Assuming styles are in a CSS module

function Dashboard({
  selectedTest,
  setSelectedTest,
  setConfigModal,
  configModal = { isOpen: false, project: null, test: null, config: null }, // Default value
  selectedTestsForRun,
  setSelectedTestsForRun,
  activeProject,
  setActiveProject,
  setIsTerminalOpen,
  isTerminalOpen,
  terminalLogs,
  setTerminalLogs,
}) {
  const [isOpen, setIsOpen] = useState(false); // Initialize state

  return (
    <div className={styles.container}>
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
      <div className={styles.main}>
        <Header
          setIsTerminalOpen={setIsTerminalOpen}
          selectedTest={selectedTest}
          selectedTestsForRun={selectedTestsForRun}
          activeProject={activeProject}
          setTerminalLogs={setTerminalLogs}
        />
        <TestStepEditor selectedTest={selectedTest} />
        {isTerminalOpen && (
          <Terminal
            selectedTest={selectedTest}
            setIsTerminalOpen={setIsTerminalOpen}
            terminalLogs={terminalLogs}
            setTerminalLogs={setTerminalLogs}
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

export default Dashboard;