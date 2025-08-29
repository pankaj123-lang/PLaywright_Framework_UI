import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './css/DatasetModal.module.css';

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
      setDatasetString(JSON.stringify(parsedData.dataset, null, 2));
    } else {
      navigate('/'); // Redirect if no data
    }
  }, [navigate]);

  const handleClose = () => {
    sessionStorage.removeItem('datasetModalContent');
    navigate(-1); // Go back to previous page
  };

  const handleChange = (e) => {
    setDatasetString(e.target.value);
    setError('');
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
            <button className={styles.saveButton} onClick={handleSave}>Save</button>
            <button className={styles.closeButton} onClick={handleClose}>×</button>
          </div>
        </div>
        {error && <div className={styles.errorMessage}>{error}</div>}
        <div className={styles.datasetModalBody}>
          <textarea
            className={styles.jsonEditor}
            value={datasetString}
            onChange={handleChange}
            spellCheck="false"
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  );
};

export default DatasetModal;