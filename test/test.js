// Basic Test Runner
let testsRun = 0;
let testsPassed = 0;

// Make test functions available globally for the test runner
window.testsRun = testsRun;
window.testsPassed = testsPassed;
window.testStringNodeCreationAndEdit = testStringNodeCreationAndEdit;
window.testNumberNodeCreationAndEdit = testNumberNodeCreationAndEdit;
window.testArrayNodeCreationAndEdit = testArrayNodeCreationAndEdit;
window.testObjectNodeCreationAndEdit = testObjectNodeCreationAndEdit;
window.testNestedNodeCreation = testNestedNodeCreation;
window.reportResults = reportResults;

function assert(condition, message) {
    testsRun++;
    window.testsRun = testsRun;
    const resultsElement = document.getElementById('test-results');
    const div = document.createElement('div');
    if (condition) {
        testsPassed++;
        window.testsPassed = testsPassed;
        div.textContent = `PASS: ${message}`;
        div.className = 'test-pass';
    } else {
        div.textContent = `FAIL: ${message}`;
        div.className = 'test-fail';
        console.error(`Assertion Failed: ${message}`);
    }
    resultsElement.appendChild(div);
}

function reportResults() {
    const resultsElement = document.getElementById('test-results');
    const summary = document.createElement('h3');
    summary.textContent = `Tests completed: ${testsPassed} / ${testsRun} passed.`;
    resultsElement.appendChild(summary);
    console.log(`Tests completed: ${testsPassed} / ${testsRun} passed.`);
}

// Helper function to set form values
function setFormValues(values) {
    for (const id in values) {
        const element = document.getElementById(id);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = values[id];
            } else {
                element.value = values[id];
            }
            // Trigger change event for select elements to update field visibility
            if (element.tagName === 'SELECT') {
                element.dispatchEvent(new Event('change'));
            }
        } else {
            console.warn(`Element with id "${id}" not found in form.`);
        }
    }
}

// Helper function to reset the schema and state for tests
function resetTestState() {
    // Access schema and state via window as they are not directly exported
    window.schema = {
        "type": "object",
        "properties": {},
        "required": [],
        "$schema": "https://json-schema.org/draft/2020-12/schema"
    };
    window.state = {
        currentNode: window.schema,
        selectedNode: null,
        parentNode: null, // Should be root initially
        currentOperation: 'add',
        isFormatted: true,
        currentView: 'edit'
    };
     // Ensure the form is reset visually and functionally
    if (window.resetForm) {
        window.resetForm();
    } else {
        console.error("resetForm function not found on window.");
    }
    // Reset tree view and preview if needed (optional for logic tests)
    // if (window.updateTreeView) window.updateTreeView();
}

// --- Test Cases ---

function testStringNodeCreationAndEdit() {
    console.log("--- Running String Node Tests ---");
    resetTestState();

    // 1. Create String Node
    setFormValues({
        title: 'testString',
        description: 'A test string',
        type: 'string',
        minLength: '5',
        maxLength: '10',
        pattern: '^[a-z]+$',
        default: 'abcde',
        required: true
    });
    window.addOrEditNode(true); // Add node

    let addedNode = window.schema.properties.testString;
    assert(addedNode, 'String node "testString" should be added');
    assert(addedNode.type === 'string', 'String node type should be "string"');
    assert(addedNode.description === 'A test string', 'String node description should be set');
    assert(addedNode.minLength === 5, `String node minLength should be 5, got ${addedNode.minLength}`);
    assert(addedNode.maxLength === 10, `String node maxLength should be 10, got ${addedNode.maxLength}`);
    assert(addedNode.pattern === '^[a-z]+$', `String node pattern should be set, got ${addedNode.pattern}`);
    assert(addedNode.default === 'abcde', `String node default should be set, got ${addedNode.default}`);
    assert(window.schema.required && window.schema.required.includes('testString'), 'String node should be required');

    // 2. Select the String Node for Editing
    window.selectNode('testString', addedNode, window.schema);
    assert(document.getElementById('title').value === 'testString', 'Form title should be populated');
    assert(document.getElementById('description').value === 'A test string', 'Form description should be populated');
    assert(document.getElementById('type').value === 'string', 'Form type should be populated');
    assert(document.getElementById('minLength').value === '5', `Form minLength should be populated, got ${document.getElementById('minLength').value}`);
    assert(document.getElementById('maxLength').value === '10', `Form maxLength should be populated, got ${document.getElementById('maxLength').value}`);
    assert(document.getElementById('pattern').value === '^[a-z]+$', `Form pattern should be populated, got ${document.getElementById('pattern').value}`);
    assert(document.getElementById('default').value === 'abcde', `Form default should be populated, got ${document.getElementById('default').value}`);
    assert(document.getElementById('required').checked === true, 'Form required checkbox should be checked');

    // 3. Edit the String Node
    setFormValues({
        title: 'testStringEdited', // Change key
        description: 'An edited string',
        minLength: '6',
        maxLength: '', // Remove maxLength
        required: false // Make not required
    });
    window.addOrEditNode(false); // Edit node

    assert(!window.schema.properties.testString, 'Old key "testString" should be removed after edit');
    let editedNode = window.schema.properties.testStringEdited;
    assert(editedNode, 'Edited string node "testStringEdited" should exist');
    assert(editedNode.description === 'An edited string', 'Edited description should be updated');
    assert(editedNode.minLength === 6, `Edited minLength should be 6, got ${editedNode.minLength}`);
    assert(editedNode.maxLength === undefined, `Edited maxLength should be undefined, got ${editedNode.maxLength}`);
    assert(editedNode.pattern === '^[a-z]+$', 'Pattern should persist after edit'); // Pattern wasn't changed
    assert(!window.schema.required || !window.schema.required.includes('testStringEdited'), 'Edited node should not be required');
    console.log("--- String Node Tests Complete ---");
}

function testNumberNodeCreationAndEdit() {
    console.log("--- Running Number Node Tests ---");
    resetTestState();

    // 1. Create Number Node
    setFormValues({
        title: 'testNumber',
        type: 'number',
        minimum: '0',
        maximum: '100',
        exclusiveMinimum: '10',
        exclusiveMaximum: '90',
        default: '50',
        required: false
    });
    window.addOrEditNode(true);

    let addedNode = window.schema.properties.testNumber;
    assert(addedNode && addedNode.type === 'number', 'Number node "testNumber" should be added');
    assert(addedNode.minimum === 0, `Number node minimum should be 0, got ${addedNode.minimum}`);
    assert(addedNode.maximum === 100, `Number node maximum should be 100, got ${addedNode.maximum}`);
    assert(addedNode.exclusiveMinimum === 10, `Number node exclusiveMinimum should be 10, got ${addedNode.exclusiveMinimum}`);
    assert(addedNode.exclusiveMaximum === 90, `Number node exclusiveMaximum should be 90, got ${addedNode.exclusiveMaximum}`);
    assert(addedNode.default === 50, `Number node default should be 50, got ${addedNode.default}`);
    assert(!window.schema.required || !window.schema.required.includes('testNumber'), 'Number node should not be required initially');

    // 2. Select Number Node
    window.selectNode('testNumber', addedNode, window.schema);
    assert(document.getElementById('minimum').value === '0', `Form minimum should be populated, got ${document.getElementById('minimum').value}`);
    assert(document.getElementById('maximum').value === '100', `Form maximum should be populated, got ${document.getElementById('maximum').value}`);
    assert(document.getElementById('exclusiveMinimum').value === '10', `Form exclusiveMinimum should be populated, got ${document.getElementById('exclusiveMinimum').value}`);
    assert(document.getElementById('exclusiveMaximum').value === '90', `Form exclusiveMaximum should be populated, got ${document.getElementById('exclusiveMaximum').value}`);
    assert(document.getElementById('default').value === '50', `Form default should be populated, got ${document.getElementById('default').value}`);
    assert(document.getElementById('required').checked === false, 'Form required checkbox should be unchecked');

    // 3. Edit Number Node
    setFormValues({
        minimum: '', // Remove minimum
        exclusiveMinimum: '5',
        required: true // Make required
    });
    window.addOrEditNode(false);

    editedNode = window.schema.properties.testNumber;
    assert(editedNode.minimum === undefined, `Edited minimum should be undefined, got ${editedNode.minimum}`);
    assert(editedNode.exclusiveMinimum === 5, `Edited exclusiveMinimum should be 5, got ${editedNode.exclusiveMinimum}`);
    assert(window.schema.required && window.schema.required.includes('testNumber'), 'Edited number node should now be required');
    console.log("--- Number Node Tests Complete ---");
}


function testArrayNodeCreationAndEdit() {
    console.log("--- Running Array Node Tests ---");
    resetTestState();

    // 1. Create Array Node
    setFormValues({
        title: 'testArray',
        type: 'array',
        description: 'List of numbers',
        minItems: '1',
        maxItems: '5',
        'item-type': 'number', // Set item type via select change event
        required: true
    });
    window.addOrEditNode(true);

    let addedNode = window.schema.properties.testArray;
    assert(addedNode && addedNode.type === 'array', 'Array node "testArray" should be added');
    assert(addedNode.description === 'List of numbers', 'Array description should be set');
    assert(addedNode.minItems === 1, `Array minItems should be 1, got ${addedNode.minItems}`);
    assert(addedNode.maxItems === 5, `Array maxItems should be 5, got ${addedNode.maxItems}`);
    assert(addedNode.items && addedNode.items.type === 'number', 'Array items type should be number');
    assert(window.schema.required && window.schema.required.includes('testArray'), 'Array node should be required');

    // 2. Select Array Node
    window.selectNode('testArray', addedNode, window.schema);
    assert(document.getElementById('minItems').value === '1', `Form minItems should be populated, got ${document.getElementById('minItems').value}`);
    assert(document.getElementById('maxItems').value === '5', `Form maxItems should be populated, got ${document.getElementById('maxItems').value}`);
    assert(document.getElementById('item-type').value === 'number', `Form item-type should be populated, got ${document.getElementById('item-type').value}`);
    assert(document.getElementById('required').checked === true, 'Form required checkbox should be checked');

    // 3. Edit Array Node
    setFormValues({
        minItems: '2',
        maxItems: '', // Remove maxItems
        required: false
    });
    window.addOrEditNode(false);

    editedNode = window.schema.properties.testArray;
    assert(editedNode.minItems === 2, `Edited minItems should be 2, got ${editedNode.minItems}`);
    assert(editedNode.maxItems === undefined, `Edited maxItems should be undefined, got ${editedNode.maxItems}`);
    assert(!window.schema.required || !window.schema.required.includes('testArray'), 'Edited array node should not be required');
    console.log("--- Array Node Tests Complete ---");
}

function testObjectNodeCreationAndEdit() {
    console.log("--- Running Object Node Tests ---");
    resetTestState();

     // 1. Create Object Node
    setFormValues({
        title: 'testObject',
        type: 'object',
        description: 'User details',
        minProperties: '1',
        maxProperties: '3',
        required: false
    });
    window.addOrEditNode(true);

    let addedNode = window.schema.properties.testObject;
    assert(addedNode && addedNode.type === 'object', 'Object node "testObject" should be added');
    assert(addedNode.description === 'User details', 'Object description should be set');
    assert(addedNode.minProperties === 1, `Object minProperties should be 1, got ${addedNode.minProperties}`);
    assert(addedNode.maxProperties === 3, `Object maxProperties should be 3, got ${addedNode.maxProperties}`);
    assert(addedNode.properties && Object.keys(addedNode.properties).length === 0, 'Object properties should be initialized as empty');
    assert(!addedNode.required || addedNode.required.length === 0, 'Object required array should be initialized as empty or undefined');
    assert(!window.schema.required || !window.schema.required.includes('testObject'), 'Object node should not be required initially');

    // 2. Select Object Node
    window.selectNode('testObject', addedNode, window.schema);
    assert(document.getElementById('minProperties').value === '1', `Form minProperties should be populated, got ${document.getElementById('minProperties').value}`);
    assert(document.getElementById('maxProperties').value === '3', `Form maxProperties should be populated, got ${document.getElementById('maxProperties').value}`);
    assert(document.getElementById('required').checked === false, 'Form required checkbox should be unchecked');

    // 3. Edit Object Node
    setFormValues({
        minProperties: '2',
        maxProperties: '', // Remove maxProperties
        required: true
    });
    window.addOrEditNode(false);

    editedNode = window.schema.properties.testObject;
    assert(editedNode.minProperties === 2, `Edited minProperties should be 2, got ${editedNode.minProperties}`);
    assert(editedNode.maxProperties === undefined, `Edited maxProperties should be undefined, got ${editedNode.maxProperties}`);
    assert(window.schema.required && window.schema.required.includes('testObject'), 'Edited object node should now be required');
    console.log("--- Object Node Tests Complete ---");
}

function testNestedNodeCreation() {
    console.log("--- Running Nested Node Tests ---");
    resetTestState();

    // 1. Create parent object
    setFormValues({ title: 'parent', type: 'object', required: true });
    window.addOrEditNode(true);
    assert(window.schema.properties.parent && window.schema.properties.parent.type === 'object', 'Parent object created');
    assert(window.schema.required && window.schema.required.includes('parent'), 'Parent object is required');

    // 2. Create nested string inside parent
    // Simulate selecting the parent node to set the context for adding child
    window.selectNode('parent', window.schema.properties.parent, window.schema);
    setFormValues({
        title: 'parent.childString', // Use dot notation for nesting
        type: 'string',
        minLength: '1',
        required: true // Mark child as required within parent
    });
    window.addOrEditNode(true); // Add nested node

    let parentNode = window.schema.properties.parent;
    let childNode = parentNode.properties.childString;
    assert(childNode && childNode.type === 'string', 'Nested string "childString" created');
    assert(childNode.minLength === 1, `Nested string minLength should be 1, got ${childNode.minLength}`);
    assert(parentNode.required && parentNode.required.includes('childString'), 'Nested string should be required within parent');

    // 3. Create nested object inside parent
    window.selectNode('parent', window.schema.properties.parent, window.schema); // Reselect parent
    setFormValues({
        title: 'parent.childObject',
        type: 'object',
        required: false
    });
    window.addOrEditNode(true);
    let childObject = parentNode.properties.childObject;
    assert(childObject && childObject.type === 'object', 'Nested object "childObject" created');
    assert(!parentNode.required || !parentNode.required.includes('childObject'), 'Nested object should not be required within parent');

    // 4. Create deeply nested property
    window.selectNode('childObject', childObject, parentNode); // Select childObject
    setFormValues({
        title: 'parent.childObject.grandChild',
        type: 'number',
        required: true
    });
    window.addOrEditNode(true);
    let grandChildNode = childObject.properties.grandChild;
    assert(grandChildNode && grandChildNode.type === 'number', 'Grandchild node created');
    assert(childObject.required && childObject.required.includes('grandChild'), 'Grandchild node should be required within childObject');

    console.log("--- Nested Node Tests Complete ---");
}


// Run tests after DOM is ready and scripts are loaded
document.addEventListener('DOMContentLoaded', () => {
    // Need a slight delay to ensure the module script has initialized
    setTimeout(() => {
        // Check if necessary functions are available on window
        if (typeof window.addOrEditNode !== 'function' || typeof window.selectNode !== 'function' || typeof window.resetForm !== 'function') {
             console.error("Required functions (addOrEditNode, selectNode, resetForm) not found on window object. Ensure src/index.js exposes them or adjust test setup.");
             resultsElement.innerHTML = '<div class="test-fail">Test setup error: Required functions not found. Check console.</div>';
             return;
        }

        try {
            testStringNodeCreationAndEdit();
            testNumberNodeCreationAndEdit();
            testArrayNodeCreationAndEdit();
            testObjectNodeCreationAndEdit();
            testNestedNodeCreation();
        } catch (error) {
            console.error("Error during test execution:", error);
            const div = document.createElement('div');
            div.textContent = `FATAL ERROR during tests: ${error.message}`;
            div.className = 'test-fail';
            resultsElement.appendChild(div);
        } finally {
            reportResults();
        }
    }, 100); // Adjust delay if needed
});
