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

**⚠️ 중요**: AI 요약 기능은 **사용자의 로컬 컴퓨터에서** Ollama를 실행합니다.

1. [Ollama 다운로드](https://ollama.com/download) 후 설치

2. 모델 다운로드:
   ```bash
   ollama pull tinyllama
   ```

3. Ollama 서버 실행:
   ```bash
   ollama serve
   ```

#### 지원 모델

- **tinyllama** (기본): 가장 빠르고 가벼움 (~0.6GB RAM) ⭐️ 권장
- **gemma3**: 더 나은 품질, 메모리 사용 증가 (~4GB RAM)
- **qwen2.5**: 한중일 언어 특화, 더 정확한 요약 (~6GB RAM)

모델은 컴포넌트 파일에서 직접 변경할 수 있습니다.

### 4. 환경 변수 설정

프로젝트 루트에 `.env` 파일 생성:

```bash
cp .env.example .env
```

`.env` 파일 내용:

```env
# Whisper STT API (로컬 개발)
NUXT_WHISPER_API_URL=http://localhost:8000
```

**Oracle Cloud 배포 시:**
```env
NUXT_WHISPER_API_URL=http://your-oracle-ip:8000
```

**주의**: Ollama 설정은 더 이상 필요하지 않습니다. 클라이언트가 자동으로 `localhost:11434`에 연결합니다.

## 개발 서버 실행

**3개의 터미널이 필요합니다:**

**터미널 1 - Whisper 서버:**
```bash
cd whisper-server
source venv/bin/activate
python server.py
# → http://localhost:8000
```

**터미널 2 - Ollama (요약 기능 사용 시):**
```bash
ollama serve
# → http://localhost:11434
```
⚠️ **Ollama는 클라이언트(사용자 PC)에서 실행됩니다!**

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

변환된 텍스트를 3개 요점으로 자동 요약합니다.

- **사용자의 로컬 컴퓨터**에서 Ollama가 실행 중이어야 합니다
- 첫 요약 시 모델 로딩으로 약 2-5초 소요 (tinyllama)
- 이후 요약은 즉시 처리됩니다
- 서버 메모리 부담 없이 사용자의 컴퓨터 성능을 활용합니다

## 프로젝트 구조

```
stt/
├── app.vue                           # 메인 레이아웃
├── components/
│   ├── TabNavigation.vue             # 탭 네비게이션
│   ├── FileUploadSTT.vue             # 파일 업로드 컴포넌트
│   ├── RealtimeSTT.vue               # 실시간 STT 컴포넌트
│   ├── StatusAnimation.vue           # 상태 애니메이션
│   └── LicenseFooter.vue             # 라이센스 푸터
├── server/
│   ├── api/
│   │   ├── stt/
│   │   │   ├── upload.post.ts        # 파일 업로드 API
│   │   │   └── realtime.post.ts      # 실시간 STT API
│   │   └── summarize/
│   │       └── text.post.ts          # AI 요약 API
│   └── utils/
│       ├── whisper.ts                # Whisper API 유틸리티
│       └── rtzr.ts                   # 기타 유틸리티
├── whisper-server/                   # Whisper FastAPI 서버
│   ├── server.py                     # FastAPI 서버
│   ├── requirements.txt              # Python 의존성
│   ├── README.md                     # 서버 가이드
│   └── .env.example                  # 환경 변수 예시
├── docs/                             # 배포 가이드
│   ├── oracle-cloud-setup.md         # Oracle Cloud 배포
│   ├── vercel-deployment.md          # Vercel 배포
│   └── testing-guide.md              # 통합 테스트
├── scripts/                          # 배포 자동화 스크립트
│   ├── deploy-oracle.sh              # Oracle Cloud 배포
│   ├── setup-systemd.sh              # Systemd 서비스 설정
│   ├── test-services.sh              # 서비스 테스트
│   └── README.md                     # 스크립트 가이드
├── assets/
│   └── css/
│       └── main.css                  # Tailwind CSS
├── .env                              # 환경 변수 (gitignore)
├── .env.example                      # 환경 변수 예시
├── vercel.json                       # Vercel 배포 설정
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

## 프로덕션 배포

### 배포 아키텍처

```
[사용자] ─┬─→ [Vercel (Nuxt 프론트엔드)] ─→ [Oracle Cloud]
          │                                      └─ Whisper 서버 :8000
          │
          └─→ [로컬 Ollama :11434] (AI 요약)
```

**변경사항**: Ollama는 더 이상 서버에 배포하지 않습니다. 클라이언트의 로컬 Ollama를 직접 사용하여 서버 메모리 부담을 제거했습니다!

### Oracle Cloud + Vercel 배포

이 프로젝트는 다음과 같이 배포할 수 있습니다:
- **Oracle Cloud**: Whisper 서버만 무료 티어에서 실행 (STT 백엔드)
- **Vercel**: Nuxt 앱을 무료로 배포 (프론트엔드)
- **사용자 로컬**: Ollama 실행 (AI 요약)

#### 빠른 시작

**1단계: Oracle Cloud에 Whisper 배포 (자동화 스크립트 사용)**

```bash
# 로컬에서 실행
chmod +x scripts/deploy-oracle.sh
ORACLE_IP=123.45.67.89 ./scripts/deploy-oracle.sh
```

자동으로 다음 작업을 수행합니다:
- ✅ Whisper 서버 파일 업로드
- ✅ Python 의존성 설치
- ✅ Systemd 서비스 등록
- ✅ 서버 시작 및 확인

**2단계: Vercel에 Nuxt 앱 배포**

```bash
# Vercel CLI 설치
npm install -g vercel

# 로그인
vercel login

# 환경 변수 설정
vercel env add NUXT_WHISPER_API_URL
# 값: http://your-oracle-ip:8000

# 배포
vercel --prod
```

**3단계: 사용자 로컬에 Ollama 설치 (요약 기능 사용 시)**

각 사용자가 자신의 컴퓨터에서:
```bash
# 1. Ollama 설치
# https://ollama.com/download

# 2. 모델 다운로드
ollama pull tinyllama

# 3. 서버 실행 (백그라운드)
ollama serve
```

#### 상세 가이드

더 자세한 배포 방법은 다음 문서를 참조하세요:

- 📘 **[Oracle Cloud 배포 가이드](docs/oracle-cloud-setup.md)**: 인스턴스 생성, 방화벽 설정, Systemd 서비스 등록
- 📗 **[Vercel 배포 가이드](docs/vercel-deployment.md)**: 환경 변수 설정, 도메인 연결, 자동 배포
- 📙 **[배포 스크립트 사용법](scripts/README.md)**: 자동화 스크립트 상세 설명
- 📕 **[통합 테스트 가이드](docs/testing-guide.md)**: 배포 후 전체 시스템 테스트

### 로컬 개발 vs 프로덕션

| 환경 | Whisper | Ollama | Nuxt 앱 |
|------|---------|---------|---------|
| **로컬 개발** | localhost:8000 | localhost:11434 (로컬) | localhost:3000 |
| **프로덕션** | Oracle Cloud:8000 | localhost:11434 (사용자 로컬) | Vercel |

⚠️ **중요**: Ollama는 항상 사용자의 로컬 컴퓨터에서 실행됩니다!

## 참고 문서

### 배포 가이드
- 📘 [Oracle Cloud 배포 가이드](docs/oracle-cloud-setup.md)
- 📗 [Vercel 배포 가이드](docs/vercel-deployment.md)
- 📙 [배포 스크립트 사용법](scripts/README.md)
- 📕 [통합 테스트 가이드](docs/testing-guide.md)
- 📄 [Whisper 서버 가이드](whisper-server/README.md)
- 🤖 [클라이언트 Ollama 설정 가이드](docs/CLIENT_OLLAMA_SETUP.md) ⭐️ **필독**

### 외부 문서
- [OpenAI Whisper GitHub](https://github.com/openai/whisper)
- [Ollama 문서](https://ollama.com/docs)
- [FastAPI 문서](https://fastapi.tiangolo.com/)
- [Nuxt 3 문서](https://nuxt.com/docs)
- [Vue 3 문서](https://vuejs.org/)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [Vercel 문서](https://vercel.com/docs)
- [Oracle Cloud 문서](https://docs.oracle.com/en-us/iaas/Content/home.htm)

## 비용

**완전 무료** - 모든 기능이 오픈소스 및 무료 티어 기반으로 작동합니다.

### 로컬 개발
- ✅ Whisper (오픈소스 STT)
- ✅ Ollama (오픈소스 LLM)
- ✅ Nuxt/Vue (오픈소스 프레임워크)
- ✅ FastAPI (오픈소스 서버)

### 프로덕션 배포
- ✅ **Oracle Cloud**: Always Free 티어 (무료)
  - VM.Standard.A1.Flex: 4 OCPU, 24GB RAM
  - 또는 VM.Standard.E2.1.Micro: 1 OCPU, 1GB RAM
- ✅ **Vercel**: Hobby 플랜 (무료)
  - 월 100GB 대역폭
  - 무제한 요청
  - 자동 HTTPS
- ✅ **도메인 + HTTPS**: Let's Encrypt (무료, 선택사항)

**총 비용: 완전 무료!** 🎉

## 라이센스

MIT
