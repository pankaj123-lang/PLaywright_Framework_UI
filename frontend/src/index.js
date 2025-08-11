// import React from "react";
// import ReactDOM from "react-dom/client"; // ✅ use `react-dom/client`
// import App from "./App";
// import { BrowserRouter } from "react-router-dom";

// const root = ReactDOM.createRoot(document.getElementById("root"));
// root.render(
//   <BrowserRouter>
//     <App />
//     <Route path="/execution-history" element={<ExecutionHistoryPage />} />
//   </BrowserRouter>
// );

import React from "react";
import ReactDOM from "react-dom/client"; // ✅ use `react-dom/client`
import App from "./App";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ExecutionHistory from "./components/ExecutionHistory"; // Import the new page component
import ReportPage from "./components/ReportsPage"; // Import the report page component

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/execution-history" element={<ExecutionHistory />} />
      <Route path="/report" element={<ReportPage />} />
    </Routes>
  </BrowserRouter>
);

// import React from 'react';
// import ReactDOM from 'react-dom/client'; // Use 'react-dom/client' for React 18+
// import App from './App';

// const root = ReactDOM.createRoot(document.getElementById('root')); // Create a root
// root.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );