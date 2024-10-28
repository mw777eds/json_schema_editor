let schema = {
    "type": "object",
    "properties": {},
    "required": [],
    "additionalProperties": false,
    "$schema": "https://json-schema.org/draft/2020-12/schema"
};

/* 
 * Event listener for the "Apply Pasted Schema" button.
 * This function retrieves the value from the textarea and applies the schema.
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
    isFormatted: true
};

let expandedNodes = new Set();

/* 
 * Updates the tree view to reflect the current schema structure.
 * It clears the existing tree view and renders the schema nodes.
 */
function updateTreeView() {
    const treeView = document.getElementById('schema-tree');
    treeView.innerHTML = '';
    renderNode(schema, treeView, schema.title || 'root', null);
    restoreExpandedNodes();
    updatePreview();
}

/* 
 * Restores the expanded state of nodes in the tree view based on previously expanded nodes.
 */
function restoreExpandedNodes() {
    expandedNodes.forEach(key => {
        const nodeElement = document.querySelector(`[data-key="${key}"]`);
        if (nodeElement) {
            nodeElement.classList.add('expanded');
        }
    });
}

/* 
 * Renders a node in the tree view.
 * It creates the necessary HTML elements and sets up event listeners for interaction.
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
                const isExpanded = nodeElement.classList.toggle('expanded');
                if (isExpanded) {
                    expandedNodes.add(key);
                } else {
                    expandedNodes.delete(key);
                }
            };
        } else {
            nodeElement.classList.add('no-children');
        }
    } else if (node.type === 'array' && node.items) {
        const childrenContainer = document.createElement('div');
        childrenContainer.classList.add('tree-node-children');
        nodeElement.appendChild(childrenContainer);
        renderNode(node.items, childrenContainer, 'items', node);
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
 * It also updates the current operation (add/edit) and shows/hides relevant fields.
 */
function selectNode(key, value, parent) {
    state.selectedNode = { key, value, parent };
    state.parentNode = parent;
    state.currentNode = value;
    document.getElementById('title').value = key;
    document.getElementById('description').value = value.description || '';
    document.getElementById('type').value = value.type || typeof value;
    document.getElementById('enum').value = value.enum ? value.enum.join(',') : '';
    document.getElementById('default').value = value.default || '';
    document.getElementById('patternProperties').value = value.patternProperties ? 
        Object.entries(value.patternProperties)
            .map(([pattern, prop]) => `${pattern}:${prop.type}`)
            .join(',') : '';

    document.getElementById('required').checked = parent && parent.required && parent.required.includes(key);
    document.getElementById('add-btn').style.display = 'inline-block';
    document.getElementById('edit-btn').style.display = 'inline-block';
    document.getElementById('delete-btn').style.display = 'inline-block';
    document.getElementById('current-operation').textContent = `${state.currentOperation === 'add' ? 'Adding' : 'Editing'}: ${key}`;

    const typeSelect = document.getElementById('type');
    const numberFields = document.getElementById('number-fields');
    const exclusiveNumberFields = document.getElementById('exclusive-number-fields');
    const patternPropertiesFields = document.getElementById('pattern-properties-fields');
    const stringFields = document.getElementById('string-fields');
    const arrayFields = document.getElementById('array-fields');
    const objectFields = document.getElementById('object-fields');

    const selectedType = value.type || typeof value;
    numberFields.style.display = selectedType === 'number' ? 'flex' : 'none';
    exclusiveNumberFields.style.display = selectedType === 'number' ? 'flex' : 'none';
    stringFields.style.display = selectedType === 'string' ? 'flex' : 'none';
    arrayFields.style.display = selectedType === 'array' ? 'flex' : 'none';
    objectFields.style.display = selectedType === 'object' ? 'flex' : 'none';
    patternPropertiesFields.style.display = selectedType === 'object' ? 'flex' : 'none';
    document.getElementById('pattern').style.display = selectedType === 'string' ? 'flex' : 'none';
}

/* 
 * Adds or edits a node in the schema based on the current form input.
 * It validates the input and updates the schema accordingly.
 */
function addOrEditNode(isAddOperation) {
    const nodeKey = document.getElementById('title').value.trim();
    const type = document.getElementById('type').value;
    const feedback = document.getElementById('validation-feedback');

    if (!validateNodeInput(nodeKey, type, feedback)) return;

    const newNode = createNodeObject(nodeKey, type);
    updateSchema(newNode, isAddOperation);
    updateTreeView();
    validateSchema();
    resetForm();
}

/* 
 * Validates the input for a node to ensure required fields are filled.
 * Displays feedback if any fields are missing.
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
 * Creates a new node object based on the form input.
 * It handles different types and their specific properties.
 */
function createNodeObject(nodeKey, type) {
    const description = document.getElementById('description').value;
    const enumValues = document.getElementById('enum').value;
    const defaultValue = document.getElementById('default').value;
    const patternProperties = document.getElementById('patternProperties').value;
    const pattern = document.getElementById('pattern').value;
    const isRequired = document.getElementById('required').checked;

    let newNode = { description, type };

    if (type === 'boolean') {
        if (defaultValue.toLowerCase() === 'true' || defaultValue === '1') {
            newNode.default = true; // Set as boolean true
        } else if (defaultValue.toLowerCase() === 'false' || defaultValue === '0') {
            newNode.default = false; // Set as boolean false
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
        newNode.items = state.currentNode.items ? { ...state.currentNode.items } : { type: 'string' };
    }

    return newNode;
}

/* 
 * Updates the schema with the new node, either adding or editing it.
 * It handles the path to the node based on the key provided.
 */
function updateSchema(newNode, isAddOperation) {
    let currentNode = state.currentNode;
    const pathParts = document.getElementById('title').value.split('.');
    const lastPart = pathParts.pop();

    for (const part of pathParts) {
        if (!currentNode.properties) {
            currentNode.properties = {};
        }
        if (!currentNode.properties[part]) {
            currentNode.properties[part] = { type: 'object', properties: {}, additionalProperties: false };
        }
        currentNode = currentNode.properties[part];
    }

    if (!isAddOperation && state.selectedNode) {
        if (state.parentNode && state.parentNode.properties) {
            delete state.parentNode.properties[state.selectedNode.key];
            const requiredIndex = state.parentNode.required ? state.parentNode.required.indexOf(state.selectedNode.key) : -1;
            if (requiredIndex > -1) {
                state.parentNode.required.splice(requiredIndex, 1);
            }
        }
    }

    if (!state.parentNode) {
        state.parentNode = currentNode;
    }

    if (!state.parentNode.properties) {
        state.parentNode.properties = {};
    }
    state.parentNode.properties[lastPart] = newNode;

    if (newNode.required && newNode.required.includes(lastPart)) {
        if (!state.parentNode.required) state.parentNode.required = [];
        if (!state.parentNode.required.includes(lastPart)) {
            state.parentNode.required.push(lastPart);
        }
    } else if (state.parentNode.required) {
        const requiredIndex = state.parentNode.required.indexOf(lastPart);
        if (requiredIndex > -1) {
            state.parentNode.required.splice(requiredIndex, 1);
        }
    }
}

/* 
 * Initializes event listeners and sets up the form based on the selected type.
 */
document.addEventListener('DOMContentLoaded', () => {
    const typeSelect = document.getElementById('type');
    const numberFields = document.getElementById('number-fields');
    const exclusiveNumberFields = document.getElementById('exclusive-number-fields');
    const patternPropertiesFields = document.getElementById('pattern-properties-fields');
    const stringFields = document.getElementById('string-fields');
    const arrayFields = document.getElementById('array-fields');
    const objectFields = document.getElementById('object-fields');

    typeSelect.addEventListener('change', () => {
        const selectedType = typeSelect.value;
        numberFields.style.display = selectedType === 'number' ? 'flex' : 'none';
        exclusiveNumberFields.style.display = selectedType === 'number' ? 'flex' : 'none';
        stringFields.style.display = selectedType === 'string' ? 'flex' : 'none';
        arrayFields.style.display = selectedType === 'array' ? 'flex' : 'none';
        objectFields.style.display = selectedType === 'object' ? 'flex' : 'none';
        patternPropertiesFields.style.display = selectedType === 'object' ? 'flex' : 'none';
        document.getElementById('pattern').style.display = selectedType === 'string' ? 'flex' : 'none';
    });

    const initialType = typeSelect.value;
    patternPropertiesFields.style.display = initialType === 'object' ? 'flex' : 'none';
    document.getElementById('pattern').style.display = initialType === 'string' ? 'flex' : 'none';
});

/* 
 * Event listeners for the Add, Edit, and Delete buttons.
 * These functions handle the respective operations on the schema.
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
        const requiredIndex = state.parentNode.required ? state.parentNode.required.indexOf(state.selectedNode.key) : -1;
        if (requiredIndex > -1) {
            state.parentNode.required.splice(requiredIndex, 1);
        }
        updateTreeView();
        validateSchema();
        resetForm();
    }
};

/* 
 * Resets the form fields to their default state.
 * Clears all input fields and hides the edit/delete buttons.
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
    document.getElementById('add-btn').style.display = 'inline-block';
    document.getElementById('edit-btn').style.display = 'none';
    document.getElementById('delete-btn').style.display = 'none';
    state.selectedNode = null;
    state.parentNode = null;
    state.currentNode = schema;
    document.getElementById('current-operation').textContent = '';
}

/* 
 * Validates the schema to ensure it is a valid JSON structure.
 * Displays feedback based on the validation result.
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
 * It attempts to save the schema using FileMaker integration if available.
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
 * Updates the JSON preview area to reflect the current schema.
 * It formats the JSON based on the user's preference (formatted/compact).
 */
function updatePreview() {
    const previewElement = document.getElementById('json-preview');
    previewElement.innerHTML = '<pre>' + (state.isFormatted ? formatJSON(schema) : safeStringify(schema)) + '</pre>';
}

/* 
 * Formats the JSON object into a string with indentation for better readability.
 * It also applies syntax highlighting for different JSON types.
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
 * Toggles the formatting of the JSON preview between formatted and compact.
 * Updates the button text accordingly.
 */
document.getElementById('format-btn').onclick = () => {
    state.isFormatted = !state.isFormatted;
    document.getElementById('format-btn').textContent = state.isFormatted ? 'Compact JSON' : 'Format JSON';
    updatePreview();
};

/* 
 * Copies the current schema to the clipboard.
 * Displays feedback to the user upon successful copy.
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
 * This reflects the change in the preview.
 */
document.getElementById('schema-id').onchange = (e) => {
    schema.$id = e.target.value;
    updatePreview();
};

/* 
 * Applies a pasted schema from the textarea.
 * It parses the JSON and updates the schema if valid.
 */
function applySchemaFromString(pastedSchema) {
    const feedback = document.getElementById('paste-feedback');
    try {
        const parsedSchema = JSON.parse(pastedSchema);
        if (typeof parsedSchema === 'object' && parsedSchema !== null) {
            schema = parsedSchema;
            document.getElementById('schema-version').value = schema.$schema || '';
            document.getElementById('schema-id').value = schema.$id || '';
            updateTreeView();
            const applyFeedback = document.getElementById('apply-feedback');
            applyFeedback.style.display = 'inline';
            setTimeout(() => {
                applyFeedback.style.display = 'none';
                document.getElementById('schema-options').style.display = 'none';
            }, 2000);
            feedback.classList.remove('error');
            document.getElementById('paste-schema').value = '';
        } else {
            throw new Error('Invalid JSON schema structure');
        }
    } catch (error) {
        feedback.textContent = `Error: ${error.message}`;
        feedback.classList.add('error');
    }
}

/* 
 * Toggles the visibility of the schema options section.
 */
document.getElementById('toggle-schema-options').onclick = () => {
    const schemaOptions = document.getElementById('schema-options');
    schemaOptions.style.display = schemaOptions.style.display === 'none' ? 'block' : 'none';
};

/* 
 * Safely stringifies an object, handling cyclic references.
 */
function safeStringify(obj) {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                return; // Remove cyclic reference
            }
            seen.add(value);
        }
        return value;
    });
}

document.getElementById('format-btn').textContent = 'Compact JSON';
updateTreeView();
