# NeuroFormat Compliance Tests

This folder contains the compliance tests that any implementation of the NeuroFormat specification **must** pass to be considered compliant. These tests ensure that downstream libraries implement the schema correctly and consistently across different programming languages and platforms.

## Overview

The tests are organized into different categories based on the functionality they validate:

- **Parsing Tests**: JSON parsing and schema validation
- **Serialization Tests**: Round-trip serialization accuracy  
- **Validation Tests**: Input/output validation and error handling
- **Execution Tests**: Node execution and data flow
- **Integration Tests**: End-to-end model functionality

## Test Structure

All compliance tests follow the `tests.schema.json` schema and are organized as JSON files containing arrays of `TestDefinition` objects. Each test definition includes:

### Required Fields

- **`id`**: Unique identifier for the test
- **`title`**: Short, descriptive test name
- **`description`**: Detailed explanation of what the test verifies
- **`feature`**: Specific capability being tested (e.g., `"schema_validation"`, `"operator_execution"`)
- **`inputs`**: Test input data (NeuroFormat models, tensor data, parameters)
- **`expected`**: Expected outcomes (success with outputs, or specific error conditions)

### Optional Fields

- **`tags`**: Categories for filtering tests
- **`metadata`**: Priority, timeout, skip conditions

## Test Categories

### Schema & Parsing Tests

- JSON schema validation
- Malformed input handling
- Reference resolution

### Execution Tests

- Operator mathematical correctness
- Layer functionality
- Architecture composition
- Subgraph execution

### Data Flow Tests

- Input/output tensor validation
- Weight loading and application
- Node reference resolution

## Using Compliance Tests

Downstream library implementers should:

1. **Pull test files** from this directory
2. **Parse test definitions** according to `tests.schema.json`
3. **Generate parameterized unit tests** dynamically from the JSON definitions
4. **Execute tests** against their implementation
5. **Verify** all tests pass for compliance certification

## Example Test Structure

```json
{
  "$schema": "https://raw.githubusercontent.com/neuro-format/schemas/tests-schema-2025-1.json",
  "metadata": {
    "name": "Basic Parsing Tests",
    "category": "parsing"
  },
  "tests": [
    {
      "id": "valid_model_parsing",
      "title": "Valid Model Parsing",
      "description": "Verify that a valid .neuro.json model parses correctly",
      "feature": "json_parsing",
      "inputs": {
        "neuro_model": { /* complete model definition */ }
      },
      "expected": {
        "success": true,
        "parsed_structure": { /* expected parsed result */ }
      }
    }
  ]
}
```

This schema-driven approach ensures that compliance tests are well-structured, self-documenting, and easy for library authors to understand and implement.

### Error Code Compliance

All error tests use **canonical NeuroFormat error codes** as defined in `docs/error-codes.md`. These standardized codes ensure consistent error handling across all language implementations:

```json
{
  "expected": {
    "error": {
      "code": "neuro.ref.node_not_found",
      "message_pattern": ".*nonexistent_input.*not found.*"
    }
  }
}
```

Key error code categories:

- **`neuro.schema.*`**: Schema validation errors
- **`neuro.ref.*`**: Reference resolution errors  
- **`neuro.type.*`**: Type system errors
- **`neuro.exec.*`**: Runtime execution errors
- **`neuro.impl.*`**: Implementation-specific errors
- **`neuro.parse.*`**: Parsing and structure errors
