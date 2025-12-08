#!/bin/bash
#
# Jacal 오프라인 환경 배포 스크립트
# 이 스크립트를 오프라인 환경의 서버에서 실행하세요.
#
# 사용법: chmod +x deploy-offline.sh && ./deploy-offline.sh
#

set -e

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║       Jacal 오프라인 배포 스크립트                    ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_step() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}  ✅ $1${NC}"
}

print_error() {
    echo -e "${RED}  ❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}  ℹ️  $1${NC}"
}

# ============================================
# Step 1: 파일 확인
# ============================================
print_step "Step 1: 필요한 파일 확인"

required_files=("jacal-image.tar" "postgres-image.tar" "docker-compose.prod.yml" ".env.example")
missing_files=()

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_success "$file 존재함"
    else
        print_error "$file 없음"
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -gt 0 ]; then
    echo ""
    print_error "필수 파일이 누락되었습니다!"
    exit 1
fi

# ============================================
# Step 2: Docker 확인
# ============================================
print_step "Step 2: Docker 환경 확인"

if ! command -v docker &> /dev/null; then
    print_error "Docker가 설치되지 않았습니다!"
    exit 1
fi
print_success "Docker 설치됨: $(docker --version)"

if ! docker info &> /dev/null; then
    print_error "Docker 데몬이 실행되지 않습니다!"
    exit 1
fi
print_success "Docker 데몬 실행 중"

# ============================================
# Step 3: 해시값 검증 (선택사항)
# ============================================
print_step "Step 3: 파일 무결성 확인"

if [ -f "CHECKSUMS.txt" ]; then
    print_info "해시값 검증 중..."
    if sha256sum -c CHECKSUMS.txt 2>/dev/null; then
        print_success "모든 파일 무결성 확인됨"
    else
        print_error "파일 무결성 검증 실패! 파일이 손상되었을 수 있습니다."
        read -p "  계속 진행하시겠습니까? (y/N): " confirm
        if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
else
    print_info "CHECKSUMS.txt 파일이 없어 무결성 검증을 건너뜁니다."
fi

# ============================================
# Step 4: Docker 이미지 로드
# ============================================
print_step "Step 4: Docker 이미지 로드"

print_info "Jacal 이미지 로드 중... (시간이 소요됩니다)"
docker load -i jacal-image.tar
print_success "Jacal 이미지 로드 완료"

print_info "PostgreSQL 이미지 로드 중..."
docker load -i postgres-image.tar
print_success "PostgreSQL 이미지 로드 완료"

# 이미지 확인
echo ""
print_info "로드된 이미지 목록:"
docker images | grep -E "jacal|postgres" || true

# ============================================
# Step 5: .env 파일 설정
# ============================================
print_step "Step 5: 환경변수 설정"

if [ -f ".env" ]; then
    print_info ".env 파일이 이미 존재합니다."
    read -p "  기존 .env 파일을 사용하시겠습니까? (Y/n): " use_existing
    if [[ "$use_existing" =~ ^[Nn]$ ]]; then
        cp .env.example .env
        print_info "새 .env 파일이 생성되었습니다. 편집이 필요합니다."
    else
        print_success "기존 .env 파일 사용"
    fi
else
    cp .env.example .env
    print_success ".env 파일 생성됨"
    print_info ".env 파일을 편집해야 합니다!"
fi

echo ""
echo -e "${YELLOW}  ⚠️  중요: .env 파일에서 다음 값들을 반드시 수정하세요!${NC}"
echo "     - JWT_SECRET: 고유한 비밀키로 변경"
echo "     - VITE_API_URL: 이 서버의 IP 또는 도메인으로 변경"
echo "       예: http://192.168.1.100:3000"
echo ""
echo -e "${GREEN}  💡 참고: VITE_API_URL은 자동으로 CORS 허용 목록에 추가됩니다${NC}"
echo ""
read -p "  .env 파일을 지금 편집하시겠습니까? (Y/n): " edit_env

if [[ ! "$edit_env" =~ ^[Nn]$ ]]; then
    if command -v nano &> /dev/null; then
        nano .env
    elif command -v vi &> /dev/null; then
        vi .env
    else
        print_error "편집기를 찾을 수 없습니다. 수동으로 .env 파일을 편집하세요."
    fi
fi

# ============================================
# Step 6: 컨테이너 시작
# ============================================
print_step "Step 6: 컨테이너 시작"

read -p "  컨테이너를 지금 시작하시겠습니까? (Y/n): " start_containers

if [[ ! "$start_containers" =~ ^[Nn]$ ]]; then
    print_info "컨테이너 시작 중..."
    docker compose -f docker-compose.prod.yml up -d
    
    print_success "컨테이너가 시작되었습니다!"
    echo ""
    print_info "컨테이너 상태:"
    docker compose -f docker-compose.prod.yml ps
    
    echo ""
    print_info "로그 확인 (Ctrl+C로 종료):"
    echo "     docker compose -f docker-compose.prod.yml logs -f"
    echo ""
    
    # 잠시 대기 후 헬스체크
    sleep 5
    print_info "접속 테스트..."
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|301\|302"; then
        print_success "서비스가 정상적으로 실행 중입니다!"
        echo ""
        echo "  🌐 접속 URL: http://localhost:3000"
    else
        print_info "서비스가 아직 시작 중입니다. 잠시 후 다시 확인하세요."
    fi
else
    echo ""
    print_info "나중에 다음 명령어로 컨테이너를 시작하세요:"
    echo "     docker compose -f docker-compose.prod.yml up -d"
fi

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo -e "║           ${GREEN}✅ 배포 스크립트 완료!${NC}                       ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
