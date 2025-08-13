import React from 'react';
import { useLocation } from 'react-router-dom';
import styles from './css/PassReportPage.module.css'; // Adjust the path as necessary
import { FaHome } from 'react-icons/fa'; // Import the home icon

const PassReportPage = () => {
    const location = useLocation();
    const reportData = location.state?.reportData; // Access passed state

    return (
        <div className={styles.executionHistoryContainer}>
            <div className={styles.executionHistoryHeader}>
                <h3 className={styles.executionHistoryTitle}>Pass Report</h3>
                <FaHome 
                className={styles.homeButton}
                onClick={() => window.location.href = "/"} // Redirect to home
                />
            </div>
            {reportData ? (
                <div className={styles.folderContent}>
                    {Object.keys(reportData).map((folderName) => (
                        <div key={folderName} >
                            {/* <h2>{folderName}</h2> */}
                            <ul>
                                {reportData[folderName].report.map((reportPath, index) => (
                                    <li key={index}>
                                        <div className={styles.checkboxItem}>
                                            <input
                                                type="checkbox"
                                                style={{ marginRight: "10px" }}
                                            />
                                            <a
                                                href={`http://localhost:5000${reportPath}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    color: "#60a5fa",
                                                    textDecoration: "underline",
                                                }}
                                                onClick={(event) => {
                                                    event.preventDefault(); // Prevent default link behavior
                                                    window.open(
                                                        `http://localhost:5000${reportPath}`,
                                                        "_blank"
                                                    ); // Open in a new tab
                                                }}
                                            >
                                                {reportPath}
                                            </a>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            ) : (
                <p>No data available for the pass report.</p>
            )}
        </div>
    );
};

export default PassReportPage;