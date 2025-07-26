# Imports and References

This document explains how the NeuroFormat import system works and how to reference imported content using namespace syntax.

## Overview

NeuroFormat supports importing external resources to enable modular model design and code reuse. There are two types of imports:

1. **NeuroFormat Models** (`type: "neuro"`) - Import entire `.neuro.json` files
2. **Tensor Data** (`type: "safetensors"`) - Import weight data from safetensors files

## Import Declaration

All imports are declared in the `imports` section:

```json
{
  "imports": [
    {
      "name": "encoder",
      "type": "neuro",
      "path": "./modules/encoder.neuro.json"
    },
    {
      "name": "weights",
      "type": "safetensors",
      "path": "./weights/model.safetensors"
    }
  ]
}
```

## NeuroFormat Model Imports

When you import a NeuroFormat model with `type: "neuro"`, two things happen:

### 1. Model as Node Type

The imported model becomes available as a node type using the import `name`:

```json
{
  "export": [
    {
      "name": "my_encoder",
      "type": "encoder", // References the imported model by name
      "arguments": ["@{inputs.input_tensor}"]
    }
  ]
}
```

### 2. Namespace Access

All sections of the imported model become accessible via namespace syntax: `import_name:section/item`

#### Accessing Constants

```json
{
  "constants": [
    {
      "name": "learning_rate",
      "type": "scalar",
      "value": "@{encoder:constants/lr}" // Access imported constant
    }
  ]
}
```

#### Accessing Definitions

```json
{
  "export": [
    {
      "name": "custom_layer",
      "type": "encoder:definitions/attention_layer", // Use imported definition
      "arguments": ["@{inputs.input_01}"]
    }
  ]
}
```

#### Accessing Other Sections

The namespace syntax works for any section in the imported model:

- `encoder:constants/value_name` - Access constants
- `encoder:definitions/node_name` - Access node definitions
- `encoder:inputs/tensor_name` - Reference input specifications
- `encoder:outputs/tensor_name` - Reference output specifications

## Safetensors Imports

When you import tensor data with `type: "safetensors"`, the tensors become available for weight references:

```json
{
  "imports": [
    {
      "name": "pretrained_weights",
      "type": "safetensors",
      "path": "./weights/model.safetensors"
    }
  ],
  "export": [
    {
      "name": "linear_layer",
      "type": "linear",
      "arguments": ["@{inputs.input_01}"],
      "weights": {
        "ref": "pretrained_weights/layer1_weight" // Reference imported tensor
      }
    }
  ]
}
```

## Reference Syntax

### Node References

For referencing nodes, use the simple string format:

```json
"arguments": ["encoder:definitions/transformer_block"]
```

### Data References

For referencing data (constants, weights), use the object format:

```json
"value": "@{encoder:constants/hidden_size}"
```

### Weight References

For referencing weights, use the object format:

```json
"weights": "@{weights/embedding_matrix}"
```

## Practical Examples

### Multi-Modal Model with Imports

```json
{
  "$schema": "https://raw.githubusercontent.com/neuro-format/schemas/2025-1/neuro.schema.json",
  "metadata": {
    "model": {
      "name": "multimodal_classifier",
      "version": "1.0.0"
    }
  },
  "imports": [
    {
      "name": "text_encoder",
      "type": "neuro",
      "path": "./encoders/bert_base.neuro.json"
    },
    {
      "name": "image_encoder",
      "type": "neuro",
      "path": "./encoders/vit_b16.neuro.json"
    },
    {
      "name": "pretrained_weights",
      "type": "safetensors",
      "path": "./weights/multimodal.safetensors"
    }
  ],
  "inputs": [
    { "name": "text", "shape": [512], "dtype": "int32" },
    { "name": "image", "shape": [224, 224, 3], "dtype": "float32" }
  ],
  "outputs": [
    { "name": "classification", "shape": [1000], "dtype": "float32" }
  ],
  "constants": [
    {
      "name": "text_dim",
      "type": "scalar",
      "value": "@{text_encoder:constants/hidden_size}"
    },
    {
      "name": "image_dim",
      "type": "scalar",
      "value": "@{image_encoder:constants/feature_dim}"
    }
  ],
  "export": [
    {
      "name": "text_features",
      "type": "text_encoder",
      "arguments": ["@{inputs.text}"]
    },
    {
      "name": "image_features",
      "type": "image_encoder",
      "arguments": ["@{inputs.image}"]
    },
    {
      "name": "fusion",
      "type": "linear",
      "arguments": ["@{text_features}", "@{image_features}"],
      "weights": "@{pretrained_weights/fusion_weights}",
      "attributes": {
        "in_features": "@{text_encoder:constants/hidden_size}",
        "out_features": 1000
      }
    }
  ]
}
```

### Hierarchical Model Structure

```json
{
  "imports": [
    {
      "name": "backbone",
      "type": "neuro",
      "path": "../shared/resnet_backbone.neuro.json"
    },
    {
      "name": "head",
      "type": "neuro",
      "path": "../heads/classification_head.neuro.json"
    }
  ],
  "export": [
    {
      "name": "features",
      "type": "backbone",
      "arguments": ["@{inputs.input_01}"]
    },
    {
      "name": "logits",
      "type": "head:definitions/classifier", // Use specific definition from import
      "arguments": ["@{./features}"]
    }
  ]
}
```

## Advanced Import Scenarios

### Nested Imports

Imported models can themselves have imports, creating a hierarchy of dependencies:

```json
// main_model.neuro.json
{
  "imports": [
    {
      "name": "multimodal_encoder",
      "type": "neuro",
      "path": "./encoders/multimodal.neuro.json"
    }
  ],
  "export": [
    {
      "name": "output",
      "type": "multimodal_encoder",
      "arguments": ["@{text}", "@{image}"]
    }
  ]
}

// encoders/multimodal.neuro.json
{
  "imports": [
    {
      "name": "text_model",
      "type": "neuro",
      "path": "./text_encoder.neuro.json"
    },
    {
      "name": "vision_model",
      "type": "neuro",
      "path": "./vision_encoder.neuro.json"
    }
  ]
  // ...rest of model
}
```

### Conditional Imports

While not directly supported by the schema, you can structure imports for conditional loading:

```json
{
  "imports": [
    {
      "name": "base_model",
      "type": "neuro",
      "path": "./models/base.neuro.json"
    },
    {
      "name": "low_precision_weights",
      "type": "safetensors",
      "path": "./weights/fp16_weights.safetensors"
    },
    {
      "name": "high_precision_weights",
      "type": "safetensors",
      "path": "./weights/fp32_weights.safetensors"
    }
  ]
}
```

### Version-Specific Imports

Use versioned paths for compatibility:

```json
{
  "imports": [
    {
      "name": "encoder_v2",
      "type": "neuro",
      "path": "./models/encoder/v2.1/encoder.neuro.json"
    },
    {
      "name": "legacy_weights",
      "type": "safetensors",
      "path": "./weights/v1_compat/weights.safetensors"
    }
  ]
}
```

## Reference Resolution Rules

### Search Order

When resolving references, the system follows this precedence:

1. **Local scope** - Nodes defined in the current model's sections
2. **Import namespace** - Content from imported models via `namespace:path`
3. **Built-in types** - Core operators, layers, and architectures

### Scoping Rules

- **Constants**: Always resolved at parse time, no runtime lookups
- **Definitions**: Resolved when the definition is instantiated
- **Weights**: Resolved when the model is loaded for execution
- **Node references**: Resolved during graph construction

### Reference Validation

All references must be resolvable at model validation time:

```json
{
  "constants": [
    {
      "name": "valid_ref",
      "type": "scalar",
      "value": "@{encoder:constants/hidden_size}" // ✓ Valid
    },
    {
      "name": "invalid_ref",
      "type": "scalar",
      "value": "@{missing:constants/value}" // ✗ Import 'missing' not found
    }
  ]
}
```

## Import Path Resolution

### Relative Paths

Paths are resolved relative to the importing file:

```json
// In /models/classification/resnet.neuro.json
{
  "imports": [
    {
      "name": "backbone",
      "type": "neuro",
      "path": "../shared/resnet_backbone.neuro.json" // → /models/shared/resnet_backbone.neuro.json
    },
    {
      "name": "weights",
      "type": "safetensors",
      "path": "./weights/resnet50.safetensors" // → /models/classification/weights/resnet50.safetensors
    }
  ]
}
```

### Absolute Paths

For system-wide shared components:

```json
{
  "imports": [
    {
      "name": "stdlib",
      "type": "neuro",
      "path": "/usr/share/neuroformat/stdlib/common.neuro.json"
    }
  ]
}
```

### URL-Based Imports

Remote imports (implementation-dependent):

```json
{
  "imports": [
    {
      "name": "pretrained_bert",
      "type": "neuro",
      "path": "https://models.example.com/bert-base.neuro.json"
    },
    {
      "name": "pretrained_weights",
      "type": "safetensors",
      "path": "https://weights.example.com/bert-base.safetensors"
    }
  ]
}
```

## Weight Import Strategies

### Fine-Grained Weight Access

Access specific tensor slices or transformations:

```json
{
  "export": [
    {
      "name": "layer1",
      "type": "linear",
      "arguments": ["@{inputs.input_01}"],
      "weights": {
        "ref": "weights/transformer.encoder.layers.0.self_attn.q_proj.weight"
      },
      "bias": {
        "ref": "weights/transformer.encoder.layers.0.self_attn.q_proj.bias"
      }
    }
  ]
}
```

### Weight Sharing

Multiple nodes can reference the same weights:

```json
{
  "export": [
    {
      "name": "encoder_layer_1",
      "type": "transformer_layer",
      "weights": "@{shared_weights/encoder_params}"
    },
    {
      "name": "encoder_layer_2",
      "type": "transformer_layer",
      "weights": "@{shared_weights/encoder_params}" // Same weights
    }
  ]
}
```

### Mixed Precision Weights

Different precision for different components:

```json
{
  "imports": [
    {
      "name": "fp16_weights",
      "type": "safetensors",
      "path": "./weights/model_fp16.safetensors"
    },
    {
      "name": "fp32_weights",
      "type": "safetensors",
      "path": "./weights/model_fp32.safetensors"
    }
  ],
  "export": [
    {
      "name": "backbone",
      "type": "resnet",
      "weights": "@{fp16_weights/backbone}" // Lower precision for backbone
    },
    {
      "name": "classifier",
      "type": "linear",
      "weights": "@{fp32_weights/head}" // Higher precision for final layer
    }
  ]
}
```

## Best Practices

### 1. Clear Import Names

Use descriptive names that indicate the purpose:

```json
{
  "name": "text_encoder", // Good: clear purpose
  "name": "bert", // Okay: recognizable
  "name": "model1" // Poor: unclear
}
```

### 2. Organize Related Imports

Group related functionality:

```json
"imports": [
  {
    "name": "vision_backbone",
    "type": "neuro",
    "path": "./vision/resnet50.neuro.json"
  },
  {
    "name": "vision_head",
    "type": "neuro",
    "path": "./vision/classification_head.neuro.json"
  },
  {
    "name": "vision_weights",
    "type": "safetensors",
    "path": "./weights/vision_model.safetensors"
  }
]
```

### 3. Use Namespace Access for Configuration

Import shared configuration and reference it:

```json
{
  "imports": [
    {
      "name": "config",
      "type": "neuro",
      "path": "./config/model_config.neuro.json"
    }
  ],
  "constants": [
    {
      "name": "hidden_size",
      "type": "scalar",
      "value": "@{config:constants/hidden_dim}"
    }
  ]
}
```

## Error Handling

The NeuroFormat compliance system defines specific error codes for import issues:

- `neuro.ref.circular_import` - Circular import dependencies detected
- `neuro.ref.import_not_found` - Referenced import file not found
- `neuro.ref.node_not_found` - Referenced node/section not found in import
- `neuro.schema.validation_failed` - Imported file fails schema validation

See [error-codes.md](./error-codes.md) for complete details.

## Validation

When validating models with imports, implementations should:

1. **Resolve all imports** - Load and validate all referenced files
2. **Check circular dependencies** - Prevent infinite import loops
3. **Validate references** - Ensure all namespace references exist
4. **Type compatibility** - Verify imported content matches usage context

## Migration from Other Formats

### From ONNX

```json
{
  "imports": [
    {
      "name": "pretrained_model",
      "type": "safetensors",
      "path": "./converted_from_onnx.safetensors"
    }
  ]
}
```

### From PyTorch/TensorFlow

```json
{
  "imports": [
    {
      "name": "checkpoint_weights",
      "type": "safetensors",
      "path": "./converted_checkpoint.safetensors"
    }
  ]
}
```

The import system enables flexible, modular model design while maintaining clear dependency relationships and supporting both code reuse and weight sharing across NeuroFormat models.

## Namespace Syntax Reference

### Complete Syntax Guide

The namespace syntax follows the pattern: `import_name:section/item_path`

**Components:**

- `import_name` - The name given to the import in the imports array
- `section` - The target section in the imported model (`constants`, `definitions`, `inputs`, `outputs`)
- `item_path` - Path to the specific item, using forward slashes for nested access

### Section Access Patterns

#### Constants Section

Access imported constants using the `ref` object pattern:

```json
{
  "constants": [
    {
      "name": "vocab_size",
      "type": "scalar",
      "value": "@{bert_model:constants/vocabulary_size}"
    },
    {
      "name": "max_length",
      "type": "scalar",
      "value": "@{config:constants/sequence_length}"
    }
  ]
}
```

#### Definitions Section

Use imported definitions as node types:

```json
{
  "export": [
    {
      "name": "encoder_block",
      "type": "transformer_lib:definitions/encoder_layer", // Direct type reference
      "arguments": ["@{inputs.input_01}"]
    },
    {
      "name": "custom_attention",
      "type": "attention_lib:definitions/multi_head_attention",
      "arguments": ["query", "key", "value"]
    }
  ]
}
```

#### Inputs/Outputs Section

Reference imported tensor specifications:

```json
{
  "inputs": [
    {
      "name": "processed_input",
      "shape": "@{preprocessor:inputs/raw_data/shape}",
      "dtype": "@{preprocessor:inputs/raw_data/dtype}"
    }
  ]
}
```

### Nested Path Access

For deeply nested structures, use forward slash separation:

```json
{
  "constants": [
    {
      "name": "attention_heads",
      "type": "scalar",
      "value": "@{config:constants/model_config/attention/num_heads}"
    }
  ]
}
```

### Type System Integration

Namespace references work seamlessly with the type system:

```json
{
  "definitions": [
    {
      "name": "custom_layer",
      "type": "base_model:definitions/transformer_block",
      "arguments": [{ "name": "x", "type": "tensor" }],
      "attributes": {
        "hidden_size": "@{base_model:constants/d_model}",
        "num_heads": "@{base_model:constants/n_heads}"
      }
    }
  ]
}
```

## Real-World Usage Patterns

### Model Composition Pipeline

A typical multi-stage model using imports:

```json
{
  "$schema": "../../../schema/2025-draft/neuro.schema.json",
  "metadata": {
    "model": {
      "name": "document_understanding_pipeline",
      "version": "2.0.0"
    }
  },
  "imports": [
    {
      "name": "ocr_model",
      "type": "neuro",
      "path": "./stages/text_extraction.neuro.json"
    },
    {
      "name": "layout_analyzer",
      "type": "neuro",
      "path": "./stages/layout_analysis.neuro.json"
    },
    {
      "name": "content_classifier",
      "type": "neuro",
      "path": "./stages/content_classification.neuro.json"
    },
    {
      "name": "pipeline_weights",
      "type": "safetensors",
      "path": "./weights/full_pipeline_v2.safetensors"
    }
  ],
  "inputs": [
    {
      "name": "document_image",
      "shape": [3, 1024, 1024],
      "dtype": "uint8"
    }
  ],
  "outputs": [
    {
      "name": "extracted_text",
      "shape": ["@{ocr_model:constants/max_text_length}"],
      "dtype": "int32"
    },
    {
      "name": "layout_regions",
      "shape": ["@{layout_analyzer:constants/max_regions}", 4],
      "dtype": "float32"
    },
    {
      "name": "content_categories",
      "shape": ["@{content_classifier:constants/num_categories}"],
      "dtype": "float32"
    }
  ],
  "export": [
    {
      "name": "text_extraction",
      "type": "ocr_model",
      "arguments": ["@{inputs.document_image}"]
    },
    {
      "name": "layout_analysis",
      "type": "layout_analyzer",
      "arguments": ["@{inputs.document_image}"]
    },
    {
      "name": "content_classification",
      "type": "content_classifier",
      "arguments": ["@{text_extraction}", "@{layout_analysis}"],
      "weights": "@{pipeline_weights/fusion_classifier}"
    }
  ]
}
```

### Configuration-Driven Development

Centralized configuration with multiple model variants:

```json
// shared_config.neuro.json
{
  "metadata": {"model": {"name": "shared_config"}},
  "inputs": [],
  "outputs": [],
  "constants": [
    {
      "name": "model_variants",
      "type": "object",
      "value": {
        "small": {"hidden_size": 256, "num_layers": 6, "num_heads": 4},
        "base": {"hidden_size": 512, "num_layers": 12, "num_heads": 8},
        "large": {"hidden_size": 1024, "num_layers": 24, "num_heads": 16}
      }
    },
    {
      "name": "training_config",
      "type": "object",
      "value": {
        "learning_rate": 0.0001,
        "batch_size": 32,
        "max_epochs": 100
      }
    }
  ],
  "export": []
}

// model_base.neuro.json
{
  "imports": [
    {"name": "config", "type": "neuro", "path": "./shared_config.neuro.json"}
  ],
  "constants": [
    {
      "name": "hidden_size",
      "type": "scalar",
      "value": "@{config:constants/model_variants/base/hidden_size}"
    },
    {
      "name": "num_layers",
      "type": "scalar",
      "value": "@{config:constants/model_variants/base/num_layers}"
    }
  ]
  // ...rest of model using the configuration
}
```

### Multi-Modal Fusion Architecture

Complex fusion of different modalities:

```json
{
  "imports": [
    {
      "name": "text_encoder",
      "type": "neuro",
      "path": "./modalities/text/bert_encoder.neuro.json"
    },
    {
      "name": "image_encoder",
      "type": "neuro",
      "path": "./modalities/vision/vit_encoder.neuro.json"
    },
    {
      "name": "audio_encoder",
      "type": "neuro",
      "path": "./modalities/audio/wav2vec_encoder.neuro.json"
    },
    {
      "name": "fusion_components",
      "type": "neuro",
      "path": "./fusion/multimodal_fusion.neuro.json"
    },
    {
      "name": "pretrained_weights",
      "type": "safetensors",
      "path": "./weights/multimodal_pretrained.safetensors"
    }
  ],
  "definitions": [
    {
      "name": "adaptive_fusion",
      "type": "fusion_components:definitions/attention_fusion",
      "arguments": [
        { "name": "text_features", "type": "tensor" },
        { "name": "image_features", "type": "tensor" },
        { "name": "audio_features", "type": "tensor" }
      ],
      "attributes": {
        "text_dim": "@{text_encoder:constants/output_dim}",
        "image_dim": "@{image_encoder:constants/output_dim}",
        "audio_dim": "@{audio_encoder:constants/output_dim}",
        "fusion_dim": "@{fusion_components:constants/unified_dim}"
      }
    }
  ],
  "export": [
    {
      "name": "text_features",
      "type": "text_encoder",
      "arguments": ["@{inputs.text_input}"]
    },
    {
      "name": "image_features",
      "type": "image_encoder",
      "arguments": ["@{inputs.image_input}"]
    },
    {
      "name": "audio_features",
      "type": "audio_encoder",
      "arguments": ["@{inputs.audio_input}"]
    },
    {
      "name": "fused_representation",
      "type": "adaptive_fusion",
      "arguments": ["text_features", "image_features", "audio_features"],
      "weights": "@{pretrained_weights/fusion_weights}"
    }
  ]
}
```

## Implementation Considerations

### Dependency Management

#### Circular Dependency Detection

Implementations must detect and prevent circular imports:

```
Model A → imports → Model B → imports → Model C → imports → Model A  ❌
```

**Detection Algorithm:**

1. Maintain a stack of currently resolving imports
2. Before resolving an import, check if it's already in the stack
3. If found, report `neuro.ref.circular_import` error
4. Remove from stack when resolution completes

#### Dependency Ordering

For optimal loading, resolve dependencies in topological order:

```
Base Models (no imports) → Level 1 Models → Level 2 Models → Final Model
```

### Caching and Performance

#### Import Resolution Caching

Cache resolved imports to avoid redundant file operations:

#### Lazy Loading

Load imports only when actually referenced:

```json
{
  "imports": [
    {
      "name": "large_model",
      "type": "neuro",
      "path": "./large_expensive_model.neuro.json" // Only load if used
    }
  ],
  "export": [
    // If this export section doesn't use 'large_model', don't load it
    {
      "name": "simple_output",
      "type": "identity",
      "arguments": ["@{inputs.input}"]
    }
  ]
}
```

### Security Considerations

#### Path Validation

Validate import paths to prevent directory traversal attacks:

```json
{
  "imports": [
    {
      "name": "malicious",
      "type": "neuro",
      "path": "../../etc/passwd" // ❌ Should be rejected
    }
  ]
}
```

**Validation Steps:**

- Resolve path into absolute form relative to the importing file.
- Ensure absolute path starts with the base directory of the model folder (e.g. the folder containing the initial neuro file which the user requested to load)

## Troubleshooting Guide

### Common Import Errors

#### Import File Not Found

```
Error: neuro.ref.import_not_found
Message: Import file './models/encoder.neuro.json' not found
```

**Solutions:**

- Verify the file path is correct relative to the importing file
- Check file permissions and accessibility
- Ensure the file extension matches the import type
- Verify the file exists in the expected location

#### Circular Import Detected

```
Error: neuro.ref.circular_import
Message: Circular import dependency: model_a → model_b → model_c → model_a
```

**Solutions:**

- Restructure models to eliminate cycles
- Extract shared components to a common base model
- Use composition instead of inheritance patterns

#### Reference Not Found

```
Error: neuro.ref.node_not_found
Message: Reference 'encoder:constants/hidden_size' not found in import 'encoder'
```

**Solutions:**

- Verify the referenced section exists in the imported model
- Check spelling and case sensitivity in the reference path
- Ensure the imported model defines the referenced constant/definition
- Validate that the namespace syntax is correct

#### Schema Validation Failed

```
Error: neuro.schema.validation_failed
Message: Imported file 'model.neuro.json' fails schema validation
```

**Solutions:**

- Validate the imported file independently
- Check that the imported file uses the correct schema version
- Fix any schema violations in the imported file
- Ensure all required fields are present
