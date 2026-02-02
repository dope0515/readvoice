// Whisper STT API 유틸리티 함수

/**
 * Whisper API로 오디오 파일 전송 및 텍스트 변환
 */
export async function transcribeAudio(
  config: any,
  audioBlob: Blob,
  filename: string
): Promise<string> {
  const { apiBaseUrl } = config.whisper

  try {
    const formData = new FormData()
    formData.append('file', audioBlob, filename)
    formData.append('model', 'whisper-1') // OpenAI 표준 모델명

    const response = await $fetch<{ text: string }>(
      `${apiBaseUrl}/v1/audio/transcriptions`,
      {
        method: 'POST',
        body: formData,
      }
    )

    return response.text
  } catch (error: any) {
    console.error('Failed to transcribe audio:', error)
    throw createError({
      statusCode: 500,
      message: '음성 변환에 실패했습니다.',
    })
  }
}
