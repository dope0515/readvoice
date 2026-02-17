#!/bin/bash

############################################################
# Oracle Cloud (Rocky Linux) 서버 배포 스크립트
# 사용법: SSH로 서버 접속 후 이 스크립트 실행
############################################################

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# 현재 사용자 및 디렉토리 확인
CURRENT_USER=$(whoami)
PROJECT_DIR="$HOME/stt"
WHISPER_DIR="$PROJECT_DIR/whisper-server"

check_requirements() {
    print_header "필수 요구사항 확인"
    
    # 프로젝트 디렉토리 확인
    if [ ! -d "$PROJECT_DIR" ]; then
        print_error "프로젝트 디렉토리를 찾을 수 없습니다: $PROJECT_DIR"
        echo "먼저 레포지토리를 클론하세요: git clone <repo-url> ~/stt"
        exit 1
    fi
    
    # Whisper 서버 디렉토리 확인
    if [ ! -d "$WHISPER_DIR" ]; then
        print_error "Whisper 서버 디렉토리를 찾을 수 없습니다: $WHISPER_DIR"
        exit 1
    fi
    
    print_success "프로젝트 디렉토리 확인 완료"
}

install_system_packages() {
    print_header "시스템 패키지 설치"
    
    print_info "Python 및 필수 패키지 확인 중..."
    
    # Rocky Linux에서 필요한 패키지 확인 및 설치
    if ! command -v python3 &> /dev/null; then
        print_info "Python3 설치 중..."
        sudo dnf install -y python3 python3-pip python3-devel
    fi
    
    if ! command -v ffmpeg &> /dev/null; then
        print_info "ffmpeg 설치 중..."
        # Rocky Linux에서 ffmpeg 설치 (EPEL 필요)
        sudo dnf install -y epel-release
        sudo dnf install -y ffmpeg
    fi
    
    print_success "시스템 패키지 설치 완료"
}

setup_python_env() {
    print_header "Python 가상환경 설정"
    
    cd "$WHISPER_DIR"
    
    # 가상환경 생성 (없다면)
    if [ ! -d "venv" ]; then
        print_info "Python 가상환경 생성 중..."
        python3 -m venv venv
        print_success "가상환경 생성 완료"
    else
        print_info "가상환경이 이미 존재합니다"
    fi
    
    # 의존성 설치
    print_info "Python 패키지 설치 중 (시간이 걸릴 수 있습니다)..."
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    
    print_success "Python 의존성 설치 완료"
}

setup_environment() {
    print_header "환경 변수 설정"
    
    cd "$WHISPER_DIR"
    
    # .env 파일 생성 (없다면)
    if [ ! -f ".env" ]; then
        print_info ".env 파일 생성 중..."
        cat > .env << EOF
WHISPER_MODEL=base
PORT=8000
HOST=0.0.0.0
EOF
        print_success ".env 파일 생성 완료"
    else
        print_info ".env 파일이 이미 존재합니다"
        cat .env
    fi
}

setup_systemd_service() {
    print_header "Whisper Systemd 서비스 설정"
    
    # 로그 파일 생성
    print_info "로그 파일 생성 중..."
    sudo touch /var/log/whisper.log
    sudo touch /var/log/whisper-error.log
    sudo chown ${CURRENT_USER}:${CURRENT_USER} /var/log/whisper*.log
    
    # Systemd 서비스 파일 생성
    print_info "Systemd 서비스 파일 생성 중..."
    sudo tee /etc/systemd/system/whisper.service > /dev/null << EOF
[Unit]
Description=Whisper STT Server
After=network.target

[Service]
Type=simple
User=${CURRENT_USER}
WorkingDirectory=${WHISPER_DIR}
Environment="PATH=${WHISPER_DIR}/venv/bin"
Environment="WHISPER_MODEL=base"
Environment="PORT=8000"
Environment="HOST=0.0.0.0"
ExecStart=${WHISPER_DIR}/venv/bin/python server.py
Restart=always
RestartSec=10
StandardOutput=append:/var/log/whisper.log
StandardError=append:/var/log/whisper-error.log

[Install]
WantedBy=multi-user.target
EOF
    
    # Systemd 데몬 리로드
    sudo systemctl daemon-reload
    sudo systemctl enable whisper.service
    
    print_success "Systemd 서비스 설정 완료"
}

setup_firewall() {
    print_header "방화벽 설정"
    
    print_info "포트 8000 (Whisper) 오픈 중..."
    
    # firewalld가 실행 중인지 확인
    if sudo systemctl is-active --quiet firewalld; then
        sudo firewall-cmd --permanent --add-port=8000/tcp
        sudo firewall-cmd --reload
        print_success "방화벽 규칙 추가 완료"
    else
        print_info "firewalld가 실행 중이지 않습니다 (스킵)"
    fi
}

start_service() {
    print_header "Whisper 서비스 시작"
    
    print_info "서비스 시작 중..."
    sudo systemctl start whisper.service
    
    # 서비스 시작 대기
    sleep 5
    
    # 서비스 상태 확인
    if sudo systemctl is-active --quiet whisper.service; then
        print_success "Whisper 서비스 실행 중"
    else
        print_error "Whisper 서비스 시작 실패"
        echo ""
        echo "로그 확인:"
        sudo journalctl -u whisper.service -n 50 --no-pager
        exit 1
    fi
}

verify_deployment() {
    print_header "배포 검증"
    
    print_info "헬스 체크 중..."
    sleep 3
    
    if curl -s http://localhost:8000/health > /dev/null; then
        print_success "Whisper 서버 정상 작동 중"
        echo ""
        curl -s http://localhost:8000/health | python3 -m json.tool
    else
        print_error "Whisper 서버 응답 없음"
        echo ""
        echo "로그 확인:"
        sudo tail -20 /var/log/whisper-error.log
        exit 1
    fi
}

show_info() {
    echo ""
    echo "=========================================="
    echo "배포 완료!"
    echo "=========================================="
    echo ""
    echo "📍 Whisper 서버: http://localhost:8000"
    echo "📍 헬스 체크: http://localhost:8000/health"
    echo ""
    echo "유용한 명령어:"
    echo "  상태 확인:    sudo systemctl status whisper.service"
    echo "  로그 확인:    sudo tail -f /var/log/whisper.log"
    echo "  에러 로그:    sudo tail -f /var/log/whisper-error.log"
    echo "  서비스 재시작: sudo systemctl restart whisper.service"
    echo "  서비스 중지:   sudo systemctl stop whisper.service"
    echo ""
    echo "다음 단계:"
    echo "  1. Ollama 설정: ./setup-ollama.sh"
    echo "  2. 방화벽 설정: ./setup-firewall.sh"
    echo "  3. 서비스 검증: ./verify-services.sh"
    echo ""
}

main() {
    echo ""
    echo "=========================================="
    echo "Oracle Cloud 서버 배포"
    echo "=========================================="
    echo ""
    
    check_requirements
    install_system_packages
    setup_python_env
    setup_environment
    setup_systemd_service
    setup_firewall
    start_service
    verify_deployment
    show_info
}

main
