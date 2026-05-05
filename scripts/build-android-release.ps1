$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
. (Join-Path $PSScriptRoot 'activate-build-env.ps1')

Push-Location $projectRoot
try {
  if (-not (Test-Path (Join-Path $projectRoot 'node_modules'))) {
    Write-Host 'Installing npm dependencies first...'
    npm install
  }

  $androidRoot = Join-Path $projectRoot 'android'
  Push-Location $androidRoot
  try {
    if (Test-Path (Join-Path $projectRoot '.toolchain\gradle\current\bin\gradle.bat')) {
      & (Join-Path $projectRoot '.toolchain\gradle\current\bin\gradle.bat') assembleRelease
    }
    else {
      .\gradlew.bat assembleRelease
    }
  }
  finally {
    Pop-Location
  }
}
finally {
  Pop-Location
}
