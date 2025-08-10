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
  const [isExecutionResultsOpen, setIsExecutionResultsOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [selectedTestsForRun, setSelectedTestsForRun] = useState([]);
  const [activeProject, setActiveProject] = useState(null);

  const [configModal, setConfigModal] = useState({
    isOpen: false,
    project: "",
    test: "",
  });

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
// import React from 'react';
// import Dashboard from "./components/Dashboard.jsx";
// import { useState } from 'react';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import ExecutionHistory from "./components/ExecutionHistory.jsx";
// import styles from "./App.module.css"; // Assuming styles are in a CSS module
// function App() {
//   const [selectedTest, setSelectedTest] = useState("");
//   const [isTerminalOpen, setIsTerminalOpen] = useState(false);
//   const [isExecutionResultsOpen, setIsExecutionResultsOpen] = useState(false);
//   const [isReportsOpen, setIsReportsOpen] = useState(false);
//   const [terminalLogs, setTerminalLogs] = useState([]);
//   const [selectedTestsForRun, setSelectedTestsForRun] = useState([]);
//   const [activeProject, setActiveProject] = useState(null);

//   const [configModal, setConfigModal] = useState({
//     isOpen: false,
//     project: "",
//     test: "",
//   });
//   return (
//     <Router>
//       <div className={styles.container}>
//         <Routes>
//           {/* Route for the root path */}
//           <Route path="/" element={<Dashboard />} />

//           {/* Route for the dashboard */}
//           <Route path="/dashboard" element={<Dashboard
//             selectedTest={selectedTest}
//             setSelectedTest={setSelectedTest}
//             configModal={{ isOpen: false, project: null, test: null, config: null }}
//             setConfigModal={setConfigModal}
//             selectedTestsForRun={selectedTestsForRun}
//             setSelectedTestsForRun={setSelectedTestsForRun}
//             activeProject={activeProject}
//             setActiveProject={setActiveProject}
//             setIsTerminalOpen={setIsTerminalOpen}
//             isTerminalOpen={isTerminalOpen}
//             terminalLogs={terminalLogs}
//             setTerminalLogs={setTerminalLogs}
//           />} />

//           {/* Route for the execution history */}
//           <Route path="/execution-history" element={<ExecutionHistory />} />
//         </Routes>
//       </div>
//     </Router>

//   );
// }

// export default App;