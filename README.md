# JSON Schema Editor for FileMaker LLM Integration

*A visual editor for creating and managing JSON schemas for LLM tool calls within FileMaker*

## What It Does
This tool provides a user-friendly interface for FileMaker developers to create and edit JSON schemas that define the structure of LLM tool calls. It runs directly in a FileMaker web viewer, making it seamlessly integrated with your FileMaker development environment.

## Key Features
- Visual tree-based schema editor with interactive node expansion/collapse
- Real-time JSON preview with syntax highlighting and toggle between formatted/compact views
- Support for all primary JSON Schema data types (string, number, boolean, object, array)
- Nested property creation and editing with intuitive path handling (using dot notation)
- Required property flagging at both schema and property levels
- Schema metadata editing ($schema version and $id)
- Type-specific constraints and validations:
  - String: minLength, maxLength, pattern, enum, default
  - Number: minimum, maximum, exclusiveMinimum, exclusiveMaximum, enum, default
  - Boolean: default values (true/false)
  - Array: minItems, maxItems, item type definition
  - Object: minProperties, maxProperties, pattern properties
- Import existing schemas via paste functionality
- Direct schema validation
- Copy to clipboard with visual feedback
- FileMaker integration via PerformScript API
- Support for JSON Schema Draft 2020-12

## Interface Layout
- **Edit View**: Two-panel interface with form editor (left) and schema tree visualization (right)
- **Preview View**: Formatted JSON output with syntax highlighting and controls
- Simple toggle between Edit and Preview modes

## Usage
### Creating Properties
1. Select the parent node in the tree view (or stay at root level)
2. Fill in the property details in the form
3. Click "Add" to create the property

### Editing Properties
1. Click on a node in the tree view to select it
2. The form will populate with the node's current values
3. Make your changes
4. Click "Edit" to update the property

### Deleting Properties
1. Select a node in the tree view
2. Click "Delete" to remove the property

### Importing Schemas
1. Click "Schema Options"
2. Paste your JSON schema into the text area
3. Click "Apply Pasted Schema"

### Exporting Schemas
- Click "Copy JSON" to copy the schema to clipboard
- Click "Save" to save to FileMaker (requires FileMaker integration)

## FileMaker Integration
The editor integrates with FileMaker through the `FileMaker.PerformScript` API. When saving, it calls a script named 'SaveJSONSchema' with the stringified schema as a parameter.

## Test Framework
The application includes a comprehensive testing framework:
- Test runner with UI for running individual test suites or all tests
- Test cases for all data types (string, number, array, object)
- Tests for nested property creation and editing
- Test result visualization and downloadable reports
- Debug panel showing current schema state
- Test-specific versions of core functions

## Development Setup
The project is designed to be developed and tested within a browser environment:
- Standard ES6 JavaScript with module imports
- CSS for styling with responsive design considerations
- No external library dependencies
- FileMaker bridge configured through widget.config.js

## Project Structure
- `index.html` - Main application HTML
- `src/` - Application source code
  - `index.js` - Core schema manipulation logic
  - `style.css` - Application styling
- `test/` - Testing framework
  - `test.js` - Test cases for all functionality
  - `test-index.js` - Test-specific version of core logic
  - `test-runner.html` - Browser-based test runner
  - `test-runner.js` - Test execution and reporting logic
- `widget.config.js` - FileMaker integration configuration

## Code Style
The application follows specific code style preferences:
- Block-level comments using `/* */` format
- Human-readable descriptions for each function
- No line-level comments
- Accurate description of functionality in comments

## Limitations
- Does not support all JSON Schema features (oneOf, anyOf, allOf, etc.)
- No support for JSON Schema references ($ref)
- Limited validation beyond basic JSON schema structure

## Future Enhancements
- Support for additional JSON Schema features
- Better mobile responsiveness
- Improved validation feedback
- Undo/redo functionality
- Theme support

## Contributing
Contributions are welcome! Please follow the established code style preferences when submitting pull requests.
