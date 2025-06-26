# NeuroFormat UI Metadata Documentation

The `metadata.model.ui` section provides user interface presentation information for NeuroFormat models. This section enables consistent presentation of models across different applications and tools while supporting specialized UI configurations.

## Overview

The UI metadata section allows model authors to specify how their models should be presented in graphical interfaces, including display names, descriptions, visual styling, and interaction patterns.

```json
{
  "metadata": {
    "model": {
      "name": "bert_base",
      "version": "1.0.0",
      "ui": {
        "display_name": "BERT Base (Uncased)",
        "description": "A bidirectional transformer for understanding natural language",
        "icon": "https://example.com/icons/bert.svg",
        "colors": {
          "light": {
            "primary": "#4285F4",
            "secondary": "#34A853"
          },
          "dark": {
            "primary": "#5A9BF8",
            "secondary": "#4CAF50"
          }
        },
        "prompting": {
          "phrases": {
            "required": "Answer the following question:",
            "recommended": [
              "Based on the context provided:",
              "Please explain:",
              "Summarize the key points:"
            ]
          }
        }
      }
    }
  }
}
```

## Properties

### `display_name` (Optional)

**Type:** `string`

A human-readable name for the model that's more suitable for user interfaces than the technical `name` field.

**Examples:**

- `"BERT Base (Uncased)"` instead of `"bert_base_uncased"`
- `"GPT-3.5 Turbo"` instead of `"gpt35_turbo"`
- `"ResNet-50 ImageNet"` instead of `"resnet50_imagenet"`

**Usage:**

```json
{
  "ui": {
    "display_name": "Vision Transformer (ViT-B/16)"
  }
}
```

### `description` (Optional)

**Type:** `string`

A UI-specific description that may be different from the technical description in the main metadata. This should be written for end users rather than developers.

**Examples:**

```json
{
  "ui": {
    "description": "A powerful language model that can understand and generate human-like text responses"
  }
}
```

### `icon` (Optional)

**Type:** `string`

A resource link (URL or relative path) to an icon representing the model. The icon should be suitable for display in user interfaces.

### `colors` (Optional)

**Type:** `object`

Color theming configuration that supports both light and dark themes with primary and secondary color variants.

**Structure:**
```json
{
  "ui": {
    "colors": {
      "light": {
        "primary": "#4285F4",
        "secondary": "#34A853"
      },
      "dark": {
        "primary": "#5A9BF8", 
        "secondary": "#4CAF50"
      }
    }
  }
}
```

**Properties:**

- **`light`** (Optional): Colors for light theme
  - **`primary`** (Optional): Primary color for light theme (hex format: `#RRGGBB`)
  - **`secondary`** (Optional): Secondary color for light theme (hex format: `#RRGGBB`)
- **`dark`** (Optional): Colors for dark theme  
  - **`primary`** (Optional): Primary color for dark theme (hex format: `#RRGGBB`)
  - **`secondary`** (Optional): Secondary color for dark theme (hex format: `#RRGGBB`)

**Usage examples:**
```json
{
  "ui": {
    "colors": {
      "light": {
        "primary": "#1976D2",
        "secondary": "#FFC107"
      },
      "dark": {
        "primary": "#42A5F5",
        "secondary": "#FFD54F"
      }
    }
  }
}
```

**Common use cases:**
- Model cards and listings with theme-aware styling
- Progress indicators and status displays
- Category groupings and visual organization

### `prompting` (Optional)

**Type:** `object`

Configuration for models that support prompting, defining required and recommended phrases for optimal interaction.

#### `prompting.phrases` (Optional)

**Type:** `object`

Defines specific phrases that should be used when prompting the model.

##### `prompting.phrases.required` (Optional)

**Type:** `string`

A required phrase that must be included in prompts for the model to function correctly.

**Examples:**

```json
{
  "ui": {
    "prompting": {
      "phrases": {
        "required": "Answer the following question:"
      }
    }
  }
}
```

##### `prompting.phrases.recommended` (Optional)

**Type:** `array` of `string`

An array of recommended phrases that improve the model's performance or behavior.

**Examples:**

```json
{
  "ui": {
    "prompting": {
      "phrases": {
        "recommended": [
          "Think step by step:",
          "Based on the context:",
          "Please be concise:",
          "Explain your reasoning:"
        ]
      }
    }
  }
}
```

## Complete Example

```json
{
  "metadata": {
    "model": {
      "name": "multimodal_classifier_v2",
      "version": "2.1.0",
      "description": "Technical classifier for image and text inputs",
      "author": "AI Research Lab",
      "license": "Apache-2.0",
      "tags": ["multimodal", "classification", "vision", "nlp"],
      "ui": {
        "display_name": "Multimodal Content Classifier",
        "description": "Classify images and text content across multiple categories with high accuracy",
        "icon": "https://assets.ailab.com/models/multimodal-classifier.svg",
        "colors": {
          "light": {
            "primary": "#FF6B35",
            "secondary": "#FF8A50"
          },
          "dark": {
            "primary": "#FF8A50",
            "secondary": "#FFB74D"
          }
        },
        "prompting": {
          "phrases": {
            "required": "Classify the following content:",
            "recommended": [
              "Consider both visual and textual elements:",
              "Provide confidence scores:",
              "Explain your classification:"
            ]
          }
        }
      }
    }
  }
}
```

## Best Practices

### Display Names

- Use title case (e.g., "BERT Base Uncased")
- Include model size/variant information when relevant
- Avoid technical abbreviations unless they're widely known
- Keep under 50 characters when possible

### Descriptions

- Write for your target users, not developers
- Focus on capabilities and use cases
- Avoid technical jargon
- Keep under 200 characters for UI compatibility

### Icons

- Use vector formats (SVG) when possible for scalability
- Ensure good contrast and visibility at small sizes
- Consider dark/light theme compatibility

### Prompting Configuration

- Test required phrases thoroughly
- Provide examples in a documentation `model.md` file included with the model

## Validation

The UI metadata is validated against the NeuroFormat schema. Key validation rules:

1. **Color format**: All color fields must be valid 6-digit hex colors (e.g., `#FF6B35`)
2. **Icon URL**: Must be a valid string (URL validation is application-specific)
3. **All fields optional**: UI metadata is entirely optional, including individual color fields
4. **String constraints**: No length limits enforced by schema, but UI best practices apply

## Migration Notes

When updating models with UI metadata:

1. **Backward compatibility**: UI metadata is optional and doesn't affect model functionality
2. **Graceful degradation**: Applications should handle missing UI metadata gracefully

# Implementation Notes

- Everything within the `ui` section is completely optional.
- Applications should not fail if a UI metadata field is missing.
- Use default values or fallbacks in your application logic to ensure a consistent user experience even when UI metadata is not provided.

## Resolving the Colors Field

- The `colors` field allows specifying primary and secondary colors for both light and dark themes.
- If only one theme is provided, the other should default to the same values.
- For primary and secondary colors, if only one is specified, the other should default to the same value.

### Color Resolving Logic

```typescript
interface NeuroMetadata {
    ui?: {
        colors?: {
            light?: {
                primary?: string;
                secondary?: string;
            };
            dark?: {
                primary?: string;
                secondary?: string;
            };
        };
    };
}

function resolveColors(metadata: NeuroMetadata) {
    const colors = metadata.ui?.colors;
    return {
        light: {
            primary: colors?.light?.primary || colors?.dark?.primary || yourapp.theme.light.primary,
            secondary: colors?.light?.secondary || colors?.dark?.secondary || yourapp.theme.light.secondary
        },
        dark: {
            primary: colors?.dark?.primary || colors?.light?.primary || yourapp.theme.dark.primary,
            secondary: colors?.dark?.secondary || colors?.light?.secondary || yourapp.theme.dark.secondary
        }
    };
}
```

## Related Documentation

- [Model Metadata Overview](./model-metadata.md)
- [Schema Reference](../schema/2025-draft/neuro.schema.json)
- [Examples Collection](./examples/)
