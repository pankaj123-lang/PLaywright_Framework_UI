import React, { useState, useEffect } from "react";
import AceEditor from "react-ace";
import ace from "ace-builds/src-noconflict/ace";
import styles from "./css/Keywords.module.css"; // Assuming you have a CSS module for styling
// Import Ace modes/themes
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-monokai";
import { FaHome, FaInfo, FaInfoCircle } from "react-icons/fa";
// import "ace-builds/src-noconflict/worker-javascript"
ace.config.setModuleUrl("ace/mode/javascript_worker", require("ace-builds/src-noconflict/worker-javascript?url"));
function Keywords() {
    const [keywords, setKeywords] = useState(""); // content of editor
    const [savedKeywords, setSavedKeywords] = useState([]); // list of saved custom keywords
    const [showKeywords, setShowKeywords] = useState(false); // toggle for showing/hiding keywords
    const [originalKeywords, setOriginalKeywords] = useState([]);
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
                // return data; // Return the fetched keywords
                setSavedKeywords(data); // Set the fetched keywords to state
                setOriginalKeywords(data); // Store original keywords for reset functionality
            })
            .catch(error => {
                console.error('Error fetching keywords:', error);
                return []; // Return an empty array on error
            });
        setSavedKeywords(Array.isArray(existingKeywords) ? existingKeywords : []); // Ensure we set an array
        setOriginalKeywords(Array.isArray(existingKeywords) ? existingKeywords : []); // Store original keywords for reset functionality
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
    // Resolve variable (i.e. \${variableName})
    const value= resolveValue(step.value || ""); 
    //Normalize selector 
    const selector = normalizeSelector(step.selector);
    const options = step.options || {};
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
                            Save Keyword
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
                                            className="mb-4 p-3 border rounded-lg bg-gray-900 text-white"
                                        >
                                            <h3 className={styles.keyName}>{kw.name}</h3>
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
