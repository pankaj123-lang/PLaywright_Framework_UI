import React, { useState, useEffect , useRef} from "react";
import { FaTimes, FaPlay, FaChevronDown, FaCheck } from 'react-icons/fa';
import styles from "./css/TagsModal.module.css";

export default function TagsModal({ isOpen, onClose, onRunTests }) {
    const [selectedTags, setSelectedTags] = useState([]);
    const [runType, setRunType] = useState('tests');
    const [selectedProjects, setSelectedProjects] = useState([]);
    const [availableProjects, setAvailableProjects] = useState([]);
    const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const [availableTags] = useState([
        'smoke', 'regression', 'critical', 'integration', 'unit', 'e2e',
        'api', 'ui', 'performance', 'security', 'accessibility', 'sanity',
        'functional', 'load', 'stress', 'cross-browser'
    ]);

    // Fetch available projects when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchProjects();
        }
    }, [isOpen]);
    useEffect(() => {
        function handleClickOutside(event) {
          if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsProjectDropdownOpen(false);
          }
          
        }
    
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }, []);

    const fetchProjects = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/folders');
            if (response.ok) {
                const projects = await response.json();
                setAvailableProjects(projects);
                console.log('Fetched projects:', projects);
            } else {
                console.error('Failed to fetch projects');
                setAvailableProjects({});
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
            setAvailableProjects({});
        }
    };

    const handleProjectToggle = (projectName) => {
        setSelectedProjects(prev =>
            prev.includes(projectName)
                ? prev.filter(p => p !== projectName)
                : [...prev, projectName]
        );
    };

    const handleTagToggle = (tag) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const handleSelectAllProjects = () => {
        const allProjectNames = Object.keys(availableProjects);
        if (selectedProjects.length === allProjectNames.length) {
            setSelectedProjects([]);
        } else {
            setSelectedProjects([...allProjectNames]);
        }
    };

    const handleRunTests = () => {
        if (selectedTags.length === 0) {
            alert('Please select at least one tag');
            return;
        }

        if (selectedProjects.length === 0) {
            alert(`Please select at least one project for ${runType === 'tests' ? 'individual tests' : 'test suites'}`);
            return;
        }

        const runData = {
            tags: selectedTags,
            runType,
            projects: selectedProjects
        };

        console.log('Sending run data:', runData); // Debug log
        onRunTests(runData);
        onClose();
    };

    const handleReset = () => {
        setSelectedTags([]);
        setSelectedProjects([]);
        setRunType('tests');
    };

    const handleRunTypeChange = (type) => {
        setRunType(type);
        // Don't clear projects when switching between types
        // Users might want to run the same projects as tests or suites
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.tagsModal}>
                <div className={styles.tagsModalHeader}>
                    <h3>Run Tests/Suites by Tags</h3>
                    <button className={styles.closeButton} onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <div className={styles.tagsModalContent}>
                    {/* Run Type Selection */}
                    <div className={styles.runTypeSection}>
                        <h4>Select Run Type:</h4>
                        <div className={styles.runTypeOptions}>
                            <label className={styles.radioOption}>
                                <input
                                    type="radio"
                                    value="tests"
                                    checked={runType === 'tests'}
                                    onChange={(e) => handleRunTypeChange(e.target.value)}
                                />
                                <span>Individual Tests</span>
                                {/* <small className={styles.optionDescription}>
                                    Run specific tests with matching tags within selected projects
                                </small> */}
                            </label>
                            <label className={styles.radioOption}>
                                <input
                                    type="radio"
                                    value="suites"
                                    checked={runType === 'suites'}
                                    onChange={(e) => handleRunTypeChange(e.target.value)}
                                />
                                <span>Test Suites</span>
                                {/* <small className={styles.optionDescription}>
                                    Run entire project suites that contain tests with matching tags
                                </small> */}
                            </label>
                        </div>
                    </div>

                    {/* Project Selection - Show for both tests and suites */}
                    <div className={styles.projectSection}>
                        <h4>
                            Select Projects:
                            <span className={styles.sectionSubtitle}>
                                {runType === 'tests' 
                                    ? 'Choose projects to search for tagged tests' 
                                    : 'Choose project suites to run if they contain tagged tests'
                                }
                            </span>
                        </h4>
                        <div className={styles.projectSelector} ref={dropdownRef}>
                            <button
                                className={styles.projectDropdownToggle}
                                onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                            >
                                <span>
                                    {selectedProjects.length === 0
                                        ? 'Select projects...'
                                        : selectedProjects.length === Object.keys(availableProjects).length
                                            ? 'All projects selected'
                                            : `${selectedProjects.length} project(s) selected`
                                    }
                                </span>
                                <FaChevronDown
                                    className={`${styles.chevron} ${isProjectDropdownOpen ? styles.chevronUp : ''}`}
                                />
                            </button>

                            {isProjectDropdownOpen && (
                                <div className={styles.projectDropdown}>
                                    <div className={styles.projectDropdownHeader}>
                                        <button
                                            className={styles.selectAllButton}
                                            onClick={handleSelectAllProjects}
                                        >
                                            <FaCheck className={styles.checkIcon} />
                                            {selectedProjects.length === Object.keys(availableProjects).length ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>

                                    <div className={styles.projectList}>
                                        {Object.entries(availableProjects).map(([folderName, folderData]) => (
                                            <label key={folderName} className={styles.projectOption}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedProjects.includes(folderName)}
                                                    onChange={() => handleProjectToggle(folderName)}
                                                />
                                                <span className={styles.projectName}>
                                                    {folderName}
                                                    {folderData?.tests && (
                                                        <span className={styles.testCount}>
                                                            ({folderData.tests.length} tests)
                                                        </span>
                                                    )}
                                                </span>
                                                {selectedProjects.includes(folderName) && (
                                                    <FaCheck className={styles.selectedIcon} />
                                                )}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Selected Projects Display */}
                        {selectedProjects.length > 0 && (
                            <div className={styles.selectedProjectsSection}>
                                <div className={styles.selectedProjects}>
                                    {selectedProjects.map(project => (
                                        <span key={project} className={styles.selectedProject}>
                                            {project}
                                            <button
                                                className={styles.removeProjectButton}
                                                onClick={() => handleProjectToggle(project)}
                                                title={`Remove ${project}`}
                                            >
                                                <FaTimes />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tags Selection */}
                    <div className={styles.tagsSection}>
                        <h4>Select Tags:</h4>
                        <div className={styles.tagsGrid}>
                            {availableTags.map(tag => (
                                <button
                                    key={tag}
                                    className={`${styles.tagButton} ${selectedTags.includes(tag) ? styles.tagSelected : ''}`}
                                    onClick={() => handleTagToggle(tag)}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Selected Tags Display */}
                    {selectedTags.length > 0 && (
                        <div className={styles.selectedTagsSection}>
                            <h4>Selected Tags ({selectedTags.length}):</h4>
                            <div className={styles.selectedTags}>
                                {selectedTags.map(tag => (
                                    <span key={tag} className={styles.selectedTag}>
                                        {tag}
                                        <button
                                            className={styles.removeTagButton}
                                            onClick={() => handleTagToggle(tag)}
                                        >
                                            <FaTimes />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Execution Summary */}
                    {selectedTags.length > 0 && selectedProjects.length > 0 && (
                        <div className={styles.executionSummary}>
                            <h4>Execution Summary:</h4>
                            <div className={styles.summaryContent}>
                                <div className={styles.summaryItem}>
                                    <strong>Run Type:</strong> {runType === 'tests' ? 'Individual Tests' : 'Test Suites'}
                                </div>
                                <div className={styles.summaryItem}>
                                    <strong>Tags:</strong> {selectedTags.join(', ')}
                                </div>
                                <div className={styles.summaryItem}>
                                    <strong>Projects:</strong> {selectedProjects.join(', ')}
                                </div>
                                <div className={styles.summaryItem}>
                                    <strong>Action:</strong> 
                                    {runType === 'tests' 
                                        ? ' Find and run individual tests with matching tags in selected projects'
                                        : ' Run entire project suites that contain tests with matching tags'
                                    }
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.tagsModalFooter}>
                    <button className={styles.resetButton} onClick={handleReset}>
                        Reset
                    </button>
                    <button
                        className={styles.runButton}
                        onClick={handleRunTests}
                        disabled={
                            selectedTags.length === 0 ||
                            selectedProjects.length === 0
                        }
                    >
                        <FaPlay />
                        Run {runType === 'tests' ? 'Individual Tests' : 'Test Suites'}
                        <span className={styles.buttonDetails}>
                            ({selectedTags.length} tags, {selectedProjects.length} projects)
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}