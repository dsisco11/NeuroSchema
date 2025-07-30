# Node Definition Refactor - Scope Document

## Scope

Refactor the NeuroSchema node-definition structure to:

1. Add a new "outputs" field that provides named aliases for outputs from subgraph nodes

## Functional Requirements

### Core Changes

- **Add "outputs" field**: New required field that allows naming and aliasing outputs from subgraph nodes within a definition
- **Breaking change**: Existing node definitions will need to add the "outputs" field
- **Update schema validation**: Schema must support the new "outputs" field structure

### Non-Functional Requirements

- **Schema validation**: Changes must maintain JSON Schema validity
- **Documentation consistency**: All documentation and examples must reflect the new structure
- **Migration path**: Clear migration guidance for existing models (breaking change)

## Design Aspects

### Current Structure Analysis

From the schema, the current `node_definition` has:

```json
{
  "arguments": {
    "type": "array",
    "description": "Input arguments that this node definition expects...",
    "items": {
      "type": "object",
      "required": ["name", "type"],
      "properties": {
        "name": { "type": "string" },
        "type": { "type": "string" },
        "required": { "type": "boolean", "default": true },
        "description": { "type": "string" }
      }
    }
  }
}
```

### Target Structure

The new structure should add an "outputs" field:

```json
{
  "arguments": {
    // Existing structure unchanged
  },
  "outputs": {
    "type": "array",
    "description": "Named output aliases that reference subgraph node outputs",
    "items": {
      "type": "object",
      "required": ["name", "source"],
      "properties": {
        "name": { "type": "string", "description": "Name of the output alias" },
        "description": {
          "type": "string",
          "description": "Description of the output"
        },
        "source": {
          "$ref": "#/definitions/qualified_ref",
          "description": "Reference to the source subgraph node output"
        }
      }
    }
  }
}
```

### Integration Points

- **Validation systems**: May need updates to handle new "outputs" field and validate source references
- **Documentation**: Examples and guides need updates to show "outputs" usage

## Assumptions

1. The "outputs" field should be required in `node_definition`
2. The "outputs" field should follow a similar pattern to "arguments" but reference subgraph node outputs via qualified-ref
3. The "arguments" field should remain optional
4. The change is breaking and requires migration (due to required "outputs" field)

## Constraints

- **Schema compatibility**: Must remain valid JSON Schema
- **Existing tooling**: Changes should not break existing parsing/validation tools unnecessarily
- **Performance**: Schema validation performance should not degrade
- **Clarity**: New structure should be more intuitive than current

## Existing Documentation

Need to analyze:

- Current schema documentation
- Example files in the NeuroSchema repository
- Any existing validation or compliance tests
- Migration documentation patterns

## Questions

**RESOLVED:**

1. ✅ **Output Structure**: Array like "arguments", with name/description/source properties
2. ✅ **Node Instance Impact**: No changes needed to `node_instance`
3. ✅ **Migration Strategy**: Breaking change, requires migration
4. ✅ **Output References**: By qualified-reference to subgraph node outputs
5. ✅ **Validation**: Out of scope for this change
6. ✅ **Default Behavior**: "outputs" field is required, no default behavior needed

**ALL QUESTIONS RESOLVED - READY FOR DESIGN PHASE**
