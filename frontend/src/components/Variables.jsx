import React from "react";
import { useState, useEffect } from "react";
import styles from "./css/Variables.module.css"; // Assuming you have a CSS module for styling
import { FaEdit, FaEye, FaEyeSlash, FaHome, FaTimes } from "react-icons/fa";

export default function Variables() {
    const [variables, setVariables] = useState({});
    const [newKey, setNewKey] = useState("");
    const [newValue, setNewValue] = useState("");
    const [visiblePasswords, setVisiblePasswords] = useState({});

    useEffect(() => {
        fetchVariables(); // Fetch variables on component mount
    }, []); // Empty dependency array to run only once on mount
    const saveVariables = async () => {
        if (!newKey.trim() || !newValue.trim()) {
            console.error("Key and value cannot be empty");
            return; // Ensure both key and value are not empty
        }
        try {
            const response = await fetch("http://localhost:5000/api/saveVariables", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ newKey, newValue }),
            });
            const data = await response.json();
            if (data.success) {
                setNewKey(""); // Clear input fields after saving
                setNewValue("");
                fetchVariables(); // Refresh variables after saving
                alert(data.message); // Show success message
            } else {
                alert("Failed to save variable. Please try again.");
            }
        } catch (error) {
            console.error("Error saving variable:", error);
        }

    };
    const fetchVariables = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/getVariables");
            if (!response.ok) {
                throw new Error("Failed to fetch variables");
            }
            const data = await response.json();
            console.log("Fetched variables:", data); // Log fetched variables
            setVariables(data);
        } catch (error) {
            console.error("Error fetching variables:", error);
        }
    }
    const deleteVariable = async (key) => {
        if (!key) {
            console.error("Key cannot be empty");
            return; // Ensure key is not empty
        }
        try {
            const response = await fetch("http://localhost:5000/api/deleteVariable", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ key }),
            });
            const data = await response.json();
            if (data.success) {
                fetchVariables(); // Refresh variables after deletion
            } else {
                alert("Failed to delete variable. Please try again.");
            }
        } catch (error) {
            console.error("Error deleting variable:", error);
        }
    }
    const handleSearch = (searchTerm) => {
        // const searchTerm = e.target.value.toLowerCase();
        if (searchTerm === "") {
            fetchVariables()
        } else {
            // Filter variables based on search term
            const filteredVariables = Object.fromEntries(
                Object.entries(variables).filter(([key, value]) =>
                    key.toLowerCase().includes(searchTerm) || value.toLowerCase().includes(searchTerm)
                )
            );
            setVariables(filteredVariables);
        }
    }
    const handkeEdit = (key, value) => {
        setNewKey(key); // Set the key to be edited
        setNewValue(value); // Set the value to be edited
        // try {
        //     const response = fetch("http://localhost:5000/api/upadateVariable", {
        //         method: "POST",
        //         headers: {
        //             "Content-Type": "application/json",
        //         },
        //         body: JSON.stringify({ key, value }),
        //     });
        // } catch (error) {
        //     console.error("Error updating variable:", error);
        // }
    }
    return (
        <div className={styles.variableContainer}>
            <div className={styles.headerContainer}>
                <h2 className={styles.headerText}>Manage Variables</h2>
                <input
                    type="text"
                    placeholder="Search Variables"
                    className={styles.searchInput}
                    onChange={(e) => {
                        handleSearch(e.target.value); // Implement search functionality if needed
                    }}
                />
                <FaHome className={styles.homeIcon} onClick={() => window.location.href = "/"} />
            </div>

            <div className={styles.variableForm}>
                <input
                    type="text"
                    placeholder="Variable Name"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    className={styles.variableInput}
                />
                <input
                    type="text"
                    placeholder="Variable Value"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className={styles.variableInput}
                />
                <button
                    onClick={saveVariables}
                    className={styles.saveButton}
                >
                    Save
                </button>
            </div>
            <div className={styles.savedVariablesContainer}>
                {/* <div className={styles.savedVariablesText}> */}
                {Object.keys(variables).length === 0 ? (
                    <p className={styles.noVariablesText}>No variables saved yet</p>
                ) : (
                    <div className={styles.tableScrollWrapper}>
                        <table className={styles.tableContainer}>
                            <thead className={styles.tableHeader}>
                                <tr className={styles.tabelRow}>
                                    <th className={styles.headerTextTable}>Variable Name</th>
                                    <th className={styles.headerTextTable}>Value</th>
                                    <th className={styles.headerTextTable}>Actions</th>
                                </tr>
                            </thead>
                            <tbody className={styles.tableBody}>
                                {Object.entries(variables).map(([key, value]) => (

                                    <tr key={key} className={styles.tabelRow}>
                                        <td className={styles.valueCell}><b>{key}</b></td>
                                        <td className={styles.valueCell}>
                                            {key.toLowerCase().includes("pass") && !visiblePasswords[key]
                                                ? "******"
                                                : value}
                                            {key.toLowerCase().includes("pass") && (
                                                <button
                                                    className={styles.eyeButton}
                                                    onClick={() => setVisiblePasswords(v => ({ ...v, [key]: !v[key] }))}
                                                >
                                                    {visiblePasswords[key] ? <FaEyeSlash /> : <FaEye />}
                                                </button>
                                            )}
                                        </td>
                                        <td className={styles.actionOption}>
                                            <button
                                                className={styles.deleteButton}
                                                onClick={() => { deleteVariable(key) }}
                                            >
                                                <FaTimes className={styles.deleteIcon} />
                                            </button>
                                            <button
                                                className={styles.editButton}
                                                onClick={() => { handkeEdit(key, value) }}
                                            >
                                                <FaEdit className={styles.editIcon} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>

                        </table>
                    </div>

                )}
                {/* </div> */}
            </div>
        </div>
    );
}