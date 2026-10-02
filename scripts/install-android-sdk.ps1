# SDK license acceptance was explicitly authorized by the user on 2026-10-02.
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$toolchain = Get-Content -LiteralPath (Join-Path $taskRoot 'work/toolchains/paths.json') | ConvertFrom-Json
$env:JAVA_HOME = $toolchain.java
$env:ANDROID_HOME = $toolchain.sdk
$env:ANDROID_USER_HOME = Join-Path $taskRoot 'work/toolchains/android-user'
$env:ANDROID_PREFS_ROOT = $env:ANDROID_USER_HOME
$env:ANDROID_SDK_ROOT = $toolchain.sdk
$env:PATH = "$($toolchain.java)bin;$env:PATH"
$sdkManager = Join-Path $toolchain.sdk 'cmdline-tools/latest/bin/sdkmanager.bat'
$licenseAnswers = 1..20 | ForEach-Object { 'y' }
$licenseAnswers | & $sdkManager "--sdk_root=$($toolchain.sdk)" --licenses
if ($LASTEXITCODE -ne 0) { throw 'SDK license step failed' }
& $sdkManager "--sdk_root=$($toolchain.sdk)" 'platforms;android-36' 'build-tools;36.0.0' 'platform-tools'
if ($LASTEXITCODE -ne 0) { throw 'SDK installation failed' }
