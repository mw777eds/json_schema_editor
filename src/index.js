const rootTitle = "parameters";
const rootDescription = "parameters for the current tool";

let schema = {
    "type": "object",
    "properties": {},
    "required": [],
    "additionalProperties": false,
    "$schema": "https://json-schema.org/draft/2020-12/schema"
}

document.getElementById('apply-pasted-schema').onclick = () => {
    const pastedSchema = document.getElementById('paste-schema').value;
    applySchemaFromString(pastedSchema);
}
window.applySchemaFromString = applySchemaFromString;
let currentNode = schema;
let selectedNode = null;
let parentNode = null;
let currentOperation = 'add';
let isFormatted = true;

let expandedNodes = new Set();

function updateTreeView() {
    const treeView = document.getElementById('schema-tree');
    treeView.innerHTML = '';
    renderNode(schema, treeView, schema.title || 'root', null);
    restoreExpandedNodes();
    updatePreview();
}

function restoreExpandedNodes() {
    expandedNodes.forEach(key => {
        const nodeElement = document.querySelector(`[data-key="${key}"]`);
        if (nodeElement) {
            nodeElement.classList.add('expanded');
        }
    });
}

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

function selectNode(key, value, parent) {
    selectedNode = { key, value, parent };
    parentNode = parent;
    currentNode = value;
    document.getElementById('title').value = key;
    document.getElementById('description').value = value.description || '';
    document.getElementById('type').value = value.type || typeof value;
    document.getElementById('enum').value = value.enum ? value.enum.join(',') : '';
    document.getElementById('default').value = value.default || '';
    if (value.patternProperties) {
        document.getElementById('patternProperties').value = 
            Object.entries(value.patternProperties)
                  .map(([pattern, prop]) => `${pattern}:${prop.type}`)
                  .join(',');
    } else {
        document.getElementById('patternProperties').value = '';
    }

    document.getElementById('required').checked = parent && parent.required && parent.required.includes(key);
    document.getElementById('add-btn').style.display = 'inline-block';
    document.getElementById('edit-btn').style.display = 'inline-block';
    document.getElementById('delete-btn').style.display = 'inline-block';
    document.getElementById('current-operation').textContent = `Editing: ${key}`;

    // Show/hide fields based on type
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
}

function addOrEditNode(isAdd) {
    const newKey = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const type = document.getElementById('type').value;
    if (!type) {
        alert('Please select a type.');
        return;
    }
    const enumValues = document.getElementById('enum').value;
    const defaultValue = document.getElementById('default').value;
    const patternProperties = document.getElementById('patternProperties').value;
    const isRequired = document.getElementById('required').checked;

    if (defaultValue) {
        newNode.default = defaultValue;
    }

    let newNode = { 
        description, 
        type
    };

    if (patternProperties) {
        newNode.patternProperties = {};
        const pairs = patternProperties.match(/[^,]+:[^,]+/g);
        if (pairs) {
            pairs.forEach(pair => {
                const [pattern, type] = pair.split(/:(.+)/).map(v => v.trim());
                console.log(`Pattern: ${pattern}, Type: ${type}`); // Debugging line
                if (pattern && type) {
                    newNode.patternProperties[pattern] = { type };
                }
            });
        }
    }

    if (type === 'object') {
        newNode.properties = currentNode.properties ? { ...currentNode.properties } : {};
        newNode.required = currentNode.required ? [...currentNode.required] : [];
    }
    if (enumValues) {
        newNode.enum = enumValues.split(',').map(v => v.trim());
    }

    if (type === 'object') {
        newNode.properties = currentNode.properties ? { ...currentNode.properties } : {};
        newNode.required = currentNode.required ? [...currentNode.required] : [];
    } else if (type === 'array') {
        newNode.items = currentNode.items ? { ...currentNode.items } : { type: 'string' };
    }

    let currentObj = schema;
    const pathParts = newKey.split('.');
    const lastPart = pathParts[pathParts.length - 1];

    for (let i = 0; i < pathParts.length - 1; i++) {
        if (!currentObj.properties) {
            currentObj.properties = {};
        }
        if (!currentObj.properties[pathParts[i]]) {
            currentObj.properties[pathParts[i]] = { type: 'object', properties: {}, additionalProperties: false };
        }
        currentObj = currentObj.properties[pathParts[i]];
    }

    if (!isAdd && selectedNode) {
        // Remove the old node from the correct parent
        if (parentNode && parentNode.properties) {
            delete parentNode.properties[selectedNode.key];
            const requiredIndex = parentNode.required ? parentNode.required.indexOf(selectedNode.key) : -1;
            if (requiredIndex > -1) {
                parentNode.required.splice(requiredIndex, 1);
            }
        }
    }

    // Ensure parentNode is correctly set
    if (!parentNode) {
        parentNode = currentObj;
    }

    // Add the new node
    if (!parentNode.properties) {
        parentNode.properties = {};
    }
    parentNode.properties[lastPart] = newNode;

    if (isRequired) {
        if (!parentNode.required) parentNode.required = [];
        if (!parentNode.required.includes(lastPart)) {
            parentNode.required.push(lastPart);
        }
    } else if (parentNode.required) {
        const requiredIndex = parentNode.required.indexOf(lastPart);
        if (requiredIndex > -1) {
            parentNode.required.splice(requiredIndex, 1);
        }
    }

    updateTreeView();
    validateSchema();
    resetForm();
}

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
        patternPropertiesFields.style.display = selectedType === 'string' ? 'flex' : 'none';
    });
    
    // Trigger the change event initially to set correct initial state
    const initialType = typeSelect.value;
    patternPropertiesFields.style.display = initialType === 'string' ? 'flex' : 'none';
});

document.getElementById('add-btn').onclick = () => addOrEditNode(true);
document.getElementById('edit-btn').onclick = () => addOrEditNode(false);

document.getElementById('delete-btn').onclick = () => {
    if (selectedNode && parentNode) {
        delete parentNode.properties[selectedNode.key];
        const requiredIndex = parentNode.required ? parentNode.required.indexOf(selectedNode.key) : -1;
        if (requiredIndex > -1) {
            parentNode.required.splice(requiredIndex, 1);
        }
        updateTreeView();
        validateSchema();
        resetForm();
    }
};

function resetForm() {
    document.getElementById('title').value = '';
    document.getElementById('description').value = '';
    document.getElementById('type').value = 'string';
    document.getElementById('enum').value = '';
    document.getElementById('required').checked = false;
    document.getElementById('add-btn').style.display = 'inline-block';
    document.getElementById('edit-btn').style.display = 'none';
    document.getElementById('delete-btn').style.display = 'none';
    selectedNode = null;
    parentNode = null;
    currentNode = schema;
    document.getElementById('current-operation').textContent = '';
}

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

document.getElementById('save-btn').onclick = () => {
    const schemaString = safeStringify(schema);
    if (typeof window.FileMaker !== 'undefined') {
        window.FileMaker.PerformScript('SaveJSONSchema', schemaString);
    } else {
        alert('FileMaker integration is not available.');
    }
};

function updatePreview() {
    const previewElement = document.getElementById('json-preview');
    previewElement.innerHTML = '<pre>' + (isFormatted ? formatJSON(schema) : safeStringify(schema)) + '</pre>';
}

function formatJSON(obj) {
    return JSON.stringify(obj, null, 2)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'json-key';
                } else {
                    cls = 'json-string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        })
        .replace(/\{|\}|\[|\]|,|:/g, function (match) {
            return '<span class="json-mark">' + match + '</span>';
        });
}

document.getElementById('format-btn').onclick = () => {
    isFormatted = !isFormatted;
    document.getElementById('format-btn').textContent = isFormatted ? 'Compact JSON' : 'Format JSON';
    updatePreview();
};

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
        alert('Failed to copy JSON: ' + err);
    }
};

document.getElementById('schema-id').onchange = (e) => {
    schema.$id = e.target.value;
    updatePreview();
};

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
                const schemaOptions = document.getElementById('schema-options');
                schemaOptions.style.display = 'none';
            }, 2000);
            setTimeout(() => {
                feedback.style.display = 'none';
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
};

document.getElementById('toggle-schema-options').onclick = () => {
    const schemaOptions = document.getElementById('schema-options');
    schemaOptions.style.display = schemaOptions.style.display === 'none' ? 'block' : 'none';
};

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
