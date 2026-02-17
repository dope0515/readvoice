#!/bin/bash

############################################################
# Ollama 외부 접속 허용 설정 스크립트
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

check_ollama() {
    print_header "Ollama 설치 확인"
    
    if ! command -v ollama &> /dev/null; then
        print_error "Ollama가 설치되어 있지 않습니다."
        echo ""
        echo "Ollama 설치 방법:"
        echo "  curl -fsSL https://ollama.com/install.sh | sh"
        echo ""
        exit 1
    fi
    
    print_success "Ollama가 설치되어 있습니다"
}

setup_external_access() {
    print_header "Ollama 외부 접속 설정"
    
    print_info "Systemd override 설정 생성 중..."
    
    # override 디렉토리 생성
    sudo mkdir -p /etc/systemd/system/ollama.service.d
    
    # override 설정 파일 생성
    sudo tee /etc/systemd/system/ollama.service.d/override.conf > /dev/null << 'EOF'
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
EOF
    
    print_success "외부 접속 설정 완료"
}

setup_firewall() {
    print_header "방화벽 설정"
    
    print_info "포트 11434 (Ollama) 오픈 중..."
    
    # firewalld가 실행 중인지 확인
    if sudo systemctl is-active --quiet firewalld; then
        sudo firewall-cmd --permanent --add-port=11434/tcp
        sudo firewall-cmd --reload
        print_success "방화벽 규칙 추가 완료"
    else
        print_info "firewalld가 실행 중이지 않습니다 (스킵)"
    fi
}

restart_ollama() {
    print_header "Ollama 서비스 재시작"
    
    print_info "Systemd 데몬 리로드 중..."
    sudo systemctl daemon-reload
    
    print_info "Ollama 서비스 재시작 중..."
    sudo systemctl restart ollama.service
    sudo systemctl enable ollama.service
    
    # 서비스 시작 대기
    sleep 5
    
    # 서비스 상태 확인
    if sudo systemctl is-active --quiet ollama.service; then
        print_success "Ollama 서비스 실행 중"
    else
        print_error "Ollama 서비스 시작 실패"
        echo ""
        echo "상태 확인:"
        sudo systemctl status ollama.service --no-pager
        exit 1
    fi
}

check_models() {
    print_header "설치된 모델 확인"
    
    print_info "모델 목록 조회 중..."
    
    if ollama list | grep -q gemma3; then
        print_success "gemma3 모델이 설치되어 있습니다"
    else
        print_info "gemma3 모델이 설치되어 있지 않습니다"
        echo ""
        echo "모델 설치 방법:"
        echo "  ollama pull gemma3"
        echo ""
    fi
    
    echo ""
    ollama list
}

verify_setup() {
    print_header "설정 검증"
    
    print_info "API 테스트 중..."
    sleep 2
    
    if curl -s http://localhost:11434/api/tags > /dev/null; then
        print_success "Ollama API 정상 작동 중"
        echo ""
        curl -s http://localhost:11434/api/tags | python3 -m json.tool 2>/dev/null || curl -s http://localhost:11434/api/tags
    else
        print_error "Ollama API 응답 없음"
        echo ""
        echo "로그 확인:"
        sudo journalctl -u ollama.service -n 50 --no-pager
        exit 1
    fi
}

show_info() {
    echo ""
    echo "=========================================="
    echo "Ollama 설정 완료!"
    echo "=========================================="
    echo ""
    echo "📍 Ollama 서버: http://localhost:11434"
    echo "📍 API 확인: http://localhost:11434/api/tags"
    echo ""
    echo "유용한 명령어:"
    echo "  모델 목록:     ollama list"
    echo "  모델 다운로드: ollama pull gemma3"
    echo "  모델 삭제:     ollama rm gemma3"
    echo "  서비스 상태:   sudo systemctl status ollama.service"
    echo "  로그 확인:     sudo journalctl -u ollama.service -f"
    echo ""
    echo "모델 다운로드 권장:"
    echo "  ollama pull gemma3        # 권장 (4-6GB RAM)"
    echo "  ollama pull phi3          # 빠름 (3-4GB RAM)"
    echo "  ollama pull qwen2.5:7b    # 한국어 특화 (5-7GB RAM)"
    echo ""
}

main() {
    echo ""
    echo "=========================================="
    echo "Ollama 외부 접속 설정"
    echo "=========================================="
    echo ""
    
    check_ollama
    setup_external_access
    setup_firewall
    restart_ollama
    check_models
    verify_setup
    show_info
}

main
