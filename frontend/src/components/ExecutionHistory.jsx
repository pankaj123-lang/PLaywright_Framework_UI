import { useLocation } from "react-router-dom";
import styles from "./css/ExecutionHistory.module.css"; // Adjust the path as necessary
import React, { useState } from "react";
import {
    FaFolder,
    FaChevronDown,
    FaChevronRight,
    FaHome,
    FaTrash,
} from "react-icons/fa";

const ExecutionHistory = () => {
    const [reportFolder, setReportFolder] = useState({});
    const toggleFolder = (folderName) => {
        setReportFolder((prev) => ({
            ...prev,
            [folderName]: !prev[folderName], // Toggle open state
        }));
    };

    const location = useLocation();
    const executionHistory = location.state?.executionHistory;

    if (!executionHistory) {
        return <p>No execution history available.</p>;
    }

    return (
        <div className={styles.executionHistoryContainer}>
            <div className={styles.executionHistoryHeader}>
                <h3 className={styles.executionHistoryTitle}>Execution History</h3>
                <input
                    className={styles.searchHistory}
                    placeholder="Search execution suite history..."
                    type="text"
                    onChange={(e) => {
                        const searchTerm = e.target.value.toLowerCase(); // Convert input to lowercase
                        const filteredHistory = Object.fromEntries(
                            Object.entries(executionHistory).filter(([folder]) =>
                                folder.toLowerCase().includes(searchTerm) // Check if folder name includes the search term
                            )
                        );
                        setReportFolder(filteredHistory); // Update state with filtered results
                    }}
                />
                <FaTrash
                    className={styles.deleteHistoryButton}
                    onClick={() => {
                        if (window.confirm("Are you sure you want to delete the execution history?")) {
                            setReportFolder({}); // Clear the history
                            alert("Execution history deleted.");
                        }
                    }}
                />
                <FaHome
                    className={styles.homeButton}
                    onClick={() => window.location.href = "/"} // Redirect to home
                />
            </div>

            {Object.entries(executionHistory).map(([folder, details]) => (
                <div key={folder} className={styles.folderBlock}>
                    <div className={styles.folderHeader}>
                        <div
                            className={styles.folderToggle}
                            onClick={() => toggleFolder(folder)}
                        >
                            {reportFolder[folder] ? <FaChevronDown /> : <FaChevronRight />}
                            <FaFolder className={styles.folderIcon} />
                            <span>{folder}</span>
                        </div>
                    </div>
                    {reportFolder[folder] && (
                        <div className={styles.folderContent}>

                            {details?.report?.length > 0 ? (
                                <pre className={styles.folderDetails}>
                                    {details.report.map((filePath, index) => (
                                        <div className={styles.checkboxItem}>
                                            <input
                                                type="checkbox"
                                                className={styles.checkbox}
                                            /> <a
                                                key={index}
                                                href={filePath} // Ensure filePath is a valid URL
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    color: "#60a5fa",
                                                    textDecoration: "underline",
                                                    display: "block",
                                                }}
                                                onClick={(event) => {
                                                    event.preventDefault(); // Prevent default link behavior

                                                    window.open(`http://localhost:5000/${filePath}`, "_blank"); // Open in a new tab
                                                }}
                                            >
                                                {filePath}
                                            </a>
                                        </div>

                                    ))}
                                </pre>
                            ) : (
                                <p>No reports available for this folder.</p>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ExecutionHistory;