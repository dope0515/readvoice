# 읽어줄래요 (STT & AI Summary)

말하는 대로, 들리는 대로. 음성을 텍스트로 바꾸고 AI가 요약까지 해주는 스마트 비서입니다.
Nuxt 3와 Groq API를 사용하여 별도의 GPU 서버 없이도 **압도적인 속도와 정확도**를 제공합니다.

## 🚀 주요 기능

- **🎤 녹음 인식 (Voice Recorder)**: 마이크로 실시간 녹음하고, 종료 즉시 고품질 텍스트로 변환합니다.
- **📁 파일 업로드 (File Upload)**: 기존 음성 파일(WAV, MP3, M4A 등)을 한 번에 텍스트로 바꿉니다.
- **🤖 AI 요약 및 회의록**: 변환된 텍스트를 AI가 분석하여 핵심 요약이나 전문적인 회의록(주제, 참석자, 논의사항, 결정사항)을 작성합니다.
- **📄 스마트 내보내기**: 생성된 회의록을 PDF, Excel로 저장하거나 이메일로 즉시 공유할 수 있습니다.
- **♿ 웹 접근성 준수**: ARIA 속성 및 시맨틱 마크업을 통해 모든 사용자가 편리하게 이용할 수 있습니다.

## 🛠 기술 스택

- **Frontend**: [Nuxt 3](https://nuxt.com/) (Vue 3, TypeScript)
- **AI Core**: [Groq Whisper API](https://groq.com/) (STT), Llama 3 / DeepSeek (Summary)
- **Export**: jsPDF, html2canvas, SheetJS (XLSX)
- **PWA**: `@vite-pwa/nuxt`를 통한 모바일 앱 경험 제공

## 📋 시작하기

1. **의존성 설치**:
   ```bash
   npm install
   ```

2. **환경 변수 설정**:
   프로젝트 루트에 `.env` 파일을 생성하고 Groq API 키를 입력합니다.
   ```env
   GROQ_API_KEY=gsk_your_api_key_here
   ```

3. **개발 서버 실행**:
   ```bash
   npm run dev
   ```

## 📂 프로젝트 구조 및 문서

- `components/`: 핵심 UI 컴포넌트 (`FileUploadSTT`, `RealtimeSTT` 등)
- `server/api/`: STT 및 요약 처리를 위한 서버리스 API
- `docs/PROJECT_MAP.md`: [**전체 구조 및 기술 스택 요약**](docs/PROJECT_MAP.md) (LLM 참고용)
- `docs/COMPONENTS_MAP.md`: [**컴포넌트 기능 및 상태 가이드**](docs/COMPONENTS_MAP.md) (LLM 참고용)

## 📜 라이센스

MIT License
