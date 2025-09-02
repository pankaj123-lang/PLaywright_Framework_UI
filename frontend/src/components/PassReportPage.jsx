
import { useLocation } from "react-router-dom";
import styles from "./css/TotalExecution.module.css";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
    FaFolder,
    FaChevronDown,
    FaChevronRight,
    FaHome,
    FaTrash,
    FaCheckCircle,
    FaAngleLeft,
} from "react-icons/fa";
// import PassReportPage from "./FailReportPage";

const PassReportPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const reportData = location.state?.reportData;

    const [reportFolder, setReportFolder] = useState({});
    const [filteredData, setFilteredData] = useState(reportData || {});

    const [selectedReports, setSelectedReports] = useState([]);

    useEffect(() => {
        if (reportData) {
            console.log("Report Data:", reportData); // Debugging
            setFilteredData(reportData);
        }
    }, [reportData]);

    const toggleFolder = (folderName) => {
        setReportFolder((prev) => ({
            ...prev,
            [folderName]: !prev[folderName],
        }));
    };

    // if (!reportData || Object.keys(filteredData).length === 0) {
    //     return <p className={styles.noHistory}>No execution history available.</p>;
    // }
    const handleReportDelete = async () => {
        const confirmDelete = window.confirm("Are you sure you want to delete the selected reports?");
        if (!confirmDelete) return;

        try {
            const response = await fetch("http://localhost:5000/api/deleteReport", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ folderPaths: selectedReports }), // Send selected file paths
            });

            const success = await response.json();
            if (success) {
                alert("Reports deleted successfully");
                setSelectedReports([]); // Clear selected reports

                // Reload the updated report data
                const updatedResponse = await fetch("http://localhost:5000/api/reportStatus");
                const updatedReportData = await updatedResponse.json();
                setFilteredData(updatedReportData); // Update the filtered data
            } else {
                console.error("Failed to delete reports");
            }
        } catch (error) {
            console.error("Error deleting reports:", error);
        }
    };
    const fetchReport = async () => {
        try {
            const res = await fetch("http://localhost:5000/api/report");
            const data = await res.json();

            if (res.ok) {
                navigate("/report", { state: { reportData: data } });
            } else {
                console.error(data.error);
                alert("Failed to fetch report data.");
            }
        } catch (err) {
            console.error("Error fetching report:", err);
            alert("An error occurred while fetching the report.");
        }
    };
    return (
        <div className={styles.executionHistoryContainer}>
            <div className={styles.executionHistoryHeader}>
                <FaAngleLeft className={styles.backButton}
                    onClick={fetchReport}
                />
                <h3 className={styles.executionHistoryTitle}>Total Pass Report</h3>
                <input
                    className={styles.searchHistory}
                    placeholder="Search Pass Reports..."
                    type="text"
                    onChange={(e) => {
                        const searchTerm = e.target.value.toLowerCase();
                        const filteredHistory = Object.fromEntries(
                            Object.entries(reportData).filter(([folder]) =>
                                folder.toLowerCase().includes(searchTerm)
                            )
                        );
                        console.log("Filtered Data:", filteredHistory); // Debugging
                        setFilteredData(filteredHistory);
                    }}
                />
                <FaTrash
                    className={styles.deleteHistoryButton}
                    onClick={handleReportDelete}
                />
                <FaHome
                    className={styles.homeButton}
                    onClick={() => (window.location.href = "/")}
                />
            </div>

            {Object.entries(filteredData).map(([folder, details]) => {
                const passedCount = details?.passed?.length || 0;
                const failedCount = details?.failed?.length || 0;
                const totalCount = passedCount + failedCount;

                return (
                    <div key={folder} className={styles.folderBlock}>
                        <div className={styles.folderHeader}>
                            <div
                                className={styles.folderToggle}
                                onClick={() => toggleFolder(folder)}
                            >
                                {reportFolder[folder] ? <FaChevronDown /> : <FaChevronRight />}
                                <FaFolder className={styles.folderIcon} />
                                <span>{folder}</span>
                                {!reportFolder[folder] && (
                                    <span className={styles.folderCount}>
                                        ({passedCount} reports)
                                    </span>
                                )}
                            </div>
                            {reportFolder[folder] ? (
                                <div
                                    className={styles.selectAllContainer}
                                    onClick={(e) => e.stopPropagation()} // Prevent folder toggle
                                >
                                    <input
                                        type="checkbox"
                                        className={styles.selectAllCheckbox}
                                        checked={
                                            // Only check passed reports since this is a pass report page
                                            details.passed && details.passed.length > 0 &&
                                            details.passed.every((filePath) => selectedReports.includes(filePath))
                                        }
                                        onChange={(e) => {
                                            e.stopPropagation(); // Prevent folder toggle
                                            if (e.target.checked) {
                                                // Select all PASSED reports in this folder only
                                                const passedFilePaths = details.passed || [];
                                                setSelectedReports((prev) => [...new Set([...prev, ...passedFilePaths])]);
                                            } else {
                                                // Deselect all PASSED reports in this folder only
                                                const passedFilePaths = details.passed || [];
                                                setSelectedReports((prev) => prev.filter((path) => !passedFilePaths.includes(path)));
                                            }
                                        }}
                                        disabled={!details.passed || details.passed.length === 0} // Disable if no passed reports
                                    />
                                    <span className={styles.selectAllText}>
                                        Select All
                                    </span>
                                </div>
                            ) : null}
                        </div>
                        {reportFolder[folder] && (
                            <div className={styles.folderContent}>
                                {totalCount > 0 ? (
                                    <div className={styles.folderDetails}>
                                        {[...(details.passed || [])
                                            .sort((a, b) => {
                                                // Extract timestamps or dates from filenames
                                                const fileNameA = a.split("/").pop();
                                                const fileNameB = b.split("/").pop();

                                                // Try to extract date patterns from filenames
                                                // This assumes files have dates in format YYYY-MM-DD or contain timestamps
                                                const dateRegex = /(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})|(\d{4}-\d{2}-\d{2})|(\d{14})/;
                                                const matchA = fileNameA.match(dateRegex);
                                                const matchB = fileNameB.match(dateRegex);

                                                // If both filenames have dates, compare them (descending order)
                                                if (matchA && matchB) {
                                                    return matchB[0].localeCompare(matchA[0]); // B compared to A for descending order
                                                }

                                                // If no dates found, sort by filename (recent files might have higher numbers)
                                                return fileNameB.localeCompare(fileNameA);
                                            }).map((filePath, index) => (
                                                <div
                                                    key={`passed-${index}`}
                                                    className={styles.reportItem}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className={styles.reportCheckbox}
                                                        value={filePath}
                                                        checked={selectedReports.includes(filePath)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedReports((prev) => [...prev, filePath]); // Add filePath to selectedReports
                                                            } else {
                                                                setSelectedReports((prev) => prev.filter((path) => path !== filePath)); // Remove filePath from selectedReports
                                                            }
                                                        }}
                                                    />
                                                    <a
                                                        href={`http://localhost:5000${filePath}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={styles.reportLink}
                                                        onClick={(event) => {
                                                            event.preventDefault();
                                                            window.open(
                                                                `http://localhost:5000${filePath}`,
                                                                "_blank"
                                                            );
                                                        }}
                                                    >
                                                        {filePath.split("/").pop()}
                                                    </a>
                                                    <span className={styles.passedStatus}>
                                                        <FaCheckCircle /> PASSED</span>
                                                </div>
                                            ))]}
                                    </div>
                                ) : (
                                    <p>No reports available for this folder.</p>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default PassReportPage;