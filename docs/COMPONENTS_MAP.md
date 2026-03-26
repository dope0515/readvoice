# Components Map

각 컴포넌트의 역할과 주요 상태 변수를 요약합니다. UI 수정 시 이 문서를 참고하세요.

## 1. `FileUploadSTT.vue`
- **역할**: 오디오 파일 드래그 앤 드롭 및 변환 관리.
- **주요 상태**:
  - `selectedFile`: 업로드된 File 객체.
  - `isConverting`: 변환 중 여부.
  - `totalChunks` / `processedChunks`: 30초 단위 청킹 진행률.
  - `transcriptionResult`: 최종 변환 텍스트.

## 2. `RealtimeSTT.vue` (녹음 인식)
- **역할**: 마이크 입력을 통한 녹음 및 즉시 변환.
- **주요 상태**:
  - `isRecording`: 녹음 중 여부.
  - `recordingTime`: 경과 시간 (초).
  - `masterAudioBlobs`: 녹음된 전체 오디오 조각들.
  - `isConverting`: 녹음 종료 후 후처리(변환) 진행 중 여부.

## 3. `TabNavigation.vue`
- **역할**: 파일 업로드 vs 녹음 인식 모드 전환.
- **Props**: `activeTab` (string).
- **Events**: `@change-tab` (tabId: string).

## 4. `StatusAnimation.vue`
- **역할**: 현재 상태(`idle`, `recording`, `converting`, `summarizing`, `finished`)에 따른 애니메이션 이미지 및 텍스트 표시.
- **Props**: `status`, `mode`.

## 5. `LicenseFooter.vue`
- **역할**: 저작권 정보 및 하단 레이아웃.

---

## 공통 스타일 가이드
- **Design System**: Google Material Design (Blue, Green, Red, Yellow 4색 활용).
- **Typography**: 'Google Sans', Roboto, sans-serif.
- **Transitions**: `.fade-enter-active`를 활용한 부드러운 전환.
