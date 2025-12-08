# 오프라인 환경 Docker 이미지 배포 가이드

## 📋 개요

이 가이드는 Jacal 애플리케이션의 Docker 이미지를 빌드하고, 오프라인(폐쇄망) 환경으로 안전하게 이전하기 위한 절차를 설명합니다.

---

## 🎯 전체 절차 요약

```mermaid
flowchart LR
    A[1. 빌드 환경 준비] --> B[2. Docker 이미지 빌드]
    B --> C[3. 이미지 저장 & 압축]
    C --> D[4. 오프라인 환경으로 이동]
    D --> E[5. 이미지 로드 & 실행]
```

---

## 📦 필요한 Docker 이미지 목록

| 이미지 | 역할 | 비고 |
|--------|------|------|
| `gagagiga/jacal:latest` | 메인 애플리케이션 (API + Web) | 직접 빌드 필요 |
| `postgres:15-alpine` | PostgreSQL 데이터베이스 | Docker Hub에서 pull |

---

## 🔧 Step 1: 빌드 환경 사전 체크

### 필수 요구사항

```powershell
# Docker 버전 확인 (19.03 이상 권장)
docker --version

# Docker Compose 버전 확인
docker compose version

# 디스크 공간 확인 (최소 5GB 권장)
# Windows PowerShell
Get-PSDrive C | Select-Object Used,Free
```

### 네트워크 연결 상태 확인

```powershell
# npm registry 접근 가능 여부
Test-NetConnection registry.npmjs.org -Port 443

# Docker Hub 접근 가능 여부  
Test-NetConnection registry-1.docker.io -Port 443
```

---

## 🏗️ Step 2: Docker 이미지 빌드

### 2.1 프로젝트 디렉토리로 이동

```powershell
cd C:\Users\USER\projects\jacal
```

### 2.2 빌드 캐시 정리 (선택사항 - 클린 빌드 시)

```powershell
# 기존 빌드 캐시 삭제
docker builder prune -f
```

### 2.3 Jacal 애플리케이션 이미지 빌드

```powershell
# 이미지 빌드 (태그: gagagiga/jacal:latest)
docker build --no-cache -t gagagiga/jacal:latest .
```

> **⚠️ 주의사항:**
> - `--no-cache` 옵션은 깨끗한 빌드를 보장합니다
> - 빌드 시간: 약 5-15분 소요 (네트워크 및 시스템 사양에 따라 상이)
> - 빌드 중 오류 발생 시 로그를 주의 깊게 확인하세요

### 2.4 PostgreSQL 이미지 Pull

```powershell
# postgres:15-alpine 이미지 다운로드
docker pull postgres:15-alpine
```

### 2.5 빌드 결과 확인

```powershell
# 생성된 이미지 목록 확인
docker images | Select-String "jacal|postgres"
```

출력 예시:
```
REPOSITORY          TAG           IMAGE ID       CREATED         SIZE
gagagiga/jacal      latest        abc123def456   2 minutes ago   450MB
postgres            15-alpine     xyz789ghi012   1 week ago      240MB
```

---

## 💾 Step 3: Docker 이미지 저장 (tar 파일 생성)

### 3.1 이미지를 tar 파일로 저장

```powershell
# 출력 디렉토리 생성
New-Item -ItemType Directory -Path ".\offline-deploy" -Force

# Jacal 이미지 저장
docker save -o .\offline-deploy\jacal-image.tar gagagiga/jacal:latest

# PostgreSQL 이미지 저장
docker save -o .\offline-deploy\postgres-image.tar postgres:15-alpine
```

### 3.2 필수 설정 파일 복사

```powershell
# docker-compose 파일 복사
Copy-Item .\docker-compose.prod.yml .\offline-deploy\

# 환경변수 템플릿 생성
@"
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
"@ | Out-File -FilePath .\offline-deploy\.env.example -Encoding UTF8
```

### 3.3 압축 (선택사항 - 용량 절약)

```powershell
# 전체 폴더 ZIP 압축
Compress-Archive -Path .\offline-deploy\* -DestinationPath .\jacal-offline-package.zip -Force
```

### 3.4 산출물 확인

```powershell
# 파일 목록 및 크기 확인
Get-ChildItem .\offline-deploy | Select-Object Name, @{N='Size(MB)';E={[math]::Round($_.Length/1MB,2)}}
```

출력 예시:
```
Name                    Size(MB)
----                    --------
jacal-image.tar         450.23
postgres-image.tar      85.67
docker-compose.prod.yml 1.17
.env.example            0.52
```

---

## 🚚 Step 4: 오프라인 환경으로 이동

### 이동해야 할 파일들

| 파일명 | 필수 여부 | 용도 |
|--------|----------|------|
| `jacal-image.tar` | ✅ 필수 | 애플리케이션 이미지 |
| `postgres-image.tar` | ✅ 필수 | 데이터베이스 이미지 |
| `docker-compose.prod.yml` | ✅ 필수 | 컨테이너 구성 |
| `.env.example` | ✅ 필수 | 환경변수 템플릿 |

### 이동 방법

1. **USB 드라이브**: 가장 일반적인 방법
2. **CD/DVD**: 보안 환경에서 선호
3. **보안 파일 전송 시스템**: 조직 정책에 따름

---

## 🔄 Step 5: 오프라인 환경에서 실행

### 5.1 파일 복사 및 이동

```bash
# 작업 디렉토리 생성
mkdir -p /opt/jacal
cd /opt/jacal

# USB에서 파일 복사 (Linux 예시)
cp /mnt/usb/* ./
```

### 5.2 Docker 이미지 로드

```bash
# Jacal 이미지 로드
docker load -i jacal-image.tar

# PostgreSQL 이미지 로드
docker load -i postgres-image.tar

# 이미지 로드 확인
docker images
```

### 5.3 환경변수 설정

```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 수정 (필수!)
nano .env
# 또는
vi .env
```

> **⚠️ 중요: 반드시 수정해야 할 값들**
> - `JWT_SECRET`: 고유한 비밀키로 변경 (최소 32자 권장)
> - `VITE_API_URL`: 실제 서버 IP 또는 도메인으로 변경

### 5.4 컨테이너 실행

```bash
# Docker Compose로 컨테이너 시작
docker compose -f docker-compose.prod.yml up -d

# 컨테이너 상태 확인
docker compose -f docker-compose.prod.yml ps

# 로그 확인 (초기 시작시 권장)
docker compose -f docker-compose.prod.yml logs -f
```

### 5.5 접속 테스트

```bash
# API 헬스체크
curl http://localhost:3000/health

# 또는 웹 브라우저에서 접속
# http://<서버IP>:3000
```

---

## 🔍 트러블슈팅

### 문제 1: 이미지 로드 실패

```bash
# 오류: "Error processing tar file"
# 해결: 파일 무결성 확인
md5sum jacal-image.tar
# 원본과 해시값 비교
```

### 문제 2: 컨테이너 시작 실패

```bash
# 로그 확인
docker compose -f docker-compose.prod.yml logs app

# PostgreSQL 연결 대기 문제시
docker compose -f docker-compose.prod.yml restart app
```

### 문제 3: 데이터베이스 마이그레이션 실패

```bash
# 수동 마이그레이션 실행
docker compose -f docker-compose.prod.yml exec app \
  npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
```

### 문제 4: Permission Denied

```bash
# Linux에서 Docker 권한 문제
sudo usermod -aG docker $USER
newgrp docker
```

---

## 📝 체크리스트 (배포 전 최종 확인)

### 빌드 환경에서

- [ ] `docker build` 성공 완료
- [ ] `docker pull postgres:15-alpine` 완료
- [ ] `jacal-image.tar` 파일 생성됨
- [ ] `postgres-image.tar` 파일 생성됨
- [ ] `docker-compose.prod.yml` 복사됨
- [ ] `.env.example` 생성됨
- [ ] 모든 파일 해시값 기록 (무결성 확인용)

### 오프라인 환경에서

- [ ] 모든 tar 파일 해시값 일치 확인
- [ ] `docker load` 성공 완료
- [ ] `.env` 파일 환경에 맞게 수정
- [ ] `JWT_SECRET` 변경 완료
- [ ] `VITE_API_URL` 환경에 맞게 변경
- [ ] `docker compose up -d` 성공
- [ ] 웹 브라우저 접속 테스트 완료
- [ ] 로그인 기능 테스트 완료

---

## 📁 최종 디렉토리 구조

```
offline-deploy/
├── jacal-image.tar          # Jacal 애플리케이션 이미지
├── postgres-image.tar       # PostgreSQL 이미지  
├── docker-compose.prod.yml  # Docker Compose 설정
├── .env.example             # 환경변수 템플릿
└── OFFLINE_DEPLOYMENT.md    # 이 문서 (선택사항)
```

---

## 📌 버전 정보

| 구성요소 | 버전 |
|---------|------|
| Jacal | 1.0.0 |
| Node.js | 20-alpine |
| PostgreSQL | 15-alpine |
| 문서 업데이트 | 2025-12-08 |
