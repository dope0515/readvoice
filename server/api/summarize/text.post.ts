export default defineEventHandler(async (event) => {
  const { text, mode = 'summary', attendees = '', date = '' } = await readBody(event)
  
  if (!text) {
    throw createError({
      statusCode: 400,
      message: '요약할 텍스트가 없습니다.'
    })
  }

  const systemPrmopt = mode === 'meeting_minutes' 
    ? '당신은 전문적인 비서입니다. 제공된 텍스트를 바탕으로 완벽한 비즈니스 회의록을 추출하여, 반드시 다음의 JSON 형식으로만 응답하세요. 마크다운(```json)이나 다른 설명은 절대 포함하지 마세요.\n\n{\n  "topic": "회의 주제 요약",\n  "date": "회의 일시",\n  "attendees": "참석자 명단",\n  "discussions": ["주요 논의 사항 1", "주요 논의 사항 2"],\n  "decisions": ["결정 사항 1"],\n  "actionItems": ["추후 진행 및 확인 필요 사항 1"]\n}'
    : '당신은 텍스트를 간결하게 요약하는 전문가입니다. 핵심 내용을 3개 요점으로 요약해주세요.'

  const userPrompt = mode === 'meeting_minutes'
    ? `다음 내용으로 회의록을 생성해주세요:\n[회의 일시]: ${date || '미상'}\n[참석자]: ${attendees || '미상'}\n[내용]:\n${text}`
    : `다음 텍스트를 3개 요점으로 요약해주세요:\n\n${text}`
  
  try {
    const config = useRuntimeConfig()
    const groqApiKey = config.groqApiKey
    
    if (!groqApiKey) {
      throw createError({
        statusCode: 500,
        message: 'GROQ_API_KEY가 설정되지 않았습니다.'
      })
    }
    
    // Groq API Request Body
    const requestBody: any = {
      model: 'llama-3.3-70b-versatile', // 빠르고 정확한 모델
      messages: [
        {
          role: 'system',
          content: systemPrmopt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1024,
      top_p: 0.9
    }

    if (mode === 'meeting_minutes') {
      requestBody.response_format = { type: 'json_object' }
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
      body: requestBody
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
