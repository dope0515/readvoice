# 클라이언트 측 Ollama 설정 가이드

## 개요

이 프로젝트는 AI 요약 기능을 위해 **사용자의 로컬 컴퓨터에서 Ollama를 실행**합니다.

### 장점

- ✅ **서버 메모리 부담 없음**: 저사양 서버도 문제없이 운영
- ✅ **빠른 응답 속도**: 사용자의 컴퓨터 성능을 직접 활용
- ✅ **오프라인 가능**: 인터넷 연결 없이도 요약 기능 사용
- ✅ **프라이버시**: 텍스트가 서버로 전송되지 않음

### 아키텍처

```
[브라우저] ─┬─→ [Vercel Nuxt 앱] ─→ [Oracle Cloud Whisper]
            │                        (음성→텍스트 변환)
            │
            └─→ [로컬 Ollama]
                (텍스트 요약, localhost:11434)
```

## 설치 방법

### 1. Ollama 다운로드 및 설치

#### macOS

```bash
# 공식 사이트에서 다운로드
open https://ollama.com/download

# 또는 Homebrew 사용
brew install ollama
```

#### Windows

1. https://ollama.com/download 방문
2. Windows installer 다운로드 및 실행

#### Linux

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### 2. 모델 다운로드

```bash
# tinyllama 모델 다운로드 (권장, 약 600MB)
ollama pull tinyllama
```

#### 다른 모델 옵션

| 모델 | 크기 | 메모리 | 특징 |
|------|------|--------|------|
| **tinyllama** | 600MB | ~0.6GB | 가장 빠르고 가벼움 ⭐️ |
| **gemma3** | 3GB | ~4GB | 더 나은 품질 |
| **qwen2.5** | 4GB | ~6GB | 한중일 언어 특화 |
| **llama3.2** | 2GB | ~3GB | 범용성 좋음 |

```bash
# 다른 모델 다운로드 예시
ollama pull gemma3
ollama pull qwen2.5
```

### 3. Ollama 서버 실행

#### macOS / Linux

```bash
# 포그라운드 실행
ollama serve

# 또는 백그라운드 실행 (시스템 서비스로 자동 시작됨)
# macOS: Ollama.app 실행 후 메뉴바에서 관리
```

#### Windows

```bash
# PowerShell에서 실행
ollama serve
```

### 4. 확인

```bash
# 모델 목록 확인
ollama list

# API 테스트
curl http://localhost:11434/api/version
```

예상 출력:
```json
{"version":"0.1.23"}
```

## 사용 방법

### 웹 앱에서 사용

1. Ollama가 실행 중인지 확인
2. 웹 앱(http://localhost:3000 또는 배포된 URL)에 접속
3. 음성을 텍스트로 변환
4. "요약하기" 버튼 클릭

브라우저가 자동으로 `http://localhost:11434`에 연결하여 요약을 생성합니다.

### 모델 변경

컴포넌트 파일에서 모델을 변경할 수 있습니다:

```typescript
// components/FileUploadSTT.vue 또는 RealtimeSTT.vue
const response = await fetch('http://localhost:11434/api/generate', {
  method: 'POST',
  body: JSON.stringify({
    model: 'tinyllama', // 여기를 'gemma3', 'qwen2.5' 등으로 변경
    // ...
  })
})
```

## 문제 해결

### Ollama에 연결할 수 없습니다

**증상**: "로컬 Ollama에 연결할 수 없습니다" 에러

**해결 방법**:

1. Ollama가 실행 중인지 확인:
   ```bash
   ps aux | grep ollama  # macOS/Linux
   tasklist | findstr ollama  # Windows
   ```

2. 포트 확인:
   ```bash
   curl http://localhost:11434/api/version
   ```

3. Ollama 재시작:
   ```bash
   # macOS/Linux
   pkill ollama
   ollama serve
   
   # Windows
   taskkill /IM ollama.exe /F
   ollama serve
   ```

### CORS 에러

**증상**: 브라우저 콘솔에 CORS 관련 에러

**해결 방법**: 

Ollama는 기본적으로 localhost에서 CORS를 허용합니다. 하지만 문제가 발생하면:

```bash
# macOS/Linux - 환경 변수 설정
export OLLAMA_ORIGINS="*"
ollama serve

# Windows - PowerShell
$env:OLLAMA_ORIGINS="*"
ollama serve
```

### 모델이 너무 느림

**원인**: 컴퓨터 메모리 부족

**해결 방법**:

1. 더 작은 모델 사용:
   ```bash
   ollama pull tinyllama  # 가장 가벼움
   ```

2. 다른 프로그램 종료하여 메모리 확보

3. 컴퓨터 사양 확인:
   - 최소: 4GB RAM
   - 권장: 8GB RAM 이상

### 모델을 찾을 수 없음

**증상**: "model not found" 에러

**해결 방법**:

```bash
# 설치된 모델 확인
ollama list

# 모델 다운로드
ollama pull tinyllama
```

## 성능 최적화

### 1. 적절한 모델 선택

- **저사양 PC (4-8GB RAM)**: `tinyllama`
- **중급 PC (8-16GB RAM)**: `gemma3` 또는 `llama3.2`
- **고사양 PC (16GB+ RAM)**: `qwen2.5` 또는 더 큰 모델

### 2. 프롬프트 최적화

현재 설정:
```typescript
prompt: `다음 텍스트를 3개 요점으로 요약:\n\n${text}`
```

더 짧은 응답을 원하면:
```typescript
options: {
  temperature: 0.3,
  num_predict: 100  // 기본 150에서 감소
}
```

### 3. 백그라운드 실행

#### macOS

```bash
# LaunchAgent로 자동 시작 설정
brew services start ollama
```

#### Linux (systemd)

```bash
# systemd 서비스로 등록
sudo systemctl enable ollama
sudo systemctl start ollama
```

#### Windows

Ollama.app을 시작 프로그램에 등록

## FAQ

### Q: Ollama를 설치하지 않으면 앱을 사용할 수 없나요?

A: 아니요! 음성 → 텍스트 변환 기능은 정상 작동합니다. **AI 요약 기능만** Ollama가 필요합니다.

### Q: 서버에서 Ollama를 실행하면 안 되나요?

A: Oracle Cloud Free Tier의 제한된 메모리(764MB)로는 Ollama를 안정적으로 실행하기 어렵습니다. 클라이언트 측 실행이 훨씬 효율적입니다.

### Q: 모바일에서도 사용할 수 있나요?

A: 현재는 데스크톱 브라우저에서만 지원됩니다. 모바일에서는 음성 변환만 가능하고, 요약 기능은 사용할 수 없습니다.

### Q: 인터넷 연결 없이 요약 기능을 사용할 수 있나요?

A: 네! 모델을 미리 다운로드하면 완전히 오프라인에서 요약 기능을 사용할 수 있습니다. (음성 변환은 서버 연결 필요)

### Q: 여러 탭에서 동시에 사용할 수 있나요?

A: 네! Ollama는 여러 요청을 큐에 넣어 순차적으로 처리합니다.

## 관련 문서

- [Ollama 공식 문서](https://ollama.com/docs)
- [지원 모델 목록](https://ollama.com/library)
- [프로젝트 README](../README.md)
- [배포 가이드](./deployment-guide.md)

## 지원

문제가 발생하면 [GitHub Issues](https://github.com/yourusername/stt/issues)에 보고해주세요.
