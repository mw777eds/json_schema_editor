// This is a test-specific version of index.js that exposes necessary functions for testing

// Create a basic schema for testing
let schema = {
    "type": "object",
    "properties": {},
    "required": [],
    "additionalProperties": false,
    "$schema": "https://json-schema.org/draft/2020-12/schema"
};

// Create a basic state object for testing
let state = {
    currentNode: schema,
    selectedNode: null,
    parentNode: schema, // Set parent to schema by default
    currentOperation: 'add',
    isFormatted: true,
    currentView: 'edit'
};

// Expose schema and state for testing
window.schema = schema;
window.state = state;

// Log initial state
console.log("Initial schema:", JSON.stringify(schema));

// Mock DOM elements for testing
function createMockDOM() {
    // Create mock elements that tests will look for
    const elements = [
        'title', 'description', 'type', 'default', 'enum', 'required',
        'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum',
        'minLength', 'maxLength', 'pattern', 'minItems', 'maxItems',
        'minProperties', 'maxProperties', 'patternProperties', 'item-type',
        'number-fields', 'exclusive-number-fields', 'string-fields',
        'array-fields', 'object-fields', 'pattern-properties-fields',
        'pattern-fields', 'enum-fields', 'default-fields', 'item-type-fields',
        'add-btn', 'edit-btn', 'delete-btn', 'current-operation',
        'validation-feedback', 'test-results'
    ];

    elements.forEach(id => {
        if (!document.getElementById(id)) {
            const el = document.createElement(id === 'required' ? 'input' : 'div');
            el.id = id;
            if (id === 'required') {
                el.type = 'checkbox';
            } else if (id.endsWith('-fields')) {
                el.style.display = 'none';
            }
            document.body.appendChild(el);
        }
    });

    // Create test-results div if it doesn't exist
    if (!document.getElementById('test-results')) {
        const resultsEl = document.createElement('div');
        resultsEl.id = 'test-results';
        document.body.appendChild(resultsEl);
    }
}

// Call this immediately to set up the mock DOM
createMockDOM();

// Mock functions for testing
function selectNode(key, value, parent) {
    state.selectedNode = { key, value, parent };
    state.parentNode = parent ? parent : state.currentNode;
    state.currentNode = value;
    
    // Update form fields
    document.getElementById('title').value = key;
    document.getElementById('description').value = value.description || '';
    document.getElementById('type').value = value.type || typeof value;
    document.getElementById('enum').value = value.enum ? value.enum.join(',') : '';
    
    if (value.type === 'boolean') {
        document.getElementById('default').value = (typeof value.default !== 'undefined') ? value.default.toString() : '';
    } else {
        document.getElementById('default').value = value.default || '';
    }
    
    document.getElementById('required').checked = parent && parent.required && parent.required.includes(key);
    
    // Populate type-specific fields
    document.getElementById('minimum').value = value.minimum ?? '';
    document.getElementById('maximum').value = value.maximum ?? '';
    document.getElementById('exclusiveMinimum').value = value.exclusiveMinimum ?? '';
    document.getElementById('exclusiveMaximum').value = value.exclusiveMaximum ?? '';
    document.getElementById('minLength').value = value.minLength ?? '';
    document.getElementById('maxLength').value = value.maxLength ?? '';
    document.getElementById('pattern').value = value.pattern || '';
    document.getElementById('minItems').value = value.minItems ?? '';
    document.getElementById('maxItems').value = value.maxItems ?? '';
    document.getElementById('minProperties').value = value.minProperties ?? '';
    document.getElementById('maxProperties').value = value.maxProperties ?? '';
    
    // Show/hide type-specific fields
    const selectedType = value.type || typeof value;
    const fieldTypes = ['number', 'string', 'array', 'object'];
    
    fieldTypes.forEach(type => {
        const display = type === selectedType ? 'flex' : 'none';
        document.getElementById(`${type}-fields`).style.display = display;
        
        if (type === 'number') {
            document.getElementById('exclusive-number-fields').style.display = display;
        } else if (type === 'string') {
            document.getElementById('pattern-fields').style.display = display;
        } else if (type === 'object') {
            document.getElementById('pattern-properties-fields').style.display = display;
        }
    });
    
    document.getElementById('enum-fields').style.display = 
        (selectedType === 'string' || selectedType === 'number') ? 'flex' : 'none';
    document.getElementById('default-fields').style.display = 
        (selectedType === 'boolean' || selectedType === 'string' || selectedType === 'number') ? 'flex' : 'none';
    document.getElementById('item-type-fields').style.display = 
        selectedType === 'array' ? 'flex' : 'none';
        
    if (selectedType === 'array' && value.items && value.items.type) {
        document.getElementById('item-type').value = value.items.type;
    }
}

function addOrEditNode(isAddOperation) {
    const nodeKey = document.getElementById('title').value.trim();
    const type = document.getElementById('type').value;
    const isRequired = document.getElementById('required').checked;
    
    // Create a new node based on form values
    const newNode = createNodeObject(nodeKey, type);
    
    // Update the schema
    updateSchema(newNode, isAddOperation, isRequired);
}

function createNodeObject(nodeKey, type) {
    const description = document.getElementById('description').value;
    const enumValues = document.getElementById('enum').value;
    const defaultValue = document.getElementById('default').value;
    const pattern = document.getElementById('pattern').value;
    
    let newNode = { type };
    
    // Only add description if it's not empty
    if (description) {
        newNode.description = description;
    }
    
    // Handle default values
    if (type === 'boolean') {
        if (defaultValue.toLowerCase() === 'true' || defaultValue === '1') {
            newNode.default = true;
        } else if (defaultValue.toLowerCase() === 'false' || defaultValue === '0') {
            newNode.default = false;
        }
    } else if (defaultValue) {
        newNode.default = type === 'number' ? parseFloat(defaultValue) : defaultValue;
    }
    
    // Handle type-specific properties
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
    } else if (type === 'object') {
        newNode.properties = {};
        newNode.required = [];
        
        const minProperties = document.getElementById('minProperties').value;
        const maxProperties = document.getElementById('maxProperties').value;
        
        if (minProperties) newNode.minProperties = parseInt(minProperties, 10);
        if (maxProperties) newNode.maxProperties = parseInt(maxProperties, 10);
    } else if (type === 'array') {
        const itemType = document.getElementById('item-type').value;
        const minItems = document.getElementById('minItems').value;
        const maxItems = document.getElementById('maxItems').value;
        
        if (itemType === 'object') {
            newNode.items = {
                type: 'object',
                properties: {},
                required: []
            };
        } else {
            newNode.items = { type: itemType };
        }
        
        if (minItems) newNode.minItems = parseInt(minItems, 10);
        if (maxItems) newNode.maxItems = parseInt(maxItems, 10);
    }
    
    // Handle enum values
    if (enumValues) {
        newNode.enum = enumValues.split(',').map(v => v.trim());
    }
    
    return newNode;
}

function updateSchema(newNode, isAddOperation, isRequired) {
    const titleVal = document.getElementById('title').value.trim();
    const pathParts = titleVal.split('.');
    const newKey = pathParts.pop();
    
    // Ensure we're working with the global schema object
    if (!window.schema) {
        window.schema = {
            "type": "object",
            "properties": {},
            "required": [],
            "additionalProperties": false,
            "$schema": "https://json-schema.org/draft/2020-12/schema"
        };
    }
    
    // Debug log
    console.log("Before update - Schema:", JSON.stringify(window.schema));
    console.log("Adding/editing node:", newKey, "with value:", JSON.stringify(newNode));
    console.log("isAddOperation:", isAddOperation, "isRequired:", isRequired);
    
    let parentNode = window.schema;
    
    if (!isAddOperation && state.parentNode) {
        parentNode = state.parentNode;
    } else {
        // For add operation, traverse the path to find the parent
        let currentPathNode = window.schema;
        for (const part of pathParts) {
            if (currentPathNode.type === 'object') {
                if (!currentPathNode.properties) currentPathNode.properties = {};
                if (!currentPathNode.properties[part]) {
                    currentPathNode.properties[part] = { 
                        type: 'object', 
                        properties: {}, 
                        required: [] 
                    };
                }
                parentNode = currentPathNode.properties[part];
                currentPathNode = parentNode;
            } else if (currentPathNode.type === 'array' && part === 'items') {
                if (!currentPathNode.items) {
                    currentPathNode.items = { 
                        type: 'object', 
                        properties: {}, 
                        required: [] 
                    };
                }
                parentNode = currentPathNode.items;
                currentPathNode = parentNode;
            }
        }
    }
    
    console.log("Parent node for update:", JSON.stringify(parentNode));
    
    const oldKey = isAddOperation ? null : state.selectedNode?.key;
    
    if (parentNode.type === 'object') {
        if (!parentNode.properties) {
            parentNode.properties = {};
            console.log("Created properties object for parent node");
        }
        
        if (!isAddOperation && oldKey && parentNode.properties[oldKey]) {
            // Preserve existing children for edit operations
            let oldNode = parentNode.properties[oldKey];
            
            if (oldNode.properties && (!newNode.properties || Object.keys(newNode.properties).length === 0)) {
                newNode.properties = oldNode.properties;
                newNode.required = oldNode.required || [];
            }
            
            if (oldNode.items && newNode.type === 'array') {
                if (!newNode.items || !newNode.items.properties || Object.keys(newNode.items.properties).length === 0) {
                    newNode.items = oldNode.items;
                }
            }
            
            // Remove old key if it changed
            if (oldKey !== newKey) {
                delete parentNode.properties[oldKey];
                console.log(`Deleted old key "${oldKey}" from parent node`);
            }
        }
        
        // Add/update the property
        parentNode.properties[newKey] = newNode;
        
        // Debug log to help diagnose issues
        console.log(`Added/updated property "${newKey}" to schema:`, JSON.stringify(parentNode.properties[newKey]));
        console.log("Parent node properties after update:", Object.keys(parentNode.properties));
        
        // Update required array
        if (!parentNode.required) {
            parentNode.required = [];
            console.log("Created required array for parent node");
        }
        
        // Remove old key from required if it exists
        if (oldKey) {
            const oldKeyIndex = parentNode.required.indexOf(oldKey);
            if (oldKeyIndex > -1) {
                parentNode.required.splice(oldKeyIndex, 1);
                console.log(`Removed "${oldKey}" from required array`);
            }
        }
        
        // Add new key to required if needed
        if (isRequired && !parentNode.required.includes(newKey)) {
            parentNode.required.push(newKey);
            console.log(`Added "${newKey}" to required array`);
        }
        
        // Clean up empty required array
        if (parentNode.required.length === 0) {
            delete parentNode.required;
            console.log("Deleted empty required array");
        }
    } else if (parentNode.type === 'array' && newKey === 'items') {
        parentNode.items = newNode;
        console.log("Updated array items:", JSON.stringify(parentNode.items));
    }
    
    // Debug log the final schema state
    console.log("After update - Schema:", JSON.stringify(window.schema));
}

function resetForm() {
    // Reset all form fields
    const fields = [
        'title', 'description', 'type', 'default', 'enum',
        'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum',
        'minLength', 'maxLength', 'pattern', 'minItems', 'maxItems',
        'minProperties', 'maxProperties', 'patternProperties', 'item-type'
    ];
    
    fields.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.value = '';
        }
    });
    
    document.getElementById('required').checked = false;
    
    // Hide all type-specific fields
    const fieldSets = [
        'number-fields', 'exclusive-number-fields', 'string-fields',
        'array-fields', 'object-fields', 'pattern-properties-fields',
        'pattern-fields', 'enum-fields', 'default-fields', 'item-type-fields'
    ];
    
    fieldSets.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'none';
        }
    });
    
    // Reset state
    state.selectedNode = null;
    state.parentNode = schema;
    state.currentNode = schema;
    
    document.getElementById('current-operation').textContent = '';
}

// Mock applySchemaFromString function
function applySchemaFromString(schemaString) {
    try {
        const parsedSchema = JSON.parse(schemaString);
        if (typeof parsedSchema === 'object' && parsedSchema !== null) {
            schema = parsedSchema;
            resetForm();
        }
    } catch (error) {
        console.error("Error parsing schema:", error);
    }
}

// Expose functions for testing
window.selectNode = selectNode;
window.addOrEditNode = addOrEditNode;
window.resetForm = resetForm;
window.applySchemaFromString = applySchemaFromString;
