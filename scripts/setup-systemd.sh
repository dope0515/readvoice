#!/bin/bash

##################################################################
# Oracle Cloud에서 Whisper와 Ollama를 Systemd 서비스로 등록
# 이 스크립트는 Oracle Cloud 인스턴스 내부에서 실행합니다
##################################################################

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# 현재 사용자 확인
CURRENT_USER=$(whoami)
WHISPER_DIR="/home/${CURRENT_USER}/whisper-server"

setup_whisper_service() {
    print_info "Whisper Systemd 서비스 설정 중..."
    
    # whisper-server 디렉토리 확인
    if [ ! -d "$WHISPER_DIR" ]; then
        print_error "Whisper 서버 디렉토리를 찾을 수 없습니다: $WHISPER_DIR"
        exit 1
    fi
    
    # 로그 파일 생성
    sudo touch /var/log/whisper.log
    sudo touch /var/log/whisper-error.log
    sudo chown ${CURRENT_USER}:${CURRENT_USER} /var/log/whisper*.log
    
    # Systemd 서비스 파일 생성
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
    
    # Systemd 데몬 리로드 및 서비스 활성화
    sudo systemctl daemon-reload
    sudo systemctl enable whisper.service
    sudo systemctl start whisper.service
    
    # 서비스 상태 확인
    sleep 3
    if sudo systemctl is-active --quiet whisper.service; then
        print_success "Whisper 서비스 실행 중"
    else
        print_error "Whisper 서비스 시작 실패"
        sudo systemctl status whisper.service
        exit 1
    fi
}

setup_ollama_service() {
    print_info "Ollama Systemd 서비스 설정 중..."
    
    # Ollama 설치 확인
    if ! command -v ollama &> /dev/null; then
        print_error "Ollama가 설치되어 있지 않습니다."
        echo "먼저 Ollama를 설치하세요: curl -fsSL https://ollama.com/install.sh | sh"
        return 1
    fi
    
    # Ollama는 설치 시 자동으로 systemd 서비스로 등록됨
    # 외부 접속을 위한 환경 변수 설정
    
    sudo mkdir -p /etc/systemd/system/ollama.service.d
    sudo tee /etc/systemd/system/ollama.service.d/override.conf > /dev/null << EOF
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
EOF
    
    # Systemd 데몬 리로드 및 서비스 재시작
    sudo systemctl daemon-reload
    sudo systemctl restart ollama.service
    sudo systemctl enable ollama.service
    
    # 서비스 상태 확인
    sleep 3
    if sudo systemctl is-active --quiet ollama.service; then
        print_success "Ollama 서비스 실행 중"
    else
        print_error "Ollama 서비스 시작 실패"
        sudo systemctl status ollama.service
        return 1
    fi
}

setup_log_rotation() {
    print_info "로그 로테이션 설정 중..."
    
    sudo tee /etc/logrotate.d/whisper > /dev/null << 'EOF'
/var/log/whisper*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 ubuntu ubuntu
}
EOF
    
    print_success "로그 로테이션 설정 완료"
}

verify_services() {
    print_info "서비스 동작 확인 중..."
    
    echo ""
    echo "=== Whisper 서비스 ==="
    sudo systemctl status whisper.service --no-pager | head -n 10
    
    echo ""
    echo "=== Ollama 서비스 ==="
    sudo systemctl status ollama.service --no-pager | head -n 10
    
    echo ""
    print_info "헬스 체크..."
    
    # Whisper 헬스 체크
    if curl -s http://localhost:8000/health > /dev/null; then
        print_success "Whisper: http://localhost:8000/health"
    else
        print_error "Whisper 응답 없음"
    fi
    
    # Ollama 헬스 체크
    if curl -s http://localhost:11434/api/tags > /dev/null; then
        print_success "Ollama: http://localhost:11434/api/tags"
    else
        print_error "Ollama 응답 없음"
    fi
}

show_commands() {
    echo ""
    echo "=========================================="
    echo "Systemd 서비스 설정 완료!"
    echo "=========================================="
    echo ""
    echo "유용한 명령어:"
    echo ""
    echo "📊 상태 확인:"
    echo "  sudo systemctl status whisper.service"
    echo "  sudo systemctl status ollama.service"
    echo ""
    echo "🔄 서비스 제어:"
    echo "  sudo systemctl start whisper.service"
    echo "  sudo systemctl stop whisper.service"
    echo "  sudo systemctl restart whisper.service"
    echo ""
    echo "📝 로그 확인:"
    echo "  sudo tail -f /var/log/whisper.log"
    echo "  sudo tail -f /var/log/whisper-error.log"
    echo "  sudo journalctl -u ollama -f"
    echo ""
    echo "🔧 서비스 관리:"
    echo "  sudo systemctl enable whisper.service   # 부팅 시 자동 시작"
    echo "  sudo systemctl disable whisper.service  # 자동 시작 비활성화"
    echo ""
}

main() {
    echo ""
    echo "=========================================="
    echo "Systemd 서비스 설정"
    echo "=========================================="
    echo ""
    
    setup_whisper_service
    setup_ollama_service
    setup_log_rotation
    verify_services
    show_commands
}

main
