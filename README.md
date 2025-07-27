# NeuroFormat Schema

A unified JSON schema system for describing neural network models as hierarchical node graphs.

## Overview

NeuroFormat introduces the **NeuroGraph** format - a human-readable, framework-agnostic approach to neural network model representation that differs from existing serialized formats.
**NeuroGraph** aims to provide an agnostic abstraction defining the structure of AI models, where models are written once in human-readable form and deployed everywhere through a unified ecosystem of language and provider libraries.

### What Makes NeuroGraph Different

**🖊️ Human-Readable & Editable**  
Unlike binary or complex serialization formats, NeuroGraph uses clean JSON that model authors can write, read, and edit directly without specialized tools.  
No more wrestling with export scripts or format-specific APIs - just define your model structure in JSON.

**🌐 Language & Provider Agnostic Architecture**  
NeuroGraph employs a two-layer abstraction system:

1. **Language Libraries**: Each programming language (Python, JavaScript, Rust, C++, etc.) has its own implementation package that reads `.neuro.json` files into native in-memory node-graph representations
2. **Provider Libraries**: Specific compute providers (PyTorch, LibTorch, ONNX Runtime, TensorFlow, etc.) have dedicated packages that translate the node-graph representation into provider-specific execution instructions

This separation means you write your model once in NeuroGraph, then deploy it anywhere without format conversion hassles.

**⚡ Direct Model Authoring**  
Instead of being an export target, _NeuroGraph_ is designed as a primary authoring format. Model developers can define their architectures directly in `.neuro.json` files, making model sharing, version control, and collaboration as simple as sharing a text file.

## Design Goals

NeuroGraph prioritizes human-centric development over serialization efficiency:

- **🖊️ Human Authoring**: Write and edit models directly in JSON without specialized tools
- **📖 Readability**: Clear structure that developers can understand at a glance
- **🔗 Universal Deployment**: Language-agnostic format with provider-specific translation layers
- **📝 Version Control Friendly**: Text-based format that works seamlessly with Git
- **🔄 Modularity**: Reusable components across models, languages, and frameworks
- **🔧 Extensibility**: Custom and third-party components via namespacing
- **⚡ Rapid Prototyping**: Quick iteration without framework lock-in

## Getting Started

1. **Explore Examples**: Check the `docs/examples/` directory for complete model definitions
2. **Validate Models**: Use JSON Schema validators with the provided `.schema.json` files
3. **Reference Schema Version**: Include the `$schema` field in your `.neuro.json` files for validation and tooling support
4. **Build Language Libraries**: Implement parsers for your preferred programming language
5. **Create Provider Libraries**: Add support for your compute framework (PyTorch, TensorFlow, etc.)
6. **Extend the Schema**: Add custom operators, layers, or architectures using namespacing

## NeuroGraph Concepts

### Hierarchical Node Composition

The NeuroGraph format is built around a simple concept: **everything is a node**.
Nodes can be composed hierarchically to create increasingly complex structures:

- **Operators** (Atomic nodes): Basic mathematical operations like `add`, `multiply`, `matmul`, `relu`
- **Layers** (Compound nodes): Neural network components like `linear`, `convolution`, `attention`
- **Architectures** (Compound nodes): High-level patterns like `sequential`, `transformer`, `resnet`

### Unified Structure

All nodes, regardless of complexity, follow the same structural pattern:

```json
{
  "name": "node_name",
  "type": "node_type",
  "arguments": [
    /* input specifications */
  ],
  "attributes": {
    /* node-specific parameters */
  },
  "subgraph": [
    /* internal node composition */
  ],
  "weights": "/* optional weight data */"
}
```

This unified approach enables:

- **Modularity**: Reusable component definitions
- **Composability**: Nodes can contain other nodes recursively
- **Extensibility**: Third-party components via `namespace:type` syntax
- **Consistency**: Same validation and tooling for all abstraction levels

## File Structure

A `.neuro.json` file contains these sections:

### 📋 `metadata` (Required)

Defines model information and configuration:

**Key fields:**

- **Core metadata**: `name`, `version`, `description`, `author`, `license`
- **UI configuration**: Display settings, icons, prompting guidelines
- **Third-party sections**: Custom metadata for external tools

#### Example

```json
{
  "metadata": {
    "model": {
      "name": "example_model",
      "version": "1.0.0",
      "description": "Model description",
      "author": "Author Name",
      "license": "MIT",
      "tags": ["classification", "cnn"]
    }
  }
}
```

**For detailed UI metadata configuration**, see [`docs/ui-metadata.md`](./docs/ui-metadata.md).

### 🔌 `inputs` (Required)

Defines the input tensors the model expects:

```json
{
  "inputs": [
    {
      "name": "image",
      "description": "RGB image input",
      "shape": [3, 224, 224],
      "dtype": "float32"
    }
  ]
}
```

### 🔍 `outputs` (Required)

Defines the output tensors the model produces:

```json
{
  "outputs": [
    {
      "name": "predictions",
      "description": "Class probabilities",
      "shape": [1000],
      "dtype": "float32"
    }
  ]
}
```

### 🔢 `constants` (Optional)

Define named constants for model configuration and reusable values:

```json
{
  "constants": [
    {
      "name": "hidden_size",
      "type": "scalar",
      "value": 768,
      "description": "Dimension of hidden layers in the model"
    },
    {
      "name": "model_weights",
      "type": "tensor",
      "dtype": "float32",
      "shape": [768, 512],
      "value": "@{weights_file/layer_weights}",
      "description": "Pretrained weights for the linear layer"
    }
  ]
}
```

**Constant Types:**

- **`scalar`**: Single numeric, string, or boolean values
- **`tensor`**: Multi-dimensional arrays with shape and dtype specifications

**Value Sources:**

- **Direct values**: Numbers, strings, arrays embedded in the file
- **References**: `"@{import_name/tensor_name}"` for imported data
- **Base64/Hex**: Encoded binary data for embedding weights directly

### 🎯 `export` (Required)

The main execution graph - defines how the model processes inputs to produce outputs:

```json
{
  "export": [
    {
      "name": "classifier",
      "type": "resnet50",
      "arguments": ["@{image}"]
    }
  ]
}
```

### 🔧 `definitions` (Optional)

Reusable node definitions for operators, layers, and architectures:

```json
{
  "definitions": [
    {
      "name": "my_sequential_classifier",
      "type": "sequential",
      "arguments": [{ "name": "input", "type": "tensor" }],
      "subgraph": [
        {
          "name": "fc1",
          "type": "linear",
          "arguments": ["@{inputs.input}"]
        },
        { "name": "relu1", "type": "activation", "arguments": ["@{fc1}"] },
        { "name": "output", "type": "linear", "arguments": ["@{relu1}"] }
      ]
    }
  ]
}
```

### 📦 `imports` (Optional)

Enable modular model design through importing external resources:

```json
{
  "imports": [
    {
      "name": "text_encoder",
      "type": "neuro",
      "path": "./encoders/bert_base.neuro.json"
    },
    {
      "name": "pretrained_weights",
      "type": "safetensors",
      "path": "./weights/model.safetensors"
    }
  ]
}
```

**Import Types:**

- **`type: "neuro"`**: Import entire `.neuro.json` models
  - Imported model becomes available as a node type
  - All sections accessible via namespace syntax: `import_name:section/item`
- **`type: "safetensors"`**: Import tensor data for weights
  - Tensors accessible via: `"@{import_name/tensor_name}"`

**Namespace Reference Syntax:**

- **Constants**: `"@{encoder:constants/hidden_size}"`
- **Definitions**: `"type": "encoder:definitions/attention_layer"`
- **Weights**: `"@{weights/layer1_weight}"`

For complete documentation and examples, see [`docs/imports-and-references.md`](./docs/imports-and-references.md).

This consistent referencing system works across all contexts - whether connecting nodes in a graph, referencing inputs, or using custom definitions.

## Schema Architecture

The NeuroFormat schema system is modular and extensible:

### Core Schemas

- **`neuro.schema.json`**: Main schema defining file structure and base node types
- **`operators.schema.json`**: Mathematical operators (add, multiply, matmul, etc.)
- **`layers.schema.json`**: Neural network layers (linear, convolution, attention, etc.)
- **`architectures.schema.json`**: High-level architectures (sequential, transformer, etc.)

### Type System

The schemas use concise "catchall" type definitions to reduce redundancy:

- **`anyint`**: Any signed integer type (`int8`, `int16`, `int32`, `int64`)
- **`anyuint`**: Any unsigned integer type (`uint8`, `uint16`, `uint32`, `uint64`)
- **`anyfloat`**: Any floating-point type (`float16`, `float32`, `float64`)
- **`anynumeric`**: Any numeric type (combination of above)

### Extensibility

Third-party extensions are supported through namespaced types:

```json
{
  "type": "mycompany:custom_operator",
  "attributes": {
    "custom_parameter": "value"
  }
}
```

## Examples

### Simple Sequential Classifier

```json
{
  "$schema": "https://raw.githubusercontent.com/neuro-graph/schemas/latest/neuro.schema.json",
  "metadata": {
    "model": {
      "name": "mnist_classifier",
      "version": "1.0.0",
      "description": "Simple MNIST digit classifier"
    }
  },
  "inputs": [{ "name": "image", "shape": [1, 784], "dtype": "float32" }],
  "outputs": [{ "name": "predictions", "shape": [1, 10], "dtype": "float32" }],
  "definitions": [
    {
      "name": "classifier",
      "type": "sequential",
      "arguments": [{ "name": "input", "type": "tensor", "shape": [784] }],
      "subgraph": [
        {
          "name": "fc1",
          "type": "linear",
          "arguments": ["@{./inputs.input}"]
        },
        { "name": "relu1", "type": "activation", "arguments": ["@{fc1}"] },
        { "name": "fc2", "type": "linear", "arguments": ["@{relu1}"] },
        { "name": "output", "type": "activation", "arguments": ["@{fc2}"] }
      ]
    }
  ],
  "export": [
    { "name": "main", "type": "classifier", "arguments": ["@{inputs.image}"] }
  ]
}
```

### Multimodal Model with Imports

For a complete example demonstrating the import system, see [`docs/examples/multimodal_with_imports.neuro.json`](./docs/examples/multimodal_with_imports.neuro.json). This example shows:

- **Model Imports**: Importing text and image encoders as reusable components
- **Weight Imports**: Loading pretrained weights from safetensors files
- **Configuration Imports**: Sharing constants and definitions across models
- **Namespace References**: Accessing imported constants, definitions, and weights
- **Cross-Modal Architecture**: Combining multiple imported models into a unified system

### Additional Examples

For more examples, see the `docs/examples/` directory:

- [`example.neuro.json`](./docs/examples/example.neuro.json) - Comprehensive format demonstration
- [`sequential_classifier.neuro.json`](./docs/examples/sequential_classifier.neuro.json) - Simple classification model
- [`encoders/`](./docs/examples/encoders/) - Modular encoder components
- [`config/`](./docs/examples/config/) - Shared configuration files

## Documentation

- **[Import System Guide](./docs/imports-and-references.md)** - Complete guide to imports and namespace references
- **[UI Metadata Guide](./docs/ui-metadata.md)** - User interface presentation configuration
- **[Error Codes](./docs/error-codes.md)** - Canonical error codes for compliance testing
- **[Testing Framework](./tests/README.md)** - Compliance test suite and validation framework

## Contributing

To contribute to the NeuroFormat schema:

1. **Follow the modular design** - Keep schemas focused and composable
2. **Add comprehensive tests** - Include compliance tests for new features
3. **Document thoroughly** - Update documentation and examples
4. **Maintain compatibility** - Consider backward compatibility for schema changes
5. **Use semantic versioning** - Follow semantic versioning for schema updates

## Library Hierarchy

The NeuroGraph format is designed to be implemented across various programming languages and compute providers. The following diagram illustrates the hierarchy for libraries that implement the NeuroGraph format:

```mermaid
flowchart LR
    A["<b>.neuro.json</b><br/><i>Human Readable<br/>Model Format</i>"]
    B["<b>Language Library</b><br/><i>(Python, JavaScript,<br/>Rust, C++, etc.)</i>"]
    C["<b>Provider Library</b><br/><i>(PyTorch, ONNX,<br/>TensorFlow, etc.)</i>"]
    A --> B
    B --> C

    style A stroke:#01579b,stroke-width:2px
    style B stroke:#4a148c,stroke-width:2px
    style C stroke:#1b5e20,stroke-width:2px
```
