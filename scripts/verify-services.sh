#!/bin/bash

############################################################
# 서비스 검증 스크립트
# Whisper와 Ollama가 정상 작동하는지 확인
############################################################

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
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

print_warning() {
    echo -e "${MAGENTA}⚠ $1${NC}"
}

# 테스트 결과 카운터
TESTS_PASSED=0
TESTS_FAILED=0

check_systemd_services() {
    print_header "Systemd 서비스 상태 확인"
    
    echo ""
    print_info "Whisper 서비스 확인 중..."
    if sudo systemctl is-active --quiet whisper.service; then
        print_success "Whisper 서비스 실행 중"
        ((TESTS_PASSED++))
    else
        print_error "Whisper 서비스 실행 안 됨"
        ((TESTS_FAILED++))
        echo ""
        sudo systemctl status whisper.service --no-pager | head -n 15
    fi
    
    echo ""
    print_info "Ollama 서비스 확인 중..."
    if sudo systemctl is-active --quiet ollama.service; then
        print_success "Ollama 서비스 실행 중"
        ((TESTS_PASSED++))
    else
        print_error "Ollama 서비스 실행 안 됨"
        ((TESTS_FAILED++))
        echo ""
        sudo systemctl status ollama.service --no-pager | head -n 15
    fi
}

check_ports() {
    print_header "포트 연결 테스트"
    
    echo ""
    print_info "포트 8000 (Whisper) 확인 중..."
    if nc -z -w5 localhost 8000 2>/dev/null; then
        print_success "포트 8000 열림"
        ((TESTS_PASSED++))
    else
        print_error "포트 8000 닫힘 또는 연결 불가"
        ((TESTS_FAILED++))
    fi
    
    print_info "포트 11434 (Ollama) 확인 중..."
    if nc -z -w5 localhost 11434 2>/dev/null; then
        print_success "포트 11434 열림"
        ((TESTS_PASSED++))
    else
        print_error "포트 11434 닫힘 또는 연결 불가"
        ((TESTS_FAILED++))
    fi
}

test_whisper_api() {
    print_header "Whisper API 테스트"
    
    echo ""
    print_info "헬스 체크 중..."
    
    local response
    local http_code
    
    response=$(curl -s -w "\n%{http_code}" http://localhost:8000/health 2>&1 || echo "connection_failed")
    
    if [ "$response" = "connection_failed" ]; then
        print_error "Whisper API 연결 실패"
        ((TESTS_FAILED++))
        return 1
    fi
    
    http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        print_success "Whisper API 정상 작동 (HTTP 200)"
        ((TESTS_PASSED++))
        echo ""
        echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
        return 0
    else
        print_error "Whisper API 응답 오류 (HTTP $http_code)"
        ((TESTS_FAILED++))
        echo "$body"
        return 1
    fi
}

test_ollama_api() {
    print_header "Ollama API 테스트"
    
    echo ""
    print_info "모델 목록 조회 중..."
    
    local response
    local http_code
    
    response=$(curl -s -w "\n%{http_code}" http://localhost:11434/api/tags 2>&1 || echo "connection_failed")
    
    if [ "$response" = "connection_failed" ]; then
        print_error "Ollama API 연결 실패"
        ((TESTS_FAILED++))
        return 1
    fi
    
    http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        print_success "Ollama API 정상 작동 (HTTP 200)"
        ((TESTS_PASSED++))
        echo ""
        echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
        
        # 모델 확인
        echo ""
        if echo "$body" | grep -q "gemma3"; then
            print_success "gemma3 모델 설치됨"
        else
            print_warning "gemma3 모델이 설치되어 있지 않습니다"
            echo "설치 명령어: ollama pull gemma3"
        fi
        
        return 0
    else
        print_error "Ollama API 응답 오류 (HTTP $http_code)"
        ((TESTS_FAILED++))
        echo "$body"
        return 1
    fi
}

check_external_access() {
    print_header "외부 접속 설정 확인"
    
    echo ""
    print_info "Whisper 외부 접속 확인 중..."
    
    # server.py에서 HOST 설정 확인
    if grep -q 'HOST.*0.0.0.0' ~/stt/whisper-server/.env 2>/dev/null || \
       grep -q 'host.*0.0.0.0' ~/stt/whisper-server/server.py; then
        print_success "Whisper가 외부 접속을 허용합니다 (0.0.0.0)"
        ((TESTS_PASSED++))
    else
        print_warning "Whisper 외부 접속 설정 미확인"
    fi
    
    echo ""
    print_info "Ollama 외부 접속 확인 중..."
    
    # Ollama override 설정 확인
    if [ -f /etc/systemd/system/ollama.service.d/override.conf ]; then
        if grep -q "OLLAMA_HOST=0.0.0.0" /etc/systemd/system/ollama.service.d/override.conf; then
            print_success "Ollama가 외부 접속을 허용합니다 (0.0.0.0)"
            ((TESTS_PASSED++))
        else
            print_warning "Ollama 외부 접속 설정 확인 필요"
        fi
    else
        print_warning "Ollama override 설정 파일이 없습니다"
        echo "설정 방법: ./setup-ollama.sh 실행"
    fi
}

check_firewall() {
    print_header "방화벽 설정 확인"
    
    echo ""
    if sudo systemctl is-active --quiet firewalld; then
        print_info "firewalld 실행 중"
        
        echo ""
        if sudo firewall-cmd --list-ports | grep -q "8000/tcp"; then
            print_success "포트 8000/tcp 방화벽 규칙 설정됨"
            ((TESTS_PASSED++))
        else
            print_error "포트 8000/tcp 방화벽 규칙 없음"
            ((TESTS_FAILED++))
            echo "설정 방법: sudo firewall-cmd --permanent --add-port=8000/tcp && sudo firewall-cmd --reload"
        fi
        
        if sudo firewall-cmd --list-ports | grep -q "11434/tcp"; then
            print_success "포트 11434/tcp 방화벽 규칙 설정됨"
            ((TESTS_PASSED++))
        else
            print_error "포트 11434/tcp 방화벽 규칙 없음"
            ((TESTS_FAILED++))
            echo "설정 방법: sudo firewall-cmd --permanent --add-port=11434/tcp && sudo firewall-cmd --reload"
        fi
    else
        print_info "firewalld가 실행 중이지 않습니다"
    fi
}

get_server_ip() {
    # 서버 IP 확인 (여러 방법 시도)
    local ip=""
    
    # 1. 공인 IP 확인
    ip=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "")
    
    if [ -n "$ip" ]; then
        echo "$ip"
    else
        # 2. 로컬 IP 확인
        ip=$(hostname -I | awk '{print $1}')
        echo "$ip"
    fi
}

show_summary() {
    local server_ip=$(get_server_ip)
    
    echo ""
    echo "=========================================="
    echo "검증 결과 요약"
    echo "=========================================="
    echo ""
    echo "통과: ${GREEN}${TESTS_PASSED}${NC}"
    echo "실패: ${RED}${TESTS_FAILED}${NC}"
    echo ""
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}✓ 모든 테스트 통과!${NC}"
        echo ""
        echo "서버 준비 완료. 다음 단계를 진행하세요:"
        echo ""
        echo "1️⃣ 로컬에서 서버 API 테스트:"
        echo "   curl http://${server_ip}:8000/health"
        echo "   curl http://${server_ip}:11434/api/tags"
        echo ""
        echo "2️⃣ Vercel 환경 변수 설정:"
        echo "   NUXT_WHISPER_API_URL=http://${server_ip}:8000"
        echo "   NUXT_OLLAMA_HOST=http://${server_ip}:11434"
        echo "   NUXT_OLLAMA_MODEL=gemma3"
        echo ""
        echo "3️⃣ Vercel 배포:"
        echo "   cd /path/to/your/project"
        echo "   vercel env add NUXT_WHISPER_API_URL"
        echo "   vercel env add NUXT_OLLAMA_HOST"
        echo "   vercel env add NUXT_OLLAMA_MODEL"
        echo "   vercel --prod"
        echo ""
    else
        echo -e "${RED}✗ 일부 테스트 실패${NC}"
        echo ""
        echo "문제 해결 방법:"
        echo ""
        echo "서비스 재시작:"
        echo "  sudo systemctl restart whisper.service"
        echo "  sudo systemctl restart ollama.service"
        echo ""
        echo "로그 확인:"
        echo "  sudo tail -f /var/log/whisper.log"
        echo "  sudo tail -f /var/log/whisper-error.log"
        echo "  sudo journalctl -u ollama.service -f"
        echo ""
        echo "재배포:"
        echo "  cd ~/stt/scripts"
        echo "  ./deploy-to-server.sh"
        echo "  ./setup-ollama.sh"
        echo "  ./setup-firewall.sh"
        echo ""
    fi
    
    echo "주의: Oracle Cloud 콘솔의 Security List에서도"
    echo "      포트 8000, 11434가 열려있는지 확인하세요!"
    echo ""
}

main() {
    echo ""
    echo "=========================================="
    echo "서비스 검증"
    echo "=========================================="
    echo ""
    
    check_systemd_services
    echo ""
    
    check_ports
    echo ""
    
    test_whisper_api
    echo ""
    
    test_ollama_api
    echo ""
    
    check_external_access
    echo ""
    
    check_firewall
    
    show_summary
}

main
