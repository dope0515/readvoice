# 읽어줄래요 (STT & AI Summary)

**"말하는 대로, 기록하는 대로."**
음성을 실시간으로 인식하여 텍스트로 변환하고, 최신 AI 모델을 통해 요약 및 회의록 생성을 자동화하는 스마트 비서입니다.
매번 반복되는 긴 회의와 강의 기록의 고충을 해결하여 사용자에게 '기록 그 이상의 가치'를 전달합니다.

---

## Problem Statement (문제 정의)
- **비효율적인 기록**: 1시간 분량의 음성을 다시 듣고 정리하는 데는 다시 그만큼의(혹은 그 이상의) 시간이 소요됩니다.
- **정보의 파편화**: 텍스트로 변환된 데이터는 많지만, 정작 중요한 '결론'과 '할 일'을 찾는 것은 여전히 사람의 수작업에 의존합니다.
- **속도와 비용의 한계**: 기존 STT 서비스는 처리 속도가 느리거나 무거운 환경(GPU 서버)이 필요하며 접근성이 낮습니다.

## Target Audience (타겟 유저)
- **직장인**: 회의록 작성 시간을 단축하고 액션 아이템을 놓치고 싶지 않은 분
- **대학생/연구원**: 방대한 분량의 강의와 인터뷰를 핵심 위주로 빠르게 정리하고 싶은 분
- **콘텐츠 크리에이터**: 영감을 즉석에서 텍스트화하고 지능적으로 요약하고 싶은 분

---

---

## 주요 기능 및 차별점

### 스마트 음성 인식 (STT)
- **실시간 및 파일 변환**: 마이크 실시간 녹음 또는 다양한 오디오 파일 업로드를 통해 고성능 텍스트 변환을 지원합니다.
- **압도적 처리 속도**: 별도의 무거운 서버 없이 **Groq Cloud API**를 활용하여 기존 대비 최대 10배 빠른(Real-time 이하) 변환 속도를 제공합니다.

### 지능형 AI 비서
- **맞춤형 분석 및 요약**: 텍스트의 핵심을 짚는 3점 요약과 주제별 논의 사항을 담은 전문 회의록을 생성합니다.
- **고급 텍스트 정제**: AI 기반의 화자 분리(Diarization) 및 문맥 교정을 통해 읽기 편한 대화문 형태의 결과물을 제공합니다.

### 스마트 내보내기 및 PWA
- **문서화 지원**: 생성된 결과물을 PDF, Excel, TXT 등 다양한 포맷으로 즉시 저장할 수 있습니다.
- **Seamless Experience**: 별도 설치 없는 **PWA 지원**으로 데스크탑과 모바일 어디서나 앱처럼 편리하게 접근할 수 있습니다.
- **이메일 원클릭 공유**: 협업 효율을 높이기 위해 분석 결과를 깔끔하게 정리하여 이메일로 즉시 공유합니다.

---

## User Journey (사용자 여정)
1. **[Input]**: 웹 브라우저나 모바일(PWA)로 접속하여 실시간 녹음 또는 파일 업로드 선택.
2. **[STT]**: Groq Whisper 엔진이 지능형 청킹 기술을 통해 음성을 고속 텍스트로 전환.
3. **[Analysis]**: Llama 3.3 모델이 문맥을 분석하여 화자 분리 및 핵심 요점(3줄 요약) 자동 생성.
4. **[Output]**: 정제된 요약본과 전문 회의록을 다양한 문서 포맷으로 즉시 공유 및 저장.

---

---

## 기술 스택

| 구분 | 기술 / 서비스 |
| :--- | :--- |
| **Framework** | [Nuxt 3](https://nuxt.com/) (Vue 3, TypeScript) |
| **STT Engine** | [Groq Whisper (whisper-large-v3)](https://groq.com/) |
| **AI Summary** | [Groq Llama-3.3-70b-versatile](https://groq.com/) |
| **Styling** | Vanilla CSS, SCSS (Material Design System) |
| **Export** | jsPDF, SheetJS (XLSX), html2canvas |
| **PWA** | `@vite-pwa/nuxt` (모바일/데스크탑 앱 설치 지원) |

---

## AI Implementation Details (AI 평가 항목)

본 프로젝트는 최신의 고성능 AI 모델을 복합적으로 활용하여, 단순 텍스트 변환을 넘어 지능형 비서 역할을 수행하도록 구현되었습니다.

### 1. 사용한 AI 모델
- **STT (Speech-to-Text)**: [Groq Whisper-large-v3](https://groq.com/) 및 `whisper-large-v3-turbo` (고정확도/고속 모드 선택 가능)
- **AI Summary & Processing**: [Groq Llama-3.3-70b-versatile](https://groq.com/) (70B 파라미터 기반의 정밀 논리 처리)

### 2. AI의 역할
- **음성 엔진 (Whisper)**: 오디오 데이터를 실시간 또는 파일 단위로 수집하여 고품질 한국어 텍스트로 전환합니다.
- **언어 모델 (Llama 3.3)**: 
    - **핵심 요약**: 비정형 텍스트를 분석하여 3개의 요점으로 구조화합니다.
    - **전문 회의록 추출**: Topic, Participants, Action Items 등을 포함한 JSON 기반 정형 데이터를 생성합니다.
    - **텍스트 정제 및 화자 분리**: 문맥 분석을 통해 STT 노이즈를 제거하고 대화의 흐름에 따라 화자를 추론하여 구분합니다.

### 3. 프롬프트 및 처리 방식 (Processing Methods)
- **Context-Aware Chunking (문맥 인지 청킹)**: 대용량 오디오 데이터를 30~120초 단위로 나누어 처리하며, **이전 청크의 변환 결과를 다음 청크의 `prompt`로 전달**하여 문맥의 단절을 막고 고유명사 등의 인식 정확도를 획기적으로 개선했습니다.
- **Smart Noise Cancellation (지능형 노이즈 필터링)**: 
    - **하드웨어 전처리**: 브라우저 API(Web Audio)를 통한 입력 소음 및 에코 억제.
    - **환각 패턴 제거**: Whisper 엔진 특유의 무음 구간 환각(Hallucination) 패턴을 서버 측에서 감지하여 실시간 필터링. (`server/utils/whisper.ts`)
    - **AI 지능형 정제**: Llama 3.3의 텍스트 정제 모드를 통해 '음', '어' 등의 간투사와 문맥 이탈 노이즈를 지능적으로 제거. (`server/api/summarize/text.post.ts`)
- **Structured Output Control (구조화된 출력 제어)**: 시스템 프롬프트를 통해 AI가 반드시 JSON 스키마를 따르도록 제어하여, 프론트엔드에서 즉시 회의록 표(Table) 형태로 시각화할 수 있는 데이터 신뢰성을 확보했습니다.

---

## 시작하기

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
프로젝트 루트에 `.env` 파일을 생성하고 Groq API 키를 입력합니다.
```env
# Groq API Key (https://console.groq.com/keys)
GROQ_API_KEY=gsk_your_api_key_here
```

### 3. 개발 서버 실행
```bash
npm run dev
```

---

## 프로젝트 구조

- `app.vue`: 메인 레이아웃 및 탭 로직
- `components/`:
    - `FileUploadSTT.vue`: 파일 업로드 및 변환 관리
    - `RealtimeSTT.vue`: 마이크 녹음 및 실시간 변환
    - `StatusAnimation.vue`: 상태별 인터랙티브 애니메이션
- `server/`:
    - `api/stt/upload.post.ts`: 오디오 처리용 API
    - `api/summarize/text.post.ts`: AI 요약 및 정제 API
    - `utils/whisper.ts`: Groq API 통신 유틸리티 (한국어 최적화)
- `docs/`: LLM 가이드 및 시스템 맵 문서 (`PROJECT_MAP.md`, `COMPONENTS_MAP.md`)

---

## 라이센스
MIT License

---

> [!TIP]
> 더 높은 정확도를 위해 마이크 녹음 시 명확한 발음과 조용한 환경을 권장합니다.  
> 대용량 파일 변환 시 브라우저 탭을 열어두어야 안정적인 처리가 가능합니다.
