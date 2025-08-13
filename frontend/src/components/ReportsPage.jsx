import React from "react";
import { useLocation } from "react-router-dom";
import styles from "./css/ReportsPage.module.css"; // Optional: Add styles
import { FaCheckCircle, FaTimesCircle, FaHome } from "react-icons/fa";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
const ReportPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { reportData } = location.state || {};

    if (!reportData) {
        return <div>No report data available.</div>;
    }
    const handlePassCardClick = async () => {
        // Handle the click event for the pass card
        console.log("Pass card clicked");
        try {
            const res = await fetch("http://localhost:5000/api/passReport");
            const data = await res.json();
      
            if (res.ok) {
              navigate("/pass-report", { state: { reportData: data } });
            } else {
              console.error(data.error);
              alert("Failed to fetch pass report data.");
            }
          } catch (err) {
            console.error("Error fetching pass report:", err);
            alert("An error occurred while fetching the pass report.");
          }
    };
    const handleFailCardClick = async () => {
        // Handle the click event for the fail card
        console.log("Fail card clicked");
        try {
            const res = await fetch("http://localhost:5000/api/failReport");
            const data = await res.json();
      
            if (res.ok) {
              navigate("/fail-report", { state: { reportData: data } });
            } else {
              console.error(data.error);
              alert("Failed to fetch fail report data.");
            }
          } catch (err) {
            console.error("Error fetching fail report:", err);
            alert("An error occurred while fetching the fail report.");
          }
    }
    return (
        <div className={styles.reportContainer}>
            <div className={styles.reportHeader}>
                <h3 className={styles.reportTitle}>📊 Report</h3>
                <FaHome 
                className={styles.homeButton}
                onClick={() => window.location.href = "/"} // Redirect to home
                />
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