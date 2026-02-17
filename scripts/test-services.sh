#!/bin/bash

############################################
# Oracle Cloud 서비스 통합 테스트 스크립트
############################################

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 설정
ORACLE_IP="${ORACLE_IP:-}"
WHISPER_PORT="${WHISPER_PORT:-8000}"
OLLAMA_PORT="${OLLAMA_PORT:-11434}"

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

check_ip() {
    if [ -z "$ORACLE_IP" ]; then
        print_error "ORACLE_IP가 설정되지 않았습니다."
        echo "사용법: ORACLE_IP=123.45.67.89 ./test-services.sh"
        exit 1
    fi
}

test_whisper_health() {
    print_header "Whisper 서버 헬스 체크"
    
    local url="http://${ORACLE_IP}:${WHISPER_PORT}/health"
    
    if response=$(curl -s -w "\n%{http_code}" "$url" 2>&1); then
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | sed '$d')
        
        if [ "$http_code" = "200" ]; then
            print_success "Whisper 서버 정상 작동"
            echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
            return 0
        else
            print_error "HTTP $http_code 응답"
            echo "$body"
            return 1
        fi
    else
        print_error "연결 실패"
        return 1
    fi
}

test_whisper_transcription() {
    print_header "Whisper 음성 변환 테스트"
    
    # 테스트 오디오 파일이 있는지 확인
    local test_file="test-audio.wav"
    
    if [ ! -f "$test_file" ]; then
        print_info "테스트 오디오 파일이 없습니다. 스킵합니다."
        echo "테스트하려면 test-audio.wav 파일을 준비하세요."
        return 0
    fi
    
    local url="http://${ORACLE_IP}:${WHISPER_PORT}/v1/audio/transcriptions"
    
    print_info "음성 변환 요청 중... (시간이 걸릴 수 있습니다)"
    
    if response=$(curl -s -w "\n%{http_code}" -X POST "$url" \
        -F "file=@${test_file}" \
        -F "model=whisper-1" 2>&1); then
        
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | sed '$d')
        
        if [ "$http_code" = "200" ]; then
            print_success "음성 변환 성공"
            echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
            return 0
        else
            print_error "HTTP $http_code 응답"
            echo "$body"
            return 1
        fi
    else
        print_error "연결 실패"
        return 1
    fi
}

test_ollama_health() {
    print_header "Ollama 서버 헬스 체크"
    
    local url="http://${ORACLE_IP}:${OLLAMA_PORT}/api/tags"
    
    if response=$(curl -s -w "\n%{http_code}" "$url" 2>&1); then
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | sed '$d')
        
        if [ "$http_code" = "200" ]; then
            print_success "Ollama 서버 정상 작동"
            echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
            return 0
        else
            print_error "HTTP $http_code 응답"
            echo "$body"
            return 1
        fi
    else
        print_error "연결 실패"
        return 1
    fi
}

test_ollama_generation() {
    print_header "Ollama 텍스트 생성 테스트"
    
    local url="http://${ORACLE_IP}:${OLLAMA_PORT}/api/generate"
    
    print_info "텍스트 생성 요청 중... (시간이 걸릴 수 있습니다)"
    
    local payload='{
        "model": "gemma3",
        "prompt": "Hello, how are you?",
        "stream": false
    }'
    
    if response=$(curl -s -w "\n%{http_code}" -X POST "$url" \
        -H "Content-Type: application/json" \
        -d "$payload" 2>&1); then
        
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | sed '$d')
        
        if [ "$http_code" = "200" ]; then
            print_success "텍스트 생성 성공"
            echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
            return 0
        else
            print_error "HTTP $http_code 응답"
            echo "$body"
            return 1
        fi
    else
        print_error "연결 실패"
        return 1
    fi
}

test_network_connectivity() {
    print_header "네트워크 연결 테스트"
    
    # Ping 테스트
    if ping -c 3 "$ORACLE_IP" > /dev/null 2>&1; then
        print_success "Ping 성공"
    else
        print_error "Ping 실패"
    fi
    
    # 포트 연결 테스트
    print_info "Whisper 포트 (${WHISPER_PORT}) 확인 중..."
    if nc -z -w5 "$ORACLE_IP" "$WHISPER_PORT" 2>/dev/null; then
        print_success "포트 ${WHISPER_PORT} 열림"
    else
        print_error "포트 ${WHISPER_PORT} 닫힘 또는 연결 불가"
    fi
    
    print_info "Ollama 포트 (${OLLAMA_PORT}) 확인 중..."
    if nc -z -w5 "$ORACLE_IP" "$OLLAMA_PORT" 2>/dev/null; then
        print_success "포트 ${OLLAMA_PORT} 열림"
    else
        print_error "포트 ${OLLAMA_PORT} 닫힘 또는 연결 불가"
    fi
}

show_summary() {
    echo ""
    print_header "테스트 요약"
    echo ""
    echo "Oracle IP: $ORACLE_IP"
    echo "Whisper URL: http://${ORACLE_IP}:${WHISPER_PORT}"
    echo "Ollama URL: http://${ORACLE_IP}:${OLLAMA_PORT}"
    echo ""
    echo "다음 단계:"
    echo "1. .env 파일에 위 URL 설정"
    echo "2. Vercel 환경 변수에 URL 등록"
    echo "3. 로컬에서 앱 테스트: npm run dev"
    echo "4. Vercel 배포: vercel --prod"
    echo ""
}

main() {
    echo ""
    print_header "Oracle Cloud 서비스 통합 테스트"
    echo ""
    
    check_ip
    
    # 모든 테스트 실행
    test_network_connectivity
    echo ""
    
    test_whisper_health
    echo ""
    
    test_whisper_transcription
    echo ""
    
    test_ollama_health
    echo ""
    
    test_ollama_generation
    echo ""
    
    show_summary
}

main
