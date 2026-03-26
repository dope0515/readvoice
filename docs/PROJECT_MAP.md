# 읽어줄래요 (STT & Summarize) Project Map

이 문서는 AI가 프로젝트 구조를 빠르게 파악하여 토큰 사용량을 최적화할 수 있도록 돕는 기술 요약 가이드입니다.

## 기술 스택
- **Framework**: Nuxt 3 (Vue 3, TypeScript)
- **Styling**: SCSS (Scoped), Vanilla CSS
- **STT Engine**: Groq Whisper (AWS/Local 대신 고성능 API 사용)
- **AI Summary**: Groq Llama/DeepSeek (Markdown 기반 요약 및 회의록 추출)
- **Storage**: 브라우저 메모리 (Blob), 파일 다운로드 (PDF, Excel, TXT)

## 핵심 서버 로직 (`server/`)
- `/api/stt/upload.post.ts`: 오디오 파일(전체 또는 청크)을 받아 `transcribeAudio`를 호출.
- `/api/summarize/text.post.ts`: 텍스트를 받아 요약, 회의록, 또는 문법 수정을 수행.
- `server/utils/whisper.ts`: Groq API와 직접 통신하여 STT 수행 (한국어 최적화 프롬프트 포함).

## 데이터 흐름 (STT)
1. 사용자가 파을 업로드하거나 녹음함.
2. (대용량/녹음 시) 브라우저에서 30초 단위로 청킹.
3. `/api/stt/upload`로 순차 전송.
4. `contextPrompt`를 활용해 이전 청크의 문맥을 이어받아 정확도 유지.
5. 최종 결합된 텍스트를 화면에 표시.

## 주요 기능
- **파일 업로드**: 기존 녹음 파일 변환.
- **녹음 인식**: 실시간 녹음 후 즉시 변환 (Recorder 방식).
- **AI 요약/회의록**: 변환된 텍스트를 바탕으로 요약 및 구조화된 회의록 생성.
- **내보내기**: PDF (jsPDF), Excel (xlsx), Email (mailto).
