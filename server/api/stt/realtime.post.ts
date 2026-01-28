import { readMultipartFormData } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    // 1. 사용량 체크
    const usageCheck = await checkUsageLimit()
    if (!usageCheck.isAvailable) {
      throw createError({
        statusCode: 429,
        message: `무료 사용량(${usageCheck.limitMinutes}분)을 초과했습니다. 현재 ${Math.floor(usageCheck.totalMinutes)}분 사용 중입니다.`,
      })
    }

    const config = useRuntimeConfig()
    
    // 2. multipart/form-data 파싱
    const formData = await readMultipartFormData(event)
    
    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        message: '오디오 데이터가 업로드되지 않았습니다.',
      })
    }

    // 오디오 파일 찾기
    const audioField = formData.find(field => field.name === 'audio')
    
    if (!audioField || !audioField.data) {
      throw createError({
        statusCode: 400,
        message: '올바른 오디오 데이터가 업로드되지 않았습니다.',
      })
    }

    const filename = audioField.filename || 'recording.wav'
    const audioBlob = new Blob([audioField.data])

    // 3. RTZR API로 오디오 업로드 및 STT 시작
    const transcriptionId = await uploadFileForSTT(config, audioBlob, filename)

    // 4. 변환 완료까지 대기 (최대 2분)
    const text = await waitForTranscription(config, transcriptionId, 60, 2000)

    // 5. 전체 결과 조회하여 오디오 길이 계산
    const fullResult = await getTranscriptionFullResult(config, transcriptionId)
    const durationMinutes = calculateAudioDuration(fullResult.results.utterances)
    
    // 6. 사용량 기록
    const usageUpdate = await addUsage(durationMinutes, 'realtime')

    return {
      success: true,
      text,
      transcriptionId,
      usedMinutes: Math.round(durationMinutes * 100) / 100,
      remainingMinutes: Math.round(usageUpdate.remainingMinutes * 100) / 100,
      isLocked: usageUpdate.isLocked
    }
  } catch (error: any) {
    console.error('Realtime API error:', error)
    
    // 이미 생성된 에러인 경우 그대로 전달
    if (error.statusCode) {
      throw error
    }

    // 그 외의 에러
    throw createError({
      statusCode: 500,
      message: error.message || '음성 인식 중 오류가 발생했습니다.',
    })
  }
})
