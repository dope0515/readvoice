# 읽어줄래요 (STT & AI Summary) 🎤🤖

**"말하는 대로, 기록하는 대로."**  
음성을 실시간으로 인식하여 텍스트로 변환하고, 최신 AI 모델을 통해 요약 및 회의록 생성을 자동화하는 스마트 비서입니다.  
별도의 무거운 GPU 서버 없이 **Groq Cloud API**를 활용하여 압도적인 속도와 정확도를 제공합니다.

---

## ✨ 주요 기능

### 🎤 스마트 녹음 및 STT (Speech-to-Text)
- **실시간 녹음 (Recorder)**: 웹 브라우저에서 즉시 녹음하고 종료와 동시에 텍스트로 변환합니다.
- **30초 단위 청킹 (Chunking)**: 긴 오디오도 안정적으로 처리할 수 있도록 자동 청킹 및 병렬 처리를 지원합니다.
- **문맥 유지 알고리즘**: 이전 청킹의 텍스트를 프롬프트로 전달하여 문장 끊김 현상을 최소화합니다.
- **환각(Hallucination) 필터링**: 무음 구간이나 노이즈에서 발생하는 무의미한 텍스트 반복을 지능적으로 제거합니다.

### 📁 다양한 파일 업로드 지원
- **멀티 포맷**: MP3, WAV, M4A 등 다양한 오디오 포맷의 파일을 업로드하여 즉시 변환할 수 있습니다.
- **진행률 표시**: 대용량 파일 처리 시 실시간으로 진행 상태를 시각적으로 확인할 수 있습니다.

### 🤖 AI 사후 처리 (Groq Llama 3.3-70b)
- **📄 3점 요약**: 전체 내용을 핵심 중심의 3가지 요점으로 빠르게 파악합니다.
- **🏛 전문 회의록**: 회의 주제, 일시, 참석자, 논의 사항, 결정 사항을 구조화된 JSON 기반으로 추출합니다.
- **🧹 텍스트 정제 및 교정**: '음', '어' 등 간투사를 제거하고 맞춤법 및 문맥을 자연스럽게 다듬습니다.
- **👥 AI 화자 분리 (Diarization)**: 문맥 분석을 통해 발화자를 추론하여 대화 형식으로 재구성합니다.

### 📄 스마트 내보내기 및 공유
- **PDF/Excel 저장**: 변환된 결과물과 요약을 깔끔한 문서 형태로 저장합니다.
- **이메일 즉시 공유**: 결과물을 메일 본문에 최적화된 형태로 즉시 전송할 수 있는 기능을 제공합니다.

---

## 🛠 기술 스택

| 구분 | 기술 / 서비스 |
| :--- | :--- |
| **Framework** | [Nuxt 3](https://nuxt.com/) (Vue 3, TypeScript) |
| **STT Engine** | [Groq Whisper (whisper-large-v3)](https://groq.com/) |
| **AI Summary** | [Groq Llama-3.3-70b-versatile](https://groq.com/) |
| **Styling** | Vanilla CSS, SCSS (Material Design System) |
| **Export** | jsPDF, SheetJS (XLSX), html2canvas |
| **PWA** | `@vite-pwa/nuxt` (모바일/데스크탑 앱 설치 지원) |

---

## 📋 시작하기

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

## 📂 프로젝트 구조

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

## 📜 라이센스
MIT License

---

> [!TIP]
> 더 높은 정확도를 위해 마이크 녹음 시 명확한 발음과 조용한 환경을 권장합니다.  
> 대용량 파일 변환 시 브라우저 탭을 열어두어야 안정적인 처리가 가능합니다.
