$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$toolchainRoot = Join-Path $projectRoot '.toolchain'
$nodeRoot = Join-Path $toolchainRoot 'node\current'
$jdkRoot = Join-Path $toolchainRoot 'jdk\current'
$sdkRoot = Join-Path $toolchainRoot 'android-sdk'
$gradleRoot = Join-Path $toolchainRoot 'gradle\current'

$paths = @(
  (Join-Path $nodeRoot ''),
  (Join-Path $jdkRoot 'bin'),
  (Join-Path $sdkRoot 'platform-tools'),
  (Join-Path $sdkRoot 'cmdline-tools\latest\bin'),
  (Join-Path $sdkRoot 'emulator'),
  (Join-Path $gradleRoot 'bin')
) | Where-Object { Test-Path $_ }

$env:SMARTMARKET_PROJECT_ROOT = $projectRoot
$env:SMARTMARKET_TOOLCHAIN_ROOT = $toolchainRoot
$env:JAVA_HOME = $jdkRoot
$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot
$env:GRADLE_HOME = $gradleRoot
$env:NODE_ENV = 'production'

foreach ($pathEntry in ($paths | Select-Object -Unique | Sort-Object Length -Descending)) {
  if ($env:Path -notlike "*$pathEntry*") {
    $env:Path = "$pathEntry;$env:Path"
  }
}

Write-Host "SmartMarket build env loaded"
Write-Host "  Project: $projectRoot"
Write-Host "  Node:    $nodeRoot"
Write-Host "  JDK:     $jdkRoot"
Write-Host "  SDK:     $sdkRoot"
Write-Host "  Gradle:  $gradleRoot"
Write-Host ""
Write-Host "Run one of these next:"
Write-Host "  npm install"
Write-Host "  npx expo run:android"
Write-Host "  .\scripts\build-android-release.ps1"
