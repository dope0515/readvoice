# Whisper STT 서버

OpenAI Whisper를 사용한 음성-텍스트 변환 FastAPI 서버입니다.

## 주요 기능

- 🎯 **OpenAI API 호환**: OpenAI Whisper API와 동일한 엔드포인트 제공
- 🚀 **빠른 설정**: 간단한 설치와 실행
- 🌐 **CORS 지원**: Vercel 배포를 위한 CORS 설정 내장
- 📝 **다양한 출력 형식**: JSON, 텍스트, SRT, VTT 자막 지원
- 🔧 **환경 설정 가능**: 모델 크기 및 포트 설정 가능

## 시스템 요구사항

### 로컬 개발
- Python 3.8 이상
- ffmpeg
- 최소 4GB RAM (base 모델 기준)

### Oracle Cloud 배포
- Ubuntu 22.04 LTS
- 최소 2 vCPU, 8GB RAM (무료 티어 사용 가능)
- 50GB 스토리지

## 로컬 설치

### 1. ffmpeg 설치

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install -y ffmpeg
```

**Windows:**
[ffmpeg 다운로드](https://ffmpeg.org/download.html)에서 설치

### 2. Python 환경 설정

```bash
# whisper-server 폴더로 이동
cd whisper-server

# 가상환경 생성
python3 -m venv venv

# 가상환경 활성화
# macOS/Linux:
source venv/bin/activate
# Windows:
# venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt
```

### 3. 환경 변수 설정 (선택사항)

`.env` 파일 생성:

```bash
# Whisper 모델 크기 선택 (tiny, base, small, medium, large)
# 작을수록 빠르지만 정확도 낮음
WHISPER_MODEL=base

# 서버 포트
PORT=8000

# 서버 호스트
HOST=0.0.0.0
```

**모델 크기별 특징:**
- `tiny`: 39M 파라미터, 가장 빠름, 정확도 낮음
- `base`: 74M 파라미터, 빠름, 적절한 정확도 (권장)
- `small`: 244M 파라미터, 중간 속도, 좋은 정확도
- `medium`: 769M 파라미터, 느림, 높은 정확도
- `large`: 1550M 파라미터, 매우 느림, 최고 정확도

### 4. 서버 실행

```bash
python server.py
```

**첫 실행 시:**
- Whisper 모델이 자동으로 다운로드됩니다 (1-3GB)
- 다운로드는 한 번만 수행됩니다

서버가 시작되면: `http://localhost:8000`

## API 사용법

### 헬스 체크

```bash
curl http://localhost:8000/health
```

응답:
```json
{
  "status": "healthy",
  "model": "base",
  "model_loaded": true
}
```

### 음성-텍스트 변환

**cURL 예시:**
```bash
curl -X POST "http://localhost:8000/v1/audio/transcriptions" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@audio.mp3" \
  -F "model=whisper-1"
```

**Python 예시:**
```python
import requests

url = "http://localhost:8000/v1/audio/transcriptions"
files = {"file": open("audio.mp3", "rb")}
data = {"model": "whisper-1"}

response = requests.post(url, files=files, data=data)
print(response.json())
```

**응답:**
```json
{
  "text": "변환된 텍스트 내용입니다."
}
```

### 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `file` | File | ✅ | 오디오 파일 (WAV, MP3, M4A, FLAC, OGG) |
| `model` | String | ❌ | 모델 이름 (기본: whisper-1) |
| `language` | String | ❌ | 언어 코드 (예: 'ko', 'en') |
| `prompt` | String | ❌ | 컨텍스트 프롬프트 |
| `response_format` | String | ❌ | 응답 형식 (json, text, srt, vtt) |
| `temperature` | Float | ❌ | 샘플링 온도 (0.0 ~ 1.0) |

### 응답 형식

**JSON (기본값):**
```bash
curl -X POST "http://localhost:8000/v1/audio/transcriptions" \
  -F "file=@audio.mp3" \
  -F "response_format=json"
```

**텍스트:**
```bash
curl -X POST "http://localhost:8000/v1/audio/transcriptions" \
  -F "file=@audio.mp3" \
  -F "response_format=text"
```

**SRT 자막:**
```bash
curl -X POST "http://localhost:8000/v1/audio/transcriptions" \
  -F "file=@audio.mp3" \
  -F "response_format=srt"
```

**VTT 자막:**
```bash
curl -X POST "http://localhost:8000/v1/audio/transcriptions" \
  -F "file=@audio.mp3" \
  -F "response_format=vtt"
```

## Oracle Cloud 배포

자세한 배포 가이드는 [`../docs/oracle-cloud-setup.md`](../docs/oracle-cloud-setup.md)를 참조하세요.

### 빠른 시작

```bash
# 1. 파일 업로드
scp -r whisper-server ubuntu@your-oracle-ip:/home/ubuntu/

# 2. SSH 접속
ssh ubuntu@your-oracle-ip

# 3. 의존성 설치
cd whisper-server
sudo apt update && sudo apt install -y python3-pip python3-venv ffmpeg
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 4. 서버 실행
python server.py
```

### Systemd 서비스 등록

자동 시작 및 재시작을 위해 systemd 서비스로 등록:

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
ExecStart=/home/ubuntu/whisper-server/venv/bin/python server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

서비스 시작:
```bash
sudo systemctl daemon-reload
sudo systemctl enable whisper.service
sudo systemctl start whisper.service
sudo systemctl status whisper.service
```

## 문제 해결

### ffmpeg 오류
```bash
# ffmpeg 설치 확인
ffmpeg -version

# 재설치
sudo apt remove ffmpeg
sudo apt install ffmpeg
```

### 메모리 부족
- 더 작은 모델 사용 (`tiny` 또는 `base`)
- 스왑 메모리 추가

### 느린 처리 속도
- GPU가 없는 환경에서는 CPU로 처리되므로 느립니다
- 더 작은 모델 사용 권장
- 긴 오디오는 청크로 분할 처리

### CORS 에러
`server.py`의 `allow_origins`에 도메인 추가:
```python
allow_origins=[
    "https://your-app.vercel.app",
    "https://yourdomain.com",
]
```

## 성능 최적화

### 모델 선택
- 짧은 음성 (< 30초): `tiny` 또는 `base`
- 중간 길이 (30초 ~ 5분): `base` 또는 `small`
- 긴 음성 (> 5분): 청크로 분할 + `base`

### 서버 설정
- 프로덕션에서는 여러 워커 실행:
```bash
uvicorn server:app --host 0.0.0.0 --port 8000 --workers 4
```

## 라이센스

MIT

## 참고 자료

- [OpenAI Whisper GitHub](https://github.com/openai/whisper)
- [FastAPI 문서](https://fastapi.tiangolo.com/)
- [Whisper 모델 카드](https://github.com/openai/whisper/blob/main/model-card.md)
