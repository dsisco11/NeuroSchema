# NeuroFormat Error Codes

This document defines the canonical set of error codes that NeuroFormat implementations must use. These error codes ensure consistent error handling across all language libraries and enable precise compliance testing.

## Error Code Format

Error codes follow the format: `neuro.category.specific_error`

- **neuro**: Standard prefix for all NeuroFormat errors
- **category**: High-level error category (e.g., schema, parse, ref, exec)
- **specific_error**: Specific error condition within the category (using underscores for multi-word errors)

## Schema Validation Errors

### neuro.schema.invalid_json

**Description**: The provided JSON is malformed and cannot be parsed  
**When to use**: JSON syntax errors, missing brackets, invalid escape sequences  
**Example**: `"Malformed JSON: missing closing bracket at line 15"`

### neuro.schema.validation_failed

**Description**: JSON is valid but does not conform to NeuroFormat schema  
**When to use**: Missing required fields, invalid field types, constraint violations  
**Example**: `"Schema validation failed: missing required field 'metadata.model.name'"`

### neuro.schema.unsupported_version

**Description**: The schema version specified is not supported  
**When to use**: Unknown or deprecated schema versions  
**Example**: `"Unsupported schema version: 'neuro-schema-2024-1'"`

### neuro.schema.invalid_dtype

**Description**: An invalid data type was specified  
**When to use**: Unsupported or misspelled dtype values  
**Example**: `"Invalid dtype 'float128': supported types are float16, float32, float64"`

### neuro.schema.invalid_shape

**Description**: An invalid tensor shape was specified  
**When to use**: Negative dimensions, non-integer dimensions  
**Example**: `"Invalid shape [-1, 10]: dimensions must be non-negative integers"`

### neuro.schema.missing_required_field

**Description**: A required field or section is missing from the model  
**When to use**: Missing required fields, missing required sections, empty required sections  
**Example**: `"Missing required field 'metadata.model.name'" or "Missing required section: 'export'"`

## Reference Resolution Errors

### neuro.ref.node_not_found

**Description**: Referenced node does not exist in the current scope  
**When to use**: Node arguments reference non-existent inputs, definitions, or local nodes  
**Example**: `"Node reference 'nonexistent_input' not found in current scope"`

### neuro.ref.definition_not_found

**Description**: Referenced definition does not exist  
**When to use**: Node type references a definition that doesn't exist  
**Example**: `"Definition 'my_custom_layer' not found in definitions section"`

### neuro.ref.circular_dependency

**Description**: Circular dependency detected in node references  
**When to use**: Definition A references definition B which references A  
**Example**: `"Circular dependency detected: layer_a -> layer_b -> layer_a"`

### neuro.ref.invalid_path

**Description**: Reference path format is invalid  
**When to use**: Malformed reference paths, invalid characters  
**Example**: `"Invalid reference path 'my-invalid@path': must match pattern '^[a-zA-Z_][a-zA-Z0-9_]*(\\/[a-zA-Z_][a-zA-Z0-9_]*)*$'"`

### neuro.ref.data_not_found

**Description**: Referenced data object does not exist  
**When to use**: Weight or variable references point to non-existent data  
**Example**: `"Data reference 'variables/layer1_weights' not found"`

### neuro.ref.import_not_found

**Description**: Referenced import does not exist or cannot be loaded  
**When to use**: Import references point to missing files or invalid imports  
**Example**: `"Import 'model_weights' references missing file './weights/model.safetensors'"`

### neuro.ref.circular_import

**Description**: Circular import dependency detected  
**When to use**: Import A references import B which directly or indirectly references import A  
**Example**: `"Circular import detected: model_a.neuro.json -> model_b.neuro.json -> model_a.neuro.json"`

### neuro.ref.duplicate_import

**Description**: Multiple imports with the same name detected  
**When to use**: Two or more imports in the same model have identical names  
**Example**: `"Duplicate import name 'shared_module': each import must have a unique name"`

### neuro.ref.import_security_violation

**Description**: Import path violates security restrictions  
**When to use**: Path traversal attempts, access to restricted directories, or other security violations  
**Example**: `"Import security violation: path '../../../etc/passwd' attempts directory traversal"`

## Type System Errors

### neuro.type.unknown_operator

**Description**: Unknown operator type specified  
**When to use**: Operator type not found in operators schema or namespace  
**Example**: `"Unknown operator type 'custom_add': not found in operators schema"`

### neuro.type.unknown_layer

**Description**: Unknown layer type specified  
**When to use**: Layer type not found in layers schema or namespace  
**Example**: `"Unknown layer type 'my_layer': not found in layers schema"`

### neuro.type.unknown_architecture

**Description**: Unknown architecture type specified  
**When to use**: Architecture type not found in architectures schema or namespace  
**Example**: `"Unknown architecture type 'transformer_v2': not found in architectures schema"`

### neuro.type.invalid_identifier

**Description**: Invalid identifier format in type specification
**When to use**: Malformed identifiers in custom types or references
**Example**: `"Invalid identifier 'my@layer!foo': identifiers must match 'name', 'namespace:name', or 'namespace:path/to/item' patterns"`

### neuro.type.invalid_namespace

**Description**: Invalid namespace format in type specification  
**When to use**: Malformed namespace syntax in custom types  
**Example**: `"Invalid namespace format 'my@company:layer': namespaces may only contain letters, digits, and underscores"`

## Execution Errors

### neuro.exec.shape_mismatch

**Description**: Input tensor shapes do not match expected shapes  
**When to use**: Runtime shape validation failures  
**Example**: `"Shape mismatch: expected [10, 5] but got [10, 3] for input 'data'"`

### neuro.exec.dtype_mismatch

**Description**: Input tensor dtypes do not match expected dtypes  
**When to use**: Runtime dtype validation failures  
**Example**: `"Dtype mismatch: expected float32 but got int32 for input 'weights'"`

### neuro.exec.missing_weights

**Description**: Required weights are missing for execution  
**When to use**: Node requires weights but none are provided  
**Example**: `"Missing required weights for linear layer 'fc1'"`

### neuro.exec.invalid_attributes

**Description**: Node attributes are invalid or incomplete  
**When to use**: Required attributes missing or invalid attribute values  
**Example**: `"Invalid attribute 'in_features': must be positive integer, got -5"`

### neuro.exec.runtime_error

**Description**: Runtime execution error in node computation  
**When to use**: Mathematical errors, numerical instability, provider-specific errors  
**Example**: `"Runtime error in matmul operation: incompatible matrix dimensions"`

## Implementation Errors

### neuro.impl.not_implemented

**Description**: Feature or operation is not implemented in this library  
**When to use**: Unsupported operators, layers, or features  
**Example**: `"Operator 'fft' is not implemented in this library version"`

### neuro.impl.provider_error

**Description**: Error from underlying compute provider (PyTorch, ONNX, etc.)  
**When to use**: Provider-specific errors that cannot be categorized otherwise  
**Example**: `"PyTorch provider error: CUDA out of memory"`

### neuro.impl.version_incompatible

**Description**: Implementation version incompatibility  
**When to use**: Library version conflicts, unsupported feature versions  
**Example**: `"Feature requires library version 2.0+ but current version is 1.5"`

## Graph Errors

### neuro.graph.invalid_structure

**Description**: Graph structure is logically invalid  
**When to use**: Valid JSON/schema but illogical graph structure  
**Example**: `"Invalid graph structure: node references undefined inputs"`

## Internal Errors

### neuro.internal.error

**Description**: An unexpected internal error occurred
**When to use**: Unhandled exceptions, logic errors, or unexpected states
**Example**: `"Internal error: unexpected null reference in node processing"`

## Usage Guidelines

### For Library Implementers

1. **Always use canonical error codes** when throwing NeuroFormat-related exceptions
2. **Include descriptive messages** that help users understand the specific issue
3. **Maintain error code consistency** across different language implementations
4. **Map provider errors** to appropriate neuro.\* error codes when possible

### For Compliance Testing

1. **Specify exact error codes** in test definitions using the `code` field
2. **Use message patterns** for additional validation when needed
3. **Test error conditions thoroughly** to ensure consistent error handling
4. **Verify error codes match** between different implementations

### Example Error Object

```json
{
  "code": "neuro.ref.node_not_found",
  "message": "Node reference 'nonexistent_input' not found in current scope",
  "details": {
    "reference": "nonexistent_input",
    "scope": "export",
    "available_nodes": ["input", "layer1", "output"]
  }
}
```

## Versioning

Error codes are versioned with the NeuroFormat specification. New error codes may be added in minor versions, but existing codes will not be removed or changed until major version updates.

Current version: **2025-1**  
Last updated: **June 25, 2025**
