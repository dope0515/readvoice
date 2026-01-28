// RTZR STT API 유틸리티 함수
interface TokenCache {
  token: string
  expiresAt: number
}

let tokenCache: TokenCache | null = null

/**
 * RTZR API 액세스 토큰 발급
 */
export async function getAccessToken(config: any): Promise<string> {
  const now = Date.now()
  
  // 캐시된 토큰이 있고 아직 유효한 경우 재사용
  if (tokenCache && tokenCache.expiresAt > now + 60000) {
    return tokenCache.token
  }

  const { clientId, clientSecret, apiBaseUrl } = config.rtzr

  try {
    const response = await $fetch<{ access_token: string; expires_in: number }>(
      `${apiBaseUrl}/authenticate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
        }),
      }
    )

    // 토큰 캐시 저장 (만료 시간 - 1분)
    tokenCache = {
      token: response.access_token,
      expiresAt: now + (response.expires_in * 1000) - 60000,
    }

    return response.access_token
  } catch (error: any) {
    console.error('Failed to get access token:', error)
    throw createError({
      statusCode: 500,
      message: '인증 토큰 발급에 실패했습니다.',
    })
  }
}

/**
 * 파일을 RTZR API에 업로드하고 STT 작업 시작
 */
export async function uploadFileForSTT(
  config: any,
  file: Blob,
  filename: string
): Promise<string> {
  const token = await getAccessToken(config)
  const { apiBaseUrl } = config.rtzr

  try {
    const formData = new FormData()
    formData.append('file', file, filename)
    formData.append('config', JSON.stringify({
      use_diarization: false,
      use_itn: true,
      use_disfluency_filter: false,
      use_profanity_filter: false,
    }))

    const response = await $fetch<{ id: string }>(
      `${apiBaseUrl}/transcribe`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    )

    return response.id
  } catch (error: any) {
    console.error('Failed to upload file:', error)
    throw createError({
      statusCode: 500,
      message: '파일 업로드에 실패했습니다.',
    })
  }
}

/**
 * STT 작업 상태 확인
 */
export async function getTranscriptionStatus(
  config: any,
  transcriptionId: string
): Promise<{ status: string; progress?: number }> {
  const token = await getAccessToken(config)
  const { apiBaseUrl } = config.rtzr

  try {
    const response = await $fetch<{ status: string; progress?: number }>(
      `${apiBaseUrl}/transcribe/${transcriptionId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    return response
  } catch (error: any) {
    console.error('Failed to get transcription status:', error)
    throw createError({
      statusCode: 500,
      message: '변환 상태 조회에 실패했습니다.',
    })
  }
}

/**
 * STT 작업 결과 조회
 */
export async function getTranscriptionResult(
  config: any,
  transcriptionId: string
): Promise<string> {
  const token = await getAccessToken(config)
  const { apiBaseUrl } = config.rtzr

  try {
    const response = await $fetch<{
      results: {
        utterances: Array<{
          msg: string
          spk?: number
          start_at: number
          duration: number
        }>
      }
    }>(`${apiBaseUrl}/transcribe/${transcriptionId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    // 모든 utterances의 텍스트를 결합
    const text = response.results.utterances
      .map(u => u.msg)
      .join(' ')

    return text
  } catch (error: any) {
    console.error('Failed to get transcription result:', error)
    throw createError({
      statusCode: 500,
      message: '변환 결과 조회에 실패했습니다.',
    })
  }
}

/**
 * STT 작업 전체 결과 조회 (utterances 포함)
 */
export async function getTranscriptionFullResult(
  config: any,
  transcriptionId: string
) {
  const token = await getAccessToken(config)
  const { apiBaseUrl } = config.rtzr

  try {
    const response = await $fetch<{
      results: {
        utterances: Array<{
          msg: string
          spk?: number
          start_at: number
          duration: number
        }>
      }
    }>(`${apiBaseUrl}/transcribe/${transcriptionId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return response
  } catch (error: any) {
    console.error('Failed to get transcription full result:', error)
    throw createError({
      statusCode: 500,
      message: '변환 결과 조회에 실패했습니다.',
    })
  }
}

/**
 * utterances에서 총 오디오 길이 계산 (분 단위)
 */
export function calculateAudioDuration(utterances: Array<{ duration: number }>): number {
  const totalMs = utterances.reduce((sum, u) => sum + u.duration, 0)
  const totalMinutes = totalMs / 60000
  // 최소 10초 (0.167분) 청구
  return Math.max(totalMinutes, 0.167)
}

/**
 * STT 작업이 완료될 때까지 폴링
 */
export async function waitForTranscription(
  config: any,
  transcriptionId: string,
  maxAttempts: number = 60,
  intervalMs: number = 2000
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await getTranscriptionStatus(config, transcriptionId)

    if (status.status === 'completed') {
      return await getTranscriptionResult(config, transcriptionId)
    } else if (status.status === 'failed') {
      throw createError({
        statusCode: 500,
        message: '음성 변환에 실패했습니다.',
      })
    }

    // 다음 체크까지 대기
    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }

  throw createError({
    statusCode: 408,
    message: '음성 변환 시간이 초과되었습니다.',
  })
}
