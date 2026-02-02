# Whisper FastAPI 서버

OpenAI Whisper 모델을 사용한 음성-텍스트 변환 REST API 서버입니다.

## 사전 요구사항

- Python 3.8 이상
- ffmpeg (시스템에 설치 필요)

### ffmpeg 설치

**Mac:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Windows:**
[ffmpeg 공식 사이트](https://ffmpeg.org/download.html)에서 다운로드

## 설치 방법

### 1. 가상환경 생성 (권장)

```bash
cd whisper-server
python -m venv venv
```

### 2. 가상환경 활성화

**Mac/Linux:**
```bash
source venv/bin/activate
```

**Windows:**
```bash
venv\Scripts\activate
```

### 3. 의존성 설치

```bash
pip install -r requirements.txt
```

**주의:** 첫 설치 시 PyTorch와 Whisper 모델을 다운로드하므로 시간이 걸릴 수 있습니다 (약 5-10분).

## 서버 실행

```bash
python server.py
```

서버가 실행되면 다음 주소에서 접근 가능합니다:
- API 서버: http://localhost:8000
- API 문서 (Swagger): http://localhost:8000/docs
- 헬스 체크: http://localhost:8000/health

## API 사용법

### 음성 변환 엔드포인트

**Endpoint:** `POST /v1/audio/transcriptions`

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Parameters:
  - `file`: 오디오 파일 (필수)
  - `model`: 모델 이름 (선택, 기본값: "whisper-1")

**지원 형식:**
- WAV, MP3, M4A, FLAC, OGG, WebM

**Response:**
```json
{
  "text": "변환된 텍스트"
}
```

### 테스트 예제 (curl)

```bash
curl -X POST "http://localhost:8000/v1/audio/transcriptions" \
  -F "file=@your-audio-file.wav" \
  -F "model=whisper-1"
```

## Whisper 모델 선택

`server.py` 파일에서 모델 크기를 변경할 수 있습니다:

```python
model = whisper.load_model("base")  # 여기를 수정
```

**사용 가능한 모델:**
- `tiny`: 가장 빠름, 정확도 낮음 (~1GB RAM)
- `base`: 빠름, 적당한 정확도 (~1GB RAM) **[기본값]**
- `small`: 보통 속도, 좋은 정확도 (~2GB RAM)
- `medium`: 느림, 높은 정확도 (~5GB RAM)
- `large`: 매우 느림, 최고 정확도 (~10GB RAM)

**권장:**
- 로컬 테스트: `base` 또는 `small`
- 프로덕션: `small` 또는 `medium`

## Oracle Cloud 배포

### 1. 서버에 파일 복사

```bash
scp -r whisper-server user@oracle-ip:/path/to/destination/
```

### 2. Oracle Cloud에서 실행

```bash
ssh user@oracle-ip
cd /path/to/destination/whisper-server
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python server.py
```

### 3. Nuxt 앱에서 연결

`.env` 파일 수정:
```env
NUXT_WHISPER_API_URL=https://your-oracle-ip:8000
```

## 문제 해결

### "ffmpeg not found" 오류
ffmpeg가 설치되어 있는지 확인:
```bash
ffmpeg -version
```

### 메모리 부족 오류
더 작은 모델 사용 (`tiny` 또는 `base`)

### 첫 실행이 느린 경우
정상입니다. Whisper 모델을 다운로드하는 중입니다. 한 번만 발생합니다.

## 서버 중지

터미널에서 `Ctrl + C`

## 성능 최적화

### GPU 사용 (선택사항)
NVIDIA GPU가 있다면 더 빠른 변환이 가능합니다:
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

### 프로덕션 배포
프로덕션 환경에서는 여러 워커를 사용:
```bash
uvicorn server:app --host 0.0.0.0 --port 8000 --workers 4
```

## 라이선스

이 서버는 OpenAI Whisper를 사용하며, MIT 라이선스를 따릅니다.
