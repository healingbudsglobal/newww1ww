# EMERGENCY FIX - Site showing directory listing

Write-Host "=== FIXING HEALINGBUDS.PT NOW ===" -ForegroundColor Red
Write-Host ""
Write-Host "Your site is showing a directory listing because index.html is missing." -ForegroundColor Yellow
Write-Host ""
Write-Host "IMMEDIATE FIX (2 minutes):" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Login to cPanel File Manager"
Write-Host "2. Navigate to public_html"
Write-Host "3. You'll see an 'assets' folder and 'robots.txt'"
Write-Host "4. DELETE EVERYTHING in public_html"
Write-Host "5. Upload ALL files from this folder:"
Write-Host "   $PWD\dist"
Write-Host "6. Make sure index.html is directly in public_html (not in a subfolder)"
Write-Host "7. Refresh https://healingbuds.pt"
Write-Host ""
Write-Host "Opening dist folder now..." -ForegroundColor Green
explorer.exe "$PWD\dist"
Write-Host ""
Write-Host "Files to upload (must be in public_html root):" -ForegroundColor Yellow
Get-ChildItem "$PWD\dist" | ForEach-Object {
    Write-Host "  - $($_change.Name)" -ForegroundColor White
}
