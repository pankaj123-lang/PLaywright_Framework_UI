import React from "react";
import { useLocation } from "react-router-dom";
import styles from "./ReportsPage.module.css"; // Optional: Add styles
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

const ReportPage = () => {
    const location = useLocation();
    const { reportData } = location.state || {};

    if (!reportData) {
        return <div>No report data available.</div>;
    }
    const handlePassCardClick = () => {
        // Handle the click event for the pass card
        console.log("Pass card clicked");
    };
    const handleFailCardClick = () => {
        // Handle the click event for the fail card
        console.log("Fail card clicked");
    }
    return (
        <div className={styles.reportContainer}>
            <div className={styles.reportHeader}>
                <h3 className={styles.reportTitle}>📊 Report</h3>
            </div>
            <div className={styles.reportContent}>
                <div className={styles.reportStats}>

                    <div className={styles.statCardPass}
                        onClick={handlePassCardClick}>
                        <h3 className={styles.statTitle}>
                            <FaCheckCircle className={styles.iconPass} /> PASSED</h3>
                        <strong className={styles.statValuePass}>{reportData.passed}</strong>
                        <p>({reportData.passedPercentage}%)</p>

                    </div>
                    <div className={styles.statCardFailed}
                        onClick={handleFailCardClick}>
                        <h3 className={styles.statTitle}><FaTimesCircle className={styles.iconFail}/> FAILED</h3>
                        <strong className={styles.statValueFailed}>{reportData.failed}</strong>
                        <p>({reportData.failedPercentage}%)</p>

                    </div>
                    <div className={styles.statCardTotal}>
                        <h3 className={styles.statTitle}>Total Executions</h3>
                        <p className={styles.statValueTotal}>{reportData.totalExecutions}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportPage;