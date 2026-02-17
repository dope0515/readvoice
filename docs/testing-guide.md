# 통합 테스트 가이드

Oracle Cloud와 Vercel 배포 후 전체 시스템을 테스트하는 가이드입니다.

## 목차

1. [개별 서비스 테스트](#1-개별-서비스-테스트)
2. [로컬 통합 테스트](#2-로컬-통합-테스트)
3. [Vercel 배포 테스트](#3-vercel-배포-테스트)
4. [E2E 기능 테스트](#4-e2e-기능-테스트)
5. [성능 테스트](#5-성능-테스트)
6. [문제 해결](#6-문제-해결)

## 1. 개별 서비스 테스트

배포가 완료되면 각 서비스가 독립적으로 작동하는지 확인합니다.

### 1.1 Whisper 서버 테스트

**헬스 체크:**
```bash
curl http://your-oracle-ip:8000/health
```

**예상 응답:**
```json
{
  "status": "healthy",
  "model": "base",
  "model_loaded": true
}
```

**음성 변환 테스트:**
```bash
curl -X POST "http://your-oracle-ip:8000/v1/audio/transcriptions" \
  -F "file=@test-audio.wav" \
  -F "model=whisper-1"
```

**예상 응답:**
```json
{
  "text": "변환된 텍스트 내용"
}
```

### 1.2 Ollama 서버 테스트

**설치된 모델 확인:**
```bash
curl http://your-oracle-ip:11434/api/tags
```

**예상 응답:**
```json
{
  "models": [
    {
      "name": "gemma3:latest",
      "modified_at": "2024-01-01T00:00:00Z",
      "size": 5000000000
    }
  ]
}
```

**텍스트 생성 테스트:**
```bash
curl -X POST "http://your-oracle-ip:11434/api/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemma3",
    "prompt": "안녕하세요",
    "stream": false
  }'
```

### 1.3 자동화 테스트 스크립트

```bash
# 프로젝트 루트에서
ORACLE_IP=your-oracle-ip ./scripts/test-services.sh
```

이 스크립트는 모든 서비스를 자동으로 테스트합니다.

## 2. 로컬 통합 테스트

Vercel 배포 전에 로컬에서 전체 시스템을 테스트합니다.

### 2.1 환경 변수 설정

`.env` 파일 생성:
```bash
NUXT_WHISPER_API_URL=http://your-oracle-ip:8000
NUXT_OLLAMA_HOST=http://your-oracle-ip:11434
NUXT_OLLAMA_MODEL=gemma3
```

### 2.2 로컬 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

### 2.3 기능 테스트

#### 파일 업로드 STT
1. "파일 업로드" 탭 선택
2. 오디오 파일 업로드 (WAV, MP3 등)
3. "텍스트로 변환" 버튼 클릭
4. 변환 결과 확인

**체크리스트:**
- [ ] 파일 업로드 성공
- [ ] 로딩 상태 표시
- [ ] 텍스트 변환 결과 표시
- [ ] 에러 없음

#### 실시간 음성 인식
1. "실시간 음성 인식" 탭 선택
2. 마이크 버튼 클릭 (권한 허용)
3. 음성 녹음
4. 버튼 다시 클릭하여 중지
5. 변환 결과 확인

**체크리스트:**
- [ ] 마이크 권한 요청
- [ ] 녹음 중 표시
- [ ] 자동 변환 및 결과 표시
- [ ] 에러 없음

#### AI 요약
1. STT 결과가 있는 상태에서 "요약하기" 버튼 클릭
2. 요약 결과 대기 및 확인

**체크리스트:**
- [ ] 요약 중 로딩 표시
- [ ] 3-5개 핵심 요점 표시
- [ ] 에러 없음

## 3. Vercel 배포 테스트

### 3.1 Vercel 환경 변수 확인

Vercel Dashboard → 프로젝트 → Settings → Environment Variables

필수 변수:
- `NUXT_WHISPER_API_URL`
- `NUXT_OLLAMA_HOST`
- `NUXT_OLLAMA_MODEL`

### 3.2 배포 상태 확인

```bash
vercel ls
```

최신 배포가 "Ready" 상태인지 확인

### 3.3 프로덕션 URL 테스트

브라우저에서 Vercel URL 접속:
```
https://your-project.vercel.app
```

**초기 로딩 확인:**
- [ ] 페이지 정상 로드
- [ ] UI 제대로 표시
- [ ] 콘솔 에러 없음

## 4. E2E 기능 테스트

Vercel 배포 후 전체 워크플로우를 테스트합니다.

### 4.1 파일 업로드 STT 전체 플로우

**테스트 시나리오:**
1. Vercel 앱 접속
2. 파일 업로드 탭 선택
3. 테스트 오디오 파일 업로드
4. 변환 시작
5. 결과 확인
6. 텍스트 복사 기능 테스트
7. 요약 기능 테스트

**예상 결과:**
- ✅ 파일 업로드 성공
- ✅ Oracle Cloud Whisper로 요청 전송
- ✅ 변환 결과 수신 및 표시
- ✅ 복사 기능 작동
- ✅ 요약 기능 작동

### 4.2 실시간 STT 전체 플로우

**테스트 시나리오:**
1. 실시간 음성 인식 탭 선택
2. 마이크 권한 허용
3. 10-20초 녹음
4. 녹음 중지
5. 자동 변환 대기
6. 결과 확인
7. 요약 기능 테스트

**예상 결과:**
- ✅ 마이크 접근 성공
- ✅ 녹음 중 표시 작동
- ✅ Oracle Cloud로 오디오 전송
- ✅ 변환 결과 자동 표시
- ✅ 요약 기능 작동

### 4.3 에러 처리 테스트

**시나리오 1: 잘못된 파일 형식**
1. TXT 파일이나 이미지 파일 업로드
2. 에러 메시지 확인

**예상 결과:**
- ✅ 적절한 에러 메시지 표시
- ✅ 앱 충돌 없음

**시나리오 2: 네트워크 에러**
1. Oracle Cloud 서버 중지
2. 변환 시도
3. 에러 메시지 확인

**예상 결과:**
- ✅ 네트워크 에러 메시지 표시
- ✅ 앱 정상 작동 유지

**시나리오 3: 매우 긴 오디오**
1. 5분 이상의 오디오 파일 업로드
2. 타임아웃 또는 성공 확인

**예상 결과:**
- ⚠️ Vercel 타임아웃 발생 가능 (Hobby: 10초)
- ✅ 타임아웃 시 적절한 에러 메시지

## 5. 성능 테스트

### 5.1 응답 시간 측정

**Whisper 변환 시간:**
```bash
time curl -X POST "http://your-oracle-ip:8000/v1/audio/transcriptions" \
  -F "file=@test-audio.wav" \
  -F "model=whisper-1"
```

**기준:**
- 10초 오디오: ~5-10초 (base 모델, CPU)
- 30초 오디오: ~15-30초
- 1분 오디오: ~30-60초

### 5.2 동시 요청 테스트

```bash
# 여러 터미널에서 동시에 실행
for i in {1..5}; do
  curl -X POST "http://your-oracle-ip:8000/v1/audio/transcriptions" \
    -F "file=@test-audio.wav" \
    -F "model=whisper-1" &
done
wait
```

**확인 사항:**
- [ ] 모든 요청 처리
- [ ] 서버 다운 없음
- [ ] 적절한 응답 시간

### 5.3 Ollama 응답 시간

```bash
time curl -X POST "http://your-oracle-ip:11434/api/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemma3",
    "prompt": "긴 텍스트 요약해주세요...",
    "stream": false
  }'
```

**기준:**
- 짧은 텍스트: ~2-5초
- 중간 텍스트 (~500자): ~5-10초
- 긴 텍스트 (~1000자): ~10-20초

## 6. 문제 해결

### 6.1 Whisper 변환 실패

**증상:**
- "음성 변환에 실패했습니다" 에러

**확인 사항:**
```bash
# Whisper 서버 상태 확인
ssh ubuntu@your-oracle-ip
sudo systemctl status whisper.service

# 로그 확인
sudo tail -f /var/log/whisper.log
sudo tail -f /var/log/whisper-error.log
```

**해결 방법:**
1. 서비스 재시작: `sudo systemctl restart whisper.service`
2. 메모리 확인: `free -h` (부족하면 스왑 추가)
3. 모델 다운로드 확인: `ls ~/.cache/whisper/`

### 6.2 Ollama 요약 실패

**증상:**
- "요약에 실패했습니다" 에러

**확인 사항:**
```bash
# Ollama 서버 상태
ssh ubuntu@your-oracle-ip
sudo systemctl status ollama.service

# 모델 확인
ollama list
```

**해결 방법:**
1. 서비스 재시작: `sudo systemctl restart ollama.service`
2. 모델 다운로드: `ollama pull gemma3`
3. 외부 접속 설정 확인

### 6.3 CORS 에러

**증상:**
- 브라우저 콘솔에 "CORS policy" 에러

**해결 방법:**

`whisper-server/server.py`에서 Vercel 도메인 추가:
```python
allow_origins=[
    "https://your-project.vercel.app",
    "https://stt.yourdomain.com",
]
```

수정 후 재배포:
```bash
ORACLE_IP=your-ip ./scripts/deploy-oracle.sh
```

### 6.4 타임아웃 에러

**증상:**
- "Request timeout" 에러 (특히 긴 오디오)

**원인:**
- Vercel Hobby 플랜: 10초 제한
- Pro 플랜: 300초 (5분) 제한

**해결 방법:**
1. 짧은 오디오만 처리 (< 30초 권장)
2. 클라이언트에서 오디오 청크 분할
3. Vercel Pro 플랜 고려

### 6.5 배포 후 환경 변수 인식 안 됨

**증상:**
- localhost:8000으로 요청 시도

**해결 방법:**
1. Vercel Dashboard에서 환경 변수 확인
2. 변수 이름이 `NUXT_`로 시작하는지 확인
3. Production 환경에 변수가 설정되어 있는지 확인
4. 재배포: `vercel --prod`

## 테스트 체크리스트

### 개별 서비스
- [ ] Whisper 헬스 체크 성공
- [ ] Whisper 음성 변환 성공
- [ ] Ollama 헬스 체크 성공
- [ ] Ollama 텍스트 생성 성공

### 로컬 통합
- [ ] 파일 업로드 STT 작동
- [ ] 실시간 음성 인식 작동
- [ ] AI 요약 기능 작동
- [ ] 에러 처리 정상

### Vercel 배포
- [ ] 프로덕션 URL 접속 가능
- [ ] 환경 변수 정상 작동
- [ ] 파일 업로드 STT 작동
- [ ] 실시간 음성 인식 작동
- [ ] AI 요약 기능 작동

### 성능
- [ ] Whisper 응답 시간 적절
- [ ] Ollama 응답 시간 적절
- [ ] 동시 요청 처리 가능
- [ ] 서버 안정성 확인

### 에러 처리
- [ ] 잘못된 파일 형식 에러 처리
- [ ] 네트워크 에러 처리
- [ ] 타임아웃 에러 처리
- [ ] CORS 설정 정상

## 자동화된 테스트 실행

전체 테스트를 한 번에 실행:

```bash
# 1. 서비스 테스트
ORACLE_IP=your-oracle-ip ./scripts/test-services.sh

# 2. 로컬 앱 테스트
npm run dev
# 브라우저에서 수동 테스트

# 3. Vercel 배포 테스트
vercel --prod
# 프로덕션 URL에서 수동 테스트
```

## 모니터링

### 실시간 로그 모니터링

**Whisper 서버:**
```bash
ssh ubuntu@your-oracle-ip
sudo tail -f /var/log/whisper.log
```

**Ollama 서버:**
```bash
ssh ubuntu@your-oracle-ip
sudo journalctl -u ollama -f
```

**Vercel 로그:**
```bash
vercel logs your-project.vercel.app
```

### 리소스 사용량 모니터링

```bash
ssh ubuntu@your-oracle-ip
htop  # CPU, 메모리 사용량
df -h  # 디스크 사용량
```

## 다음 단계

모든 테스트가 통과하면:
- ✅ 시스템 정상 작동
- ✅ 프로덕션 사용 가능
- ✅ 사용자에게 공개 가능

추가 최적화:
- [ ] HTTPS 설정 (Caddy/Nginx)
- [ ] 커스텀 도메인 설정
- [ ] 성능 모니터링 도구 추가
- [ ] 백업 및 복구 계획 수립

## 참고 자료

- [Oracle Cloud 배포 가이드](./oracle-cloud-setup.md)
- [Vercel 배포 가이드](./vercel-deployment.md)
- [배포 스크립트 사용법](../scripts/README.md)
