import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './css/DatasetModal.module.css';
import AceEditor from "react-ace";

// Import required ace modules
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/ext-searchbox";
import "ace-builds/src-noconflict/ext-beautify";

const DatasetModal = () => {
  const [modalData, setModalData] = useState({ project: '', test: '', dataset: {} });
  const [datasetString, setDatasetString] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedData = sessionStorage.getItem('datasetModalContent');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      setModalData(parsedData);
      // Format the JSON with proper indentation
      setDatasetString(JSON.stringify(parsedData.dataset, null, 2));
    } else {
      navigate('/'); // Redirect if no data
    }
  }, [navigate]);

  const handleClose = () => {
    sessionStorage.removeItem('datasetModalContent');
    navigate(-1); // Go back to previous page
  };

  const handleChange = (value) => {
    setDatasetString(value);
    setError('');
  };

  const formatJson = () => {
    try {
      // Parse and re-stringify to format
      const parsedJson = JSON.parse(datasetString);
      setDatasetString(JSON.stringify(parsedJson, null, 2));
      setError('');
    } catch (err) {
      setError(`Invalid JSON: ${err.message}`);
    }
  };

  const handleSave = async () => {
    try {
      // Validate JSON
      const parsedDataset = JSON.parse(datasetString);
      
      // Save to backend
      const response = await fetch('http://localhost:5000/api/saveDataset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project: modalData.project,
          test: modalData.test,
          dataset: parsedDataset
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        alert('Dataset saved successfully!');
        // Update sessionStorage with the new dataset
        sessionStorage.setItem('datasetModalContent', JSON.stringify({
          ...modalData,
          dataset: parsedDataset
        }));
      } else {
        setError(`Failed to save dataset: ${result.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      setError(`Invalid JSON format: ${err.message}`);
    }
  };

  return (
    <div className={styles.datasetModalOverlay}>
      <div className={styles.datasetModal}>
        <div className={styles.datasetModalHeader}>
          <h2>Dataset for {modalData.project} - {modalData.test}</h2>
          <div className={styles.buttonGroup}>
            <button className={styles.formatButton} onClick={formatJson}>Format JSON</button>
            <button className={styles.saveButton} onClick={handleSave}>Save</button>
            <button className={styles.closeButton} onClick={handleClose}>×</button>
          </div>
        </div>
        {error && <div className={styles.errorMessage}>{error}</div>}
        <div className={styles.datasetModalBody}>
          <AceEditor
            className={styles.aceEditor}
            mode="json"
            theme="monokai"
            value={datasetString}
            onChange={handleChange}
            name="dataset_editor"
            width="100%"
            height="77vh"
            fontSize={14}
            showPrintMargin={false}
            highlightActiveLine={true}
            editorProps={{ $blockScrolling: true }}
            setOptions={{
              useWorker: false, // Enable worker for syntax checking
              enableBasicAutocompletion: true,
              enableLiveAutocompletion: true,
              enableSnippets: true,
              showLineNumbers: true,
              tabSize: 2,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default DatasetModal;