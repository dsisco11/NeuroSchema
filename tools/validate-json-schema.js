#!/usr/bin/env node
/**
 * NeuroSchema JSON Schema Validation Script
 * Validates JSON files against the NeuroSchema using AJV
 */

const fs = require('fs');
const path = require('path');
const { program } = require('commander');

// Define command line options
program
    .name('validate-json-schema')
    .description('Validate JSON files against NeuroSchema')
    .option('-p, --path <path>', 'Base path to search for files', '.')
    .option('-s, --schema <schema>', 'Path to schema file', 'schema/2025-draft/neuro.schema.json')
    .option('-v, --verbose', 'Verbose output', false)
    .option('-i, --include <patterns...>', 'Include file patterns', ['*.neuro.json', '*.json'])
    .option('-e, --exclude <patterns...>', 'Exclude file patterns', ['*.schema.json'])
    .parse();

const options = program.opts();

// Install required packages if they don't exist
async function ensureDependencies() {
    const packageJsonPath = path.join(__dirname, 'package.json');
    const nodeModulesPath = path.join(__dirname, 'node_modules');
    
    if (!fs.existsSync(nodeModulesPath)) {
        console.log('Installing required dependencies...');
        
        // Create package.json if it doesn't exist
        if (!fs.existsSync(packageJsonPath)) {
            const packageJson = {
                name: 'neurograph-schema-validator',
                version: '1.0.0',
                dependencies: {
                    'ajv': '^8.12.0',
                    'ajv-formats': '^2.1.1',
                    'commander': '^11.0.0',
                    'glob': '^10.3.0'
                }
            };
            
            fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        }
        
        // Install dependencies
        const { execSync } = require('child_process');
        try {
            execSync('npm install', { cwd: __dirname, stdio: options.verbose ? 'inherit' : 'pipe' });
        } catch (error) {
            console.error('❌ Failed to install dependencies');
            console.error('Please run: npm install');
            process.exit(1);
        }
    }
}

async function loadSchema(schemaPath) {
    try {
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');
        const schema = JSON.parse(schemaContent);
        
        // Try to load AJV after ensuring dependencies
        let Ajv, addFormats;
        try {
            Ajv = require('ajv');
            addFormats = require('ajv-formats');
        } catch (error) {
            console.error('❌ Required dependencies not found. Installing...');
            await ensureDependencies();
            Ajv = require('ajv');
            addFormats = require('ajv-formats');
        }
        
        // Create AJV instance with more permissive settings
        const ajv = new Ajv({ 
            allErrors: true, 
            verbose: false,
            strict: false,
            loadSchema: false,
            addUsedSchema: false
        });
        addFormats(ajv);
        
        // Load additional schemas that might be referenced
        const schemaDir = path.dirname(schemaPath);
        const referencedSchemas = [
            { file: 'operators.schema.json', key: 'operators.schema.json' },
            { file: 'layers.schema.json', key: 'layers.schema.json' }, 
            { file: 'architectures.schema.json', key: 'architectures.schema.json' }
        ];
        
        // First, add the main schema to AJV so other schemas can reference it
        const localSchema = { ...schema };
        const originalMainId = localSchema.$id;
        if (localSchema.$id) {
            if (options.verbose) {
                console.log(`Removing remote $id reference from main schema: ${localSchema.$id}`);
            }
            delete localSchema.$id;
        }
        
        // Add the main schema with a local reference
        ajv.addSchema(localSchema, 'neuro.schema.json');
        if (originalMainId) {
            ajv.addSchema(localSchema, originalMainId);
        }
        
        for (const refSchema of referencedSchemas) {
            const refSchemaPath = path.join(schemaDir, refSchema.file);
            if (fs.existsSync(refSchemaPath)) {
                try {
                    const refSchemaContent = fs.readFileSync(refSchemaPath, 'utf8');
                    const refSchemaObj = JSON.parse(refSchemaContent);
                    
                    // Remove remote $id to force local resolution
                    const localRefSchema = { ...refSchemaObj };
                    const originalRefId = localRefSchema.$id;
                    if (localRefSchema.$id) {
                        if (options.verbose) {
                            console.log(`Removing remote $id reference from ${refSchema.file}: ${localRefSchema.$id}`);
                        }
                        delete localRefSchema.$id;
                    }
                    
                    // Add schema with the exact reference key used in the main schema
                    ajv.addSchema(localRefSchema, refSchema.key);
                    
                    // Also add it with the original $id for cross-references
                    if (originalRefId) {
                        ajv.addSchema(localRefSchema, originalRefId);
                    }
                    
                    if (options.verbose) {
                        console.log(`Loaded referenced schema: ${refSchema.file}`);
                    }
                } catch (error) {
                    if (options.verbose) {
                        console.warn(`Warning: Could not load ${refSchema.file}: ${error.message}`);
                    }
                }
            }
        }
        
        // Remove the $id from the main schema to prevent remote resolution attempts
        // (already done above)
        
        // try {
            return ajv.compile(localSchema);
        // } catch (compileError) {
        //     if (options.verbose) {
        //         console.warn(`Schema compilation warning: ${compileError.message}`);
        //         console.log('Attempting to validate without strict schema references...');
        //     }
            
        //     // Try with a more permissive AJV instance
        //     const permissiveAjv = new Ajv({ 
        //         allErrors: true, 
        //         verbose: false,
        //         strict: false,
        //         validateSchema: false,
        //         addUsedSchema: false,
        //         loadSchema: false
        //     });
        //     addFormats(permissiveAjv);
            
        //     // Re-add the referenced schemas to the permissive instance
        //     const permissiveLocalSchema = { ...schema };
        //     if (permissiveLocalSchema.$id) {
        //         delete permissiveLocalSchema.$id;
        //     }
        //     permissiveAjv.addSchema(permissiveLocalSchema, 'neuro.schema.json');
            
        //     for (const refSchema of referencedSchemas) {
        //         const refSchemaPath = path.join(schemaDir, refSchema.file);
        //         if (fs.existsSync(refSchemaPath)) {
        //             try {
        //                 const refSchemaContent = fs.readFileSync(refSchemaPath, 'utf8');
        //                 const refSchemaObj = JSON.parse(refSchemaContent);
        //                 const localRefSchema = { ...refSchemaObj };
        //                 if (localRefSchema.$id) {
        //                     delete localRefSchema.$id;
        //                 }
        //                 permissiveAjv.addSchema(localRefSchema, refSchema.key);
        //             } catch (error) {
        //                 // Ignore errors in permissive mode
        //             }
        //         }
        //     }
            
        //     return permissiveAjv.compile(localSchema);
        // }
    } catch (error) {
        console.error(`❌ Failed to load schema: ${schemaPath}`);
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

// Load tests schema for validating test definition files
async function loadTestsSchema(basePath) {
    const testsSchemaPath = path.join(basePath, 'tests', 'tests.schema.json');
    if (!fs.existsSync(testsSchemaPath)) {
        return null;
    }
    
    try {
        const schemaContent = fs.readFileSync(testsSchemaPath, 'utf8');
        const schema = JSON.parse(schemaContent);
        
        const Ajv = require('ajv');
        const addFormats = require('ajv-formats');
        
        const ajv = new Ajv({ 
            allErrors: true, 
            verbose: true,
            strict: false,
            loadSchema: true,
            addUsedSchema: false
        });
        addFormats(ajv);
        
        // Load the main neuro schema to resolve the $ref in neuro_model
        const neuroSchemaPath = path.join(basePath, 'schema', '2025-draft', 'neuro.schema.json');
        const localNeuroSchema = loadSchema(neuroSchemaPath);
        ajv.addSchema(localNeuroSchema, 'neuro.schema.json');
        // if (fs.existsSync(neuroSchemaPath)) {
        //     const neuroSchemaContent = fs.readFileSync(neuroSchemaPath, 'utf8');
        //     const neuroSchema = JSON.parse(neuroSchemaContent);
            
        //     // Remove remote $id to force local resolution
        //     const localNeuroSchema = { ...neuroSchema };
        //     if (localNeuroSchema.$id) {
        //         delete localNeuroSchema.$id;
        //     }
            
        //     // Add the neuro schema with the path used in the tests schema reference
        //     // ajv.addSchema(localNeuroSchema, '../schema/2025-draft/neuro.schema.json');
            
        //     if (options.verbose) {
        //         console.log('Loaded neuro schema for tests schema reference resolution');
        //     }
        // }
        
        const localSchema = { ...schema };
        if (localSchema.$id) {
            delete localSchema.$id;
        }
        
        return ajv.compile(localSchema);
    } catch (error) {
        if (options.verbose) {
            console.warn(`Warning: Could not load tests schema: ${error.message}`);
        }
        return null;
    }
}

/**
 * Find line and column number for a JSON path
 * @param {string} jsonContent - The JSON file content
 * @param {string} path - Dot-separated path like "definitions.0.name"
 * @returns {Object|null} - {line, column} or null if not found
 */
function findJsonLocation(jsonContent, path) {
    if (!path) return findJsonLocationByPosition(jsonContent, 0);
    
    try {
        // Parse JSON to get structure
        const data = JSON.parse(jsonContent);
        
        // Navigate to the path
        const pathParts = path.split('.');
        let current = data;
        let jsonPath = '';
        
        for (let i = 0; i < pathParts.length; i++) {
            const part = pathParts[i];
            if (current === null || current === undefined) break;
            
            if (Array.isArray(current)) {
                const index = parseInt(part);
                if (isNaN(index) || index >= current.length) break;
                current = current[index];
                jsonPath += `[${index}]`;
            } else if (typeof current === 'object') {
                if (!(part in current)) break;
                current = current[part];
                jsonPath += jsonPath ? `.${part}` : part;
            } else {
                break;
            }
        }
        
        // Find the position of this path in the JSON string
        // This is a simplified approach - we'll look for the key name
        const lastPart = pathParts[pathParts.length - 1];
        if (!lastPart) return null;
        
        // Look for the property key in the JSON
        const keyPattern = new RegExp(`"${lastPart}"\\s*:`);
        const match = keyPattern.exec(jsonContent);
        
        if (match) {
            return findJsonLocationByPosition(jsonContent, match.index);
        }
        
        return null;
    } catch (error) {
        return null;
    }
}

/**
 * Convert character position to line/column
 * @param {string} content - The file content
 * @param {number} position - Character position
 * @returns {Object} - {line, column}
 */
function findJsonLocationByPosition(content, position) {
    const lines = content.substring(0, position).split('\n');
    return {
        line: lines.length,
        column: lines[lines.length - 1].length + 1
    };
}

function validateJsonFile(jsonFilePath, validator, testsValidator) {
    const fileName = path.basename(jsonFilePath);
    const relativePath = path.relative(process.cwd(), jsonFilePath);
    
    // Use tests schema for files under tests/ directory
    const isTestFile = relativePath.includes(path.sep + 'tests' + path.sep) || relativePath.startsWith('tests' + path.sep);
    const activeValidator = (isTestFile && testsValidator) ? testsValidator : validator;
    const schemaType = (isTestFile && testsValidator) ? 'tests' : 'neuro';
    
    if (options.verbose) {
        console.log(`Validating: ${fileName} (${schemaType} schema)`);
    }
    
    try {
        // Load and parse JSON file
        const jsonContent = fs.readFileSync(jsonFilePath, 'utf8');
        const data = JSON.parse(jsonContent);
        
        // Validate against schema
        const valid = activeValidator(data);
        
        if (valid) {
            if (options.verbose) {
                console.log(`✅ Valid: ${fileName} (${schemaType} schema)`);
            }
            return true;
        } else {
            console.log(`❌ Schema validation failed: ${fileName} (${schemaType} schema)`);
            if (activeValidator.errors) {
                activeValidator.errors.forEach(error => {
                    const instancePath = error.instancePath || '';
                    const dataPath = instancePath.replace(/^\//, '').replace(/\//g, '.');
                    
                    // Try to find line/column information for the error path
                    const location = findJsonLocation(jsonContent, dataPath);
                    const locationStr = location ? `:${location.line}:${location.column}` : '';
                    
                    // Format error in standard format: file:line:column: message
                    console.log(`${relativePath}${locationStr}: ${error.message}`);
                    
                    if (options.verbose) {
                        console.log(`  Path: ${instancePath || '/'}`);
                        if (error.data !== undefined) {
                            console.log(`  Data: ${JSON.stringify(error.data)}`);
                        }
                        if (error.schema !== undefined) {
                            console.log(`  Schema: ${JSON.stringify(error.schema)}`);
                        }
                    }
                });
            }
            return false;
        }
        
    } catch (error) {
        if (error instanceof SyntaxError && error.message.includes('JSON')) {
            // JSON parse error - try to extract line/column info
            const match = error.message.match(/at position (\d+)/);
            if (match) {
                const position = parseInt(match[1]);
                const location = findJsonLocationByPosition(fs.readFileSync(jsonFilePath, 'utf8'), position);
                const locationStr = location ? `:${location.line}:${location.column}` : '';
                console.log(`${relativePath}${locationStr}: JSON syntax error: ${error.message}`);
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
        const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
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
            } else if (entry.isFile() && entry.name.endsWith('.json')) {
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
    console.log('NeuroSchema JSON Schema Validation (Node.js + AJV)');
    console.log(`Working directory: ${path.resolve(options.path)}`);
    
    const fullSchemaPath = path.join(options.path, options.schema);
    if (!fs.existsSync(fullSchemaPath)) {
        console.error(`❌ Schema file not found: ${fullSchemaPath}`);
        process.exit(1);
    }
    
    if (options.verbose) {
        console.log(`Schema file: ${options.schema}`);
        console.log(`Include patterns: ${options.include.join(', ')}`);
        console.log(`Exclude patterns: ${options.exclude.join(', ')}`);
        console.log('='.repeat(60));
    }
    
    // Load schemas
    const neuroValidator = await loadSchema(fullSchemaPath);
    const testsValidator = await loadTestsSchema(options.path);
    
    let totalErrors = 0;
    let totalFiles = 0;
    
    // Validate different directories
    const directories = [
        { path: path.join(options.path, 'docs/examples'), category: 'Examples' },
        { path: path.join(options.path, 'tests/compliance'), category: 'Compliance Tests' },
        { path: path.join(options.path, 'tests/execution'), category: 'Execution Tests' },
        { path: path.join(options.path, 'tests/runtime'), category: 'Runtime Tests' }
    ];
    
    for (const dir of directories) {
        const dirFiles = findJsonFiles(dir.path, options.include, options.exclude);
        if (dirFiles.length > 0) {
            totalFiles += dirFiles.length;
            const errors = await validateDirectory(dir.path, neuroValidator, testsValidator, dir.category);
            totalErrors += errors;
        }
    }
    
    // Final results
    if (options.verbose) {
        console.log('\n' + '='.repeat(60));
    }
    
    if (totalErrors === 0) {
        if (options.verbose) {
            console.log(`🎉 All ${totalFiles} JSON files are valid against their schemas! ✓`);
        }
        process.exit(0);
    } else {
        console.log(`\nFound ${totalErrors} validation errors in ${totalFiles} files.`);
        process.exit(1);
    }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception:', error.message);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled rejection:', reason);
    process.exit(1);
});

// Run the main function
main().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
});
