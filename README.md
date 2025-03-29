# JSON Schema Editor for FileMaker LLM Integration

*A visual editor for creating and managing JSON schemas for LLM tool calls within FileMaker*

## What It Does
This tool provides a user-friendly interface for FileMaker developers to create and edit JSON schemas that define the structure of LLM tool calls. It runs directly in a FileMaker web viewer, making it seamlessly integrated with your FileMaker development environment.

## Key Features
- Visual tree-based schema editor
- Real-time JSON preview with syntax highlighting
- Support for all JSON Schema data types (string, number, boolean, object, array)
- Nested property creation and editing
- Required property flagging
- Type-specific constraints and validations:
  - String: minLength, maxLength, pattern, enum, default
  - Number: minimum, maximum, exclusiveMinimum, exclusiveMaximum, enum, default
  - Boolean: default values
  - Array: minItems, maxItems, item type definition
  - Object: minProperties, maxProperties, pattern properties
- Copy and paste functionality
- Direct integration with FileMaker scripts
- Schema validation
- Support for JSON Schema Draft 2020-12

## Getting Started
1. Open the FileMaker file containing the web viewer
2. Navigate to the JSON Schema Editor layout
3. Start building your schema using the visual interface
4. Preview and validate your schema in real-time
5. Save directly to your FileMaker solution

## Usage
- Use the "Edit" view to build and modify your schema
- Switch to "Preview" to see the formatted JSON output
- Copy the schema directly to your clipboard
- Save the schema to your FileMaker solution
- Paste existing schemas to modify them

## Development Setup

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/json-schema-editor.git
cd json-schema-editor

# Install dependencies
npm install
```

### Development
```bash
# Start the development server
npm start

# This will launch the application at http://localhost:3000
```

### Testing
The project includes comprehensive tests to ensure functionality works correctly:

```bash
# Run the automated tests in the browser
npm test

# This will open test-runner.html in your default browser
```

You can also run individual test suites from the test runner interface:
- String node tests
- Number node tests
- Array node tests
- Object node tests
- Nested node tests

### Building for Production
```bash
# Create a production build
npm run build
```

## Schema Support
Supports all major JSON Schema features including:
- Objects and nested properties
- Arrays with item definitions
- String patterns and enums
- Numeric ranges and constraints
- Required properties
- Default values
- Pattern properties

## Integration
The editor integrates directly with FileMaker through the web viewer interface and can save schemas directly to your FileMaker solution for use in LLM tool call configurations.

## Project Structure
- `src/` - Source code for the editor
  - `index.js` - Main application logic
  - `style.css` - Styling for the editor
- `test/` - Test files
  - `test.js` - Test cases for all functionality
  - `test-index.js` - Test-specific version of the main code
  - `test-runner.html` - Browser-based test runner

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.
