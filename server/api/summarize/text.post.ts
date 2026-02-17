import { Ollama } from 'ollama'

export default defineEventHandler(async (event) => {
  const { text } = await readBody(event)
  
  if (!text) {
    throw createError({
      statusCode: 400,
      message: '요약할 텍스트가 없습니다.'
    })
  }
  
  try {
    const config = useRuntimeConfig()
    const ollamaHost = config.ollama?.host || 'http://localhost:11434'
    const ollamaModel = config.ollama?.model || 'gemma3'
    
    const ollama = new Ollama({ 
      host: ollamaHost,
      fetch: (url, options) => {
        return fetch(url, {
          ...options,
          signal: AbortSignal.timeout(60000) // 60초 타임아웃
        })
      }
    })
    
    const response = await ollama.chat({
      model: ollamaModel,
      messages: [{
        role: 'user',
        content: `다음 텍스트를 3개 요점으로 요약:\n\n${text}`
      }],
      stream: false,
      options: {
        temperature: 0.3,      // 더 일관된 출력
        top_p: 0.9,            // 샘플링 최적화
        num_predict: 150       // 최대 토큰 제한
      }
    })
    
    return {
      success: true,
      summary: response.message.content
    }
  } catch (error: any) {
    console.error('Ollama summarization error:', error)
    
    if (error.message?.includes('ECONNREFUSED') || error.code === 'ECONNREFUSED') {
      throw createError({
        statusCode: 503,
        message: 'Ollama 서버에 연결할 수 없습니다. Ollama가 실행 중인지 확인해주세요.'
      })
    }
    
    throw createError({
      statusCode: 500,
      message: '요약 생성에 실패했습니다.'
    })
  }
})
