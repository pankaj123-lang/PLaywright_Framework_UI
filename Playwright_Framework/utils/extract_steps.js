const fs = require('fs');

function extractSteps(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const lines = data.split('\n');

        const steps = [];

        // Process each line individually to maintain order
        for (const line of lines) {
            const trimmedLine = line.trim();

            // Skip empty lines and non-await lines
            if (!trimmedLine.startsWith('await ')) continue;

            // Check for page actions
            const pageActionMatch = /await page\.(\w+)\((.*?)\);/.exec(trimmedLine);
            if (pageActionMatch) {
                const step = processPageAction(pageActionMatch[1], pageActionMatch[2]);
                if (step) steps.push(step);
                continue;
            }

            // Check for expect statements
            const expectMatch = /await expect\((page\..*?)\)\.(toBeVisible|toHaveText|toHaveValue|toBeHidden|toBeChecked|toBeDisabled|toBeEnabled|toHaveAttribute|toHaveClass|toHaveCount|toHaveCSS|toHaveId|toHaveJSProperty|toHaveScreenshot|toHaveTitle|toHaveURL|toContainText|toBeFocused|toBeEmpty|toBeEditable|not\.toBeChecked|not\.toHaveClass|not\.toBeVisible)\((.*?)\);/.exec(trimmedLine);
            if (expectMatch) {
                const step = processExpectStatement(expectMatch[1], expectMatch[2], expectMatch[3]);
                if (step) steps.push(step);
                continue;
            }
        }

        return steps;
    } catch (error) {
        console.error('Error reading or parsing the file:', error);
        return [];
    }
}

function processPageAction(action, params) {
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
                    .replace(/\.fill\(['"].*?['"]\)?/, '')
                    .replace(/['"]/g, '')
                    .replace(/\)$/, '');
            } else if (params.includes('.press')) {
                action = 'pressByText';
                const pressMatch = /.*\.press\(['"](.+?)['"]\)?/.exec(params);
                value = pressMatch ? pressMatch[1] : null;
                selector = params
                    .replace(/\.press\(['"].*?['"]\)?/, '')
                    .replace(/['"]/g, '')
                    .replace(/\)$/, '');
            }
            break;

        case 'getByRole':
            const fillMatch = /.*\.fill\(['"](.+?)['"]\)?/.exec(params);
            const roleTypeMatch = /^['"](.+?)['"]/.exec(params);
            const roleMatch = /{ name: ['"](.+?)['"] }/.exec(params);
            const clickMatch = /\.click\(/.exec(params);
            const pressMatch = /.*\.press\(['"](.+?)['"]\)?/.exec(params);
            const filterMatch = /\.filter\(({ hasText: \/\^(.*)?\$\/ })\)/.exec(params);

            if (clickMatch) {
                action = 'clickByRole';
                selector = roleMatch ? roleMatch[1] : null;
                options = roleTypeMatch ? roleTypeMatch[1] : null;

                if (filterMatch) {
                    action = 'filterClickByRole';
                    options = `${options}|filter:${filterMatch[2] || 'empty'}`;
                }
            } else if (fillMatch) {
                action = 'fillByRole';
                selector = roleMatch ? roleMatch[1] : null;
                value = fillMatch ? fillMatch[1] : null;
                options = roleTypeMatch ? roleTypeMatch[1] : null;

                if (filterMatch) {
                    action = 'filterFillByRole';
                    options = `${options}|filter:${filterMatch[2] || 'empty'}`;
                }
            } else if (pressMatch) {
                action = 'pressByRole';
                selector = roleMatch ? roleMatch[1] : null;
                value = pressMatch ? pressMatch[1] : null;
                options = roleTypeMatch ? roleTypeMatch[1] : null;

                if (filterMatch) {
                    action = 'filterPressByRole';
                    options = `${options}|filter:${filterMatch[2] || 'empty'}`;
                }
            } else {
                selector = roleMatch ? roleMatch[1] : null;
                options = roleTypeMatch ? roleTypeMatch[1] : null;

                if (filterMatch) {
                    action = 'filterClickByRole';
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
        // Add this case to your processPageAction function in the switch statement:

        case 'locator':
            const locatorClickMatch = /\.click\(\)/.exec(params);
            const locatorFillMatch = /.*\.fill\(['"](.+?)['"]\)/.exec(params);
            const locatorPressMatch = /.*\.press\(['"](.+?)['"]\)/.exec(params);
            const locatorFirstMatch = /\.first\(\)/.exec(params);
            const locatorLastMatch = /\.last\(\)/.exec(params);
            const locatorNthMatch = /\.nth\((\d+)\)/.exec(params);

            // Extract the base selector (remove quotes and actions)
            let baseSelector = null;
            const selectorMatch = /^['"](.+?)['"]/.exec(params);
            if (selectorMatch) {
                baseSelector = selectorMatch[1];
            } else {
                // Fallback: extract everything before the first dot that's not inside quotes
                const beforeFirstAction = params.split(/\.(click|fill|press|first|last|nth)/)[0];
                baseSelector = beforeFirstAction.replace(/['"]/g, '');
            }

            if (locatorClickMatch) {
                if (locatorFirstMatch) {
                    action = 'clickLocatorFirst';
                    selector = baseSelector;
                } else if (locatorLastMatch) {
                    action = 'clickLocatorLast';
                    selector = baseSelector;
                } else if (locatorNthMatch) {
                    action = 'clickLocatorNth';
                    selector = baseSelector;
                    options = locatorNthMatch[1]; // Store the nth index
                } else {
                    action = 'clickLocator';
                    selector = baseSelector;
                }
            } else if (locatorFillMatch) {
                if (locatorFirstMatch) {
                    action = 'fillLocatorFirst';
                    selector = baseSelector;
                    value = locatorFillMatch[1];
                } else if (locatorLastMatch) {
                    action = 'fillLocatorLast';
                    selector = baseSelector;
                    value = locatorFillMatch[1];
                } else if (locatorNthMatch) {
                    action = 'fillLocatorNth';
                    selector = baseSelector;
                    value = locatorFillMatch[1];
                    options = locatorNthMatch[1];
                } else {
                    action = 'fillLocator';
                    selector = baseSelector;
                    value = locatorFillMatch[1];
                }
            } else if (locatorPressMatch) {
                if (locatorFirstMatch) {
                    action = 'pressLocatorFirst';
                    selector = baseSelector;
                    value = locatorPressMatch[1];
                } else if (locatorLastMatch) {
                    action = 'pressLocatorLast';
                    selector = baseSelector;
                    value = locatorPressMatch[1];
                } else if (locatorNthMatch) {
                    action = 'pressLocatorNth';
                    selector = baseSelector;
                    value = locatorPressMatch[1];
                    options = locatorNthMatch[1];
                } else {
                    action = 'pressLocator';
                    selector = baseSelector;
                    value = locatorPressMatch[1];
                }
            } else {
                // Default to click if no specific action found
                if (locatorFirstMatch) {
                    action = 'clickLocatorFirst';
                    selector = baseSelector;
                } else if (locatorLastMatch) {
                    action = 'clickLocatorLast';
                    selector = baseSelector;
                } else if (locatorNthMatch) {
                    action = 'clickLocatorNth';
                    selector = baseSelector;
                    options = locatorNthMatch[1];
                } else {
                    action = 'clickLocator';
                    selector = baseSelector;
                }
            }
            break;

        default:
            console.log(`Unknown page action: ${action}`);
            return null;
    }

    return {
        execute: 'Y',
        action,
        selector,
        value,
        options
    };
}

function processExpectStatement(locatorPart, expectMethod, expectValue) {
    let action = null;
    let selector = null;
    let value = null;
    let options = null;

    // Clean up the expect value
    if (expectValue) {
        value = expectValue.replace(/^['"]|['"]$/g, ''); // Remove surrounding quotes
    }

    // Parse the locator part to determine the action type
    if (locatorPart.includes('page.locator(')) {
        // Handle: page.locator('h1')
        const locatorMatch = /page\.locator\(['"](.+?)['"]\)/.exec(locatorPart);
        action = getExpectActionName(expectMethod);
        selector = locatorMatch ? locatorMatch[1] : null;

    } else if (locatorPart.includes('page.getByText(')) {
        // Handle: page.getByText('some text')
        const textMatch = /page\.getByText\(['"](.+?)['"]\)/.exec(locatorPart);
        action = `${getExpectActionName(expectMethod)}ByText`;
        selector = textMatch ? textMatch[1] : null;

    } else if (locatorPart.includes('page.getByLabel(')) {
        // Handle: page.getByLabel('chatbot conversation').locator('h2')
        const labelMatch = /page\.getByLabel\(['"](.+?)['"]\)/.exec(locatorPart);
        const chainedLocatorMatch = /\.locator\(['"](.+?)['"]\)/.exec(locatorPart);
        
        if (chainedLocatorMatch) {
            action = `${getExpectActionName(expectMethod)}ByLabelChained`;
            selector = chainedLocatorMatch[1]; // h2 becomes selector
            options = labelMatch ? labelMatch[1] : null; // chatbot conversation becomes options
        } else {
            action = `${getExpectActionName(expectMethod)}ByLabel`;
            selector = labelMatch ? labelMatch[1] : null;
        }

    } else if (locatorPart.includes('page.getByRole(')) {
        // Handle: page.getByRole('button', { name: 'Submit' })
        const roleTypeMatch = /page\.getByRole\(['"](.+?)['"]/.exec(locatorPart);
        const roleNameMatch = /{ name: ['"](.+?)['"] }/.exec(locatorPart);

        action = `${getExpectActionName(expectMethod)}ByRole`;
        selector = roleNameMatch ? roleNameMatch[1] : null;
        options = roleTypeMatch ? roleTypeMatch[1] : null;

    } else if (locatorPart.includes('page.getByTestId(')) {
        // Handle: page.getByTestId('submit-button')
        const testIdMatch = /page\.getByTestId\(['"](.+?)['"]\)/.exec(locatorPart);
        action = `${getExpectActionName(expectMethod)}ByTestId`;
        selector = testIdMatch ? testIdMatch[1] : null;

    } else if (locatorPart.includes('page.getByPlaceholder(')) {
        // Handle: page.getByPlaceholder('Enter email')
        const placeholderMatch = /page\.getByPlaceholder\(['"](.+?)['"]\)/.exec(locatorPart);
        action = `${getExpectActionName(expectMethod)}ByPlaceholder`;
        selector = placeholderMatch ? placeholderMatch[1] : null;

    } else {
        // Fallback for other locator types
        action = getExpectActionName(expectMethod);
        selector = locatorPart.replace('page.', '');
    }

    return {
        execute: 'Y',
        action,
        selector,
        value,
        options
    };
}

function getExpectActionName(expectMethod) {
    const expectActionMap = {
        'toBeVisible': 'expectVisible',
        'toBeHidden': 'expectHidden',
        'toContainText': 'expectContainText',
        'toHaveText': 'expectHaveText',
        'toHaveValue': 'expectHaveValue',
        'toBeChecked': 'expectChecked',
        'toBeUnchecked': 'expectUnchecked',
        'toBeEnabled': 'expectEnabled',
        'toBeDisabled': 'expectDisabled',
        'toHaveAttribute': 'expectHaveAttribute',
        'toHaveClass': 'expectHaveClass',
        'toHaveCSS': 'expectHaveCSS',
        'toHaveCount': 'expectHaveCount',
        'toBeFocused': 'expectFocused',
        'toBeEmpty': 'expectEmpty',
        'toBeEditable': 'expectEditable',
        'toHaveScreenshot': 'expectScreenshot',
        'toHaveTitle': 'expectHaveTitle',
        'toHaveURL': 'expectHaveURL',
        'toHaveId': 'expectHaveId',
        'toHaveJSProperty': 'expectHaveJSProperty'
    };

    return expectActionMap[expectMethod] || 'expectGeneric';
}

module.exports = { extractSteps };



// Example usage
// const steps = extractSteps('../tests/recorder.spec.ts');
// console.log(steps);