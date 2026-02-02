# STT (Speech-to-Text) 프로젝트

Nuxt 3와 OpenAI Whisper (오픈소스)를 사용한 음성-텍스트 변환 서비스입니다.

## 주요 기능

- 📁 **파일 업로드 STT**: 오디오 파일을 업로드하여 텍스트로 변환
- 🎤 **실시간 음성 인식**: 마이크로 녹음한 음성을 실시간으로 텍스트로 변환
- 🤖 **AI 요약**: Ollama를 활용한 STT 결과 자동 요약 (3-5개 핵심 요점)
- 🎨 **현대적인 UI**: Tailwind CSS를 사용한 반응형 디자인
- 🔒 **안전한 API 연동**: Nuxt Server Routes를 통한 보안 강화
- 💯 **완전 무료**: 모든 기능 오픈소스 기반, 과금 없음

## 기술 스택 (100% 무료 오픈소스)

- **Frontend**: Nuxt 3, Vue 3, TypeScript
- **Styling**: Tailwind CSS
- **STT**: OpenAI Whisper (Self-hosted)
- **AI 요약**: Ollama (Local LLM)
- **Runtime**: Node.js

## 설치

### 1. 의존성 설치

```bash
npm install
```

### 2. Whisper 서버 설정

Whisper FastAPI 서버를 로컬에서 실행합니다.

```bash
cd whisper-server

# 가상환경 생성
python -m venv venv

# 가상환경 활성화 (Mac/Linux)
source venv/bin/activate

# 의존성 설치
pip install -r requirements.txt

# 서버 실행
python server.py
```

**첫 실행 시 주의사항:**
- Whisper 모델 자동 다운로드 (약 1-3GB)
- ffmpeg 설치 필요: `brew install ffmpeg` (Mac)

자세한 내용은 [`whisper-server/README.md`](whisper-server/README.md)를 참조하세요.

### 3. Ollama 설정 (요약 기능 사용 시)

AI 요약 기능을 사용하려면 로컬에 Ollama를 설치해야 합니다.

1. [Ollama 다운로드](https://ollama.com/download) 후 설치

2. 모델 다운로드:
   ```bash
   ollama pull gemma3
   ```

3. Ollama 서버 실행 확인:
   ```bash
   ollama list
   ```

#### 지원 모델

- **gemma3** (권장): 빠르고 효율적, 적은 메모리 사용 (~4-6GB RAM)
- **qwen2.5**: 한중일 언어 특화, 더 정확한 요약
- **llama3.2**: 범용성 좋음, 더 큰 컨텍스트 지원

모델 변경은 `.env` 파일에서 `NUXT_OLLAMA_MODEL` 값을 수정하면 됩니다.

### 4. 환경 변수 설정

프로젝트 루트에 `.env` 파일 생성:

```bash
cp .env.example .env
```

`.env` 파일 내용:

```env
# Whisper STT API (로컬)
NUXT_WHISPER_API_URL=http://localhost:8000

# Ollama (선택사항)
NUXT_OLLAMA_HOST=http://localhost:11434
NUXT_OLLAMA_MODEL=gemma3
```

**Oracle Cloud 배포 시:**
```env
NUXT_WHISPER_API_URL=https://your-oracle-ip:8000
```

## 개발 서버 실행

**3개의 터미널이 필요합니다:**

**터미널 1 - Whisper 서버:**
```bash
cd whisper-server
source venv/bin/activate
python server.py
# → http://localhost:8000
```

**터미널 2 - Ollama (선택사항):**
```bash
ollama serve
# → http://localhost:11434
```

**터미널 3 - Nuxt 앱:**
```bash
npm run dev
# → http://localhost:3000
```

## 사용 방법

### 파일 업로드 STT

1. "파일 업로드" 탭 선택
2. 오디오 파일을 드래그 앤 드롭하거나 파일 선택 버튼 클릭
3. "텍스트로 변환" 버튼 클릭
4. 변환 완료 후 결과 확인 및 복사
5. (선택) "요약하기" 버튼 클릭하여 AI 요약 생성

**지원 형식**: WAV, MP3, M4A, FLAC, OGG

### 실시간 음성 인식

1. "실시간 음성 인식" 탭 선택
2. 마이크 아이콘 클릭하여 녹음 시작
3. 말하기
4. 다시 클릭하여 녹음 중지
5. 자동으로 텍스트 변환 결과 표시
6. (선택) "요약하기" 버튼 클릭하여 AI 요약 생성

### AI 요약

변환된 텍스트를 3-5개의 핵심 요점으로 자동 요약합니다.

- Ollama가 설치되고 실행 중이어야 사용 가능
- 첫 요약 시 모델 로딩으로 약 5-10초 소요
- 이후 요약은 즉시 처리됩니다

## 프로젝트 구조

```
stt/
├── app.vue                           # 메인 레이아웃
├── components/
│   ├── TabNavigation.vue             # 탭 네비게이션
│   ├── FileUploadSTT.vue             # 파일 업로드 컴포넌트
│   └── RealtimeSTT.vue               # 실시간 STT 컴포넌트
├── server/
│   ├── api/
│   │   ├── stt/
│   │   │   ├── upload.post.ts        # 파일 업로드 API
│   │   │   └── realtime.post.ts      # 실시간 STT API
│   │   └── summarize/
│   │       └── text.post.ts          # AI 요약 API
│   └── utils/
│       └── whisper.ts                # Whisper API 유틸리티
├── whisper-server/                   # Whisper FastAPI 서버
│   ├── server.py                     # FastAPI 서버
│   ├── requirements.txt              # Python 의존성
│   └── README.md                     # 서버 가이드
├── assets/
│   └── css/
│       └── main.css                  # Tailwind CSS
├── .env                              # 환경 변수 (gitignore)
└── nuxt.config.ts                    # Nuxt 설정
```

## API 엔드포인트

### STT API
- `POST /api/stt/upload` - 파일 업로드 및 변환
- `POST /api/stt/realtime` - 실시간 음성 변환

### AI 요약 API
- `POST /api/summarize/text` - 텍스트 요약 (Ollama 사용)

### Whisper 서버 API
- `POST /v1/audio/transcriptions` - 음성-텍스트 변환
- `GET /health` - 헬스 체크

## 프로덕션 빌드

```bash
npm run build
```

프로덕션 빌드 미리보기:

```bash
npm run preview
```

## Oracle Cloud 배포

1. **Whisper 서버 배포:**
   ```bash
   scp -r whisper-server user@oracle-ip:/path/to/
   ssh user@oracle-ip
   cd /path/to/whisper-server
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python server.py
   ```

2. **Nuxt 앱 `.env` 수정:**
   ```env
   NUXT_WHISPER_API_URL=https://your-oracle-ip:8000
   ```

3. **Nuxt 앱 배포:**
   ```bash
   npm run build
   ```

## 참고 문서

- [OpenAI Whisper GitHub](https://github.com/openai/whisper)
- [Ollama 문서](https://ollama.com/docs)
- [FastAPI 문서](https://fastapi.tiangolo.com/)
- [Nuxt 3 문서](https://nuxt.com/docs)
- [Vue 3 문서](https://vuejs.org/)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)

## 비용

**완전 무료** - 모든 기능이 오픈소스 기반으로 작동합니다.

- ✅ Whisper (오픈소스 STT)
- ✅ Ollama (오픈소스 LLM)
- ✅ Nuxt/Vue (오픈소스 프레임워크)
- ✅ FastAPI (오픈소스 서버)

## 라이센스

MIT
