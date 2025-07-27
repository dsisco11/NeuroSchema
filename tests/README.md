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

- **`tags`**: Categories for filtering tests (e.g., `["parsing", "json", "syntax"]`)
- **`metadata`**: Additional test configuration:
  - `priority`: Test execution priority (`"high"`, `"medium"`, `"low"`)
  - `timeout`: Maximum execution time in seconds
  - `skip_conditions`: Conditions under which to skip the test
  - `performance_baseline`: Expected performance benchmarks

## Directory Structure

```text
tests/
├── README.md                          # This file
├── tests.schema.json                  # JSON schema for all test definitions
├── compliance/                        # Core compliance tests (required)
│   ├── schema_validation/             # JSON and schema validation tests
│   │   ├── basic_validation.json
│   │   ├── minimal_model.json
│   │   ├── missing_data.json
│   │   └── schema_errors.json
│   ├── import_resolution/             # Import handling and resolution tests
│   │   ├── advanced_circular_imports.json
│   │   ├── circular_imports.json
│   │   ├── edge_cases.json
│   │   └── path_escaping.json
│   ├── node_reference_resolution/     # Node and reference resolution tests
│   │   ├── advanced_references.json
│   │   └── invalid_node_reference.json
│   └── error_handling/                # Error code and handling compliance
│       ├── error_code_compliance.json
│       ├── execution_errors.json
│       └── parsing_errors.json
└── execution/                         # Advanced execution and performance tests
    ├── operators/                     # Operator-specific functionality
    ├── layers/                        # Layer-specific functionality
    ├── architectures/                 # Architecture-level testing
    ├── integration/                   # End-to-end integration tests
    └── performance/                   # Performance and benchmarking tests
```

## Test Categories

### Compliance Tests (`/compliance/`)

The core compliance tests that all NeuroFormat implementations must pass:

#### Schema Validation (`/compliance/schema_validation/`)

- JSON parsing and syntax validation
- NeuroFormat schema compliance checking
- Data type and constraint validation
- Missing required field detection

#### Import Resolution (`/compliance/import_resolution/`)

- NeuroFormat model imports
- Safetensors weight imports
- Circular import detection
- Path escaping and security validation

#### Node Reference Resolution (`/compliance/node_reference_resolution/`)

- Input/output reference validation
- Definition reference resolution
- Scope and namespace handling
- Invalid reference detection

#### Error Handling (`/compliance/error_handling/`)

- Canonical error code compliance
- Proper error message formatting
- Error propagation and handling
- Edge case error scenarios

### Execution Tests (`/execution/`)

Advanced functionality tests for runtime behavior:

#### Operators (`/execution/operators/`)

- Mathematical correctness of operator implementations
- Input/output tensor validation
- Attribute processing and defaults

#### Layers (`/execution/layers/`)

- Layer composition and execution
- Weight loading and application
- Forward pass validation

#### Architectures (`/execution/architectures/`)

- End-to-end architecture execution
- Subgraph composition
- Complex model validation

#### Integration (`/execution/integration/`)

- Multi-modal model testing
- Real-world scenario validation
- Performance benchmarking

#### Performance (`/execution/performance/`)

- Execution speed benchmarks
- Memory usage validation
- Scalability testing

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
  "$schema": "../../tests.schema.json",
  "metadata": {
    "name": "Basic Parsing Tests",
    "version": "1.0.0",
    "description": "Basic tests for parsing and validating NeuroFormat models",
    "category": "validation"
  },
  "tests": [
    {
      "id": "valid_model_parsing",
      "title": "Valid Model Parsing",
      "description": "Verify that a valid .neuro.json model parses correctly",
      "feature": "json_parsing",
      "tags": ["parsing", "json", "validation"],
      "inputs": {
        "neuro_model": {
          "$schema": "https://raw.githubusercontent.com/neuro-graph/schemas/latest/neuro.schema.json",
          "metadata": {
            "model": {
              "name": "simple_model",
              "version": "1.0.0"
            }
          },
          "inputs": [
            {
              "name": "input",
              "shape": [10],
              "dtype": "float32"
            }
          ],
          "outputs": [
            {
              "name": "output",
              "shape": [10],
              "dtype": "float32"
            }
          ],
          "export": [
            {
              "name": "identity",
              "type": "identity",
              "arguments": ["@{inputs.input}"]
            }
          ]
        }
      },
      "expected": {
        "success": true,
        "parsed_structure": {
          "has_metadata": true,
          "input_count": 1,
          "output_count": 1,
          "export_count": 1
        }
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
      "code": "neuro.ref.node_not_found"
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
