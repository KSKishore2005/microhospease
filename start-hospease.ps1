
# ============================================================
# HospEase - PowerShell Microservice Launcher
# ============================================================
$ROOT = $PSScriptRoot
$env:JAVA_HOME = "C:\Users\Kishore\Downloads\jdk-21.0.10"
$env:PATH += ";C:\Users\Kishore\.m2\wrapper\dists\apache-maven-3.9.15\0226a00282e400185496f3b60ec5a3f029cbdc6893912937d4876d57695224e1\bin"

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
