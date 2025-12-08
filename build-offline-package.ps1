<# 
.SYNOPSIS
    Jacal 오프라인 배포용 Docker 이미지 빌드 및 패키징 스크립트

.DESCRIPTION
    이 스크립트는 다음 작업을 수행합니다:
    1. Docker 환경 체크
    2. Jacal 애플리케이션 이미지 빌드
    3. PostgreSQL 이미지 Pull
    4. 이미지들을 tar 파일로 저장
    5. 필요한 설정 파일들 복사
    6. 무결성 해시값 생성

.NOTES
    실행 방법: .\build-offline-package.ps1
    작성일: 2025-12-08
#>

# 스크립트 실행 위치 확인
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $scriptPath) {
    $scriptPath = Get-Location
}

# 설정
$projectRoot = "C:\Users\USER\projects\jacal"
$outputDir = Join-Path $projectRoot "offline-deploy"
$appImageName = "gagagiga/jacal:latest"
$pgImageName = "postgres:15-alpine"

# 색상 출력 함수
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "  ✅ $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "  ❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "  ℹ️  $Message" -ForegroundColor Yellow
}

# 시작 시간 기록
$startTime = Get-Date

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║     Jacal 오프라인 배포 패키지 빌드 스크립트         ║" -ForegroundColor Magenta
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

# ============================================
# Step 1: 환경 확인
# ============================================
Write-Step "Step 1: 환경 확인"

# Docker 실행 확인
try {
    $dockerVersion = docker --version
    Write-Success "Docker 설치됨: $dockerVersion"
}
catch {
    Write-Error-Custom "Docker가 설치되지 않았거나 실행되지 않습니다."
    Write-Host "  Docker Desktop을 설치하고 실행해주세요." -ForegroundColor Yellow
    exit 1
}

# Docker 데몬 실행 확인
try {
    docker info | Out-Null
    Write-Success "Docker 데몬 실행 중"
}
catch {
    Write-Error-Custom "Docker 데몬이 실행되지 않습니다."
    Write-Host "  Docker Desktop을 시작해주세요." -ForegroundColor Yellow
    exit 1
}

# 프로젝트 디렉토리 확인
if (-not (Test-Path $projectRoot)) {
    Write-Error-Custom "프로젝트 디렉토리를 찾을 수 없습니다: $projectRoot"
    exit 1
}
Write-Success "프로젝트 디렉토리 확인: $projectRoot"

# Dockerfile 확인
$dockerfilePath = Join-Path $projectRoot "Dockerfile"
if (-not (Test-Path $dockerfilePath)) {
    Write-Error-Custom "Dockerfile을 찾을 수 없습니다: $dockerfilePath"
    exit 1
}
Write-Success "Dockerfile 확인됨"

# ============================================
# Step 2: 출력 디렉토리 준비
# ============================================
Write-Step "Step 2: 출력 디렉토리 준비"

if (Test-Path $outputDir) {
    Write-Info "기존 출력 디렉토리 삭제 중..."
    Remove-Item -Path $outputDir -Recurse -Force
}

New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
Write-Success "출력 디렉토리 생성됨: $outputDir"

# ============================================
# Step 3: Jacal 이미지 빌드
# ============================================
Write-Step "Step 3: Jacal 애플리케이션 이미지 빌드"

Write-Info "빌드 시작... (약 5-15분 소요)"
Write-Host ""

Set-Location $projectRoot

$buildResult = docker build --no-cache -t $appImageName . 2>&1
$buildExitCode = $LASTEXITCODE

if ($buildExitCode -ne 0) {
    Write-Error-Custom "이미지 빌드 실패!"
    Write-Host $buildResult -ForegroundColor Red
    exit 1
}

Write-Success "Jacal 이미지 빌드 완료: $appImageName"

# ============================================
# Step 4: PostgreSQL 이미지 Pull
# ============================================
Write-Step "Step 4: PostgreSQL 이미지 다운로드"

Write-Info "PostgreSQL 이미지 Pull 중..."

$pullResult = docker pull $pgImageName 2>&1
$pullExitCode = $LASTEXITCODE

if ($pullExitCode -ne 0) {
    Write-Error-Custom "PostgreSQL 이미지 Pull 실패!"
    Write-Host $pullResult -ForegroundColor Red
    exit 1
}

Write-Success "PostgreSQL 이미지 다운로드 완료: $pgImageName"

# ============================================
# Step 5: 이미지 저장 (tar 파일)
# ============================================
Write-Step "Step 5: Docker 이미지를 tar 파일로 저장"

# Jacal 이미지 저장
$jacalTarPath = Join-Path $outputDir "jacal-image.tar"
Write-Info "Jacal 이미지 저장 중... (시간 소요)"

docker save -o $jacalTarPath $appImageName
if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Jacal 이미지 저장 실패!"
    exit 1
}
Write-Success "Jacal 이미지 저장됨: jacal-image.tar"

# PostgreSQL 이미지 저장
$pgTarPath = Join-Path $outputDir "postgres-image.tar"
Write-Info "PostgreSQL 이미지 저장 중..."

docker save -o $pgTarPath $pgImageName
if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "PostgreSQL 이미지 저장 실패!"
    exit 1
}
Write-Success "PostgreSQL 이미지 저장됨: postgres-image.tar"

# ============================================
# Step 6: 설정 파일 복사
# ============================================
Write-Step "Step 6: 설정 파일 복사"

# docker-compose.prod.yml 복사
$composePath = Join-Path $projectRoot "docker-compose.prod.yml"
Copy-Item $composePath $outputDir
Write-Success "docker-compose.prod.yml 복사됨"

# .env.example 생성
$envContent = @"
# Jacal Production Environment Variables
# =============================================
# 이 파일을 .env로 이름 변경 후 값을 수정하세요

# JWT 비밀키 (반드시 변경 필수!)
JWT_SECRET=your-super-secret-key-change-this-immediately

# API URL (오프라인 환경의 서버 IP/도메인으로 변경)
# 예: http://192.168.1.100:3000 또는 http://your-server.local:3000
VITE_API_URL=http://localhost:3000

# CORS 허용 Origin (VITE_API_URL은 자동으로 추가됩니다)
# 추가로 허용할 Origin이 있으면 콤마로 구분하여 추가하세요
CORS_ORIGINS=http://localhost:3000

# Database 설정 (docker-compose.prod.yml과 일치시키세요)
DATABASE_URL=postgresql://jacal:jacal123@postgres:5432/jacal?schema=public
"@

$envContent | Out-File -FilePath (Join-Path $outputDir ".env.example") -Encoding UTF8
Write-Success ".env.example 생성됨"

# 배포 가이드 복사
$guideSourcePath = Join-Path $projectRoot "docs\OFFLINE_DEPLOYMENT.md"
if (Test-Path $guideSourcePath) {
    Copy-Item $guideSourcePath $outputDir
    Write-Success "OFFLINE_DEPLOYMENT.md 복사됨"
}

# ============================================
# Step 7: 해시값 생성 (무결성 확인용)
# ============================================
Write-Step "Step 7: 파일 해시값 생성 (무결성 확인용)"

$hashFilePath = Join-Path $outputDir "CHECKSUMS.txt"
$hashContent = @()

Get-ChildItem $outputDir -File | ForEach-Object {
    if ($_.Extension -eq ".tar" -or $_.Extension -eq ".yml" -or $_.Name -like ".env*" -or $_.Extension -eq ".md") {
        $hash = Get-FileHash -Path $_.FullName -Algorithm SHA256
        $hashContent += "$($hash.Hash)  $($_.Name)"
        Write-Info "$($_.Name): $($hash.Hash.Substring(0,16))..."
    }
}

$hashContent | Out-File -FilePath $hashFilePath -Encoding UTF8
Write-Success "CHECKSUMS.txt 생성됨"

# ============================================
# Step 8: 결과 요약
# ============================================
Write-Step "Step 8: 빌드 완료 - 결과 요약"

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host ""
Write-Host "  📦 생성된 파일 목록:" -ForegroundColor White
Write-Host "  ─────────────────────────────────────────" -ForegroundColor Gray

Get-ChildItem $outputDir | ForEach-Object {
    $size = if ($_.Length) { 
        if ($_.Length -gt 1MB) { 
            "{0:N2} MB" -f ($_.Length / 1MB) 
        }
        else { 
            "{0:N2} KB" -f ($_.Length / 1KB) 
        }
    }
    else { 
        "N/A" 
    }
    Write-Host "    $($_.Name.PadRight(30)) $size" -ForegroundColor White
}

Write-Host ""
Write-Host "  📊 총 패키지 크기:" -ForegroundColor White
$totalSize = (Get-ChildItem $outputDir -File | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "     {0:N2} MB" -f $totalSize -ForegroundColor Yellow

Write-Host ""
Write-Host "  ⏱️  총 소요 시간:" -ForegroundColor White
Write-Host "     $($duration.ToString('mm\:ss'))" -ForegroundColor Yellow

Write-Host ""
Write-Host "  📁 출력 디렉토리:" -ForegroundColor White
Write-Host "     $outputDir" -ForegroundColor Yellow

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║           ✅ 오프라인 패키지 준비 완료!               ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  다음 단계:" -ForegroundColor Cyan
Write-Host "  1. '$outputDir' 폴더를 USB 등으로 오프라인 환경으로 이동" -ForegroundColor White
Write-Host "  2. 오프라인 환경에서 OFFLINE_DEPLOYMENT.md 가이드 참조" -ForegroundColor White
Write-Host ""
