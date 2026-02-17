#!/bin/bash

############################################################
# 방화벽 설정 스크립트 (Rocky Linux)
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

check_firewall() {
    print_header "방화벽 상태 확인"
    
    if sudo systemctl is-active --quiet firewalld; then
        print_success "firewalld가 실행 중입니다"
        return 0
    else
        print_info "firewalld가 실행 중이지 않습니다"
        
        echo ""
        echo "firewalld를 시작하시겠습니까? (y/n)"
        read -r response
        
        if [[ "$response" =~ ^[Yy]$ ]]; then
            sudo systemctl start firewalld
            sudo systemctl enable firewalld
            print_success "firewalld 시작 완료"
            return 0
        else
            print_info "방화벽 설정을 건너뜁니다"
            return 1
        fi
    fi
}

setup_whisper_port() {
    print_header "Whisper 포트 설정"
    
    print_info "포트 8000/tcp 오픈 중..."
    
    # 포트가 이미 열려있는지 확인
    if sudo firewall-cmd --list-ports | grep -q "8000/tcp"; then
        print_info "포트 8000은 이미 열려있습니다"
    else
        sudo firewall-cmd --permanent --add-port=8000/tcp
        print_success "포트 8000 추가 완료"
    fi
}

setup_ollama_port() {
    print_header "Ollama 포트 설정"
    
    print_info "포트 11434/tcp 오픈 중..."
    
    # 포트가 이미 열려있는지 확인
    if sudo firewall-cmd --list-ports | grep -q "11434/tcp"; then
        print_info "포트 11434는 이미 열려있습니다"
    else
        sudo firewall-cmd --permanent --add-port=11434/tcp
        print_success "포트 11434 추가 완료"
    fi
}

reload_firewall() {
    print_header "방화벽 규칙 적용"
    
    print_info "방화벽 리로드 중..."
    sudo firewall-cmd --reload
    
    print_success "방화벽 규칙 적용 완료"
}

verify_firewall() {
    print_header "방화벽 규칙 확인"
    
    echo ""
    print_info "현재 열린 포트:"
    sudo firewall-cmd --list-ports
    
    echo ""
    print_info "활성 서비스:"
    sudo firewall-cmd --list-services
    
    echo ""
    
    # 각 포트 확인
    if sudo firewall-cmd --list-ports | grep -q "8000/tcp"; then
        print_success "포트 8000/tcp 열림"
    else
        print_error "포트 8000/tcp 닫힘"
    fi
    
    if sudo firewall-cmd --list-ports | grep -q "11434/tcp"; then
        print_success "포트 11434/tcp 열림"
    else
        print_error "포트 11434/tcp 닫힘"
    fi
}

test_ports() {
    print_header "포트 연결 테스트"
    
    print_info "Whisper 포트 (8000) 테스트 중..."
    if nc -z -w5 localhost 8000 2>/dev/null; then
        print_success "포트 8000 연결 가능"
    else
        print_info "포트 8000 서비스가 실행 중이지 않거나 연결 불가"
    fi
    
    print_info "Ollama 포트 (11434) 테스트 중..."
    if nc -z -w5 localhost 11434 2>/dev/null; then
        print_success "포트 11434 연결 가능"
    else
        print_info "포트 11434 서비스가 실행 중이지 않거나 연결 불가"
    fi
}

show_info() {
    echo ""
    echo "=========================================="
    echo "방화벽 설정 완료!"
    echo "=========================================="
    echo ""
    echo "열린 포트:"
    echo "  - 8000/tcp  (Whisper STT)"
    echo "  - 11434/tcp (Ollama)"
    echo ""
    echo "유용한 명령어:"
    echo "  방화벽 상태:      sudo firewall-cmd --state"
    echo "  열린 포트 확인:   sudo firewall-cmd --list-ports"
    echo "  포트 추가:        sudo firewall-cmd --permanent --add-port=PORT/tcp"
    echo "  포트 제거:        sudo firewall-cmd --permanent --remove-port=PORT/tcp"
    echo "  방화벽 리로드:    sudo firewall-cmd --reload"
    echo ""
    echo "주의사항:"
    echo "  Oracle Cloud 콘솔에서도 Security List에"
    echo "  해당 포트들이 열려있는지 확인하세요!"
    echo ""
}

main() {
    echo ""
    echo "=========================================="
    echo "방화벽 설정 (Rocky Linux)"
    echo "=========================================="
    echo ""
    
    if check_firewall; then
        setup_whisper_port
        setup_ollama_port
        reload_firewall
        verify_firewall
        test_ports
    else
        print_info "방화벽 설정이 비활성화되었습니다"
        echo ""
        echo "참고: 방화벽이 비활성화되어도 Oracle Cloud의"
        echo "Security List 설정은 여전히 적용됩니다."
    fi
    
    show_info
}

main
