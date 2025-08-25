import React, { useState, useEffect } from "react";
import AceEditor from "react-ace";
import ace from "ace-builds/src-noconflict/ace";
import styles from "./css/Keywords.module.css";
// Import Ace modes/themes
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-monokai";
import { FaHome, FaInfo, FaInfoCircle } from "react-icons/fa";
ace.config.setModuleUrl("ace/mode/javascript_worker", require("ace-builds/src-noconflict/worker-javascript?url"));
function Keywords() {
    const [keywords, setKeywords] = useState("");
    const [savedKeywords, setSavedKeywords] = useState([]);
    const [showKeywords, setShowKeywords] = useState(false);
    const [originalKeywords, setOriginalKeywords] = useState([]);

    const [editingKeyword, setEditingKeyword] = useState(null);
    // Mock API call - replace with backend fetch
    useEffect(() => {

        const existingKeywords = fetch('http://localhost:5000/api/getKeywords')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                return response.json();
            })
            .then(data => {
                console.log('Fetched keywords:', data);
                setSavedKeywords(data);
                setOriginalKeywords(data);
            })
            .catch(error => {
                console.error('Error fetching keywords:', error);
                return [];
            });
        setSavedKeywords(Array.isArray(existingKeywords) ? existingKeywords : []);
        setOriginalKeywords(Array.isArray(existingKeywords) ? existingKeywords : []);
    }, []);
    // Save new keyword
    const handleSave = () => {
        if (!keywords.trim()) return;
        const keyName = keywords.split(":")[0].trim(); // Use first line as keyword name
        const keyCode = keywords.split(":").slice(1).join(":").trim(); // Use rest as code
        const newKeyword = {
            name: keyName,
            code: keyCode,
        };
        if (editingKeyword) {
            fetch('http://localhost:5000/api/updateKeyword', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ keyword: newKeyword })
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Keyword updated:', data);
                    setSavedKeywords(prevKeywords => prevKeywords.map(kw => kw.name === editingKeyword.name ? newKeyword : kw));
                    setEditingKeyword(null);
                    setKeywords(""); // Clear the editor
                })
                .catch(error => {
                    console.error('Error updating keyword:', error);
                    alert('Failed to update keyword. Please try again or check if keyword already exists.');
                });
        } else {
            setSavedKeywords([...savedKeywords, newKeyword]);
            setKeywords("");
            // TODO: Send this to backend for persistence
            console.log("Saving keyword:", newKeyword);
            // Example API call to save keyword
            fetch('http://localhost:5000/api/saveKeywords', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ keyword: newKeyword }), // Wrap the keyword in an object
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Keyword saved:', data);
                    setSavedKeywords(prevKeywords => [...prevKeywords, newKeyword]);
                    setKeywords(""); // Clear the editor
                })
                .catch(error => {
                    console.error('Error saving keyword:', error);
                    alert('Failed to save keyword. Please try again or check if keyword already exists.');
                });
        }
    };
    const handleEditKeyword = (index, keyword) => {
        setEditingKeyword(keyword);
        setKeywords(`${keyword.name}: ${keyword.code}`);
    };
    return (
        <div className={styles.editorContainer}>
            {/* Editor for new keyword */}
            <div className="border rounded-xl shadow-lg p-3">
                <div className={styles.headerContent}>
                    <h2 className="text-lg font-bold mb-2">Create Custom Keywords</h2>
                    <FaInfoCircle className={styles.infoIcon}
                        onClick={() => alert("Custom Keywords allow you to define reusable functions for common actions in your tests. Use the editor below to create a new keyword, then click 'Save Keyword' to add it to your list.")} // Show info on click
                    />
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Search keywords..."
                        onChange={(e) => {
                            const searchTerm = e.target.value.toLowerCase();
                            if (searchTerm === "") {
                                setSavedKeywords(originalKeywords); // Reset to original keywords if search is empty
                            } else {
                                const filteredKeywords = savedKeywords.filter(kw =>
                                    kw.name.toLowerCase().includes(searchTerm) ||
                                    kw.code.toLowerCase().includes(searchTerm)
                                );
                                setSavedKeywords(filteredKeywords);
                            }
                        }}
                    />
                    <button className={styles.showHideButton}
                        onClick={() => setShowKeywords(!showKeywords)}
                    >
                        {showKeywords ? "Hide Keywords" : "Show Keywords"}
                    </button>

                    <FaHome
                        className={styles.homeButton}
                        onClick={() => window.location.href = "/"} // Redirect to home
                    />
                </div>
                <div className={styles.keywordEditorAndKeywords}>
                    <div className={styles.keywordEditor}>
                        <AceEditor
                            className={styles.aceEditor}
                            mode="javascript"
                            theme="monokai"
                            value={keywords || `keyword_name: async (page, step, test) => {
    //Replace "keyword_name" with actual keyword name
    // Resolve variable (i.e. \${variableName})
    const value= resolveValue(step.value || ""); 
    //Normalize selector 
    const selector = normalizeSelector(step.selector);
    const options = step.options || {};
    if (selector!== "") {
    await elementToBevisible(page, selector, test, 10000);// 10 seconds timeout(i.e. 10000ms)
    }
    // Your custom logic here
}`}

                            onChange={(val) => setKeywords(val)}
                            name="keyword_editor"
                            width="100%"
                            height="400px"
                            placeholder={`keyword_name: async (page, step, test) => {

                                // Resolve variable (i.e. \${variableName})
                                const value= resolveValue(step.value || ""); 

                                //Normalize selector 
                                const selector = normalizeSelector(step.selector);

                                const options = step.options || {};
                                // Your custom logic here
                            }`}
                            fontSize={16}
                            editorProps={{ $blockScrolling: true }}
                            setOptions={{
                                useWorker: false, // Enable worker for syntax checking
                            }
                            }
                        />
                        <button
                            className={styles.saveButton}
                            onClick={handleSave}
                        >
                            {editingKeyword ? "Update Keyword" : "Save Keyword"}
                        </button>
                    </div>
                    <div className={styles.keywordsList}>
                        {!showKeywords && (
                            <p className={styles.noKeyword}>Click "Show Keywords" to view saved keywords.</p>
                        )}
                        {showKeywords && (
                            <div className="border rounded-xl shadow-lg p-3 overflow-y-auto">
                                <h2 className={styles.headerText}>Saved Keywords</h2>
                                {savedKeywords.length === 0 ? (
                                    <p className="text-gray-500">No keywords yet.</p>
                                ) : (
                                    savedKeywords.map((kw, idx) => (
                                        <div
                                            key={idx}
                                            className={styles.keywordCard}
                                        >
                                            <h3 className={styles.keyName}>{kw.name}</h3>
                                            <button
                                                className={styles.editButton}
                                                onClick={() => { handleEditKeyword(idx, kw); }}
                                            >
                                                Edit
                                            </button>
                                            <pre className={styles.code}>{kw.name} : {kw.code}</pre>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>


            </div>
            {/* Saved keywords list */}



        </div>

    );

}

export default Keywords;
