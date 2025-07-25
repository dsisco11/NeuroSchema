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
    .option('-i, --include <patterns...>', 'Include file patterns', ['*.neuro.json'])
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
        
        try {
            return ajv.compile(localSchema);
        } catch (compileError) {
            if (options.verbose) {
                console.warn(`Schema compilation warning: ${compileError.message}`);
                console.log('Attempting to validate without strict schema references...');
            }
            
            // Try with a more permissive AJV instance
            const permissiveAjv = new Ajv({ 
                allErrors: true, 
                verbose: false,
                strict: false,
                validateSchema: false,
                addUsedSchema: false,
                loadSchema: false
            });
            addFormats(permissiveAjv);
            
            // Re-add the referenced schemas to the permissive instance
            const permissiveLocalSchema = { ...schema };
            if (permissiveLocalSchema.$id) {
                delete permissiveLocalSchema.$id;
            }
            permissiveAjv.addSchema(permissiveLocalSchema, 'neuro.schema.json');
            
            for (const refSchema of referencedSchemas) {
                const refSchemaPath = path.join(schemaDir, refSchema.file);
                if (fs.existsSync(refSchemaPath)) {
                    try {
                        const refSchemaContent = fs.readFileSync(refSchemaPath, 'utf8');
                        const refSchemaObj = JSON.parse(refSchemaContent);
                        const localRefSchema = { ...refSchemaObj };
                        if (localRefSchema.$id) {
                            delete localRefSchema.$id;
                        }
                        permissiveAjv.addSchema(localRefSchema, refSchema.key);
                    } catch (error) {
                        // Ignore errors in permissive mode
                    }
                }
            }
            
            return permissiveAjv.compile(localSchema);
        }
    } catch (error) {
        console.error(`❌ Failed to load schema: ${schemaPath}`);
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

function validateJsonFile(jsonFilePath, validator) {
    const fileName = path.basename(jsonFilePath);
    
    if (options.verbose) {
        console.log(`Validating: ${fileName}`);
    }
    
    try {
        // Load and parse JSON file
        const jsonContent = fs.readFileSync(jsonFilePath, 'utf8');
        const data = JSON.parse(jsonContent);
        
        // Validate against schema
        const valid = validator(data);
        
        if (valid) {
            if (options.verbose) {
                console.log(`✓ Valid: ${fileName}`);
            }
            return true;
        } else {
            console.log(`✗ Schema validation failed: ${fileName}`);
            if (validator.errors) {
                validator.errors.forEach(error => {
                    const instancePath = error.instancePath || 'root';
                    console.log(`  Error at ${instancePath}: ${error.message}`);
                    if (error.data !== undefined && options.verbose) {
                        console.log(`    Data: ${JSON.stringify(error.data)}`);
                    }
                });
            }
            return false;
        }
        
    } catch (error) {
        console.log(`✗ Validation error: ${fileName}`);
        console.log(`  Error: ${error.message}`);
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

async function validateDirectory(dirPath, validator, category) {
    const files = findJsonFiles(dirPath, options.include, options.exclude);
    
    if (files.length === 0) {
        console.log(`No matching JSON files found in: ${dirPath}`);
        return 0;
    }
    
    console.log(`\nValidating ${files.length} JSON files in ${category} against schema...`);
    
    let errors = 0;
    for (const file of files) {
        if (!validateJsonFile(file, validator)) {
            errors++;
        }
    }
    
    if (errors === 0) {
        console.log(`✓ All ${category} files are valid against schema!`);
    } else {
        console.log(`✗ Found ${errors} schema validation errors in ${category} files`);
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
    
    console.log(`Schema file: ${options.schema}`);
    console.log(`Include patterns: ${options.include.join(', ')}`);
    console.log(`Exclude patterns: ${options.exclude.join(', ')}`);
    console.log('='.repeat(60));
    
    // Load schema and create validator
    const validator = await loadSchema(fullSchemaPath);
    
    let totalErrors = 0;
    
    // Validate different directories
    const directories = [
        { path: path.join(options.path, 'docs/examples'), category: 'Example' },
        { path: path.join(options.path, 'tests/compliance'), category: 'Compliance Test' },
        { path: path.join(options.path, 'tests/execution'), category: 'Execution Test' },
        { path: path.join(options.path, 'tests/runtime'), category: 'Runtime Test' }
    ];
    
    for (const dir of directories) {
        totalErrors += await validateDirectory(dir.path, validator, dir.category);
    }
    
    // Final results
    console.log('\n' + '='.repeat(60));
    if (totalErrors === 0) {
        console.log('🎉 All JSON files are valid against the neuro.schema.json! ✓');
        process.exit(0);
    } else {
        console.log(`❌ Found ${totalErrors} total schema validation errors`);
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
