"""
Whisper STT FastAPI 서버
OpenAI Whisper API 호환 엔드포인트 제공
"""

import os
import tempfile
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import whisper
import uvicorn
from pathlib import Path

# FastAPI 앱 초기화
app = FastAPI(title="Whisper STT API", version="1.0.0")

# CORS 설정 (Vercel 도메인 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://*.vercel.app",
        "https://*.yourdomain.com",  # 실제 도메인으로 변경
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Whisper 모델 로드 (환경 변수로 모델 선택 가능)
MODEL_SIZE = os.getenv("WHISPER_MODEL", "base")  # tiny, base, small, medium, large
print(f"Loading Whisper model: {MODEL_SIZE}")
model = whisper.load_model(MODEL_SIZE)
print("Whisper model loaded successfully!")


@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {
        "message": "Whisper STT API Server",
        "version": "1.0.0",
        "model": MODEL_SIZE,
        "endpoints": {
            "transcribe": "/v1/audio/transcriptions",
            "health": "/health"
        }
    }


@app.get("/health")
async def health_check():
    """헬스 체크 엔드포인트"""
    return {
        "status": "healthy",
        "model": MODEL_SIZE,
        "model_loaded": model is not None
    }


@app.post("/v1/audio/transcriptions")
async def transcribe_audio(
    file: UploadFile = File(...),
    model_name: str = Form("whisper-1"),
    language: str = Form(None),
    prompt: str = Form(None),
    response_format: str = Form("json"),
    temperature: float = Form(0.0)
):
    """
    OpenAI Whisper API 호환 음성-텍스트 변환 엔드포인트
    
    Parameters:
    - file: 오디오 파일 (WAV, MP3, M4A, FLAC, OGG 등)
    - model: 모델 이름 (whisper-1, 호환성을 위해 포함)
    - language: 언어 코드 (선택사항, 예: 'ko', 'en')
    - prompt: 컨텍스트 프롬프트 (선택사항)
    - response_format: 응답 형식 (json, text, srt, vtt)
    - temperature: 샘플링 온도 (0.0 ~ 1.0)
    
    Returns:
    - JSON: {"text": "변환된 텍스트"}
    """
    
    if not file:
        raise HTTPException(status_code=400, detail="오디오 파일이 업로드되지 않았습니다.")
    
    # 지원되는 오디오 형식 확인
    allowed_extensions = {'.wav', '.mp3', '.m4a', '.flac', '.ogg', '.webm', '.mp4'}
    file_ext = Path(file.filename).suffix.lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"지원되지 않는 파일 형식입니다. 지원 형식: {', '.join(allowed_extensions)}"
        )
    
    try:
        # 임시 파일로 저장
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        # Whisper로 음성 변환
        transcribe_options = {
            "temperature": temperature,
            "fp16": False,  # CPU 환경에서는 False로 설정
        }
        
        if language:
            transcribe_options["language"] = language
        
        if prompt:
            transcribe_options["initial_prompt"] = prompt
        
        result = model.transcribe(temp_file_path, **transcribe_options)
        
        # 임시 파일 삭제
        os.unlink(temp_file_path)
        
        # 응답 형식에 따라 결과 반환
        if response_format == "text":
            return result["text"]
        elif response_format == "srt":
            # SRT 형식 생성 (세그먼트 정보 활용)
            srt_content = generate_srt(result["segments"])
            return srt_content
        elif response_format == "vtt":
            # VTT 형식 생성
            vtt_content = generate_vtt(result["segments"])
            return vtt_content
        else:  # json (기본값)
            return JSONResponse(content={
                "text": result["text"]
            })
    
    except Exception as e:
        # 에러 발생 시 임시 파일 정리
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)
        
        # 디버깅을 위한 에러 출력
        import traceback
        print(f"ERROR: {str(e)}")
        traceback.print_exc()
        
        raise HTTPException(
            status_code=500,
            detail=f"음성 변환 중 오류가 발생했습니다: {str(e)}"
        )


def generate_srt(segments):
    """세그먼트 정보로부터 SRT 자막 생성"""
    srt_lines = []
    for i, segment in enumerate(segments, start=1):
        start_time = format_timestamp_srt(segment["start"])
        end_time = format_timestamp_srt(segment["end"])
        text = segment["text"].strip()
        
        srt_lines.append(f"{i}")
        srt_lines.append(f"{start_time} --> {end_time}")
        srt_lines.append(text)
        srt_lines.append("")  # 빈 줄
    
    return "\n".join(srt_lines)


def generate_vtt(segments):
    """세그먼트 정보로부터 VTT 자막 생성"""
    vtt_lines = ["WEBVTT", ""]
    
    for segment in segments:
        start_time = format_timestamp_vtt(segment["start"])
        end_time = format_timestamp_vtt(segment["end"])
        text = segment["text"].strip()
        
        vtt_lines.append(f"{start_time} --> {end_time}")
        vtt_lines.append(text)
        vtt_lines.append("")  # 빈 줄
    
    return "\n".join(vtt_lines)


def format_timestamp_srt(seconds):
    """초를 SRT 타임스탬프 형식으로 변환 (HH:MM:SS,mmm)"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def format_timestamp_vtt(seconds):
    """초를 VTT 타임스탬프 형식으로 변환 (HH:MM:SS.mmm)"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    print(f"Starting Whisper STT Server on {host}:{port}")
    print(f"Model: {MODEL_SIZE}")
    print(f"CORS enabled for Vercel deployments")
    
    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info"
    )
