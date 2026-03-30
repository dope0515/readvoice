export default defineEventHandler(async (event) => {
  const { text, mode = 'summary', attendees = '', date = '' } = await readBody(event)
  
  if (!text) {
    throw createError({
      statusCode: 400,
      message: '요약할 텍스트가 없습니다.'
    })
  }

  let systemPrompt = ''
  let userPrompt = ''

  if (mode === 'meeting_minutes') {
    systemPrompt = `당신은 전문적인 비서입니다. 음성 인식(STT) 과정에서 발생한 불필요한 노이즈(의미 없는 영어 단어, 특수 문자, 반복되는 단어 등)는 무시하고, 실제 의미가 있는 핵심 내용만 추출하여 회의록을 작성하세요.
반드시 다음 규칙을 지키세요:
1. 한자(漢字)는 사용하지 말고 알기 쉬운 한국어로 작성하세요.
2. 문맥상 어색한 영문 단어나 사이트 주소 등 STT 오류로 보이는 내용은 무시하세요.
3. 완벽한 비즈니스 회의록을 추출하여, 반드시 다음의 JSON 형식으로만 응답하세요. 마크다운( \`\`\`json )이나 다른 설명은 절대 포함하지 마세요.

{
  "topic": "회의 주제 요약",
  "date": "회의 일시",
  "attendees": "참석자 명단",
  "discussions": ["주요 논의 사항 1", "주요 논의 사항 2"],
  "decisions": ["결정 사항 1"],
  "actionItems": ["추후 진행 및 확인 필요 사항 1"]
}`
    userPrompt = `다음 내용에서 노이즈를 제거하고 회의록을 생성해주세요:\n[회의 일시]: ${date || '미상'}\n[참석자]: ${attendees || '미상'}\n[내용]:\n${text}`
  } else if (mode === 'summary') {
    systemPrompt = '당신은 텍스트 요약 전문가입니다. 음성 인식 오류로 인한 불필요한 영어, 특수 문자, 노이즈를 제거하고 핵심 내용만 3개 요점으로 요약해주세요. 한자(漢字)는 사용하지 마세요.'
    userPrompt = `다음 텍스트에서 노이즈를 제거하고 3개 요점으로 요약해주세요:\n\n${text}`
  } else if (mode === 'format') {
    systemPrompt = `당신은 한국어 텍스트 전문 편집자입니다. 음성 인식(STT) 결과물에서 다음 규칙에 따라 불필요한 요소를 제거하고 자연스러운 문장으로 교정하세요:
1. 문맥과 상관없는 무의미한 영어 단어, 특수 문자, 외국어 노이즈(예: matte, avis 등)는 완전히 삭제하세요.
2. 한자(漢字)는 한국어(한글)로 변환하거나 삭제하여 순수 한글 위주로 작성하세요.
3. 불필요한 반복이나 '음', '어' 같은 간투사를 제거하세요.
4. 문법에 맞게 교정하고 의미 단위로 단락을 구분하세요.
5. 원래 내용을 요약하지 말고 의미를 유지하며 문장만 다듬으세요.
6. 교정된 텍스트만 출력하고 설명이나 주석은 절대 포함하지 마세요.`
    userPrompt = `다음 음성 변환 텍스트를 깨끗하게 교정해주세요:\n\n${text}`
  } else if (mode === 'diarization') {
    systemPrompt = '당신은 회의 텍스트에서 화자를 구분하는 전문가입니다. 제공된 텍스트를 분석하여 문맥, 말투, 내용의 변화를 기반으로 화자를 추론하여 구분해주세요.\n반드시 다음 JSON 배열 형식으로만 응답하세요. 마크다운이나 다른 설명은 절대 포함하지 마세요.\n[\n  {"speaker": "화자 1", "text": "발화 내용"},\n  {"speaker": "화자 2", "text": "발화 내용"}\n]\n\n규칙:\n- 화자는 "화자 1", "화자 2" 등으로 명명\n- 같은 화자가 연속으로 발화해도 분리 가능\n- 각 발화 단위는 완결된 문장 또는 의미 단위로 분리\n- 최소 2명 이상의 화자로 구분 시도'
    userPrompt = `다음 회의 텍스트에서 화자를 구분해주세요:\n\n${text}`
  } else {
    throw createError({ statusCode: 400, message: '지원하지 않는 모드입니다.' })
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
    
    const requestBody: any = {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: mode === 'format' ? 0.1 : 0.3,
      max_tokens: mode === 'diarization' ? 2048 : 1024,
      top_p: 0.9
    }

    if (mode === 'meeting_minutes' || mode === 'diarization') {
      requestBody.response_format = { type: 'json_object' }
    }

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
    
    let summary = response.choices[0]?.message?.content || '처리 실패'

    // diarization: JSON object → JSON array 추출
    if (mode === 'diarization') {
      try {
        const parsed = JSON.parse(summary)
        // LLM이 {segments:[...]} 또는 {diarization:[...]} 등으로 감쌀 수 있으므로 배열 추출
        if (Array.isArray(parsed)) {
          summary = JSON.stringify(parsed)
        } else {
          // 첫 번째 배열 값을 찾아 반환
          const arrKey = Object.keys(parsed).find(k => Array.isArray(parsed[k]))
          summary = arrKey ? JSON.stringify(parsed[arrKey]) : summary
        }
      } catch (e) {
        // JSON 파싱 실패 시 원본 반환
      }
    }
    
    return {
      success: true,
      summary
    }
  } catch (error: any) {
    console.error('Groq summarization error:', error)
    
    if (error.statusCode === 401) {
      throw createError({ statusCode: 401, message: 'Groq API 키가 유효하지 않습니다.' })
    }
    
    if (error.statusCode === 429) {
      throw createError({ statusCode: 429, message: 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.' })
    }
    
    throw createError({ statusCode: 500, message: '요약 생성에 실패했습니다.' })
  }
})
