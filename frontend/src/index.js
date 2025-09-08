
import React from "react";
import ReactDOM from "react-dom/client"; // ✅ use `react-dom/client`
import App from "./App";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ExecutionHistory from "./components/ExecutionHistory"; // Import the new page component
import ReportPage from "./components/ReportsPage"; // Import the report page component
import PassReportPage from "./components/PassReportPage"; // Import the pass report page component
import FailReportPage from "./components/FailReportPage"; // Import the fail report page component
import Keywords from "./components/Keywords"; // Import the keywords component
import Variables from "./components/Variables"; // Import the variables component
import TotalExecution from "./components/TotalExecution"; // Import the total execution component
import DatasetModal from './components/DatasetModal';
import UserGuide from "./components/UserGuide";
import CustomCodes from "./components/CustomCodes";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/execution-history" element={<ExecutionHistory />} />
      <Route path="/report" element={<ReportPage />} />
      <Route path="/pass-report" element={<PassReportPage />} />
      <Route path="/fail-report" element={<FailReportPage />} />
      <Route path="/keywords" element={<Keywords />} />
      <Route path="/variables" element={<Variables />} />
      <Route path="/total-report" element={<TotalExecution />} />
      <Route path="/dataset-modal" element={<DatasetModal />} />
      <Route path="/user-guide" element={<UserGuide />} />
      <Route path="/custom-codes" element={<CustomCodes />} />
    </Routes>
  </BrowserRouter>
);
