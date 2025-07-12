#!/usr/bin/env pwsh
# NeuroSchema JSON Validation Script
# Validates all JSON files in schema, docs/examples, and tests directories

param(
    [string]$Path = ".",
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Stop"
$errors = 0

function Test-JsonFile {
    param(
        [string]$FilePath,
        [string]$Category = "File"
    )
    
    $fileName = Split-Path $FilePath -Leaf
    
    if ($Verbose) {
        Write-Host "Validating $Category`: $fileName" -ForegroundColor Yellow
    }
    
    try {
        $content = Get-Content $FilePath -Raw -ErrorAction Stop
        $null = $content | ConvertFrom-Json -ErrorAction Stop
        
        if ($Verbose) {
            Write-Host "✓ Valid: $fileName" -ForegroundColor Green
        }
        return $true
    }
    catch {
        Write-Host "✗ Invalid $Category`: $fileName" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Validate-Directory {
    param(
        [string]$DirectoryPath,
        [string]$Category
    )
    
    if (-not (Test-Path $DirectoryPath)) {
        Write-Host "Directory not found: $DirectoryPath" -ForegroundColor Yellow
        return 0
    }
    
    $jsonFiles = Get-ChildItem -Path $DirectoryPath -Recurse -Include "*.json" -ErrorAction SilentlyContinue
    
    if ($jsonFiles.Count -eq 0) {
        Write-Host "No JSON files found in: $DirectoryPath" -ForegroundColor Yellow
        return 0
    }
    
    Write-Host "`nValidating $($jsonFiles.Count) JSON files in $Category..." -ForegroundColor Cyan
    
    $localErrors = 0
    foreach ($file in $jsonFiles) {
        if (-not (Test-JsonFile -FilePath $file.FullName -Category $Category)) {
            $localErrors++
        }
    }
    
    if ($localErrors -eq 0) {
        Write-Host "✓ All $Category files are valid!" -ForegroundColor Green
    } else {
        Write-Host "✗ Found $localErrors errors in $Category files" -ForegroundColor Red
    }
    
    return $localErrors
}

# Main execution
Write-Host "NeuroSchema JSON Validation" -ForegroundColor Cyan
Write-Host "Working directory: $(Resolve-Path $Path)" -ForegroundColor Gray
Write-Host ("=" * 50)

# Validate schemas
$errors += Validate-Directory -DirectoryPath (Join-Path $Path "schema") -Category "Schema"

# Validate examples
$errors += Validate-Directory -DirectoryPath (Join-Path $Path "docs/examples") -Category "Example"

# Validate tests
$errors += Validate-Directory -DirectoryPath (Join-Path $Path "tests") -Category "Test"

# Final results
Write-Host "`n"
Write-Host ("=" * 50)
if ($errors -eq 0) {
    Write-Host "🎉 All JSON files are valid! ✓" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ Found $errors total errors in JSON files" -ForegroundColor Red
    exit 1
}