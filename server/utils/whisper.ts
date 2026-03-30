// Groq API를 사용한 Whisper STT 유틸리티 함수

/**
 * Groq Whisper API로 오디오 파일 전송 및 텍스트 변환
 * 모델: whisper-large-v3 (최고 정확도)
 * @param contextPrompt 이전 청크 텍스트 — Whisper가 문맥을 이어받아 정확도를 높임
 */
export async function transcribeAudio(
  config: any,
  audioBlob: Blob,
  filename: string,
  model: string = 'whisper-large-v3',
  contextPrompt: string = ''
): Promise<string> {
  const groqApiKey = config.groqApiKey

  if (!groqApiKey) {
    throw createError({
      statusCode: 500,
      message: 'GROQ_API_KEY가 설정되지 않았습니다. .env 파일을 확인해주세요.',
    })
  }

  // Whisper prompt: 한국어 성능 향상을 위한 최소한의 프롬프트
  // 너무 길면 무음 시 프롬프트 자체가 결과로 반환되는 '환각' 현상이 발생할 수 있음
  const basePrompt = '한국어 음성 녹음입니다.'
  const prompt = contextPrompt
    ? `${contextPrompt.slice(-200)} ${basePrompt}`
    : basePrompt

  try {
    const formData = new FormData()
    formData.append('file', audioBlob, filename)
    formData.append('model', model) // 선택된 Groq Whisper 모델
    formData.append('language', 'ko') // 한국어 최적화
    formData.append('prompt', prompt)
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

    const text = response.text || ''

    // 환각(Hallucination) 필터링: 무음이나 노이즈 시 프롬프트가 반복되는 경우 제외
    const hallucinations = [
      basePrompt,
      '음성 녹음이 끝난 후에 띄어쓰기를 연결해 주시면 됩니다.',
      '한국어 음성 녹음',
      '음성 녹음이 끝난 후에 띄어쓰기를 연결해 주시면 됩니다. 한국어 음성 녹음'
    ]

    const trimmedText = text.trim()
    if (hallucinations.some(h => trimmedText.includes(h) && trimmedText.length <= h.length + 5)) {
      console.log('Filtered Whisper hallucination:', trimmedText)
      return ''
    }

    return text
  } catch (error: any) {
    console.error('Groq Whisper API error:', error)
    
    if (error.response) {
      // ofetch 에러 (에러 응답 본문)
      console.error('Groq API Error details:', error.response._data)
      throw createError({
        statusCode: error.response.status || 500,
        message: `API Error: ${error.response._data?.error?.message || error.message}`,
      })
    }
    
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
      message: `음성 변환 실패: ${error.message || '알 수 없는 에러'}`,
    })
  }
}
