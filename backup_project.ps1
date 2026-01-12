# Hula ERP Backup Script
$ErrorActionPreference = "Stop"

# Get current date for filename
$date = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = Join-Path $PSScriptRoot "backups"
$backupFile = Join-Path $backupDir "hula-erp-code-$date.zip"
$dbDumpFile = Join-Path $backupDir "hula-erp-db-$date.sql"

# Create backup directory
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
    Write-Host "Created backup directory: $backupDir" -ForegroundColor Green
}

# 1. Database Backup
Write-Host "`n[1/2] Backing up Database..." -ForegroundColor Cyan
try {
    # Check if docker is available and container is running
    $containerName = "hula_db"
    $hasDocker = Get-Command "docker" -ErrorAction SilentlyContinue
    
    if ($hasDocker) {
        $containerId = docker ps -q -f name=$containerName
        if ($containerId) {
            # Execute pg_dump inside the container
            # Using defaults from docker-compose: user=hula_user, db=hula_db
            docker exec -t $containerName pg_dump -U hula_user hula_db > $dbDumpFile
            if ($LASTEXITCODE -eq 0) {
                 Write-Host "Database dump successful: $dbDumpFile" -ForegroundColor Green
            } else {
                 Write-Warning "Database dump failed. Please check container logs."
            }
        } else {
            Write-Warning "Container '$containerName' not found or not running. Skipping DB auto-backup."
            Write-Host "If you have a local postgres, please dump it manually." -ForegroundColor Yellow
        }
    } else {
        Write-Warning "Docker command not found. Skipping DB auto-backup."
    }
} catch {
    Write-Warning "Error during database backup: $_"
}

# 2. Code Backup
Write-Host "`n[2/2] Archiving Source Code..." -ForegroundColor Cyan

# Define exclusions
$exclude = @(
    "node_modules",
    ".git",
    "dist",
    "backups",
    ".vs",
    "postgres_data"
)

# Build tar command
# We use tar because it's available on Windows 10+ and faster than Compress-Archive for deep trees like node_modules (though we exclude node_modules)
# But Compress-Archive is safer for pure PowerShell. Let's use Compress-Archive but carefully.
# React apps have explicit node_modules.
# Using tar is better if available (we confirmed it is).
try {
    # Create a temporary exclusion file
    $excludeFile = Join-Path $backupDir "exclude.txt"
    $exclude | Set-Content -Path $excludeFile
    
    # We want to zip everything in current folder to the archive
    # tar -a -c -f <archive> --exclude-from <file> *
    
    # Note: wildcard * in powershell might pass expanded list. 
    # Better to tell tar to archive current directory '.'
    
    Write-Host "Archiving project to $backupFile ..."
    
    # Windows tar supports --exclude
    # We construct the command carefully
    $tarArgs = @("-a", "-c", "-f", $backupFile)
    foreach ($item in $exclude) {
        $tarArgs += "--exclude"
        $tarArgs += $item
    }
    $tarArgs += "*" # Archive all contents of current dir
    
    # Run tar
    Start-Process -FilePath "tar" -ArgumentList $tarArgs -Wait -NoNewWindow
    
    if (Test-Path $backupFile) {
        Write-Host "Code backup successful: $backupFile" -ForegroundColor Green
    } else {
         Write-Error "Failed to create archive."
    }
} catch {
     Write-Error "Error during archiving: $_"
}

Write-Host "`n----------------------------------------"
Write-Host "Backup Process Completed!" -ForegroundColor Green
Write-Host "Files located in: $backupDir"
Write-Host "----------------------------------------"
Write-Host "To Restore on VPS:"
Write-Host "1. Copy '$backupFile' and '$dbDumpFile' (if exists) to VPS."
Write-Host "2. Unzip: tar -xf hula-erp-code-....zip"
Write-Host "3. Install Docker & Docker Compose."
Write-Host "4. Restore DB: docker exec -i hula_db psql -U hula_user hula_db < hula-erp-db-....sql"
Write-Host "----------------------------------------"
