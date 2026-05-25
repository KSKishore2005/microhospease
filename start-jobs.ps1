$ROOT = $PSScriptRoot
$env:JAVA_HOME = "C:\Users\Kishore\Downloads\jdk-21.0.10"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

function Start-MyJob($name) {
    Write-Host "Starting $name..."
    Start-Job -Name $name -ScriptBlock {
        param($dir, $jh)
        $env:JAVA_HOME = $jh
        $env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
        cd $dir
        mvn spring-boot:run
    } -ArgumentList (Join-Path $ROOT $name), $env:JAVA_HOME
}

Start-MyJob "service-registry"
Start-Sleep -Seconds 25

Start-MyJob "config-server"
Start-Sleep -Seconds 15

Start-MyJob "user-service"
Start-MyJob "room-housekeeping-service"
Start-MyJob "guest-reservation-service"
Start-MyJob "service-order-service"
Start-MyJob "finance-service"
Start-MyJob "reporting-service"
Start-Sleep -Seconds 15

Start-MyJob "api-gateway"
Write-Host "All 9 services launched as background jobs!"
