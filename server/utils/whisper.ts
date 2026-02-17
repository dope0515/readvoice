// Groq API를 사용한 Whisper STT 유틸리티 함수

/**
 * Groq Whisper API로 오디오 파일 전송 및 텍스트 변환
 * 모델: whisper-large-v3 (최고 정확도)
 */
export async function transcribeAudio(
  config: any,
  audioBlob: Blob,
  filename: string
): Promise<string> {
  const groqApiKey = config.groqApiKey

  if (!groqApiKey) {
    throw createError({
      statusCode: 500,
      message: 'GROQ_API_KEY가 설정되지 않았습니다. .env 파일을 확인해주세요.',
    })
  }

  try {
    const formData = new FormData()
    formData.append('file', audioBlob, filename)
    formData.append('model', 'whisper-large-v3') // Groq의 Whisper 모델
    formData.append('language', 'ko') // 한국어 최적화
    formData.append('response_format', 'json')

    const response = await $fetch<{ text: string }>(
      'https://api.groq.com/openai/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
        },
        body: formData,
      }
    )

    return response.text
  } catch (error: any) {
    console.error('Groq Whisper API error:', error)
    
    if (error.statusCode === 401) {
      throw createError({
        statusCode: 401,
        message: 'Groq API 키가 유효하지 않습니다.',
      })
    }
    
    if (error.statusCode === 429) {
      throw createError({
        statusCode: 429,
        message: 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
      })
    }
    
    throw createError({
      statusCode: 500,
      message: '음성 변환에 실패했습니다.',
    })
  }
}
