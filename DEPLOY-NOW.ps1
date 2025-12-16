# Direct SSH Deploy Script
Write-Host "=== DIRECT SSH DEPLOYMENT ===" -ForegroundColor Cyan

# Build first
Write-Host "`nBuilding project..." -ForegroundColor Yellow
npm run build

if (-not (Test-Path ".\dist")) {
    Write-Error "Build failed - dist folder not created"
    exit 1
}

Write-Host "Build complete" -ForegroundColor Green

# Deploy via SSH/rsync
Write-Host "`nDeploying to cPanel..." -ForegroundColor Yellow

$sshKeyPath = "$env:USERPROFILE\.ssh\id_ed25519"
$sshHost = "server712.brixly.uk"
$sshPort = "21098"
$sshUser = "healingu"
$remotePath = "public_html/"

Write-Host "SSH Key: $sshKeyPath"
Write-Host "Target: $sshUser@e$sshPort"

# Check if rsync exists
$rsyncExists = Get-Command rsync -ErrorAction SilentlyContinue

if ($rsyncExists) {
    Write-Host "`nUsing rsync..." -ForegroundColor Yellow
    $cmd = "rsync -avz --delete -e `"ssh -i $sshKeyPath -p $sshPort -o StrictHostKeyChecking=no`" dist/ $sshUser@${sshHost}:$remotePath"
    Write-Host $cmd -ForegroundColor DarkGray
    Invoke-Expression $cmd
}
else {
    Write-Host "`nUsing scp..." -ForegroundColor Yellow
    $cmd = "scp -i $sshKeyPath -P $sshPort -r dist/* $sshUser@${sshHost}:$remotePath"
    Write-Host $cmd -ForegroundColor DarkGray
    Invoke-Expression $cmd
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nDEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "Visit https://healingbuds.pt and hard refresh (Ctrl+Shift+R)"
}
else {
    Write-Error "Deployment failed with exit code $LASTEXITCODE"
}
