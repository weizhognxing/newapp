$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'activate-build-env.ps1')

$commands = @('node', 'npm', 'java', 'javac', 'adb', 'sdkmanager', 'gradle')
foreach ($command in $commands) {
  $cmd = Get-Command $command -ErrorAction SilentlyContinue
  if ($cmd) {
    Write-Host "$command => $($cmd.Source)"
  }
  else {
    Write-Host "$command => MISSING"
  }
}

Write-Host "JAVA_HOME=$env:JAVA_HOME"
Write-Host "ANDROID_SDK_ROOT=$env:ANDROID_SDK_ROOT"
