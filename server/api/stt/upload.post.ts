import { readMultipartFormData } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    
    // 1. multipart/form-data 파싱
    const formData = await readMultipartFormData(event)
    
    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        message: '파일이 업로드되지 않았습니다.',
      })
    }

    // 파일 찾기
    const fileField = formData.find(field => field.name === 'file')
    
    if (!fileField || !fileField.data) {
      throw createError({
        statusCode: 400,
        message: '올바른 파일이 업로드되지 않았습니다.',
      })
    }

    const filename = fileField.filename || 'audio.wav'
    const fileBlob = new Blob([fileField.data])

    // 2. Whisper API로 음성 변환
    const text = await transcribeAudio(config, fileBlob, filename)

    return {
      success: true,
      text
    }
  } catch (error: any) {
    console.error('Upload API error:', error)
    
    // 이미 생성된 에러인 경우 그대로 전달
    if (error.statusCode) {
      throw error
    }

    // 그 외의 에러
    throw createError({
      statusCode: 500,
      message: error.message || '파일 변환 중 오류가 발생했습니다.',
    })
  }
})
