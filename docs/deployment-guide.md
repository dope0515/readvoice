# 완전 배포 가이드

Oracle Cloud (Rocky Linux) + Vercel 환경에서 STT 프로젝트를 배포하는 완전한 가이드입니다.

## 목차

1. [개요](#개요)
2. [전제 조건](#전제-조건)
3. [서버 배포 (Oracle Cloud)](#서버-배포-oracle-cloud)
4. [Vercel 배포](#vercel-배포)
5. [테스트 및 검증](#테스트-및-검증)
6. [문제 해결](#문제-해결)

## 개요

### 배포 아키텍처

```
[사용자] 
   ↓
[Vercel - Nuxt 앱]
   ↓
[Oracle Cloud - Rocky Linux]
   ├─ Whisper 서버 (포트 8000)
   └─ Ollama 서버 (포트 11434)
```

### 구성 요소

- **Vercel**: Nuxt 3 프론트엔드 + API Routes
- **Oracle Cloud**: Whisper STT + Ollama LLM (백엔드)
- **서버 OS**: Rocky Linux
- **서비스 관리**: systemd

## 전제 조건

### 서버 측

✅ Oracle Cloud 계정 및 인스턴스 생성 완료  
✅ SSH 키로 서버 접속 가능  
✅ 레포지토리가 서버에 다운로드됨 (`~/stt`)  
✅ Ollama 설치 완료

### 로컬 측

✅ SSH 키 파일 (`~/Downloads/ssh-key-2026-02-03.key`)  
✅ Vercel CLI 설치 (`npm install -g vercel`)  
✅ Git 레포지토리 클론 완료

### 필요한 정보

- 서버 IP: `144.24.65.251`
- 서버 사용자: `rocky`
- SSH 키 경로: `~/Downloads/ssh-key-2026-02-03.key`

## 서버 배포 (Oracle Cloud)

### 1단계: 서버 접속

```bash
ssh -i ~/Downloads/ssh-key-2026-02-03.key rocky@144.24.65.251
```

### 2단계: 프로젝트 디렉토리 확인

```bash
cd ~/stt
ls -la
```

레포지토리가 없다면:
```bash
git clone <your-repo-url> ~/stt
cd ~/stt
```

### 3단계: 스크립트 실행 권한 부여

```bash
cd ~/stt/scripts
chmod +x *.sh
```

### 4단계: Whisper 서버 배포

```bash
./deploy-to-server.sh
```

이 스크립트는 다음을 자동으로 수행합니다:
- ✅ Python 가상환경 생성
- ✅ 의존성 설치 (Whisper, FastAPI 등)
- ✅ 환경 변수 설정
- ✅ Systemd 서비스 등록
- ✅ 서비스 시작
- ✅ 방화벽 포트 오픈 (8000)

**예상 소요 시간**: 10-15분 (첫 설치 시 Whisper 모델 다운로드 포함)

### 5단계: Ollama 설정

```bash
./setup-ollama.sh
```

이 스크립트는 다음을 수행합니다:
- ✅ Ollama 외부 접속 허용 (0.0.0.0:11434)
- ✅ Systemd 서비스 재시작
- ✅ 방화벽 포트 오픈 (11434)
- ✅ 설치된 모델 확인

모델이 없다면 다운로드:
```bash
ollama pull gemma3
```

**예상 소요 시간**: 2-3분 (모델 다운로드 제외)

### 6단계: 방화벽 설정 (선택사항)

이미 `deploy-to-server.sh`와 `setup-ollama.sh`에서 자동으로 설정되지만, 수동으로 확인하려면:

```bash
./setup-firewall.sh
```

### 7단계: 서비스 검증

```bash
./verify-services.sh
```

이 스크립트는 다음을 확인합니다:
- ✅ Systemd 서비스 상태
- ✅ 포트 연결 테스트
- ✅ API 헬스 체크
- ✅ 외부 접속 설정
- ✅ 방화벽 규칙

**모든 테스트가 통과해야 합니다!**

### 8단계: 로컬에서 서버 API 테스트

서버에서 로그아웃 후, 로컬 터미널에서:

```bash
# Whisper 헬스 체크
curl http://144.24.65.251:8000/health

# Ollama 헬스 체크
curl http://144.24.65.251:11434/api/tags
```

성공적인 응답을 받아야 합니다!

## Vercel 배포

### 1단계: Vercel 로그인

```bash
cd /Users/seungjoopark/Documents/GitHub/stt
vercel login
```

### 2단계: 환경 변수 설정

#### Production 환경 변수 추가:

```bash
# Whisper API URL
vercel env add NUXT_WHISPER_API_URL production
# 입력: http://144.24.65.251:8000

# Ollama Host
vercel env add NUXT_OLLAMA_HOST production
# 입력: http://144.24.65.251:11434

# Ollama Model
vercel env add NUXT_OLLAMA_MODEL production
# 입력: gemma3
```

#### Preview 환경 변수 추가 (선택사항):

```bash
vercel env add NUXT_WHISPER_API_URL preview
# 입력: http://144.24.65.251:8000

vercel env add NUXT_OLLAMA_HOST preview
# 입력: http://144.24.65.251:11434

vercel env add NUXT_OLLAMA_MODEL preview
# 입력: gemma3
```

#### Development 환경 변수 추가 (선택사항):

```bash
vercel env add NUXT_WHISPER_API_URL development
# 입력: http://localhost:8000

vercel env add NUXT_OLLAMA_HOST development
# 입력: http://localhost:11434

vercel env add NUXT_OLLAMA_MODEL development
# 입력: gemma3
```

### 3단계: Vercel 배포

```bash
vercel --prod
```

배포가 완료되면 Vercel URL이 표시됩니다:
```
https://your-project.vercel.app
```

## 테스트 및 검증

### 1단계: Vercel 앱 접속

브라우저에서 Vercel URL을 엽니다:
```
https://your-project.vercel.app
```

### 2단계: 파일 업로드 STT 테스트

1. "파일 업로드" 탭 선택
2. 오디오 파일 업로드 (WAV, MP3 등)
3. "텍스트로 변환" 버튼 클릭
4. 변환 결과 확인

### 3단계: 실시간 음성 인식 테스트

1. "실시간 음성 인식" 탭 선택
2. 마이크 버튼 클릭
3. 말하기
4. 다시 클릭하여 중지
5. 변환 결과 확인

### 4단계: AI 요약 테스트

1. STT 변환 완료 후
2. "요약하기" 버튼 클릭
3. 요약 결과 확인 (3-5개 포인트)

### 5단계: 서버 로그 확인

문제가 있다면 서버 로그를 확인:

```bash
# SSH 접속
ssh -i ~/Downloads/ssh-key-2026-02-03.key rocky@144.24.65.251

# Whisper 로그
sudo tail -f /var/log/whisper.log
sudo tail -f /var/log/whisper-error.log

# Ollama 로그
sudo journalctl -u ollama.service -f
```

## 문제 해결

### Whisper 서비스가 시작되지 않음

```bash
# 서비스 상태 확인
sudo systemctl status whisper.service

# 에러 로그 확인
sudo tail -50 /var/log/whisper-error.log

# 수동 실행으로 에러 확인
cd ~/stt/whisper-server
source venv/bin/activate
python server.py
```

일반적인 문제:
- Python 의존성 누락: `pip install -r requirements.txt`
- ffmpeg 미설치: `sudo dnf install -y ffmpeg`
- 메모리 부족: 더 작은 모델 사용 (`tiny` 또는 `base`)

### Ollama 서비스가 시작되지 않음

```bash
# 서비스 상태 확인
sudo systemctl status ollama.service

# 로그 확인
sudo journalctl -u ollama.service -n 50

# 수동 실행
ollama serve
```

일반적인 문제:
- Ollama 미설치: `curl -fsSL https://ollama.com/install.sh | sh`
- 외부 접속 설정 누락: `./setup-ollama.sh` 실행

### 외부에서 서버 접속 불가

```bash
# 서버 내부에서 테스트
curl http://localhost:8000/health
curl http://localhost:11434/api/tags

# 방화벽 확인
sudo firewall-cmd --list-ports

# 포트 추가 (필요시)
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --permanent --add-port=11434/tcp
sudo firewall-cmd --reload
```

**중요**: Oracle Cloud 콘솔에서 Security List 확인!
- Ingress Rules에서 포트 8000, 11434가 열려있어야 합니다.

### Vercel 배포에서 API 호출 실패

1. **환경 변수 확인**:
   ```bash
   vercel env ls
   ```

2. **올바른 URL 형식 확인**:
   - ✅ `http://144.24.65.251:8000`
   - ❌ `http://144.24.65.251:8000/`
   - ❌ `https://144.24.65.251:8000`

3. **서버 IP 확인**:
   ```bash
   # 서버에서 실행
   curl ifconfig.me
   ```

4. **CORS 설정 확인**:
   `whisper-server/server.py`의 CORS 설정에 Vercel 도메인이 포함되어 있는지 확인

### 메모리 부족

Whisper 모델이 너무 크다면:

```bash
# .env 파일 수정
sudo nano ~/stt/whisper-server/.env

# WHISPER_MODEL을 tiny 또는 base로 변경
WHISPER_MODEL=tiny

# 서비스 재시작
sudo systemctl restart whisper.service
```

모델 크기 비교:
- `tiny`: 39M, 가장 빠름, 정확도 낮음
- `base`: 74M, 빠름, 적절한 정확도 (권장)
- `small`: 244M, 중간, 좋은 정확도
- `medium`: 769M, 느림, 높은 정확도

## 유지보수

### 서비스 관리

```bash
# 상태 확인
sudo systemctl status whisper.service
sudo systemctl status ollama.service

# 시작/중지/재시작
sudo systemctl start whisper.service
sudo systemctl stop whisper.service
sudo systemctl restart whisper.service

# 로그 확인
sudo tail -f /var/log/whisper.log
sudo journalctl -u ollama.service -f
```

### 코드 업데이트

```bash
# 서버에서
cd ~/stt
git pull

# Whisper 서버 재배포
cd ~/stt/scripts
./deploy-to-server.sh

# Vercel 재배포 (로컬에서)
cd /Users/seungjoopark/Documents/GitHub/stt
git push
# Vercel이 자동으로 배포합니다
```

### 모델 변경

```bash
# Ollama 모델 다운로드
ollama pull qwen2.5:7b

# Vercel 환경 변수 업데이트
vercel env add NUXT_OLLAMA_MODEL production
# 입력: qwen2.5:7b

# Vercel 재배포
vercel --prod
```

## 참고 자료

### 생성된 스크립트

- `scripts/deploy-to-server.sh` - Whisper 서버 배포
- `scripts/setup-ollama.sh` - Ollama 설정
- `scripts/setup-firewall.sh` - 방화벽 설정
- `scripts/verify-services.sh` - 서비스 검증

### 기존 문서

- [README.md](../README.md) - 프로젝트 개요
- [Oracle Cloud 배포 가이드](oracle-cloud-setup.md) - 상세 설정
- [Vercel 배포 가이드](vercel-deployment.md) - Vercel 설정
- [Whisper 서버 가이드](../whisper-server/README.md) - Whisper 설정

### 외부 링크

- [Ollama 문서](https://ollama.com/docs)
- [Vercel 문서](https://vercel.com/docs)
- [Oracle Cloud 문서](https://docs.oracle.com/en-us/iaas/Content/home.htm)
- [Nuxt 3 문서](https://nuxt.com/docs)

## 요약

### 서버 배포 단계 (Oracle Cloud)

```bash
# 1. SSH 접속
ssh -i ~/Downloads/ssh-key-2026-02-03.key rocky@144.24.65.251

# 2. 스크립트 실행
cd ~/stt/scripts
chmod +x *.sh
./deploy-to-server.sh
./setup-ollama.sh
./verify-services.sh

# 3. 로그아웃
exit
```

### Vercel 배포 단계 (로컬)

```bash
# 1. 환경 변수 설정
vercel env add NUXT_WHISPER_API_URL production
vercel env add NUXT_OLLAMA_HOST production
vercel env add NUXT_OLLAMA_MODEL production

# 2. 배포
vercel --prod
```

### 확인 사항

✅ Whisper 서버: http://144.24.65.251:8000/health  
✅ Ollama 서버: http://144.24.65.251:11434/api/tags  
✅ Vercel 앱: https://your-project.vercel.app  
✅ Oracle Cloud Security List: 포트 8000, 11434 열림

**배포 완료! 🎉**
