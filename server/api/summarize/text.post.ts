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
    const groqApiKey = config.groqApiKey
    
    if (!groqApiKey) {
      throw createError({
        statusCode: 500,
        message: 'GROQ_API_KEY가 설정되지 않았습니다.'
      })
    }
    
    // Groq Chat Completions API 호출
    const response = await $fetch<{
      choices: Array<{
        message: {
          content: string
        }
      }>
    }>('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        model: 'llama-3.3-70b-versatile', // 빠르고 정확한 모델
        messages: [
          {
            role: 'system',
            content: '당신은 텍스트를 간결하게 요약하는 전문가입니다. 핵심 내용을 3개 요점으로 요약해주세요.'
          },
          {
            role: 'user',
            content: `다음 텍스트를 3개 요점으로 요약해주세요:\n\n${text}`
          }
        ],
        temperature: 0.3,
        max_tokens: 300,
        top_p: 0.9
      }
    })
    
    const summary = response.choices[0]?.message?.content || '요약 생성 실패'
    
    return {
      success: true,
      summary
    }
  } catch (error: any) {
    console.error('Groq summarization error:', error)
    
    if (error.statusCode === 401) {
      throw createError({
        statusCode: 401,
        message: 'Groq API 키가 유효하지 않습니다.'
      })
    }
    
    if (error.statusCode === 429) {
      throw createError({
        statusCode: 429,
        message: 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'
      })
    }
    
    throw createError({
      statusCode: 500,
      message: '요약 생성에 실패했습니다.'
    })
  }
})
