"""
Whisper FastAPI 서버
OpenAI Whisper 모델을 사용하여 음성을 텍스트로 변환하는 REST API 서버
"""

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import whisper
import tempfile
import os
from pathlib import Path
import uvicorn

# FastAPI 앱 초기화
app = FastAPI(
    title="Whisper STT API",
    description="OpenAI Whisper를 사용한 음성-텍스트 변환 API",
    version="1.0.0"
)

# CORS 설정 (Nuxt 앱에서 접근 가능하도록)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인만 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Whisper 모델 (lazy loading - 첫 요청 시 로드)
model = None

def get_model():
    """Whisper 모델을 lazy loading으로 가져오기"""
    global model
    if model is None:
        print("Whisper 모델을 로딩 중입니다... (첫 실행 시 모델 다운로드로 시간이 걸릴 수 있습니다)")
        model = whisper.load_model("small")  # tiny, base, small, medium, large 중 선택
        print("Whisper 모델 로딩 완료!")
    return model


@app.get("/")
async def root():
    """서버 상태 확인"""
    return {
        "status": "running",
        "message": "Whisper STT API 서버가 실행 중입니다.",
        "model": "whisper-base"
    }


@app.post("/v1/audio/transcriptions")
async def transcribe_audio(
    file: UploadFile = File(...),
    model: str = Form(default="whisper-1")  # OpenAI API 호환성을 위한 파라미터
):
    """
    음성 파일을 텍스트로 변환
    
    OpenAI Whisper API 표준 형식을 따름:
    - Endpoint: POST /v1/audio/transcriptions
    - Request: multipart/form-data (file, model)
    - Response: { "text": "변환된 텍스트" }
    """
    
    # 파일 확장자 확인
    allowed_extensions = ['.wav', '.mp3', '.m4a', '.flac', '.ogg', '.webm']
    file_ext = Path(file.filename).suffix.lower() if file.filename else ''
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"지원하지 않는 파일 형식입니다. 지원 형식: {', '.join(allowed_extensions)}"
        )
    
    try:
        # 임시 파일에 오디오 저장
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_audio:
            content = await file.read()
            temp_audio.write(content)
            temp_audio_path = temp_audio.name
        
        # Whisper로 음성 인식
        print(f"음성 변환 시작: {file.filename}")
        whisper_model = get_model()  # 모델 가져오기 (필요 시 로드)
        result = whisper_model.transcribe(
            temp_audio_path,
            language="ko",  # 한국어 우선 (자동 감지도 가능)
            fp16=False  # CPU 사용 시 False 필요
        )
        
        # 임시 파일 삭제
        os.unlink(temp_audio_path)
        
        print(f"음성 변환 완료: {result['text'][:50]}...")
        
        # OpenAI API 표준 형식으로 응답
        return {
            "text": result["text"]
        }
        
    except Exception as e:
        # 임시 파일 정리
        if 'temp_audio_path' in locals() and os.path.exists(temp_audio_path):
            os.unlink(temp_audio_path)
        
        print(f"음성 변환 오류: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"음성 변환 중 오류가 발생했습니다: {str(e)}"
        )


@app.get("/health")
async def health_check():
    """헬스 체크 엔드포인트"""
    return {"status": "healthy"}


if __name__ == "__main__":
    print("=" * 50)
    print("Whisper STT 서버를 시작합니다...")
    print("서버 주소: http://localhost:8000")
    print("API 문서: http://localhost:8000/docs")
    print("=" * 50)
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
