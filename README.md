# STT (Speech-to-Text) 프로젝트

Nuxt 3와 RTZR STT API를 사용한 음성-텍스트 변환 서비스입니다.

## 주요 기능

- 📁 **파일 업로드 STT**: 오디오 파일을 업로드하여 텍스트로 변환
- 🎤 **실시간 음성 인식**: 마이크로 녹음한 음성을 실시간으로 텍스트로 변환
- 🤖 **AI 요약**: Ollama를 활용한 STT 결과 자동 요약 (3-5개 핵심 요점)
- 📊 **사용량 관리**: 무료 사용량(530분) 실시간 추적 및 자동 차단
- 🎨 **현대적인 UI**: Tailwind CSS를 사용한 반응형 디자인
- 🔒 **안전한 API 연동**: Nuxt Server Routes를 통한 보안 강화
- 💾 **중앙 집중식 추적**: Supabase를 통한 다중 사용자 사용량 관리

## 설치

### 1. 의존성 설치

```bash
npm install
```

### 2. RTZR API 설정

1. [RTZR 개발자 사이트](https://developers.rtzr.ai)에서 회원가입
2. 콘솔에서 애플리케이션 생성 및 Client ID, Client Secret 발급

### 3. Supabase 설정

1. [Supabase](https://supabase.com)에서 회원가입
2. 새 프로젝트 생성
3. SQL Editor에서 다음 쿼리 실행:

```sql
-- 사용량 추적 테이블
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_minutes DECIMAL(10, 2) DEFAULT 0,
  limit_minutes DECIMAL(10, 2) DEFAULT 530,
  max_minutes DECIMAL(10, 2) DEFAULT 600,
  is_locked BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용 기록 테이블
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  duration_minutes DECIMAL(10, 2) NOT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 초기 레코드 삽입
INSERT INTO usage_tracking (id, total_minutes, limit_minutes, max_minutes) 
VALUES ('00000000-0000-0000-0000-000000000001', 0, 530, 600);
```

4. Project Settings > API에서 URL과 anon key 복사

### 4. Ollama 설정 (요약 기능 사용 시)

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

⚠️ **주의사항**:
- Ollama는 로컬에서만 실행되므로 프로덕션 배포 시 별도 Ollama 서버 필요
- 첫 요약 시 모델 로딩 시간 소요 (5-10초)
- Vercel 등 서버리스 환경에서는 작동하지 않음

### 5. 환경 변수 설정

프로젝트 루트에 `.env` 파일 생성:

```bash
cp .env.example .env
```

`.env` 파일에 발급받은 정보 입력:

```env
# RTZR STT API
NUXT_RTZR_CLIENT_ID=발급받은_클라이언트_ID
NUXT_RTZR_CLIENT_SECRET=발급받은_시크릿_키
NUXT_RTZR_API_BASE_URL=https://openapi.vito.ai/v1

# Supabase
NUXT_SUPABASE_URL=https://your-project.supabase.co
NUXT_SUPABASE_KEY=your_anon_key_here

# Ollama (선택사항)
NUXT_OLLAMA_HOST=http://localhost:11434
NUXT_OLLAMA_MODEL=gemma3
```

⚠️ **주의**: `.env` 파일은 절대 Git에 커밋하지 마세요!

## 개발 서버

개발 서버를 `http://localhost:3000`에서 시작합니다:

```bash
npm run dev
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
├── app.vue                           # 메인 레이아웃 + 사용량 표시
├── components/
│   ├── TabNavigation.vue             # 탭 네비게이션
│   ├── FileUploadSTT.vue             # 파일 업로드 컴포넌트
│   ├── RealtimeSTT.vue               # 실시간 STT 컴포넌트
│   └── UsageLimitModal.vue           # 사용량 초과 모달
├── composables/
│   └── useUsage.ts                   # 사용량 관리 Composable
├── server/
│   ├── api/
│   │   ├── stt/
│   │   │   ├── upload.post.ts        # 파일 업로드 API
│   │   │   ├── realtime.post.ts      # 실시간 STT API
│   │   │   └── status/[id].get.ts    # 상태 확인 API
│   │   ├── summarize/
│   │   │   └── text.post.ts          # AI 요약 API
│   │   └── usage/
│   │       └── current.get.ts        # 사용량 조회 API
│   └── utils/
│       ├── rtzr.ts                   # RTZR API 유틸리티
│       └── supabase.ts               # Supabase 유틸리티
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
- `GET /api/stt/status/[id]` - 변환 상태 확인

### AI 요약 API
- `POST /api/summarize/text` - 텍스트 요약 (Ollama 사용)

### 사용량 관리 API
- `GET /api/usage/current` - 현재 사용량 조회

## 무료 사용량 제한

- **총 무료 제공**: 600분 (10시간)
- **사용 제한**: 530분 도달 시 서비스 자동 차단
- **추적 방식**: Supabase를 통한 중앙 집중식 추적
- **청구 기준**: RTZR API의 실제 오디오 길이 기반

### RTZR API 과금 정책

- **최소 청구 단위**: 파일/세션당 10초
- **예시**:
  - 5초 오디오 → **10초**로 청구 (0분 10초로 표시)
  - 95초 오디오 → **95초**로 청구 (1분 35초로 표시)
  - 120초 오디오 → **120초**로 청구 (2분 0초로 표시)

사용량은 헤더에 **분과 초 단위로 실시간 표시**되며, 530분 초과 시 자동으로 모달이 표시되고 서비스 사용이 차단됩니다.

## 프로덕션 빌드

```bash
npm run build
```

프로덕션 빌드 미리보기:

```bash
npm run preview
```

## 기술 스택

- **Frontend**: Nuxt 3, Vue 3, TypeScript
- **Styling**: Tailwind CSS
- **API**: RTZR STT OpenAPI
- **AI/ML**: Ollama (Local LLM)
- **Database**: Supabase (PostgreSQL)
- **Runtime**: Node.js

## 참고 문서

- [RTZR STT API 문서](https://developers.rtzr.ai/docs/)
- [Ollama 문서](https://ollama.com/docs)
- [Supabase 문서](https://supabase.com/docs)
- [Nuxt 3 문서](https://nuxt.com/docs)
- [Vue 3 문서](https://vuejs.org/)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)

## 라이센스

MIT
