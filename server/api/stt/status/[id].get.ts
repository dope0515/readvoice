export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const transcriptionId = getRouterParam(event, 'id')

    if (!transcriptionId) {
      throw createError({
        statusCode: 400,
        message: 'Transcription ID가 제공되지 않았습니다.',
      })
    }

    // STT 작업 상태 조회
    const status = await getTranscriptionStatus(config, transcriptionId)

    return {
      success: true,
      status: status.status,
      progress: status.progress,
    }
  } catch (error: any) {
    console.error('Status API error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: error.message || '상태 조회 중 오류가 발생했습니다.',
    })
  }
})
