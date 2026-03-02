$root = 'D:\User\Desktop\Programms\Islamic Planner'
$dest = 'D:\User\Desktop\Programms\Islamic Planner\src\js'
$files = @('activity-log.js','ai.js','auth.js','board.js','crypto-storage.js','db.js','firebase-init.js','i18n.js','main.js','store.js')
foreach ($f in $files) {
    $src = Join-Path $root $f
    if (Test-Path $src) {
        Move-Item -LiteralPath $src -Destination $dest -Force
        Write-Host "Moved: $f"
    } else {
        Write-Host "SKIP (not found): $f"
    }
}
Write-Host "DONE"
