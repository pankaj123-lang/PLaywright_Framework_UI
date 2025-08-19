import { useLocation } from "react-router-dom";
import styles from "./css/TotalExecution.module.css";
import React, { useState, useEffect } from "react";
import {
    FaFolder,
    FaChevronDown,
    FaChevronRight,
    FaHome,
    FaTrash,
    FaCheckCircle,
    FaTimesCircle,
} from "react-icons/fa";

const FailReportPage = () => {
    const location = useLocation();
    const reportData = location.state?.reportData;

    const [reportFolder, setReportFolder] = useState({});
    const [filteredData, setFilteredData] = useState(reportData || {});

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

    if (!reportData || Object.keys(filteredData).length === 0) {
        return <p className={styles.noHistory}>No execution history available.</p>;
    }

    return (
        <div className={styles.executionHistoryContainer}>
            <div className={styles.executionHistoryHeader}>
                <h3 className={styles.executionHistoryTitle}>Total Fail Report</h3>
                <input
                    className={styles.searchHistory}
                    placeholder="Search execution suite history..."
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
                    onClick={() => {
                        if (window.confirm("Are you sure you want to delete the execution history?")) {
                            setFilteredData({});
                            setReportFolder({});
                            alert("Execution history deleted.");
                        }
                    }}
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
                                        ({failedCount} reports)
                                    </span>
                                )}
                            </div>
                        </div>
                        {reportFolder[folder] && (
                            <div className={styles.folderContent}>
                                {totalCount > 0 ? (
                                    <div className={styles.folderDetails}>
                                        {[
                                        ...(details.failed || []).map((filePath, index) => (
                                            <div
                                                key={`failed-${index}`}
                                                className={styles.reportItem}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className={styles.reportCheckbox}
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
                                                    {filePath}
                                                </a>
                                                <span className={styles.failedStatus}>
                                                    <FaTimesCircle /> FAILED</span>
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

export default FailReportPage;