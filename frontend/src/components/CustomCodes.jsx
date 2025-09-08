import React, { useState, useRef, useCallback, useEffect } from "react";
import AceEditor from "react-ace";
import {
    FaFile,
    FaPlus,
    FaSave,
    FaPlay,
    FaCode,
    FaFileCode,
    FaTrash,
    FaEdit,
    FaTimes,
    FaCheck,
    FaTerminal,
    FaExpand,
    FaCompress
} from "react-icons/fa";
import "ace-builds/src-noconflict/mode-typescript";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-language_tools";
import styles from "./css/CustomCodes.module.css";
import { useNavigate } from "react-router-dom";

const CustomCodes = () => {
    // State declarations
    const [files, setFiles] = useState([]);
    const [currentFile, setCurrentFile] = useState(null);
    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [fileToDelete, setFileToDelete] = useState(null);
    const [terminalHeight, setTerminalHeight] = useState(200);
    const [isTerminalVisible, setIsTerminalVisible] = useState(false);
    const [isTerminalMaximized, setIsTerminalMaximized] = useState(false);
    const [terminalOutput, setTerminalOutput] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [editingFile, setEditingFile] = useState(null);
    const [editingFileName, setEditingFileName] = useState('');

    // Refs
    const terminalRef = useRef(null);
    const dragRef = useRef(null);
    const navigate = useNavigate();

    // Terminal function - MUST BE FIRST
    const addTerminalOutput = useCallback((message, type = 'info') => {
        try {
            const timestamp = new Date().toLocaleTimeString();
            setTerminalOutput(prev => [...prev, {
                message: String(message),
                type,
                timestamp,
                id: Date.now() + Math.random()
            }]);
        } catch (error) {
            console.error('Error adding terminal output:', error);
        }
    }, []);

    // File management functions
    const selectFile = useCallback((file) => {
        try {
            if (!file) return;
            setCurrentFile(file);
            setCode(file.content || "");
        } catch (error) {
            console.error('Error selecting file:', error);
        }
    }, []);

    const createNewFile = useCallback(() => {
        try {
            const fileName = prompt("Enter file name (e.g., test.ts):");
            if (fileName && fileName.trim()) {
                const newFile = {
                    name: fileName.trim(),
                    content: "// New TypeScript file\n\n",
                    id: Date.now()
                };
                setFiles(prev => [...prev, newFile]);
                setCurrentFile(newFile);
                setCode(newFile.content);
                addTerminalOutput(`Created new file: ${fileName}`, 'info');
            }
        } catch (error) {
            console.error('Error creating file:', error);
            addTerminalOutput('Error creating file', 'error');
        }
    }, [addTerminalOutput]);

    // Editing functions
    const startEditingFileName = useCallback((file, event) => {
        try {
            event.stopPropagation();
            setEditingFile(file.id);
            setEditingFileName(file.name);
        } catch (error) {
            console.error('Error starting edit:', error);
        }
    }, []);

    const cancelEditingFileName = useCallback(() => {
        setEditingFile(null);
        setEditingFileName('');
    }, []);

    const saveFileName = useCallback(async (file) => {
        if (!editingFileName.trim() || editingFileName === file.name) {
            cancelEditingFileName();
            return;
        }

        setIsLoading(true);
        try {
            addTerminalOutput(`Renaming "${file.name}" to "${editingFileName}"...`, 'info');

            const response = await fetch('http://localhost:5000/api/renameCustomFile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    oldFileName: file.name,
                    newFileName: editingFileName,
                    fileId: file.id
                }),
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setFiles(prev => prev.map(f =>
                        f.id === file.id ? { ...f, name: editingFileName } : f
                    ));

                    if (currentFile?.id === file.id) {
                        setCurrentFile(prev => ({ ...prev, name: editingFileName }));
                    }

                    addTerminalOutput('File renamed successfully!', 'success');
                    cancelEditingFileName();
                } else {
                    throw new Error(result.error || 'Failed to rename file');
                }
            } else {
                throw new Error(`Server error: ${response.status}`);
            }
        } catch (error) {
            console.error('Error renaming file:', error);
            addTerminalOutput(`Error renaming file: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [editingFileName, currentFile, addTerminalOutput, cancelEditingFileName]);

    const handleFileNameKeyPress = useCallback((e, file) => {
        if (e.key === 'Enter') {
            saveFileName(file);
        } else if (e.key === 'Escape') {
            cancelEditingFileName();
        }
    }, [saveFileName, cancelEditingFileName]);

    // Delete functions
    const handleDeleteClick = useCallback((file, event) => {
        event.stopPropagation();
        setFileToDelete(file);
        setShowDeleteModal(true);
    }, []);
    const cancelDelete = useCallback(() => {
        setShowDeleteModal(false);
        setFileToDelete(null);
    }, []);

    const confirmDelete = useCallback(async () => {
        if (!fileToDelete) return;

        setIsLoading(true);
        try {
            addTerminalOutput(`Deleting "${fileToDelete.name}"...`, 'info');

            const response = await fetch('http://localhost:5000/api/deleteCustomFile', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: fileToDelete.name,
                    fileId: fileToDelete.id,
                    filePath: fileToDelete.serverPath
                }),
            });

            if (response.ok) {
                setFiles(prev => prev.filter(file => file.id !== fileToDelete.id));

                if (currentFile?.id === fileToDelete.id) {
                    setCurrentFile(null);
                    setCode("");
                }

                addTerminalOutput(`File "${fileToDelete.name}" deleted successfully`, 'success');
            } else {
                throw new Error(`Server error: ${response.status}`);
            }
        } catch (error) {
            console.error('Error deleting file:', error);
            addTerminalOutput(`Error deleting file: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
            setShowDeleteModal(false);
            setFileToDelete(null);
        }
    }, [fileToDelete, currentFile, addTerminalOutput]);

    // Terminal functions
    const toggleTerminal = useCallback(() => {
        setIsTerminalVisible(prev => !prev);
        if (!isTerminalVisible) {
            addTerminalOutput("Terminal opened", 'info');
        }
    }, [isTerminalVisible, addTerminalOutput]);

    const toggleTerminalMaximize = useCallback(() => {
        setIsTerminalMaximized(prev => !prev);
    }, []);

    const clearTerminal = useCallback(() => {
        setTerminalOutput([]);
        addTerminalOutput("Terminal cleared", 'info');
    }, [addTerminalOutput]);

    // Save and run functions
    const saveFile = useCallback(async () => {
        if (!currentFile) {
            addTerminalOutput("No file selected!", 'warning');
            return;
        }

        setIsLoading(true);
        try {
            addTerminalOutput(`Saving "${currentFile.name}"...`, 'info');

            const response = await fetch('http://localhost:5000/api/saveCustomFile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: currentFile.name,
                    content: code,
                    fileId: currentFile.id
                }),
            });

            if (response.ok) {
                const result = await response.json();
                addTerminalOutput(`File "${currentFile.name}" saved successfully!`, 'success');

                // Update local state
                setFiles(prev => prev.map(file =>
                    file.id === currentFile.id ? { ...file, content: code } : file
                ));
                setCurrentFile(prev => ({ ...prev, content: code }));
            } else {
                throw new Error(`Server error: ${response.status}`);
            }
        } catch (error) {
            console.error('Error saving file:', error);
            addTerminalOutput(`Error saving file: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [currentFile, code, addTerminalOutput]);

    const runCode = useCallback(async () => {
        if (!currentFile) {
            addTerminalOutput("No file selected!", 'warning');
            return;
        }

        setIsLoading(true);
        setIsTerminalVisible(true);

        try {
            addTerminalOutput(`Running "${currentFile.name}"...`, 'info');
            await saveFile();

            const response = await fetch('http://localhost:5000/api/runCustomFile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: currentFile.name,
                    content: code,
                    fileId: currentFile.id
                }),
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    addTerminalOutput('Code execution completed successfully!', 'success');
                    if (result.output) {
                        addTerminalOutput(`Output: ${result.output}`, 'info');
                    }
                } else {
                    addTerminalOutput(`Execution failed: ${result.error}`, 'error');
                }
            } else {
                throw new Error(`Server error: ${response.status}`);
            }
        } catch (error) {
            console.error('Error running code:', error);
            addTerminalOutput(`Error running code: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [currentFile, code, addTerminalOutput, saveFile]);

    // Drag functionality
    const handleMouseDown = useCallback((e) => {
        setIsDragging(true);
        e.preventDefault();
    }, []);

    const handleMouseMove = useCallback((e) => {
        if (!isDragging) return;

        const containerRect = terminalRef.current?.parentElement?.getBoundingClientRect();
        if (!containerRect) return;

        const newHeight = containerRect.bottom - e.clientY;
        const minHeight = 100;
        const maxHeight = containerRect.height * 0.7;

        setTerminalHeight(Math.min(Math.max(newHeight, minHeight), maxHeight));
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Effects
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    useEffect(() => {
        const loadFilesFromServer = async () => {
            try {
                addTerminalOutput("Loading files from server...", 'info');

                const response = await fetch('http://localhost:5000/api/getCustomFiles', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.files && result.files.length > 0) {
                        const serverFiles = result.files.map(file => ({
                            id: file.id || Date.now() + Math.random(),
                            name: file.name,
                            content: file.content || "",
                            serverPath: file.path,
                            lastModified: file.lastModified
                        }));

                        setFiles(serverFiles);
                        addTerminalOutput(`Loaded ${serverFiles.length} files from server`, 'success');
                    } else {
                        addTerminalOutput("No files found on server", 'info');
                    }
                } else {
                    throw new Error(`Server error: ${response.status}`);
                }
            } catch (error) {
                console.error('Error loading files:', error);
                addTerminalOutput(`Error loading files: ${error.message}`, 'error');
            }
        };

        loadFilesFromServer();
    }, [addTerminalOutput]);
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

    const playwrightKeywords = [
        { caption: 'page.goto', value: "await page.goto('https://www.example.com')", meta: 'Playwright', score: 1000 },
        { caption: 'page.click', value: "await page.click('selector')", meta: 'Playwright', score: 1000 },
        { caption: 'page.fill', value: "await page.fill('selector', 'value')", meta: 'Playwright', score: 1000 },
        { caption: 'page.type', value: "await page.type('selector', 'value')", meta: 'Playwright', score: 1000 },
        { caption: 'page.waitForSelector', value: "await page.waitForSelector('selector')", meta: 'Playwright', score: 1000 },
        { caption: 'page.screenshot', value: "await page.screenshot({ path: 'screenshot.png' })", meta: 'Playwright', score: 1000 },
        { caption: 'page.evaluate', value: "await page.evaluate(() => { /* code */ })", meta: 'Playwright', score: 1000 },
        { caption: 'browser.newPage', value: "const page = await browser.newPage()", meta: 'Playwright', score: 1000 },
        { caption: 'browser.close', value: "await browser.close()", meta: 'Playwright', score: 1000 },
        { caption: 'expect', value: "import { expect } from '@playwright/test'", meta: 'Playwright', score: 1000 },
        { caption: 'page.getByText', value: "await page.getByText('text')", meta: 'Playwright', score: 1000 },
        { caption: 'page.getByRole', value: "await page.getByRole('role')", meta: 'Playwright', score: 1000 },
        { caption: 'page.getByLabel', value: "await page.getByLabel('label')", meta: 'Playwright', score: 1000 },
        { caption: 'page.getByPlaceholder', value: "await page.getByPlaceholder('placeholder')", meta: 'Playwright', score: 1000 },
        { caption: 'page.getByTestId', value: "await page.getByTestId('testId')", meta: 'Playwright', score: 1000 },
        { caption: 'test.describe', value: "test.describe('description', () => { /* tests */ })", meta: 'Playwright', score: 1000 },
        { caption: 'test.beforeEach', value: "test.beforeEach(async ({ page }) => { /* setup */ })", meta: 'Playwright', score: 1000 },
        { caption: 'test.afterEach', value: "test.afterEach(async ({ page }) => { /* teardown */ })", meta: 'Playwright', score: 1000 },
        { caption: 'import resolveAppropriately', value: "import { resolveAppropriately } from 'path/to/utils'", meta: 'Utility', score: 1000 },
        { caption: 'import elementToBevisible', value: "import { elementToBevisible } from 'path/to/utils'", meta: 'Utility', score: 1000 },
        { caption: 'import saveVariables', value: "import { saveVariables } from 'path/to/utils'", meta: 'Utility', score: 1000 },
        { caption: 'import normalizeSelector', value: "import { normalizeSelector } from 'path/to/utils'", meta: 'Utility', score: 1000 },
        { caption: 'import getVariableValue', value: "import { getVariableValue } from 'path/to/utils'", meta: 'Utility', score: 1000 },
        { caption: 'import fs', value: "import fs from 'fs'", meta: 'Node.js', score: 1000 },
        { caption: 'import path', value: "import path from 'path'", meta: 'Node.js', score: 1000 },
        { caption: 'import os', value: "import os from 'os'", meta: 'Node.js', score: 1000 },
        { caption: 'import fetch', value: "import fetch from 'node-fetch'", meta: 'Node.js', score: 1000 },
        { caption: 'import { test, expect }', value: "import { test, expect } from '@playwright/test'", meta: 'Playwright', score: 1000 },
        { caption: 'test', value: "test('test name', async ({ page }) => { /* test code */ })", meta: 'Playwright', score: 1000 },
        {
            caption: 'login flow', value: `
await page.goto('https://example.com/login');
await page.fill('#username', 'myUsername');
await page.fill('#password', 'myPassword');
await page.click('button[type="submit"]');`,
            meta: 'Snippet', score: 1000
        },

    ];
    const customCompleter = {
        getCompletions: (editor, session, pos, prefix, callback) => {
            if (prefix.length === 0) { callback(null, []); return; }
            callback(null, playwrightKeywords.map(word => ({
                caption: word.caption,
                value: word.value,
                meta: word.meta,
                score: word.score
            })));
        }
    };
    useEffect(() => {
        const langTools = require("ace-builds/src-noconflict/ext-language_tools");
        langTools.addCompleter(customCompleter);
    }, []);
    return (
        <div className={styles.customCodesContainer}>
            {showDeleteModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3>Confirm Delete</h3>
                            <button className={styles.modalCloseButton} onClick={cancelDelete}>
                                <FaTimes />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <p>Are you sure you want to delete "{fileToDelete?.name}"?</p>
                            <p className={styles.modalWarning}>This action cannot be undone.</p>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.modalCancelButton} onClick={cancelDelete}>
                                Cancel
                            </button>
                            <button className={styles.modalConfirmButton} onClick={confirmDelete}>
                                <FaTrash />
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <h2 className={styles.sidebarTitle}>
                        <FaFileCode className={styles.titleIcon} />
                        Custom Codes
                    </h2>
                    <button className={styles.newFileButton} onClick={createNewFile} title="Create new file">
                        <FaPlus />
                        New
                    </button>
                </div>

                <ul className={styles.filesList}>
                    {files.map((file) => (
                        <li
                            key={file.id}
                            className={`${styles.fileItem} ${currentFile?.id === file.id ? styles.active : ""} ${editingFile === file.id ? styles.editing : ""}`}
                            onClick={(e) => {
                                // e.preventDefault();
                                e.stopPropagation();
                                if (editingFile !== file.id) {
                                    selectFile(file);
                                }
                            }}
                        >
                            <FaFile className={styles.fileIcon} />

                            {editingFile === file.id ? (
                                <div className={styles.fileNameEditor}>
                                    <input
                                        type="text"
                                        value={editingFileName}
                                        onChange={(e) => setEditingFileName(e.target.value)}
                                        onKeyDown={(e) => handleFileNameKeyPress(e, file)}
                                        onBlur={() => saveFileName(file)}
                                        className={styles.fileNameInput}
                                        autoFocus
                                    />
                                    <div className={styles.editingControls}>
                                        <button
                                            className={styles.editingSaveButton}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                saveFileName(file);
                                            }}
                                            title="Save name"
                                        >
                                            <FaCheck />
                                        </button>
                                        <button
                                            className={styles.editingCancelButton}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                cancelEditingFileName();
                                            }}
                                            title="Cancel"
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <span className={styles.fileName}>{file.name}</span>
                                    <div className={styles.fileActions}>
                                        <button
                                            className={styles.editFileButton}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                startEditingFileName(file, e);
                                            }}
                                            title="Rename file"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            className={styles.deleteFileButton}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleDeleteClick(file, e);
                                            }}
                                            title="Delete file"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </>
                            )}
                        </li>
                    ))}
                    {files.length === 0 && (
                        <li className={styles.emptyMessage}>
                            No files created yet. Click "New" to create your first file.
                        </li>
                    )}
                </ul>
            </div>

            <div className={styles.mainContent}>
                <div className={styles.editorContainer}>
                    <div className={styles.editorHeader}>
                        <div className={styles.editorTitle}>
                            <FaEdit className={styles.editorIcon} />
                            {currentFile ? currentFile.name : "No file selected"}
                        </div>
                        <div className={styles.editorActions}>
                            <button
                                className={styles.reportsButton}
                                onClick={fetchReport}
                                title="Open Reports"
                            >
                                Reports
                            </button>
                            <button
                                className={styles.terminalToggleButton}
                                onClick={toggleTerminal}
                                title={isTerminalVisible ? "Hide Terminal" : "Show Terminal"}
                            >
                                <FaTerminal />
                                Terminal
                            </button>
                            <button
                                className={`${styles.actionButton} ${isLoading ? styles.loading : ""}`}
                                onClick={saveFile}
                                disabled={!currentFile || isLoading}
                                title="Save file"
                            >
                                <FaSave />
                                Save
                            </button>
                            <button
                                className={`${styles.actionButton} ${styles.runButton} ${isLoading ? styles.loading : ""}`}
                                onClick={runCode}
                                disabled={!currentFile || isLoading}
                                title="Run code"
                            >
                                <FaPlay />
                                Run
                            </button>
                        </div>
                    </div>

                    <div className={styles.editorWrapper}>
                        {currentFile ? (
                            <div className={styles.aceEditorContainer}>
                                <AceEditor
                                    mode="typescript"
                                    theme="monokai"
                                    value={code}
                                    onChange={(newCode) => setCode(newCode)}
                                    name="code-editor"
                                    editorProps={{ $blockScrolling: true }}
                                    setOptions={{
                                        enableBasicAutocompletion: true,
                                        enableLiveAutocompletion: true,
                                        enableSnippets: true,
                                        useWorker: false,
                                        fontSize: 14,
                                        showLineNumbers: true,
                                        tabSize: 2,
                                    }}
                                    style={{ width: "100%", height: "100%" }}
                                />
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <FaCode className={styles.emptyStateIcon} />
                                <h3 className={styles.emptyStateTitle}>No File Selected</h3>
                                <p className={styles.emptyStateMessage}>
                                    Create a new file or select an existing one from the sidebar to start coding.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {isTerminalVisible && (
                    <div
                        ref={terminalRef}
                        className={`${styles.terminal} ${isTerminalMaximized ? styles.terminalMaximized : ''}`}
                        style={{
                            height: isTerminalMaximized ? '100%' : `${terminalHeight}px`,
                            display: isTerminalVisible ? 'flex' : 'none'
                        }}
                    >
                        <div ref={dragRef} className={styles.terminalDragHandle} onMouseDown={handleMouseDown}>
                            <div className={styles.dragIndicator}></div>
                        </div>

                        <div className={styles.terminalHeader}>
                            <div className={styles.terminalTitle}>
                                <FaTerminal className={styles.terminalIcon} />
                                Output Terminal
                            </div>
                            <div className={styles.terminalControls}>
                                <button className={styles.terminalControlButton} onClick={clearTerminal} title="Clear terminal">
                                    Clear
                                </button>
                                <button
                                    className={styles.terminalControlButton}
                                    onClick={toggleTerminalMaximize}
                                    title={isTerminalMaximized ? "Restore" : "Maximize"}
                                >
                                    {isTerminalMaximized ? <FaCompress /> : <FaExpand />}
                                </button>
                                <button className={styles.terminalControlButton} onClick={toggleTerminal} title="Close terminal">
                                    <FaTimes />
                                </button>
                            </div>
                        </div>

                        <div className={styles.terminalContent}>
                            {terminalOutput.map((output) => (
                                <div
                                    key={output.id}
                                    className={`${styles.terminalLine} ${styles[`terminal${output.type.charAt(0).toUpperCase() + output.type.slice(1)}`]}`}
                                >
                                    <span className={styles.terminalTimestamp}>[{output.timestamp}]</span>
                                    <span className={styles.terminalMessage}>{output.message}</span>
                                </div>
                            ))}
                            {terminalOutput.length === 0 && (
                                <div className={styles.terminalEmpty}>
                                    Terminal is ready. Run some code to see output here.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomCodes;