#!/bin/bash

#############################################
# Oracle Cloud Whisper 서버 배포 스크립트
#############################################

set -e  # 에러 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 설정 (여기를 수정하세요)
ORACLE_IP="${ORACLE_IP:-}"  # 환경변수 또는 여기에 직접 입력
ORACLE_USER="${ORACLE_USER:-ubuntu}"
SSH_KEY="${SSH_KEY:-~/.ssh/id_rsa}"
REMOTE_DIR="/home/${ORACLE_USER}/whisper-server"

# 함수 정의
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

check_requirements() {
    print_info "필수 요구사항 확인 중..."
    
    # Oracle IP 확인
    if [ -z "$ORACLE_IP" ]; then
        print_error "ORACLE_IP가 설정되지 않았습니다."
        echo "사용법: ORACLE_IP=123.45.67.89 ./deploy-oracle.sh"
        echo "또는 스크립트 내부의 ORACLE_IP 변수를 수정하세요."
        exit 1
    fi
    
    # SSH 키 확인
    if [ ! -f "$SSH_KEY" ]; then
        print_error "SSH 키를 찾을 수 없습니다: $SSH_KEY"
        exit 1
    fi
    
    # whisper-server 폴더 확인
    if [ ! -d "../whisper-server" ]; then
        print_error "whisper-server 폴더를 찾을 수 없습니다."
        exit 1
    fi
    
    print_success "모든 요구사항 확인 완료"
}

test_connection() {
    print_info "Oracle Cloud 연결 테스트 중..."
    
    if ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no \
        "${ORACLE_USER}@${ORACLE_IP}" "echo 'Connection successful'" > /dev/null 2>&1; then
        print_success "연결 성공"
    else
        print_error "연결 실패. SSH 키와 IP 주소를 확인하세요."
        exit 1
    fi
}

upload_files() {
    print_info "Whisper 서버 파일 업로드 중..."
    
    # 기존 디렉토리 백업 (있다면)
    ssh -i "$SSH_KEY" "${ORACLE_USER}@${ORACLE_IP}" \
        "if [ -d ${REMOTE_DIR} ]; then mv ${REMOTE_DIR} ${REMOTE_DIR}.backup.\$(date +%Y%m%d_%H%M%S); fi"
    
    # 파일 업로드
    scp -i "$SSH_KEY" -r ../whisper-server "${ORACLE_USER}@${ORACLE_IP}:/home/${ORACLE_USER}/"
    
    print_success "파일 업로드 완료"
}

install_dependencies() {
    print_info "서버에서 의존성 설치 중..."
    
    ssh -i "$SSH_KEY" "${ORACLE_USER}@${ORACLE_IP}" << 'ENDSSH'
        set -e
        cd ~/whisper-server
        
        # 시스템 패키지 업데이트 (처음 배포 시에만)
        if [ ! -d "venv" ]; then
            echo "시스템 패키지 설치 중..."
            sudo apt update
            sudo apt install -y python3 python3-pip python3-venv ffmpeg
        fi
        
        # 가상환경 생성 (없다면)
        if [ ! -d "venv" ]; then
            echo "Python 가상환경 생성 중..."
            python3 -m venv venv
        fi
        
        # 의존성 설치
        echo "Python 패키지 설치 중..."
        source venv/bin/activate
        pip install --upgrade pip
        pip install -r requirements.txt
        
        echo "의존성 설치 완료!"
ENDSSH
    
    print_success "의존성 설치 완료"
}

setup_environment() {
    print_info "환경 변수 설정 중..."
    
    ssh -i "$SSH_KEY" "${ORACLE_USER}@${ORACLE_IP}" << 'ENDSSH'
        cd ~/whisper-server
        
        # .env 파일 생성 (없다면)
        if [ ! -f ".env" ]; then
            echo "WHISPER_MODEL=base" > .env
            echo "PORT=8000" >> .env
            echo "HOST=0.0.0.0" >> .env
            echo ".env 파일 생성됨"
        else
            echo ".env 파일이 이미 존재합니다 (유지됨)"
        fi
ENDSSH
    
    print_success "환경 변수 설정 완료"
}

setup_systemd() {
    print_info "Systemd 서비스 설정 중..."
    
    # systemd 서비스 파일 생성
    ssh -i "$SSH_KEY" "${ORACLE_USER}@${ORACLE_IP}" << ENDSSH
        # 서비스 파일이 이미 있는지 확인
        if [ -f "/etc/systemd/system/whisper.service" ]; then
            echo "Systemd 서비스가 이미 존재합니다 (재시작만 수행)"
        else
            echo "Systemd 서비스 생성 중..."
            
            # 로그 파일 생성
            sudo touch /var/log/whisper.log
            sudo touch /var/log/whisper-error.log
            sudo chown ${ORACLE_USER}:${ORACLE_USER} /var/log/whisper*.log
            
            # 서비스 파일 생성
            sudo tee /etc/systemd/system/whisper.service > /dev/null << 'EOF'
[Unit]
Description=Whisper STT Server
After=network.target

[Service]
Type=simple
User=${ORACLE_USER}
WorkingDirectory=${REMOTE_DIR}
Environment="PATH=${REMOTE_DIR}/venv/bin"
Environment="WHISPER_MODEL=base"
Environment="PORT=8000"
Environment="HOST=0.0.0.0"
ExecStart=${REMOTE_DIR}/venv/bin/python server.py
Restart=always
RestartSec=10
StandardOutput=append:/var/log/whisper.log
StandardError=append:/var/log/whisper-error.log

[Install]
WantedBy=multi-user.target
EOF
            
            sudo systemctl daemon-reload
            sudo systemctl enable whisper.service
            echo "Systemd 서비스 생성 완료"
        fi
ENDSSH
    
    print_success "Systemd 서비스 설정 완료"
}

restart_service() {
    print_info "Whisper 서비스 재시작 중..."
    
    ssh -i "$SSH_KEY" "${ORACLE_USER}@${ORACLE_IP}" << 'ENDSSH'
        sudo systemctl restart whisper.service
        sleep 3
        
        # 서비스 상태 확인
        if sudo systemctl is-active --quiet whisper.service; then
            echo "서비스 실행 중 ✓"
        else
            echo "서비스 시작 실패 ✗"
            sudo systemctl status whisper.service
            exit 1
        fi
ENDSSH
    
    print_success "서비스 재시작 완료"
}

verify_deployment() {
    print_info "배포 확인 중..."
    
    sleep 5  # 서버가 완전히 시작될 때까지 대기
    
    # 헬스 체크
    if curl -s "http://${ORACLE_IP}:8000/health" > /dev/null 2>&1; then
        print_success "Whisper 서버 정상 작동 중"
        echo ""
        curl -s "http://${ORACLE_IP}:8000/health" | python3 -m json.tool || echo "응답 확인 불가"
    else
        print_error "Whisper 서버 응답 없음"
        echo "서버 로그를 확인하세요:"
        echo "  ssh -i $SSH_KEY ${ORACLE_USER}@${ORACLE_IP} 'sudo tail -f /var/log/whisper.log'"
        exit 1
    fi
}

show_info() {
    echo ""
    echo "=========================================="
    echo "배포 완료!"
    echo "=========================================="
    echo ""
    echo "Whisper 서버 URL: http://${ORACLE_IP}:8000"
    echo "헬스 체크: http://${ORACLE_IP}:8000/health"
    echo ""
    echo "유용한 명령어:"
    echo "  서비스 상태: ssh -i $SSH_KEY ${ORACLE_USER}@${ORACLE_IP} 'sudo systemctl status whisper.service'"
    echo "  로그 확인: ssh -i $SSH_KEY ${ORACLE_USER}@${ORACLE_IP} 'sudo tail -f /var/log/whisper.log'"
    echo "  서비스 재시작: ssh -i $SSH_KEY ${ORACLE_USER}@${ORACLE_IP} 'sudo systemctl restart whisper.service'"
    echo ""
}

# 메인 실행
main() {
    echo ""
    echo "=========================================="
    echo "Oracle Cloud Whisper 서버 배포"
    echo "=========================================="
    echo ""
    
    check_requirements
    test_connection
    upload_files
    install_dependencies
    setup_environment
    setup_systemd
    restart_service
    verify_deployment
    show_info
}

# 스크립트 실행
main
