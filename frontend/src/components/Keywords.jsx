import React, { useState, useEffect } from "react";
import AceEditor from "react-ace";
import ace from "ace-builds/src-noconflict/ace";
import styles from "./css/Keywords.module.css";
import { parse } from 'acorn';
// Import Ace modes/themes
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-language_tools"; // For autocompletion
import { FaCode, FaEdit, FaHome, FaInfoCircle } from "react-icons/fa";
ace.config.setModuleUrl("ace/mode/javascript_worker", require("ace-builds/src-noconflict/worker-javascript?url"));

function Keywords() {
    const [keywords, setKeywords] = useState("");
    const [savedKeywords, setSavedKeywords] = useState([]);
    const [showKeywords, setShowKeywords] = useState(false);
    const [originalKeywords, setOriginalKeywords] = useState([]);
    const [markers, setMarkers] = useState([]);
    const [syntaxError, setSyntaxError] = useState(null);

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
    const validateSyntax = (code) => {
        try {
            parse(code, {
                ecmaVersion: 2020,
                sourceType: 'module',
                locations: true
            });

            setSyntaxError(null);
            setMarkers([]); // Clear any error markers
            return { valid: true };
        } catch (error) {
            const { line, column } = error.loc || { line: 1, column: 0 };
            const errorMessage = `Error at line ${line - 1}, column ${column}: ${error.message}`;

            setSyntaxError({
                message: error.message,
                line,
                column,
                fullMessage: errorMessage
            });

            // Set a marker at the error line
            setMarkers([{
                startRow: line - 1, // AceEditor rows are 0-indexed
                endRow: line - 1,
                className: styles.errorMarker,
                type: 'background',
                inFront: true
            }]);

            return {
                valid: false,
                error: errorMessage
            };
        }
    };
    // Save new keyword
    const handleSave = () => {

        if (!keywords.trim()) return;
        const validationResult = validateSyntax(keywords);

        if (validationResult.valid) {
            console.log("Syntax is valid");
            // Continue with saving
        } else {
            // alert(`Syntax error: ${validationResult.error}`);
            return;
        }
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
    const handleSampleCodeClick = () => {
        const sampleCode = `keyword_name: async (page, step, test) => {
    //Replace "keyword_name" with actual keyword name and remove or comment unnessesary code to avoid facing issues
    // Resolve variable if present (i.e. \${variableName})
    const value = resolveAppropriately(step.value || "", test);
    //Normalize selector if locator present
    const selector = normalizeSelector(step.selector);
    //Use if options or role present
    const options = step.options || {};
    //Wait for element to be visible if selector present
    if (selector!== "") {
    await elementToBevisible(page, selector, test, 10000);// 10 seconds timeout(i.e. 10000ms)
    }
    // Your custom logic here
    await selector.click();
    await selector.fill(value);
    await saveVariables(page, "saveVariableKey", "saveVariableValue");
}`;
        setKeywords(sampleCode);
    }
    return (
        <div className={styles.editorContainer}>
            {/* Editor for new keyword */}
            <div className={styles.bodyContainer}>
                <div className={styles.headerContent}>
                    <h2 className="text-lg font-bold mb-2">Create Custom Keywords</h2>
                    <FaInfoCircle className={styles.infoIcon}
                        onClick={() => alert("Custom Keywords allow you to define reusable functions for common actions in your tests. Use the editor below to create a new keyword, then click 'Save Keyword' to add it to your list.")} // Show info on click
                    /><FaCode className={styles.codeIcon} title="Sample code" onClick={handleSampleCodeClick} />
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
                            value={keywords}
                            markers={markers}

                            onChange={(val) => setKeywords(val)}
                            name="keyword_editor"
                            width="100%"
                            height="77vh"
                            placeholder={`keyword_name: async (page, step, test) => {
    //Replace "keyword_name" with actual keyword name and remove or comment unnessesary code to avoid facing issues
    
    // Resolve variable if present (i.e. \${variableName})
    const value = resolveAppropriately(step.value || "", test); 
    
    //Normalize selector if locator present
    const selector = normalizeSelector(step.selector);
    
    //Use if options or role present
    const options = step.options || {};
    
    //Wait for element to be visible if selector present
    if (selector!== "") {
    await elementToBevisible(page, selector, test, 10000);// 10 seconds timeout(i.e. 10000ms)
    }
    // Your custom logic here
    await selector.click();
    await selector.fill(value);
    await saveVariables(page, "saveVariableKey", "saveVariableValue");
}`}
                            fontSize={14}
                            showPrintMargin={false}
                            highlightActiveLine={true}
                            editorProps={{ $blockScrolling: true }}
                            setOptions={{
                                useWorker: false, // Enable worker for syntax checking
                                enableBasicAutocompletion: true,
                                enableLiveAutocompletion: true,
                                tabSize: 2,
                                showLineNumbers: true,
                            }
                            }
                        />
                        <div>
                            <button
                                className={styles.saveButton}
                                onClick={handleSave}
                            >
                                {editingKeyword ? "Update Keyword" : "Save Keyword"}
                            </button>
                            {editingKeyword && (
                                <button
                                    className={styles.cancelButton}
                                    onClick={() => {
                                        setEditingKeyword(null);
                                        setKeywords("");
                                    }}
                                >
                                    cancel
                                </button>
                            )}
                        </div>
                        {syntaxError && (
                            <div className={styles.syntaxErrorMessage}>
                                {syntaxError.fullMessage}
                            </div>
                        )}


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
                                                title="Edit Keyword"
                                            >
                                                <FaEdit />
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
