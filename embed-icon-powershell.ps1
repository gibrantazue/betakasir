# Script untuk embed icon menggunakan ResourceHacker via command line
# Jalankan sebagai Administrator

$exePath = "dist\win-unpacked\BetaKasir.exe"
$iconPath = "icon.ico"
$resourceHackerPath = "C:\Program Files (x86)\Resource Hacker\ResourceHacker.exe"

Write-Host "Embedding icon to executable..." -ForegroundColor Cyan
Write-Host "Executable: $exePath" -ForegroundColor Yellow
Write-Host "Icon: $iconPath" -ForegroundColor Yellow

# Cek apakah file ada
if (-not (Test-Path $exePath)) {
    Write-Host "[ERROR] Executable not found: $exePath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $iconPath)) {
    Write-Host "[ERROR] Icon not found: $iconPath" -ForegroundColor Red
    exit 1
}

# Cek apakah ResourceHacker terinstall
if (-not (Test-Path $resourceHackerPath)) {
    Write-Host "[ERROR] ResourceHacker not found at: $resourceHackerPath" -ForegroundColor Red
    Write-Host "Please install ResourceHacker from: https://www.angusj.com/resourcehacker/" -ForegroundColor Yellow
    Write-Host "Or update the path in this script" -ForegroundColor Yellow
    exit 1
}

# Backup file original
$backupPath = "$exePath.original"
if (-not (Test-Path $backupPath)) {
    Write-Host "Creating backup..." -ForegroundColor Yellow
    Copy-Item $exePath $backupPath -Force
}

# Create temporary script file for ResourceHacker
$scriptFile = "temp_icon_script.txt"
$scriptContent = @"
[FILENAMES]
Exe=$exePath
SaveAs=$exePath
Log=icon_embed.log
[COMMANDS]
-delete ICONGROUP,MAINICON,
-delete ICON,1,
-addoverwrite $iconPath, ICONGROUP,MAINICON,0
"@

$scriptContent | Out-File -FilePath $scriptFile -Encoding ASCII

Write-Host "Running ResourceHacker..." -ForegroundColor Yellow

# Run ResourceHacker
& $resourceHackerPath -script $scriptFile

# Wait a bit
Start-Sleep -Seconds 2

# Check if successful
if (Test-Path "icon_embed.log") {
    $log = Get-Content "icon_embed.log"
    Write-Host "`nResourceHacker Log:" -ForegroundColor Cyan
    Write-Host $log -ForegroundColor Gray
    
    # Clean up
    Remove-Item $scriptFile -Force -ErrorAction SilentlyContinue
    Remove-Item "icon_embed.log" -Force -ErrorAction SilentlyContinue
}

# Verify file changed
$originalHash = (Get-FileHash $backupPath -Algorithm MD5).Hash
$newHash = (Get-FileHash $exePath -Algorithm MD5).Hash

if ($originalHash -ne $newHash) {
    Write-Host "`n[SUCCESS] Icon has been embedded successfully!" -ForegroundColor Green
    Write-Host "File hash changed from $originalHash to $newHash" -ForegroundColor Green
} else {
    Write-Host "`n[WARNING] File hash unchanged - Icon might not be embedded" -ForegroundColor Yellow
    Write-Host "Please check the executable manually" -ForegroundColor Yellow
}

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Check icon in File Explorer: dist\win-unpacked\BetaKasir.exe" -ForegroundColor White
Write-Host "2. If icon is correct, rebuild installer:" -ForegroundColor White
Write-Host "   npx electron-builder --win --prepackaged dist\win-unpacked" -ForegroundColor Gray
Write-Host "3. Install the new application" -ForegroundColor White
