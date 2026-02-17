# Oracle Cloud 배포 가이드

Oracle Cloud 무료 티어에 Whisper STT 서버와 Ollama를 배포하는 완전한 가이드입니다.

## 목차

1. [Oracle Cloud 인스턴스 생성](#1-oracle-cloud-인스턴스-생성)
2. [방화벽 및 보안 설정](#2-방화벽-및-보안-설정)
3. [Whisper 서버 배포](#3-whisper-서버-배포)
4. [Ollama 설치 및 설정](#4-ollama-설치-및-설정)
5. [Systemd 서비스 등록](#5-systemd-서비스-등록)
6. [HTTPS 설정 (선택사항)](#6-https-설정-선택사항)
7. [보안 강화](#7-보안-강화)
8. [모니터링 및 로그](#8-모니터링-및-로그)

## 1. Oracle Cloud 인스턴스 생성

### 1.1 계정 생성 및 로그인

1. [Oracle Cloud](https://www.oracle.com/cloud/free/)에서 무료 계정 생성
2. Always Free 티어 선택

### 1.2 Compute 인스턴스 생성

1. **메뉴** → **Compute** → **Instances** → **Create Instance**

2. **인스턴스 설정:**
   - **Name**: `whisper-server` (또는 원하는 이름)
   - **Compartment**: 기본값 유지
   - **Availability Domain**: 자동 선택

3. **이미지 및 Shape 선택:**
   - **Image**: `Ubuntu 22.04 LTS` (Canonical Ubuntu)
   - **Shape**: `VM.Standard.A1.Flex` (ARM) 또는 `VM.Standard.E2.1.Micro` (AMD)
   - **OCPU**: 2 (권장)
   - **Memory**: 12GB (권장, 무료 티어에서 최대 24GB 사용 가능)

4. **네트워킹:**
   - **VCN**: 기본 VCN 선택 또는 새로 생성
   - **Subnet**: Public Subnet 선택
   - **Public IP**: `Assign a public IPv4 address` 선택 ✅

5. **SSH 키 추가:**
   - 기존 SSH 키 업로드 또는 새로 생성
   - 생성된 키는 안전하게 보관 (로그인에 필요)

6. **부팅 볼륨:**
   - 크기: 50GB (무료 티어 기본값)

7. **Create** 버튼 클릭

### 1.3 인스턴스 정보 확인

생성 후 **Public IP Address** 확인 및 메모
```
예: 123.45.67.89
```

## 2. 방화벽 및 보안 설정

### 2.1 Oracle Cloud 보안 리스트 설정

1. **Networking** → **Virtual Cloud Networks** → VCN 선택
2. **Security Lists** → 기본 Security List 선택
3. **Ingress Rules** → **Add Ingress Rules**

**Whisper 서버용 규칙 추가:**
- **Source CIDR**: `0.0.0.0/0` (또는 특정 IP만 허용)
- **IP Protocol**: TCP
- **Destination Port Range**: `8000`
- **Description**: `Whisper STT Server`

**Ollama용 규칙 추가:**
- **Source CIDR**: `0.0.0.0/0`
- **IP Protocol**: TCP
- **Destination Port Range**: `11434`
- **Description**: `Ollama LLM Server`

**SSH 접속 (기본 설정 확인):**
- **Source CIDR**: `0.0.0.0/0` (보안을 위해 특정 IP로 제한 권장)
- **IP Protocol**: TCP
- **Destination Port Range**: `22`

### 2.2 Ubuntu 방화벽 (iptables) 설정

SSH로 인스턴스 접속 후:

```bash
# 현재 iptables 규칙 확인
sudo iptables -L

# 포트 8000 오픈 (Whisper)
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 8000 -j ACCEPT

# 포트 11434 오픈 (Ollama)
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 11434 -j ACCEPT

# 규칙 저장
sudo netfilter-persistent save
```

또는 UFW 사용:
```bash
sudo ufw allow 8000/tcp
sudo ufw allow 11434/tcp
sudo ufw enable
sudo ufw status
```

## 3. Whisper 서버 배포

### 3.1 SSH 접속

```bash
ssh -i ~/.ssh/your-key.pem ubuntu@your-oracle-ip
```

Windows (PuTTY 사용 시): PPK 형식으로 키 변환 필요

### 3.2 시스템 업데이트 및 필수 패키지 설치

```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# 필수 패키지 설치
sudo apt install -y python3 python3-pip python3-venv ffmpeg git curl

# Python 버전 확인
python3 --version  # 3.10 이상 권장
```

### 3.3 Whisper 서버 파일 업로드

**방법 1: SCP로 직접 업로드 (로컬에서 실행)**
```bash
# whisper-server 폴더 전체 업로드
cd /path/to/your/stt/project
scp -i ~/.ssh/your-key.pem -r whisper-server ubuntu@your-oracle-ip:/home/ubuntu/
```

**방법 2: Git 사용**
```bash
# 서버에서 실행
cd /home/ubuntu
git clone https://github.com/your-username/stt.git
cd stt/whisper-server
```

### 3.4 Python 가상환경 및 의존성 설치

```bash
cd /home/ubuntu/whisper-server

# 가상환경 생성
python3 -m venv venv

# 가상환경 활성화
source venv/bin/activate

# pip 업그레이드
pip install --upgrade pip

# 의존성 설치 (시간이 좀 걸립니다)
pip install -r requirements.txt
```

**중요**: 첫 설치 시 torch 등 대용량 패키지 다운로드로 10-20분 소요될 수 있습니다.

### 3.5 환경 변수 설정

```bash
# .env 파일 생성
cp .env.example .env
nano .env
```

`.env` 내용:
```bash
WHISPER_MODEL=base
PORT=8000
HOST=0.0.0.0
```

**모델 선택 팁:**
- 무료 티어 (2 vCPU, 12GB RAM): `base` 권장
- 더 빠른 처리: `tiny` (정확도 다소 낮음)
- 더 정확한 변환: `small` (느림, 메모리 많이 사용)

### 3.6 서버 테스트 실행

```bash
# 가상환경 활성화 확인
source venv/bin/activate

# 서버 실행
python server.py
```

**첫 실행 시**: Whisper 모델 자동 다운로드 (1-3GB, 5-10분 소요)

다른 터미널에서 테스트:
```bash
curl http://your-oracle-ip:8000/health
```

응답:
```json
{
  "status": "healthy",
  "model": "base",
  "model_loaded": true
}
```

성공하면 `Ctrl+C`로 서버 종료하고 다음 단계로 진행

## 4. Ollama 설치 및 설정

### 4.1 Ollama 설치

```bash
# Ollama 설치 스크립트 실행
curl -fsSL https://ollama.com/install.sh | sh
```

### 4.2 모델 다운로드

```bash
# gemma3 모델 다운로드 (권장, 4-6GB)
ollama pull gemma3
```

**다른 모델 옵션:**
```bash
# 더 작은 모델 (빠름)
ollama pull phi3

# 한국어 특화 모델
ollama pull qwen2.5:7b
```

모델 목록 확인:
```bash
ollama list
```

### 4.3 Ollama 서버 테스트

```bash
# Ollama 서비스 상태 확인
sudo systemctl status ollama

# API 테스트
curl http://localhost:11434/api/tags
```

## 5. Systemd 서비스 등록

### 5.1 Whisper 서비스 생성

```bash
sudo nano /etc/systemd/system/whisper.service
```

내용:
```ini
[Unit]
Description=Whisper STT Server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/whisper-server
Environment="PATH=/home/ubuntu/whisper-server/venv/bin"
Environment="WHISPER_MODEL=base"
Environment="PORT=8000"
Environment="HOST=0.0.0.0"
ExecStart=/home/ubuntu/whisper-server/venv/bin/python server.py
Restart=always
RestartSec=10
StandardOutput=append:/var/log/whisper.log
StandardError=append:/var/log/whisper-error.log

[Install]
WantedBy=multi-user.target
```

### 5.2 Ollama 서비스 설정

Ollama는 설치 시 자동으로 systemd 서비스로 등록됩니다.

외부 접속 허용을 위한 설정:
```bash
sudo nano /etc/systemd/system/ollama.service.d/override.conf
```

내용:
```ini
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
```

### 5.3 서비스 시작 및 활성화

```bash
# 로그 파일 생성
sudo touch /var/log/whisper.log
sudo touch /var/log/whisper-error.log
sudo chown ubuntu:ubuntu /var/log/whisper*.log

# systemd 데몬 리로드
sudo systemctl daemon-reload

# Whisper 서비스 시작
sudo systemctl enable whisper.service
sudo systemctl start whisper.service

# Ollama 서비스 재시작
sudo systemctl restart ollama.service
sudo systemctl enable ollama.service

# 서비스 상태 확인
sudo systemctl status whisper.service
sudo systemctl status ollama.service
```

### 5.4 서비스 동작 확인

```bash
# Whisper 서버 확인
curl http://localhost:8000/health

# Ollama 확인
curl http://localhost:11434/api/tags

# 외부에서 확인 (로컬 컴퓨터에서)
curl http://your-oracle-ip:8000/health
curl http://your-oracle-ip:11434/api/tags
```

## 6. HTTPS 설정 (선택사항)

프로덕션 환경에서는 HTTPS 사용을 강력히 권장합니다.

### 6.1 도메인 설정

도메인이 있는 경우:
1. DNS A 레코드 추가:
   - `whisper.yourdomain.com` → Oracle IP
   - `ollama.yourdomain.com` → Oracle IP

### 6.2 Caddy 서버 설치 (자동 HTTPS)

```bash
# Caddy 설치
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

### 6.3 Caddyfile 설정

```bash
sudo nano /etc/caddy/Caddyfile
```

내용:
```
whisper.yourdomain.com {
    reverse_proxy localhost:8000
}

ollama.yourdomain.com {
    reverse_proxy localhost:11434
}
```

### 6.4 Caddy 시작

```bash
sudo systemctl restart caddy
sudo systemctl enable caddy
```

Caddy가 자동으로 Let's Encrypt 인증서를 발급합니다!

이제 HTTPS로 접속 가능:
- `https://whisper.yourdomain.com/health`
- `https://ollama.yourdomain.com/api/tags`

## 7. 보안 강화

### 7.1 IP 제한 (권장)

특정 IP만 접속 허용 (Vercel IP 범위):

```bash
# Vercel IP 범위 확인
# https://vercel.com/docs/concepts/edge-network/regions

# iptables로 제한 (예시)
sudo iptables -A INPUT -p tcp --dport 8000 -s 76.76.21.0/24 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 8000 -j DROP
```

### 7.2 API 키 인증 (옵션)

`server.py`에 API 키 검증 추가:

```python
from fastapi import Header, HTTPException

API_KEY = os.getenv("API_KEY", "your-secret-key")

async def verify_api_key(x_api_key: str = Header(None)):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")
```

### 7.3 Rate Limiting

`requirements.txt`에 추가:
```
slowapi==0.1.9
```

`server.py`에 추가:
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/v1/audio/transcriptions")
@limiter.limit("10/minute")
async def transcribe_audio(...):
    ...
```

## 8. 모니터링 및 로그

### 8.1 로그 확인

```bash
# Whisper 서버 로그
sudo tail -f /var/log/whisper.log

# Whisper 에러 로그
sudo tail -f /var/log/whisper-error.log

# Ollama 로그
sudo journalctl -u ollama -f

# 시스템 리소스 모니터링
htop
```

### 8.2 디스크 공간 관리

```bash
# 디스크 사용량 확인
df -h

# Whisper 캐시 정리
rm -rf ~/.cache/whisper/
```

### 8.3 자동 로그 로테이션

```bash
sudo nano /etc/logrotate.d/whisper
```

내용:
```
/var/log/whisper*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}
```

## 문제 해결

### Whisper 서버가 시작되지 않음

```bash
# 서비스 상태 확인
sudo systemctl status whisper.service

# 에러 로그 확인
sudo journalctl -u whisper.service -n 50

# 수동 실행으로 에러 확인
cd /home/ubuntu/whisper-server
source venv/bin/activate
python server.py
```

### 메모리 부족

```bash
# 스왑 메모리 추가 (4GB)
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 영구 설정
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 포트 접근 불가

```bash
# 포트가 열려있는지 확인
sudo netstat -tlnp | grep 8000

# 방화벽 규칙 확인
sudo iptables -L -n

# Oracle Cloud 보안 리스트 다시 확인
```

## 유지보수

### 서버 업데이트

```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# Whisper 서버 코드 업데이트 (Git 사용 시)
cd /home/ubuntu/stt
git pull
cd whisper-server
source venv/bin/activate
pip install -r requirements.txt --upgrade

# 서비스 재시작
sudo systemctl restart whisper.service
```

### 모델 변경

```bash
# .env 파일 수정
sudo nano /home/ubuntu/whisper-server/.env

# WHISPER_MODEL을 변경 (tiny, base, small, medium, large)
# 저장 후 서비스 재시작
sudo systemctl restart whisper.service
```

## 다음 단계

Oracle Cloud 배포 완료 후:
1. ✅ Whisper 서버: `http://your-oracle-ip:8000`
2. ✅ Ollama 서버: `http://your-oracle-ip:11434`
3. 다음: [Vercel 배포](../README.md#vercel-배포)

## 참고 자료

- [Oracle Cloud 문서](https://docs.oracle.com/en-us/iaas/Content/home.htm)
- [Whisper GitHub](https://github.com/openai/whisper)
- [Ollama 문서](https://ollama.com/docs)
- [Caddy 문서](https://caddyserver.com/docs/)
