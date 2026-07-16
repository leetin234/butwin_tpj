export function hasOpenAIKey() {
  return Boolean(import.meta.env.VITE_OPENAI_API_KEY)
}

export async function askOpenAI({ question, spots, posts }) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_KEY_MISSING')

  const model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-5-mini'
  const spotContext = spots
    .slice(0, 14)
    .map((spot) => `${spot.title}: ${spot.addr} (위도 ${spot.lat}, 경도 ${spot.lng})`)
    .join('\n')
  const postContext = posts
    .slice(0, 15)
    .map((post) => `${post.title}: ${post.content}`)
    .join('\n')

  const payload = {
    model,
    messages: [
      {
        role: 'system',
        content: `너는 LocalHub 대전·충청 지역 정보 챗봇이다. 반드시 아래 제공 JSON과 커뮤니티 게시글 내용만 근거로 한국어로 답한다. 데이터에 없는 운영시간, 가격, 일정은 추측하지 말고 확인이 필요하다고 말한다.

[관광지 JSON]
${spotContext}

[커뮤니티 게시글]
${postContext}`,
      },
      { role: 'user', content: question },
    ],
  }

  // Newer gpt-5 family models restrict tunable params like `temperature`.
  // Only include `temperature` for models that support it.
  if (!model || !String(model).startsWith('gpt-5')) {
    payload.temperature = 0.25
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI API 오류 (${response.status}): ${errorText.slice(0, 180)}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content?.trim() || '답변을 생성하지 못했습니다.'
}
