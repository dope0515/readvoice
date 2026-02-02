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
    
    const ollama = new Ollama({ host: ollamaHost })
    
    const response = await ollama.chat({
      model: ollamaModel,
      messages: [{
        role: 'user',
        content: `다음 텍스트를 3-5개의 핵심 요점으로 요약해주세요. 각 요점은 한 문장으로 작성하고, 불렛 포인트 형식으로 출력하세요:\n\n${text}`
      }],
      stream: false
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
