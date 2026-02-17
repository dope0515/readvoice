# Vercel 배포 가이드

Nuxt 앱을 Vercel에 배포하여 Oracle Cloud의 Whisper와 Ollama 서버에 연결하는 가이드입니다.

## 목차

1. [사전 준비](#1-사전-준비)
2. [Vercel CLI 설치](#2-vercel-cli-설치)
3. [환경 변수 설정](#3-환경-변수-설정)
4. [로컬 테스트](#4-로컬-테스트)
5. [Vercel 배포](#5-vercel-배포)
6. [도메인 설정](#6-도메인-설정)
7. [문제 해결](#7-문제-해결)

## 1. 사전 준비

### 1.1 필수 요구사항

- ✅ Oracle Cloud에 Whisper 서버 배포 완료
- ✅ Oracle Cloud에 Ollama 설치 완료
- ✅ 두 서비스가 정상 작동 중
- ✅ Vercel 계정 (무료 티어 사용 가능)
- ✅ GitHub/GitLab/Bitbucket 리포지토리

### 1.2 서비스 동작 확인

로컬 터미널에서 테스트:

```bash
# Whisper 서버 테스트
curl http://your-oracle-ip:8000/health

# Ollama 테스트
curl http://your-oracle-ip:11434/api/tags
```

두 서비스 모두 응답하면 준비 완료!

## 2. Vercel CLI 설치

### 2.1 npm으로 설치

```bash
npm install -g vercel
```

### 2.2 Vercel 로그인

```bash
vercel login
```

브라우저가 열리면 로그인 진행

## 3. 환경 변수 설정

### 3.1 로컬 환경 변수 (.env)

프로젝트 루트에 `.env` 파일 생성:

```bash
# Oracle Cloud Whisper 서버
NUXT_WHISPER_API_URL=http://your-oracle-ip:8000

# Oracle Cloud Ollama
NUXT_OLLAMA_HOST=http://your-oracle-ip:11434
NUXT_OLLAMA_MODEL=gemma3
```

**HTTPS 설정 시:**
```bash
NUXT_WHISPER_API_URL=https://whisper.yourdomain.com
NUXT_OLLAMA_HOST=https://ollama.yourdomain.com
NUXT_OLLAMA_MODEL=gemma3
```

### 3.2 Vercel 환경 변수 설정

**방법 1: Vercel CLI 사용**

```bash
# 프로젝트 루트에서 실행
vercel env add NUXT_WHISPER_API_URL
# 값 입력: http://your-oracle-ip:8000

vercel env add NUXT_OLLAMA_HOST
# 값 입력: http://your-oracle-ip:11434

vercel env add NUXT_OLLAMA_MODEL
# 값 입력: gemma3
```

각 환경 선택 시:
- **Production**: Yes
- **Preview**: Yes
- **Development**: No (로컬에서는 .env 사용)

**방법 2: Vercel 대시보드 사용**

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 프로젝트 선택
3. **Settings** → **Environment Variables**
4. 각 변수 추가:
   - Name: `NUXT_WHISPER_API_URL`
   - Value: `http://your-oracle-ip:8000`
   - Environment: Production, Preview 선택

   - Name: `NUXT_OLLAMA_HOST`
   - Value: `http://your-oracle-ip:11434`
   - Environment: Production, Preview 선택

   - Name: `NUXT_OLLAMA_MODEL`
   - Value: `gemma3`
   - Environment: Production, Preview 선택

## 4. 로컬 테스트

배포 전에 로컬에서 테스트:

### 4.1 Vercel 개발 서버 실행

```bash
# 프로젝트 루트에서
vercel dev
```

이제 `http://localhost:3000`에서 앱 테스트

### 4.2 기능 테스트

1. **파일 업로드 STT**
   - 오디오 파일 업로드
   - 텍스트 변환 확인
   - 오류 없이 작동하는지 확인

2. **실시간 음성 인식**
   - 마이크 녹음
   - 텍스트 변환 확인

3. **AI 요약**
   - "요약하기" 버튼 클릭
   - Ollama 응답 확인

모든 기능이 정상 작동하면 배포 진행!

## 5. Vercel 배포

### 5.1 Git 리포지토리 연결

코드를 GitHub/GitLab/Bitbucket에 푸시:

```bash
# Git 초기화 (아직 안 했다면)
git init
git add .
git commit -m "Initial commit for Vercel deployment"

# 리모트 추가 및 푸시
git remote add origin https://github.com/your-username/stt.git
git branch -M main
git push -u origin main
```

### 5.2 Vercel에서 프로젝트 임포트

**방법 1: Vercel 대시보드 사용**

1. [Vercel Dashboard](https://vercel.com/dashboard)
2. **Add New** → **Project**
3. **Import Git Repository** → GitHub 리포지토리 선택
4. **Framework Preset**: Nuxt.js 자동 감지
5. **Root Directory**: `.` (기본값)
6. **Build Command**: `npm run build` (자동)
7. **Output Directory**: `.output/public` (자동)
8. **Install Command**: `npm install` (자동)
9. **Environment Variables**: 이미 설정했다면 건너뛰기
10. **Deploy** 클릭

**방법 2: Vercel CLI 사용**

```bash
# 프로젝트 루트에서
vercel

# 질문에 답변:
# - Set up and deploy? Y
# - Which scope? 계정 선택
# - Link to existing project? N
# - Project name? stt (또는 원하는 이름)
# - In which directory is your code located? ./
# - Want to override settings? N
```

### 5.3 배포 완료

배포가 완료되면 Vercel URL 제공:
```
https://your-project.vercel.app
```

## 6. 도메인 설정

### 6.1 커스텀 도메인 추가

1. **Vercel Dashboard** → 프로젝트 선택
2. **Settings** → **Domains**
3. **Add Domain** → 도메인 입력 (예: `stt.yourdomain.com`)
4. DNS 설정 안내에 따라 도메인 연결

### 6.2 DNS 레코드 추가

도메인 제공업체(Cloudflare, GoDaddy 등)에서:

**A 레코드 추가:**
- Type: `A`
- Name: `stt` (또는 `@` for apex domain)
- Value: Vercel IP (대시보드에서 제공)
- TTL: Auto

**또는 CNAME 레코드:**
- Type: `CNAME`
- Name: `stt`
- Value: `cname.vercel-dns.com`
- TTL: Auto

### 6.3 HTTPS 자동 활성화

Vercel이 자동으로 Let's Encrypt SSL 인증서 발급 (약 5-10분 소요)

## 7. 문제 해결

### 배포 실패: "Build failed"

**로그 확인:**
- Vercel Dashboard → Deployments → 실패한 배포 클릭
- 빌드 로그 확인

**일반적인 해결책:**
```bash
# 로컬에서 빌드 테스트
npm run build

# 에러가 있으면 수정 후 다시 푸시
git add .
git commit -m "Fix build errors"
git push
```

### 환경 변수 인식 안 됨

1. Vercel Dashboard → Settings → Environment Variables 확인
2. 변수 이름이 `NUXT_`로 시작하는지 확인
3. Production, Preview 환경 모두 선택했는지 확인
4. 환경 변수 수정 후 **재배포 필요**:
   ```bash
   vercel --prod
   ```

### API 요청 실패: "Network Error"

**CORS 문제 가능성:**

Whisper `server.py`의 CORS 설정 확인:
```python
allow_origins=[
    "https://your-project.vercel.app",
    "https://stt.yourdomain.com",
]
```

수정 후 Oracle Cloud에서 서비스 재시작:
```bash
sudo systemctl restart whisper.service
```

### 타임아웃 에러

Vercel 서버리스 함수 제한:
- **Hobby 플랜**: 10초
- **Pro 플랜**: 300초 (5분)

**해결 방법:**
1. 짧은 오디오 파일만 처리 (< 1분)
2. 또는 클라이언트에서 오디오 청크 분할

### Oracle Cloud 서비스 응답 없음

```bash
# SSH 접속 후 서비스 상태 확인
sudo systemctl status whisper.service
sudo systemctl status ollama.service

# 재시작
sudo systemctl restart whisper.service
sudo systemctl restart ollama.service

# 로그 확인
sudo tail -f /var/log/whisper.log
```

## 배포 후 체크리스트

- [ ] Vercel 앱 정상 로드
- [ ] 파일 업로드 STT 작동
- [ ] 실시간 음성 인식 작동
- [ ] AI 요약 기능 작동
- [ ] 에러 없음
- [ ] 커스텀 도메인 설정 (선택)
- [ ] HTTPS 활성화 확인

## 자동 배포 설정

Git에 푸시하면 자동으로 배포:

```bash
# 코드 수정 후
git add .
git commit -m "Update feature"
git push

# Vercel이 자동으로 빌드 및 배포 시작
```

**Preview Deployment:**
- Pull Request 생성 시 자동으로 프리뷰 URL 생성
- 테스트 후 메인 브랜치에 머지하면 프로덕션 배포

## 성능 최적화

### 1. Edge Functions 활용

Nuxt API routes는 자동으로 Edge Functions로 배포됨

### 2. 이미지 최적화

```javascript
// nuxt.config.ts
export default defineNuxtConfig({
  image: {
    provider: 'vercel'
  }
})
```

### 3. 캐싱 설정

```javascript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/': { prerender: true },
    '/api/**': { cors: true }
  }
})
```

## 모니터링

### Vercel Analytics

무료로 제공되는 분석 도구:

1. Dashboard → 프로젝트 → **Analytics**
2. 방문자, 페이지 뷰, 성능 메트릭 확인

### 로그 확인

```bash
# Vercel CLI로 실시간 로그 확인
vercel logs your-project.vercel.app
```

## 비용

**Vercel 무료 티어:**
- 월 100GB 대역폭
- 무제한 요청
- 자동 HTTPS
- 글로벌 CDN
- 자동 배포

대부분의 개인 프로젝트는 무료 티어로 충분!

## 다음 단계

배포 완료 후:
1. ✅ Vercel 앱: `https://your-project.vercel.app`
2. ✅ Oracle Cloud Whisper: `http://your-oracle-ip:8000`
3. ✅ Oracle Cloud Ollama: `http://your-oracle-ip:11434`
4. 다음: [통합 테스트](./testing-guide.md)

## 참고 자료

- [Vercel 문서](https://vercel.com/docs)
- [Nuxt 배포 가이드](https://nuxt.com/deploy/vercel)
- [Vercel CLI 문서](https://vercel.com/docs/cli)
