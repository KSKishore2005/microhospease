
# ============================================================
# HospEase - PowerShell Microservice Launcher
# ============================================================
$ROOT = $PSScriptRoot

# Use system JAVA_HOME if set, otherwise auto-detect
if (-not $env:JAVA_HOME) {
    $javaPaths = @(
        "C:\Program Files\Java\jdk-21",
        "C:\Program Files\OpenJDK\jdk-21",
        "C:\Java\jdk-21"
    )
    
    foreach ($path in $javaPaths) {
        if (Test-Path "$path\bin\java.exe") {
            $env:JAVA_HOME = $path
            break
        }
    }
}

# Validate JAVA_HOME
if (-not (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
    Write-Host "ERROR: JAVA_HOME not set or invalid: $env:JAVA_HOME" -ForegroundColor Red
    Write-Host "Please set JAVA_HOME to your JDK installation folder" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Using JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Cyan

function Start-Service($name, $waitSec) {
    Write-Host "[HospEase] Starting $name..." -ForegroundColor Cyan
    $dir = Join-Path $ROOT $name
    Start-Process "cmd.exe" -ArgumentList "/k", "cd /d `"$dir`" && mvnw.cmd spring-boot:run" -WindowStyle Normal
    Write-Host "[HospEase] Waiting ${waitSec}s for $name to initialize..." -ForegroundColor Yellow
    Start-Sleep -Seconds $waitSec
}

Write-Host "============================================================" -ForegroundColor Green
Write-Host " HospEase Microservices Startup (PowerShell)" -ForegroundColor Green  
Write-Host "============================================================" -ForegroundColor Green

Start-Service "service-registry"    35
Start-Service "config-server"       20
Start-Service "user-service"        15
Start-Service "room-housekeeping-service" 15
Start-Service "guest-reservation-service" 15
Start-Service "service-order-service"     15
Start-Service "finance-service"           15
Start-Service "reporting-service"         15
Start-Service "api-gateway"               10

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host " All 9 services launched!" -ForegroundColor Green
Write-Host " Eureka:  http://localhost:8761" -ForegroundColor White
Write-Host " Gateway: http://localhost:8765" -ForegroundColor White
Write-Host " Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Green
