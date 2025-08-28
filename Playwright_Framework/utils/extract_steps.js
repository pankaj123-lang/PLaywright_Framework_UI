const fs = require('fs');

function extractSteps(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const regex = /await page\.(\w+)\((.*?)\);/g;
        const steps = [];
        let match;

        while ((match = regex.exec(data)) !== null) {
            let action = match[1];
            let params = match[2];
            let selector = null;
            let value = null;
            let options = null;

            switch (action) {
                case 'goto':
                    value = params.replace(/['"]/g, '');
                    break;

                case 'getByText':
                    if (params.includes('.click')) {
                        action = 'clickByText';
                        selector = params.replace(/['"]/g, '').replace(').click(', '');
                    } else if (params.includes('.fill')) {
                        action = 'fillByText';
                        const fillMatch = /.*\.fill\(['"](.+?)['"]\)?/.exec(params);
                        value = fillMatch ? fillMatch[1] : null;
                        selector = params
                            .replace(/\.fill\(['"].*?['"]\)?/, '') // Remove .fill(...)
                            .replace(/['"]/g, '')                 // Remove quotes
                            .replace(/\)$/, '');                  // Remove trailing )
                    } else if (params.includes('.press')) {
                        action = 'pressByText';
                        const pressMatch = /.*\.press\(['"](.+?)['"]\)?/.exec(params);
                        value = pressMatch ? pressMatch[1] : null;
                        selector = params
                            .replace(/\.press\(['"].*?['"]\)?/, '') // Remove .press(...)
                            .replace(/['"]/g, '')                    // Remove quotes
                            .replace(/\)$/, '');                     // Remove trailing )
                    }
                    break;

                case 'getByRole':
                    // console.log(`Processing action: ${action} with params: ${params}`);
                    const fillMatch = /.*\.fill\(['"](.+?)['"]\)?/.exec(params);
                    const roleTypeMatch = /^['"](.+?)['"]/.exec(params); // Match role type (e.g., 'textbox')
                    const roleMatch = /{ name: ['"](.+?)['"] }/.exec(params); // Match selector (e.g., { name: 'Email address*' })
                    const clickMatch = /\.click\(/.exec(params);
                    const pressMatch = /.*\.press\(['"](.+?)['"]\)?/.exec(params);
                    const filterMatch = /\.filter\(({ hasText: \/\^(.*)?\$\/ })\)/.exec(params); // Match filter patterns

                    if (clickMatch) {
                        action = 'clickByRole';
                        selector = roleMatch ? roleMatch[1] : null;
                        options = roleTypeMatch ? roleTypeMatch[1] : null;

                        if (filterMatch) {
                            // For empty text filter like /^$/
                            action = 'filterClickByRole';
                            options = `${options}|filter:${filterMatch[2] || 'empty'}`;
                        }
                    } else if (fillMatch) {
                        action = 'fillByRole';
                        selector = roleMatch ? roleMatch[1] : null;
                        value = fillMatch ? fillMatch[1] : null;
                        options = roleTypeMatch ? roleTypeMatch[1] : null;

                        if (filterMatch) {
                            // For empty text filter like /^$/
                            action = 'filterFillByRole';
                            options = `${options}|filter:${filterMatch[2] || 'empty'}`;
                        }
                    } else if (pressMatch) {
                        action = 'pressByRole';
                        selector = roleMatch ? roleMatch[1] : null;
                        value = pressMatch ? pressMatch[1] : null;
                        options = roleTypeMatch ? roleTypeMatch[1] : null;

                        if (filterMatch) {
                            // For empty text filter like /^$/
                            action = 'filterPressByRole';
                            options = `${options}|filter:${filterMatch[2] || 'empty'}`;
                        }
                    } else {
                        selector = roleMatch ? roleMatch[1] : null;
                        options = roleTypeMatch ? roleTypeMatch[1] : null;

                        if (filterMatch) {
                            // For empty text filter like /^$/
                            action = 'filterClickByRole'; // Default to click if no specific action
                            options = `${options}|filter:${filterMatch[2] || 'empty'}`;
                        }
                    }
                    break;
                case 'getByLabel':
                    const labelFillMatch = /.*\.fill\(['"](.+?)['"]\)?/.exec(params);
                    const labelClickMatch = /\.click\(/.exec(params);
                    const labelPressMatch = /.*\.press\(['"](.+?)['"]\)?/.exec(params);

                    if (labelClickMatch) {
                        action = 'clickByLabel';
                        selector = params.replace(/['"]/g, '').replace(').click(', '');
                    } else if (labelFillMatch) {
                        action = 'fillByLabel';
                        selector = params.replace(/\.fill\(['"].*?['"]\)?/, '')
                            .replace(/['"]/g, '')
                            .replace(/\)$/, '');
                        value = labelFillMatch ? labelFillMatch[1] : null;
                    } else if (labelPressMatch) {
                        action = 'pressByLabel';
                        selector = params.replace(/\.press\(['"].*?['"]\)?/, '')
                            .replace(/['"]/g, '')
                            .replace(/\)$/, '');
                        value = labelPressMatch ? labelPressMatch[1] : null;
                    } else {
                        selector = params.replace(/['"]/g, '').replace(/\)$/, '');
                    }
                    break;
                case 'getByPlaceholder':
                    const placeholderFillMatch = /.*\.fill\(['"](.+?)['"]\)?/.exec(params);
                    const placeholderClickMatch = /\.click\(/.exec(params);
                    const placeholderPressMatch = /.*\.press\(['"](.+?)['"]\)?/.exec(params);

                    if (placeholderClickMatch) {
                        action = 'clickByPlaceholder';
                        selector = params.replace(/['"]/g, '').replace(').click(', '');
                    } else if (placeholderFillMatch) {
                        action = 'fillByPlaceholder';
                        selector = params.replace(/\.fill\(['"].*?['"]\)?/, '')
                            .replace(/['"]/g, '')
                            .replace(/\)$/, '');
                        value = placeholderFillMatch ? placeholderFillMatch[1] : null;
                    } else if (placeholderPressMatch) {
                        action = 'pressByPlaceholder';
                        selector = params.replace(/\.press\(['"].*?['"]\)?/, '')
                            .replace(/['"]/g, '')
                            .replace(/\)$/, '');
                        value = placeholderPressMatch ? placeholderPressMatch[1] : null;
                    } else {
                        selector = params.replace(/['"]/g, '').replace(/\)$/, '');
                    }
                    break;
                case 'getByTestId':
                    const testIdFillMatch = /.*\.fill\(['"](.+?)['"]\)?/.exec(params);
                    const testIdClickMatch = /\.click\(/.exec(params);
                    const testIdPressMatch = /.*\.press\(['"](.+?)['"]\)?/.exec(params);

                    if (testIdClickMatch) {
                        action = 'clickByTestId';
                        // Extract the test ID from params (before .click)
                        selector = params.split(').click(')[0].replace(/['"]/g, '');
                    } else if (testIdFillMatch) {
                        action = 'fillByTestId';
                        selector = params.split('.fill')[0].replace(/['"]/g, '');
                        value = testIdFillMatch ? testIdFillMatch[1] : null;
                    } else if (testIdPressMatch) {
                        action = 'pressByTestId';
                        selector = params.split('.press')[0].replace(/['"]/g, '');
                        value = testIdPressMatch ? testIdPressMatch[1] : null;
                    } else {
                        selector = params.replace(/['"]/g, '').replace(/\)$/, '');
                    }
                    break;

                default:
                    console.log(`Unknown action: ${action}`);
                    break;
            }

            const step = {
                execute: 'Y', // Assuming all steps are to be executed
                action,
                selector,
                value,
                options
            };
            steps.push(step);
        }

        return steps;
    } catch (error) {
        console.error('Error reading or parsing the file:', error);
        return [];
    }
}

module.exports = { extractSteps };

// Example usage
// const steps = extractSteps('../tests/recorder.spec.ts');
// console.log(steps);