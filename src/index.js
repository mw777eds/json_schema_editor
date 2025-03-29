let schema = {
    "type": "object",
    "properties": {},
    "required": [],
    "additionalProperties": false,
    "$schema": "https://json-schema.org/draft/2020-12/schema"
};

// Expose schema and functions for testing
window.schema = schema;

/* 
 * Event listener for the "Apply Pasted Schema" button.
 */
document.getElementById('apply-pasted-schema').onclick = () => {
    const pastedSchema = document.getElementById('paste-schema').value;
    applySchemaFromString(pastedSchema);
};

window.applySchemaFromString = applySchemaFromString;

let state = {
    currentNode: schema,
    selectedNode: null,
    parentNode: null,
    currentOperation: 'add',
    isFormatted: true, // Set to true as the JSON is formatted
    currentView: 'edit' // Default view is 'edit'
};

/* 
 * Updates the tree view, expands all nodes, and updates the preview.
 */
function updateTreeView() {
    const treeView = document.getElementById('schema-tree');
    treeView.innerHTML = '';
    renderNode(schema, treeView, schema.title || 'root', null);
    expandAllNodes();
    updatePreview();
}

/* 
 * Expands all nodes in the tree view.
 */
function expandAllNodes() {
    document.querySelectorAll('.tree-node').forEach(node => {
        node.classList.add('expanded');
    });
}

/* 
 * Renders a node in the tree view.
 */
function renderNode(node, parentElement, key, parent) {
    const nodeElement = document.createElement('div');
    nodeElement.classList.add('tree-node');
    const contentElement = document.createElement('span');
    contentElement.classList.add('tree-node-content');
    contentElement.textContent = `${key}: ${node.type || typeof node}`;
    nodeElement.setAttribute('data-key', key);

    contentElement.onclick = (e) => {
        e.stopPropagation();
        selectNode(key, node, parent);
    };

    nodeElement.appendChild(contentElement);
    parentElement.appendChild(nodeElement);

    if (node.type === 'object' && node.properties) {
        const childrenContainer = document.createElement('div');
        childrenContainer.classList.add('tree-node-children');
        nodeElement.appendChild(childrenContainer);
        for (const [childKey, childValue] of Object.entries(node.properties)) {
            renderNode(childValue, childrenContainer, childKey, node);
        }
        if (Object.keys(node.properties).length > 0) {
            nodeElement.onclick = (e) => {
                e.stopPropagation();
                nodeElement.classList.toggle('expanded');
            };
        } else {
            nodeElement.classList.add('no-children');
        }
    } else if (node.type === 'array' && node.items) {
        const childrenContainer = document.createElement('div');
        childrenContainer.classList.add('tree-node-children');
        nodeElement.appendChild(childrenContainer);
        renderNode(node.items, childrenContainer, 'items', node); // Corrected this line
        nodeElement.onclick = (e) => {
            e.stopPropagation();
            nodeElement.classList.toggle('expanded');
        };
    } else {
        nodeElement.classList.add('no-children');
    }
}

/* 
 * Selects a node in the tree view and populates the form with its details.
 * Additionally, if the selected node is an array, the item-type selection is prepopulated.
 */
function selectNode(key, value, parent) {
    state.selectedNode = { key, value, parent };
    state.parentNode = parent ? parent : state.currentNode;
    state.currentNode = value;
    
    // Populate basic fields
    document.getElementById('title').value = key;
    document.getElementById('description').value = value.description || '';
    document.getElementById('type').value = value.type || typeof value;
    document.getElementById('enum').value = value.enum ? value.enum.join(',') : '';
    
    // Handle boolean default values specially
    if (value.type === 'boolean') {
        document.getElementById('default').value = (typeof value.default !== 'undefined') ? value.default.toString() : '';
    } else {
        document.getElementById('default').value = value.default !== undefined && value.default !== null ? value.default : '';
    }
    
    // Handle pattern properties
    document.getElementById('patternProperties').value = value.patternProperties ?
        Object.entries(value.patternProperties)
            .map(([pattern, prop]) => `${pattern}:${prop.type}`)
            .join(',') : '';
    
    // Set required checkbox
    document.getElementById('required').checked = parent && parent.required && parent.required.includes(key);

    // Populate type-specific fields - ensure we convert undefined/null to empty string
    // Number fields
    document.getElementById('minimum').value = value.minimum !== undefined && value.minimum !== null ? value.minimum : '';
    document.getElementById('maximum').value = value.maximum !== undefined && value.maximum !== null ? value.maximum : '';
    document.getElementById('exclusiveMinimum').value = value.exclusiveMinimum !== undefined && value.exclusiveMinimum !== null ? value.exclusiveMinimum : '';
    document.getElementById('exclusiveMaximum').value = value.exclusiveMaximum !== undefined && value.exclusiveMaximum !== null ? value.exclusiveMaximum : '';
    
    // String fields
    document.getElementById('minLength').value = value.minLength !== undefined && value.minLength !== null ? value.minLength : '';
    document.getElementById('maxLength').value = value.maxLength !== undefined && value.maxLength !== null ? value.maxLength : '';
    document.getElementById('pattern').value = value.pattern || '';
    
    // Array fields
    document.getElementById('minItems').value = value.minItems !== undefined && value.minItems !== null ? value.minItems : '';
    document.getElementById('maxItems').value = value.maxItems !== undefined && value.maxItems !== null ? value.maxItems : '';
    
    // Object fields
    document.getElementById('minProperties').value = value.minProperties !== undefined && value.minProperties !== null ? value.minProperties : '';
    document.getElementById('maxProperties').value = value.maxProperties !== undefined && value.maxProperties !== null ? value.maxProperties : '';


    // Show or hide the add button based on the selected node type
    const addButton = document.getElementById('add-btn');
    if (value.type === 'object' || (value.type === 'array' && value.items)) {
        addButton.style.display = 'inline-block';
    } else {
        addButton.style.display = 'none';
    }

    document.getElementById('edit-btn').style.display = 'inline-block'; // Ensure edit button is visible
    document.getElementById('delete-btn').style.display = 'inline-block';
    document.getElementById('current-operation').textContent = `Editing: ${key}`; // Updated to show Editing

    const numberFields = document.getElementById('number-fields');
    const exclusiveNumberFields = document.getElementById('exclusive-number-fields');
    const patternPropertiesFields = document.getElementById('pattern-properties-fields');
    const stringFields = document.getElementById('string-fields');
    const arrayFields = document.getElementById('array-fields');
    const objectFields = document.getElementById('object-fields');
    const patternFields = document.getElementById('pattern-fields');
    const enumFields = document.getElementById('enum-fields');
    const defaultFields = document.getElementById('default-fields');
    const itemTypeFields = document.getElementById('item-type-fields');
    
    const selectedType = value.type || typeof value;
    const allFields = [
        numberFields,
        exclusiveNumberFields,
        stringFields,
        arrayFields,
        objectFields,
        patternPropertiesFields,
        patternFields,
        enumFields,
        defaultFields,
        itemTypeFields
    ];
    allFields.forEach(field => {
        if (field) {
            field.style.display = 'none';
        }
    });
    
    if (selectedType === 'number') {
        if (numberFields) numberFields.style.display = 'flex';
        if (exclusiveNumberFields) exclusiveNumberFields.style.display = 'flex';
        if (enumFields) enumFields.style.display = 'flex';
        if (defaultFields) defaultFields.style.display = 'flex';
    } else if (selectedType === 'string') {
        if (stringFields) stringFields.style.display = 'flex';
        if (patternFields) patternFields.style.display = 'flex';
        if (enumFields) enumFields.style.display = 'flex';
        if (defaultFields) defaultFields.style.display = 'flex';
    } else if (selectedType === 'boolean') {
        if (defaultFields) defaultFields.style.display = 'flex';
    } else if (selectedType === 'array') {
        if (arrayFields) arrayFields.style.display = 'flex';
        if (itemTypeFields) {
            itemTypeFields.style.display = 'flex';
            // Prepopulate the item-type select if available.
            if (value.items && value.items.type) {
                document.getElementById('item-type').value = value.items.type;
            } else {
                document.getElementById('item-type').value = "";
            }
        }
    } else if (selectedType === 'object') {
        if (objectFields) objectFields.style.display = 'flex';
        if (patternPropertiesFields) patternPropertiesFields.style.display = 'flex';
    }
}

/* 
 * Adds or edits a node in the schema based on the form input.
 */
function addOrEditNode(isAddOperation) {
    const nodeKey = document.getElementById('title').value.trim();
    const type = document.getElementById('type').value;
    const feedback = document.getElementById('validation-feedback');
    const isRequired = document.getElementById('required').checked;
    if (!validateNodeInput(nodeKey, type, feedback)) return;
    
    const newNode = createNodeObject(nodeKey, type);
    updateSchema(newNode, isAddOperation, isRequired);
    updateTreeView();
    validateSchema();
    resetForm();
}

/* 
 * Validates the input for a node.
 */
function validateNodeInput(nodeKey, type, feedback) {
    let missingFields = [];
    if (!nodeKey) missingFields.push('Key');
    if (!type) missingFields.push('Type');
    if (missingFields.length > 0) {
        feedback.textContent = `${missingFields.join(' and ')} ${missingFields.length > 1 ? 'are' : 'is'} required.`;
        feedback.style.display = 'inline';
        setTimeout(() => feedback.style.display = 'none', 2000);
        return false;
    }
    return true;
}

/* 
 * Creates a new node object based on form input.
 */
function createNodeObject(nodeKey, type) {
    const description = document.getElementById('description').value;
    const enumValues = document.getElementById('enum').value;
    const defaultValue = document.getElementById('default').value;
    const patternProperties = document.getElementById('patternProperties').value;
    const pattern = document.getElementById('pattern').value;
    
    let newNode = { description, type };

    if (type === 'boolean') {
        if (defaultValue.toLowerCase() === 'true' || defaultValue === '1') {
            newNode.default = true;
        } else if (defaultValue.toLowerCase() === 'false' || defaultValue === '0') {
            newNode.default = false;
        } else {
            throw new Error('Default value for boolean must be true, false, 1, or 0.');
        }
    } else if (defaultValue) {
        newNode.default = type === 'number' ? parseFloat(defaultValue) : defaultValue;
    }
    
    if (type === 'number') {
        const minimum = document.getElementById('minimum').value;
        const maximum = document.getElementById('maximum').value;
        const exclusiveMinimum = document.getElementById('exclusiveMinimum').value;
        const exclusiveMaximum = document.getElementById('exclusiveMaximum').value;
        if (minimum) newNode.minimum = parseFloat(minimum);
        if (maximum) newNode.maximum = parseFloat(maximum);
        if (exclusiveMinimum) newNode.exclusiveMinimum = parseFloat(exclusiveMinimum);
        if (exclusiveMaximum) newNode.exclusiveMaximum = parseFloat(exclusiveMaximum);
    } else if (type === 'string') {
        const minLength = document.getElementById('minLength').value;
        const maxLength = document.getElementById('maxLength').value;
        if (minLength) newNode.minLength = parseInt(minLength, 10);
        if (maxLength) newNode.maxLength = parseInt(maxLength, 10);
        if (pattern) newNode.pattern = pattern;
    }
    
    if (patternProperties) {
        const [pattern, propType] = patternProperties.split(/:(.+)/).map(v => v.trim());
        if (pattern && propType) {
            newNode.patternProperties = { [pattern]: { type: propType } };
        }
    }
    
    if (type === 'object') {
        newNode.properties = {};
        newNode.required = [];
        const minProperties = document.getElementById('minProperties').value;
        const maxProperties = document.getElementById('maxProperties').value;
        if (minProperties) newNode.minProperties = parseInt(minProperties, 10);
        if (maxProperties) newNode.maxProperties = parseInt(maxProperties, 10);
    }
    if (enumValues) {
        newNode.enum = enumValues.split(',').map(v => v.trim());
    }
    
    if (type === 'array') {
        const itemType = document.getElementById('item-type').value;
        if (itemType === 'object') {
            newNode.items = {
                type: 'object',
                properties: {},
                required: []
            };
        } else {
            newNode.items = { type: itemType };
        }
        const minItems = document.getElementById('minItems').value;
        const maxItems = document.getElementById('maxItems').value;
        if (minItems) newNode.minItems = parseInt(minItems, 10);
        if (maxItems) newNode.maxItems = parseInt(maxItems, 10);
    }

    return newNode;
}

/* 
 * Updates the schema with the new node.
 * In edit mode, this function updates the parent's property key (if changed)
 * and merges any existing children (properties or items) into the new node.
 * Also handles updating the 'required' array in the parent node.
 */
function updateSchema(newNode, isAddOperation, isRequired) {
    const titleVal = document.getElementById('title').value.trim();
    const pathParts = titleVal.split('.');
    const newKey = pathParts.pop(); // The key for the node being added/edited
    const parentPathParts = pathParts; // The path to the parent node

    let parentNode = schema; // Start from the root
    let currentPathNode = schema; // Used for traversal during add

    // --- Determine the parent node ---
    if (!isAddOperation) {
        // Edit Mode: Parent is determined by state.parentNode
        parentNode = state.parentNode;
        if (!parentNode) {
             console.error("Cannot edit node: parentNode is not defined in state.");
             return; // Should not happen if a node is selected
        }
    } else {
        // Add Mode: Traverse the path to find/create the parent node
        for (const part of parentPathParts) {
            if (currentPathNode.type === 'object') {
                if (!currentPathNode.properties) currentPathNode.properties = {};
                if (!currentPathNode.properties[part]) {
                    // Create intermediate object nodes if they don't exist
                    currentPathNode.properties[part] = { type: 'object', properties: {}, required: [], additionalProperties: false };
                }
                parentNode = currentPathNode.properties[part]; // Update parentNode as we traverse
                currentPathNode = parentNode; // Move deeper
            } else if (currentPathNode.type === 'array' && part === 'items') {
                 if (!currentPathNode.items) {
                     // Default intermediate array items to object if not specified
                     currentPathNode.items = { type: 'object', properties: {}, required: [] };
                 }
                 parentNode = currentPathNode.items; // The 'items' schema is the parent for nested properties
                 currentPathNode = parentNode; // Move deeper
            } else {
                console.error(`Cannot add node: Invalid path segment "${part}" in path "${titleVal}". Node type is "${currentPathNode.type}".`);
                return; // Invalid path
            }
        }
         // After the loop, parentNode refers to the direct parent where the newKey will be added.
         // currentPathNode is the same as parentNode at this point for add operation.
    }

    // --- Perform Add or Edit ---
    const oldKey = isAddOperation ? null : state.selectedNode.key;

    if (parentNode.type === 'object') {
        if (!parentNode.properties) parentNode.properties = {};

        if (!isAddOperation) {
            // Edit specific logic
            let oldNode = parentNode.properties[oldKey];
            if (oldNode) {
                 // Preserve existing children if the new node doesn't define them
                if (oldNode.properties && (!newNode.properties || Object.keys(newNode.properties).length === 0)) {
                    newNode.properties = oldNode.properties;
                    newNode.required = oldNode.required || []; // Preserve required array too
                }
                if (oldNode.items && newNode.type === 'array') {
                     // Preserve array items structure
                    if (!newNode.items || !newNode.items.properties || Object.keys(newNode.items.properties).length === 0) {
                        newNode.items = oldNode.items;
                    }
                }
            }
            // If the key changed, remove the old one
            if (oldKey !== newKey && parentNode.properties.hasOwnProperty(oldKey)) {
                delete parentNode.properties[oldKey];
            }
        }
        // Add/update the property
        parentNode.properties[newKey] = newNode;

    } else if (parentNode.type === 'array' && newKey === 'items') {
        // Special case: updating the 'items' definition of an array
        parentNode.items = newNode;
    } else {
        console.error(`Cannot add/edit node: Parent node (path: ${parentPathParts.join('.')}) is not an object or array.`);
        return;
    }

    // --- Update Required Array (applies to parentNode which must be an object) ---
    if (parentNode.type === 'object') {
        if (!parentNode.required) parentNode.required = [];
        const currentRequired = parentNode.required;

        // Remove old key if it exists (relevant for edit or key change)
        const oldKeyIndex = oldKey ? currentRequired.indexOf(oldKey) : -1;
        if (oldKeyIndex > -1) {
            currentRequired.splice(oldKeyIndex, 1);
        }

        // Add new key if required and not already present
        if (isRequired && !currentRequired.includes(newKey)) {
            currentRequired.push(newKey);
        }

        // Clean up empty required array
        if (currentRequired.length === 0) {
            delete parentNode.required;
        }
    }


    // Update the schema ID and version with the values from the input fields
    schema.$schema = document.getElementById('schema-version').value || "https://json-schema.org/draft/2020-12/schema";
    schema.$id = document.getElementById('schema-id').value || undefined; // Use undefined if empty
    if (!schema.$id) delete schema.$id; // Remove $id if empty
}

/* 
 * Initializes event listeners and sets up the form.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Expose functions for testing
    window.selectNode = selectNode;
    window.addOrEditNode = addOrEditNode;
    window.state = state;
    const typeSelect = document.getElementById('type');
    const numberFields = document.getElementById('number-fields');
    const exclusiveNumberFields = document.getElementById('exclusive-number-fields');
    const patternPropertiesFields = document.getElementById('pattern-properties-fields');
    const stringFields = document.getElementById('string-fields');
    const arrayFields = document.getElementById('array-fields');
    const objectFields = document.getElementById('object-fields');
    const patternFields = document.getElementById('pattern-fields');
    const enumFields = document.getElementById('enum-fields');
    const defaultFields = document.getElementById('default-fields');
    const itemTypeFields = document.getElementById('item-type-fields');
    
    numberFields.style.display = 'none';
    exclusiveNumberFields.style.display = 'none';
    stringFields.style.display = 'none';
    arrayFields.style.display = 'none';
    objectFields.style.display = 'none';
    patternPropertiesFields.style.display = 'none';
    patternFields.style.display = 'none';
    enumFields.style.display = 'none';
    defaultFields.style.display = 'none';
    itemTypeFields.style.display = 'none';
    
    typeSelect.addEventListener('change', () => {
        const selectedType = typeSelect.value;
        numberFields.style.display = selectedType === 'number' ? 'flex' : 'none';
        exclusiveNumberFields.style.display = selectedType === 'number' ? 'flex' : 'none';
        stringFields.style.display = selectedType === 'string' ? 'flex' : 'none';
        arrayFields.style.display = selectedType === 'array' ? 'flex' : 'none';
        objectFields.style.display = selectedType === 'object' ? 'flex' : 'none';
        patternPropertiesFields.style.display = selectedType === 'object' ? 'flex' : 'none';
        patternFields.style.display = selectedType === 'string' ? 'flex' : 'none';
        enumFields.style.display = (selectedType === 'string' || selectedType === 'number') ? 'flex' : 'none';
        defaultFields.style.display = (selectedType === 'boolean' || selectedType === 'string' || selectedType === 'number') ? 'flex' : 'none';
        itemTypeFields.style.display = selectedType === 'array' ? 'flex' : 'none';
    });
    
    const initialType = typeSelect.value;
    patternPropertiesFields.style.display = initialType === 'object' ? 'flex' : 'none';
    patternFields.style.display = initialType === 'string' ? 'flex' : 'none';
    enumFields.style.display = (initialType === 'string' || initialType === 'number') ? 'flex' : 'none';
    defaultFields.style.display = (initialType === 'boolean' || initialType === 'string' || initialType === 'number') ? 'flex' : 'none';
    itemTypeFields.style.display = initialType === 'array' ? 'flex' : 'none';

    // Set default view to 'edit'
    showView(state.currentView);
});

/* 
 * Event listeners for the Add, Edit, and Delete buttons.
 */
document.getElementById('add-btn').onclick = () => {
    addOrEditNode(true);
};
document.getElementById('edit-btn').onclick = () => {
    addOrEditNode(false);
};
document.getElementById('delete-btn').onclick = () => {
    if (state.selectedNode && state.parentNode) {
        delete state.parentNode.properties[state.selectedNode.key];
        if (state.parentNode.required) {
            const index = state.parentNode.required.indexOf(state.selectedNode.key);
            if (index > -1) {
                state.parentNode.required.splice(index, 1);
            }
        }
        updateTreeView();
        validateSchema();
        resetForm();
    }
};

/* 
 * Resets the form fields.
 */
function resetForm() {
    document.getElementById('title').value = '';
    document.getElementById('description').value = '';
    document.getElementById('type').value = '';
    document.getElementById('default').value = '';
    document.getElementById('enum').value = '';
    document.getElementById('required').checked = false;
    document.getElementById('minimum').value = '';
    document.getElementById('maximum').value = '';
    document.getElementById('exclusiveMinimum').value = '';
    document.getElementById('exclusiveMaximum').value = '';
    document.getElementById('minLength').value = '';
    document.getElementById('maxLength').value = '';
    document.getElementById('minItems').value = '';
    document.getElementById('maxItems').value = '';
    document.getElementById('minProperties').value = '';
    document.getElementById('maxProperties').value = '';
    document.getElementById('patternProperties').value = '';
    document.getElementById('pattern').value = '';
    document.getElementById('item-type').value = '';
    // Reset all type-specific fields visibility
    document.getElementById('number-fields').style.display = 'none';
    document.getElementById('exclusive-number-fields').style.display = 'none';
    document.getElementById('string-fields').style.display = 'none';
    document.getElementById('array-fields').style.display = 'none';
    document.getElementById('object-fields').style.display = 'none';
    document.getElementById('pattern-properties-fields').style.display = 'none';
    document.getElementById('pattern-fields').style.display = 'none';
    document.getElementById('enum-fields').style.display = 'none';
    document.getElementById('default-fields').style.display = 'none';
    document.getElementById('item-type-fields').style.display = 'none';

    // Reset buttons and state
    document.getElementById('add-btn').style.display = 'inline-block';
    document.getElementById('edit-btn').style.display = 'none'; // Hide edit button on reset
    document.getElementById('delete-btn').style.display = 'none';
    state.selectedNode = null;
    state.parentNode = schema; // Default parent to root schema
    state.currentNode = schema;
    document.getElementById('current-operation').textContent = '';
}

// Expose functions for testing
window.resetForm = resetForm;

/* 
 * Validates the schema.
 */
function validateSchema() {
    const feedback = document.getElementById('validation-feedback');
    try {
        JSON.parse(safeStringify(schema));
        feedback.textContent = 'Schema is valid JSON.';
        feedback.classList.remove('error');
    } catch (error) {
        feedback.textContent = 'Error: Invalid JSON schema.';
        feedback.classList.add('error');
    }
}

/* 
 * Event listener for the Save button.
 */
document.getElementById('save-btn').onclick = () => {
    const schemaString = safeStringify(schema);
    if (typeof window.FileMaker !== 'undefined') {
        try {
            window.FileMaker.PerformScript('SaveJSONSchema', schemaString);
        } catch (err) {
            alert('Failed to save JSON schema. Please check the console for more details.');
        }
    } else {
        alert('FileMaker integration is not available. The schema cannot be saved.');
    }
};

/* 
 * Updates the JSON preview area.
 */
function updatePreview() {
    const previewElement = document.getElementById('json-preview');
    previewElement.innerHTML = '<pre>' + (state.isFormatted ? formatJSON(schema) : safeStringify(schema)) + '</pre>';
    document.getElementById('format-btn').textContent = state.isFormatted ? 'Compact JSON' : 'Format JSON'; // Update button label here
}

/* 
 * Formats the JSON object with syntax highlighting.
 */
function formatJSON(obj) {
    return JSON.stringify(obj, null, 2)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                cls = /:$/.test(match) ? 'json-key' : 'json-string';
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return `<span class="${cls}">${match}</span>`;
        })
        .replace(/\{|\}|\[|\]|,|:/g, function (match) {
            return `<span class="json-mark">${match}</span>`;
        });
}

/* 
 * Toggles the formatting of the JSON preview.
 */
document.getElementById('format-btn').onclick = () => {
    state.isFormatted = !state.isFormatted;
    document.getElementById('format-btn').textContent = state.isFormatted ? 'Compact JSON' : 'Format JSON';
    updatePreview();
};

/* 
 * Copies the current schema to the clipboard.
 */
document.getElementById('copy-btn').onclick = async () => {
    const schemaString = JSON.stringify(schema);
    try {
        await navigator.clipboard.writeText(schemaString);
        const copyFeedback = document.getElementById('copy-feedback');
        copyFeedback.style.display = 'inline';
        setTimeout(() => {
            copyFeedback.style.display = 'none';
        }, 2000);
    } catch (err) {
        alert('Failed to copy JSON. Please check the console for more details.');
    }
};

/* 
 * Updates the schema ID when the input changes.
 */
document.getElementById('schema-id').onchange = (e) => {
    schema.$id = e.target.value; // Update the schema ID
    updatePreview();
};

/* 
 * Applies a pasted schema.
 */
function applySchemaFromString(pastedSchema) {
    const feedback = document.getElementById('paste-feedback');
    try {
        const parsedSchema = JSON.parse(pastedSchema);
        if (typeof parsedSchema === 'object' && parsedSchema !== null) {
            schema = parsedSchema;
            document.getElementById('schema-version').value = schema.$schema || '';
            document.getElementById('schema-id').value = schema.$id || ''; // Update the schema ID input
            updateTreeView();
            validateSchema(); // Validate the newly applied schema
            const applyFeedback = document.getElementById('apply-feedback');
            applyFeedback.style.display = 'inline';
            setTimeout(() => {
                applyFeedback.style.display = 'none';
                document.getElementById('schema-options').style.display = 'none';
            }, 2000);
            feedback.classList.remove('error');
            document.getElementById('paste-schema').value = '';
            resetForm();
        } else {
            throw new Error('Invalid JSON schema structure');
        }
    } catch (error) {
        feedback.textContent = `Error: ${error.message}`;
        feedback.classList.add('error');
    }
}

/* 
 * Toggles the visibility of the schema options.
 */
document.getElementById('toggle-schema-options').onclick = () => {
    const schemaOptions = document.getElementById('schema-options');
    schemaOptions.style.display = schemaOptions.style.display === 'none' ? 'block' : 'none';
};

/* 
 * Safely stringifies an object.
 */
function safeStringify(obj) {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) return;
            seen.add(value);
        }
        return value;
    });
}

/* 
 * Show the specified view (edit or preview).
 */
function showView(view) {
    const editorSection = document.getElementById('editor');
    const treeViewSection = document.getElementById('tree-view');
    const previewSection = document.getElementById('preview');
    const mainContent = document.getElementById('main-content'); // Reference to the main section

    if (view === 'edit') {
        editorSection.style.display = 'block';
        treeViewSection.style.display = 'block';
        previewSection.style.display = 'none';
        mainContent.style.display = 'flex'; // Show the main content
    } else if (view === 'preview') {
        editorSection.style.display = 'none';
        treeViewSection.style.display = 'none';
        previewSection.style.display = 'block';
        mainContent.style.display = 'none'; // Hide the main content
    }
    state.currentView = view; // Update the current view state
}

// Set default view to 'edit' on load
showView(state.currentView);

document.getElementById('top-edit-btn').onclick = () => {
    showView('edit');
};
document.getElementById('preview-btn').onclick = () => {
    showView('preview');
};
