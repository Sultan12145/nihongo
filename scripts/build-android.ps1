$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$toolchain = Get-Content -LiteralPath (Join-Path $taskRoot 'work/toolchains/paths.json') | ConvertFrom-Json
$env:JAVA_HOME = $toolchain.java
$env:ANDROID_HOME = $toolchain.sdk
$env:ANDROID_SDK_ROOT = $toolchain.sdk
$env:ANDROID_USER_HOME = Join-Path $taskRoot 'work/toolchains/android-user'
New-Item -ItemType Directory -Force -Path $env:ANDROID_USER_HOME | Out-Null
$env:GRADLE_USER_HOME = Join-Path $taskRoot 'work/toolchains/gradle-cache'
$env:PATH = "$($toolchain.java)bin;$env:PATH"
Push-Location (Join-Path $taskRoot 'android')
try {
    & './gradlew.bat' assembleRelease --no-daemon --stacktrace --console=plain
    if ($LASTEXITCODE -ne 0) { throw 'Android build failed' }
    $outputDirectory = Join-Path $taskRoot 'outputs/android'
    New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
    Copy-Item -LiteralPath 'app/build/outputs/apk/release/app-release.apk' -Destination (Join-Path $outputDirectory 'Nihongo-0.2.0.apk')
} finally { Pop-Location }
