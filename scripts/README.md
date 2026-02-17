# 배포 스크립트

Oracle Cloud (Rocky Linux) 배포를 자동화하는 스크립트 모음입니다.

## 빠른 시작

### 서버에서 실행 (SSH 접속 후)

```bash
# 1. 프로젝트 디렉토리로 이동
cd ~/stt/scripts

# 2. 실행 권한 부여
chmod +x *.sh

# 3. 배포 스크립트 실행 (순서대로)
./deploy-to-server.sh    # Whisper 서버 배포
./setup-ollama.sh         # Ollama 외부 접속 설정
./setup-firewall.sh       # 방화벽 설정 (선택사항)
./verify-services.sh      # 서비스 검증
```

## 스크립트 목록

### 신규 스크립트 (Rocky Linux 전용)

#### 1. `deploy-to-server.sh` ⭐ 추천
서버에서 직접 실행하는 Whisper 배포 스크립트입니다.

**사용법:**
```bash
# SSH 접속 후
cd ~/stt/scripts
chmod +x deploy-to-server.sh
./deploy-to-server.sh
```

**수행 작업:**
- ✅ 시스템 패키지 설치 (Python, ffmpeg)
- ✅ Python 가상환경 생성
- ✅ 의존성 설치
- ✅ 환경 변수 설정
- ✅ Systemd 서비스 등록
- ✅ 방화벽 포트 오픈 (8000)
- ✅ 서비스 시작 및 검증

#### 2. `setup-ollama.sh` ⭐ 추천
Ollama를 외부 접속 가능하도록 설정합니다.

**사용법:**
```bash
cd ~/stt/scripts
chmod +x setup-ollama.sh
./setup-ollama.sh
```

**수행 작업:**
- ✅ Ollama 설치 확인
- ✅ 외부 접속 허용 (0.0.0.0:11434)
- ✅ Systemd 서비스 재시작
- ✅ 방화벽 포트 오픈 (11434)
- ✅ 모델 확인

#### 3. `setup-firewall.sh`
방화벽 설정을 관리합니다 (Rocky Linux firewalld).

**사용법:**
```bash
cd ~/stt/scripts
chmod +x setup-firewall.sh
./setup-firewall.sh
```

**수행 작업:**
- ✅ firewalld 상태 확인
- ✅ 포트 8000/tcp 오픈
- ✅ 포트 11434/tcp 오픈
- ✅ 방화벽 규칙 적용

#### 4. `verify-services.sh` ⭐ 추천
배포 완료 후 모든 서비스가 정상 작동하는지 검증합니다.

**사용법:**
```bash
cd ~/stt/scripts
chmod +x verify-services.sh
./verify-services.sh
```

**테스트 항목:**
- ✅ Systemd 서비스 상태
- ✅ 포트 연결 테스트
- ✅ Whisper API 헬스 체크
- ✅ Ollama API 헬스 체크
- ✅ 외부 접속 설정 확인
- ✅ 방화벽 규칙 확인

### 기존 스크립트 (Ubuntu 기반)

#### `deploy-oracle.sh`
로컬에서 실행하여 Oracle Cloud (Ubuntu)에 Whisper 서버를 배포하는 스크립트입니다.

**사용법:**
```bash
# 실행 권한 부여
chmod +x scripts/deploy-oracle.sh

# 배포 실행
ORACLE_IP=123.45.67.89 ./scripts/deploy-oracle.sh
```

**환경 변수:**
- `ORACLE_IP` (필수): Oracle Cloud 인스턴스 IP 주소
- `ORACLE_USER` (옵션): SSH 사용자명 (기본값: ubuntu)
- `SSH_KEY` (옵션): SSH 키 경로 (기본값: ~/.ssh/id_rsa)

**수행 작업:**
1. Oracle Cloud 연결 확인
2. whisper-server 파일 업로드
3. Python 의존성 설치
4. 환경 변수 설정
5. Systemd 서비스 등록
6. 서비스 시작 및 확인

### 2. `setup-systemd.sh`
Oracle Cloud 인스턴스 내부에서 실행하여 Whisper와 Ollama를 Systemd 서비스로 등록합니다.

**사용법:**
```bash
# Oracle Cloud SSH 접속 후
cd ~/whisper-server
chmod +x ../scripts/setup-systemd.sh
../scripts/setup-systemd.sh
```

**수행 작업:**
1. Whisper Systemd 서비스 생성
2. Ollama Systemd 서비스 설정
3. 로그 로테이션 설정
4. 서비스 시작 및 확인

### 3. `test-services.sh`
배포된 서비스들이 정상 작동하는지 테스트합니다.

**사용법:**
```bash
# 실행 권한 부여
chmod +x scripts/test-services.sh

# 테스트 실행
ORACLE_IP=123.45.67.89 ./scripts/test-services.sh
```

**테스트 항목:**
1. 네트워크 연결 확인
2. Whisper 헬스 체크
3. Whisper 음성 변환 테스트 (선택)
4. Ollama 헬스 체크
5. Ollama 텍스트 생성 테스트

## 전체 배포 프로세스

### Rocky Linux 서버 배포 (권장)

#### 1단계: SSH 접속

```bash
ssh -i ~/Downloads/ssh-key-2026-02-03.key rocky@144.24.65.251
```

#### 2단계: 스크립트 실행

```bash
cd ~/stt/scripts
chmod +x *.sh

# Whisper 배포 (자동)
./deploy-to-server.sh

# Ollama 설정 (자동)
./setup-ollama.sh

# 검증 (필수)
./verify-services.sh
```

#### 3단계: 로컬에서 테스트

```bash
# 서버에서 로그아웃 후
curl http://144.24.65.251:8000/health
curl http://144.24.65.251:11434/api/tags
```

#### 4단계: Vercel 배포

```bash
cd /path/to/your/project

# 환경 변수 설정
vercel env add NUXT_WHISPER_API_URL production
# 입력: http://144.24.65.251:8000

vercel env add NUXT_OLLAMA_HOST production
# 입력: http://144.24.65.251:11434

vercel env add NUXT_OLLAMA_MODEL production
# 입력: gemma3

# 배포
vercel --prod
```

### Ubuntu 서버 배포 (기존 방식)

#### 1단계: 로컬에서 배포 스크립트 실행

```bash
# 프로젝트 루트에서
cd scripts
chmod +x *.sh

# Oracle Cloud에 배포
ORACLE_IP=your-oracle-ip ./deploy-oracle.sh
```

#### 2단계: Ollama 설치 (Oracle Cloud에서)

```bash
# SSH 접속
ssh -i ~/.ssh/id_rsa ubuntu@your-oracle-ip

# Ollama 설치
curl -fsSL https://ollama.com/install.sh | sh

# 모델 다운로드
ollama pull gemma3

# Systemd 서비스 설정
cd ~/stt/scripts
./setup-systemd.sh
```

#### 3단계: 서비스 테스트 (로컬에서)

```bash
# 프로젝트 루트에서
ORACLE_IP=your-oracle-ip ./scripts/test-services.sh
```

## 문제 해결

### 스크립트 실행 권한 오류

```bash
chmod +x scripts/*.sh
```

### SSH 연결 실패

```bash
# SSH 키 확인
ls -la ~/.ssh/

# SSH 키 권한 수정
chmod 600 ~/.ssh/id_rsa

# SSH 연결 테스트
ssh -i ~/.ssh/id_rsa ubuntu@your-oracle-ip
```

### 서비스 시작 실패

```bash
# Oracle Cloud에서 로그 확인
sudo journalctl -u whisper.service -n 50
sudo tail -f /var/log/whisper-error.log

# 수동으로 서버 실행하여 에러 확인
cd ~/whisper-server
source venv/bin/activate
python server.py
```

## 유지보수

### 서버 업데이트

```bash
# 로컬에서 변경사항 푸시 후
ORACLE_IP=your-oracle-ip ./scripts/deploy-oracle.sh
```

### 서비스 재시작 (Oracle Cloud에서)

```bash
sudo systemctl restart whisper.service
sudo systemctl restart ollama.service
```

### 로그 확인

```bash
# Whisper 로그
sudo tail -f /var/log/whisper.log

# Ollama 로그
sudo journalctl -u ollama -f
```

## 참고 자료

- [Oracle Cloud 배포 가이드](../docs/oracle-cloud-setup.md)
- [Vercel 배포 가이드](../docs/vercel-deployment.md)
- [통합 테스트 가이드](../docs/testing-guide.md)
