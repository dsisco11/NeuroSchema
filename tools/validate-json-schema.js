#!/usr/bin/env node
/**
 * NeuroSchema JSON Schema Validation Script
 * Validates JSON files against the NeuroSchema using AJV
 */

const fs = require("fs");
const path = require("path");
const { program } = require("commander");

const operatorsSchema = require("../schema/2025-draft/operators.schema.json");
const layersSchema = require("../schema/2025-draft/layers.schema.json");
const architecturesSchema = require("../schema/2025-draft/architectures.schema.json");
const neuroSchema = require("../schema/2025-draft/neuro.schema.json");
const testsSchema = require("../tests/tests.schema.json");

const globalSchemaMap = {
  "operators.schema.json": operatorsSchema,
  "layers.schema.json": layersSchema,
  "architectures.schema.json": architecturesSchema,
  "neuro.schema.json": neuroSchema,
  "tests.schema.json": testsSchema,
};

// Define command line options
program
  .name("validate-json-schema")
  .description("Validate JSON files against NeuroSchema")
  .option("-p, --path <path>", "Base path to search for files", ".")
  .option(
    "-s, --schema <schema>",
    "Path to schema file",
    "schema/2025-draft/neuro.schema.json"
  )
  .option(
    "-t, --target <files...>",
    "Specific target files to validate (relative to path)"
  )
  .option("-v, --verbose", "Verbose output", false)
  .option("-i, --include <patterns...>", "Include file patterns", [
    "*.neuro.json",
    "*.json",
  ])
  .option("-e, --exclude <patterns...>", "Exclude file patterns", [
    "*.schema.json",
  ])
  .parse();

const options = program.opts();

// Install required packages if they don't exist
async function ensureDependencies() {
  const packageJsonPath = path.join(__dirname, "package.json");
  const nodeModulesPath = path.join(__dirname, "node_modules");

  if (!fs.existsSync(nodeModulesPath)) {
    console.log("Installing required dependencies...");

    // Create package.json if it doesn't exist
    if (!fs.existsSync(packageJsonPath)) {
      const packageJson = {
        name: "neurograph-schema-validator",
        version: "1.0.0",
        dependencies: {
          ajv: "^8.12.0",
          "ajv-formats": "^2.1.1",
          commander: "^11.0.0",
          glob: "^10.3.0",
          "json-source-map": "^0.6.1",
        },
      };

      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }

    // Install dependencies
    const { execSync } = require("child_process");
    try {
      execSync("npm install", {
        cwd: __dirname,
        stdio: options.verbose ? "inherit" : "pipe",
      });
    } catch (error) {
      console.error("❌ Failed to install dependencies");
      console.error("Please run: npm install");
      process.exit(1);
    }
  }
}

async function loadSchemaFileContent(schemaPath) {
  try {
    if (options.verbose) {
      console.trace(`Reading schema file: ${schemaPath}`);
    }
    const schemaContent = fs.readFileSync(schemaPath, "utf8");
    return JSON.parse(schemaContent);
  } catch (error) {
    console.error(`❌ Failed to load schema file: ${schemaPath}`);
    console.error(`Error: ${error.message}`);
    throw error;
  }
}

async function loadSchemaContent($ref) {
  // Check if the schema is already loaded in the global map
  if (globalSchemaMap[$ref]) {
    return globalSchemaMap[$ref];
  }
  // get the file name from the $ref
  const fileName = path.basename($ref);
  // Check if the schema is already loaded in the global map by file name
  if (globalSchemaMap[fileName]) {
    return globalSchemaMap[fileName];
  }

  // If not, throw error
  throw new Error(`Schema not found: ${$ref}. Please ensure it is loaded before use.`);  
}

async function getAjvInstance() {
  try {
    const Ajv = require("ajv");
    const addFormats = require("ajv-formats");

    // Create AJV instance with more permissive settings
    const ajv = new Ajv({
      allErrors: true,
      verbose: false,
      strict: false,
      loadSchema: loadSchemaContent,
      addUsedSchema: false,
    });
    addFormats(ajv);

    return ajv;
  } catch (error) {
    console.error("❌ Required dependencies not found. Installing...");
    await ensureDependencies();
    return getAjvInstance();
  }
}

async function pushSchema(ajv, schemaPath, schemaId) {
  try {
    const schemaContent = await loadSchemaContent(schemaPath);

    // Remove remote $id to force local resolution
    const localSchema = { ...schemaContent };
    const originalRefId = localSchema.$id;

    if (localSchema.$id) {
      if (options.verbose) {
        console.log(
          `Removing remote $id reference from schema: ${localSchema.$id}`
        );
      }
      delete localSchema.$id;
    }

    // Add the schema with the provided ID
    if (!schemaId) {
      schemaId = path.basename(schemaPath); // Default to file name if no ID provided
      ajv.addSchema(localSchema, schemaId);
    }

    // Also add it with the original $id for cross-references
    if (originalRefId) {
      ajv.addSchema(localSchema, originalRefId);
    }

    if (options.verbose) {
      console.log(`Loaded schema: ${schemaPath} as ${schemaId}`);
    }

    return ajv;
  } catch (error) {
    console.error(`❌ Failed to load schema: ${schemaPath}`);
    console.error(`Error: ${error.message}`);
    throw error;
  }
}

async function addNeuroSchema(ajv, schemaPath) {
  try {
    await pushSchema(ajv, schemaPath);
    const schemaDir = path.dirname(schemaPath);
    const referencedSchemas = [
      "operators.schema.json",
      "layers.schema.json",
      "architectures.schema.json",
    ];

    // Load and add referenced schemas
    for (const refSchema of referencedSchemas) {
      const refSchemaPath = path.join(schemaDir, refSchema);
      if (fs.existsSync(refSchemaPath)) {
        try {
          await pushSchema(ajv, refSchemaPath);
        } catch (error) {
          if (options.verbose) {
            console.warn(
              `Warning: Could not load ${refSchema}: ${error.message}`
            );
          }
        }
      } else if (options.verbose) {
        console.warn(`Referenced schema not found: ${refSchemaPath}`);
      }
    }

    return ajv;
  } catch (error) {
    console.error(`❌ Failed to load main schema: ${schemaPath}`);
    console.error(`Error: ${error.message}`);
    throw error;
  }
}



/**
 * Convert character position to line/column
 * @param {string} content - The file content
 * @param {number} position - Character position
 * @returns {Object} - {line, column}
 */
function findJsonLocationByPosition(content, position) {
  const lines = content.substring(0, position).split("\n");
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}

/**
 * Get line/column position for a JSON path using source map
 * @param {string} instancePath - AJV instance path (e.g., "/nodes/0/type")
 * @param {Object} sourceMap - Source map from json-source-map
 * @returns {Object|null} - {line, column} or null if not found
 */
function getLineColumnFromPath(instancePath, sourceMap) {
  try {
    if (!sourceMap || instancePath === undefined) {
      return null;
    }

    // Convert AJV instance path to json-source-map pointer format
    // AJV uses "/nodes/0/type", json-source-map uses "/nodes/0/type"
    const jsonPointer = instancePath === "" ? "" : instancePath;
    
    // Try to get the source position for this path
    const position = sourceMap[jsonPointer];
    
    if (position && position.value) {
      return {
        line: position.value.line + 1, // json-source-map uses 0-based lines
        column: position.value.column + 1 // json-source-map uses 0-based columns
      };
    }

    // If exact path not found, try parent paths
    if (jsonPointer && jsonPointer.includes("/")) {
      const parts = jsonPointer.split("/").filter(p => p !== "");
      
      // Try progressively shorter paths
      for (let i = parts.length - 1; i >= 0; i--) {
        const parentPath = "/" + parts.slice(0, i).join("/");
        const parentPosition = sourceMap[parentPath];
        
        if (parentPosition && parentPosition.value) {
          return {
            line: parentPosition.value.line + 1,
            column: parentPosition.value.column + 1
          };
        }
      }
    }

    // Try root if nothing else works
    const rootPosition = sourceMap[""];
    if (rootPosition && rootPosition.value) {
      return {
        line: rootPosition.value.line + 1,
        column: rootPosition.value.column + 1
      };
    }

    return null;
  } catch (error) {
    // Silently fail and return null if source map lookup fails
    return null;
  }
}

function validateJsonFile(jsonFilePath, validator, testsValidator) {
  const fileName = path.basename(jsonFilePath);
  const relativePath = path.relative(process.cwd(), jsonFilePath);

  // Use tests schema for files under tests/ directory
  const isTestFile =
    relativePath.includes(`${path.sep}tests${path.sep}`) ||
    relativePath.startsWith(`tests${path.sep}`);
  const activeValidator =
    isTestFile && testsValidator ? testsValidator : validator;
  const schemaType = isTestFile && testsValidator ? "tests" : "neuro";

  if (options.verbose) {
    console.log(`Validating: ${fileName} (${schemaType} schema)`);
  }

  try {
    // Load and parse JSON file with source map
    const jsonContent = fs.readFileSync(jsonFilePath, "utf8");
    
    let data, sourceMap;
    try {
      // Try to get json-source-map
      const jsonSourceMap = require("json-source-map");
      const parseResult = jsonSourceMap.parse(jsonContent);
      data = parseResult.data;
      sourceMap = parseResult.pointers;
      
      if (options.verbose && sourceMap) {
        console.log(`Source map available for ${fileName}`);
        // Show some example mappings for debugging
        console.log(`Available pointers:`, Object.keys(sourceMap));
        console.log(`Root mapping:`, sourceMap[""]);
        console.log(`Metadata mapping:`, sourceMap["/metadata"]);
        console.log(`Metadata/name mapping:`, sourceMap["/metadata/name"]);
      }
    } catch (sourceMapError) {
      // Fallback to regular JSON parsing if json-source-map is not available
      data = JSON.parse(jsonContent);
      sourceMap = null;
      if (options.verbose) {
        console.log(`Note: Source mapping not available for ${fileName}: ${sourceMapError.message}`);
      }
    }

    // Validate against schema
    const valid = activeValidator(data);

    if (valid) {
      if (options.verbose) {
        console.log(`✅ Valid: ${fileName} (${schemaType} schema)`);
      }
      return true;
    } else {
      console.log(
        `❌ Schema validation failed: ${fileName} (${schemaType} schema)`
      );
      if (activeValidator.errors) {
        activeValidator.errors.forEach(error => {
          const instancePath = error.instancePath || "";
          
          // Try to get line/column from source map
          const location = sourceMap ? getLineColumnFromPath(instancePath, sourceMap) : null;
          const locationStr = location ? `:${location.line}:${location.column}` : "";
          
          // Format error with location information
          console.log(`${relativePath}${locationStr}: ${error.message}`);
          console.log(`  at path: ${instancePath || "/"}`);

          if (options.verbose) {
            if (error.data !== undefined) {
              console.log(`  Data: ${JSON.stringify(error.data)}`);
            }
            if (error.schema !== undefined) {
              console.log(`  Schema: ${JSON.stringify(error.schema)}`);
            }
            if (error.schemaPath) {
              console.log(`  Schema path: ${error.schemaPath}`);
            }
          }
        });
      }
      return false;
    }
  } catch (error) {
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      // JSON parse error - try to extract line/column info
      const match = error.message.match(/at position (\d+)/);
      if (match) {
        const position = parseInt(match[1]);
        const location = findJsonLocationByPosition(
          fs.readFileSync(jsonFilePath, "utf8"),
          position
        );
        const locationStr = location
          ? `:${location.line}:${location.column}`
          : "";
        console.log(
          `${relativePath}${locationStr}: JSON syntax error: ${error.message}`
        );
      } else {
        console.log(`${relativePath}: JSON syntax error: ${error.message}`);
      }
    } else {
      console.log(`${relativePath}: Validation error: ${error.message}`);
    }
    return false;
  }
}

function matchesPattern(fileName, patterns) {
  return patterns.some(pattern => {
    const regex = new RegExp(pattern.replace(/\*/g, ".*").replace(/\?/g, "."));
    return regex.test(fileName);
  });
}

function findJsonFiles(dirPath, includePatterns, excludePatterns) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const files = [];

  function walkDir(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        // Check include patterns
        if (matchesPattern(entry.name, includePatterns)) {
          // Check exclude patterns
          if (!matchesPattern(entry.name, excludePatterns)) {
            files.push(fullPath);
          } else if (options.verbose) {
            console.log(`Excluding: ${entry.name}`);
          }
        }
      }
    }
  }

  walkDir(dirPath);
  return files;
}

async function validateDirectory(dirPath, validator, testsValidator, category) {
  const files = findJsonFiles(dirPath, options.include, options.exclude);

  if (files.length === 0) {
    if (options.verbose) {
      console.log(`No matching JSON files found in: ${dirPath}`);
    }
    return 0;
  }

  if (options.verbose) {
    console.log(`\nValidating ${files.length} JSON files in ${category}...`);
  }

  let errors = 0;
  for (const file of files) {
    if (!validateJsonFile(file, validator, testsValidator)) {
      errors++;
    }
  }

  return errors;
}

async function main() {
  console.log("NeuroSchema JSON Schema Validation (Node.js + AJV)");
  // Change current working directory to the specified path
  process.chdir(options.path);
  console.log(`Working directory: ${process.cwd()}`);

  const fullSchemaPath = path.join(options.schema);
  const testsSchemaPath = path.join("tests", "tests.schema.json");
  if (!fs.existsSync(fullSchemaPath)) {
    console.error(`❌ Schema file not found: ${fullSchemaPath}`);
    process.exit(1);
  }

  if (options.verbose) {
    console.log(`Schema file: ${options.schema}`);
    console.log(`Include patterns: ${options.include.join(", ")}`);
    console.log(`Exclude patterns: ${options.exclude.join(", ")}`);
    console.log("=".repeat(60));
  }

  // Load schemas
  const neuroAjv = await getAjvInstance();
  // await addNeuroSchema(neuroAjv, fullSchemaPath);
  const neuroSchema = await loadSchemaContent('neuro.schema.json');//loadSchemaContent(fullSchemaPath);
  const testsSchema = await loadSchemaContent('tests.schema.json');//loadSchemaContent(testsSchemaPath);

  const neuroValidator = await neuroAjv.compileAsync(neuroSchema);
  const testsValidator = await neuroAjv.compileAsync(testsSchema);

  let totalErrors = 0;
  let totalFiles = 0;

  // Check if specific target files are specified
  if (options.target && options.target.length > 0) {
    console.log(`Validating ${options.target.length} target file(s)...`);
    for (const targetFile of options.target) {
      const fullPath = path.resolve(targetFile);
      if (!fs.existsSync(fullPath)) {
        console.error(`❌ Target file not found: ${fullPath}`);
        totalErrors++;
        continue;
      }

      totalFiles++;
      const isTestFile = targetFile.includes("tests/");

      console.log(
        `Validating: ${path.basename(targetFile)} (${isTestFile ? "tests" : "neuro"} schema)`
      );
      const isValid = validateJsonFile(
        fullPath,
        neuroValidator,
        testsValidator
      );
      if (!isValid) {
        totalErrors++;
      }
    }
  } else {
    // Validate different directories (original logic)
    const directories = [
      { path: path.join("docs/examples"), category: "Examples" },
      { path: path.join("tests/compliance"), category: "Compliance Tests" },
      { path: path.join("tests/execution"), category: "Execution Tests" },
      { path: path.join("tests/runtime"), category: "Runtime Tests" },
    ];

    for (const dir of directories) {
      const dirFiles = findJsonFiles(
        dir.path,
        options.include,
        options.exclude
      );
      if (dirFiles.length > 0) {
        totalFiles += dirFiles.length;
        const errors = await validateDirectory(
          dir.path,
          neuroValidator,
          testsValidator,
          dir.category
        );
        totalErrors += errors;
      }
    }
  }

  // Final results
  if (options.verbose) {
    console.log("\n" + "=".repeat(60));
  }

  if (totalErrors === 0) {
    if (options.verbose) {
      console.log(
        `🎉 All ${totalFiles} JSON files are valid against their schemas! ✓`
      );
    }
    process.exit(0);
  } else {
    console.log(
      `\nFound ${totalErrors} validation errors in ${totalFiles} files.`
    );
    process.exit(1);
  }
}

// Handle uncaught errors
process.on("uncaughtException", error => {
  console.error("❌ Uncaught exception:", error.message);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled rejection:", reason);
  process.exit(1);
});

// Run the main function
main().catch(error => {
  console.error("❌ Error:", error.message, error);
  process.exit(1);
});
