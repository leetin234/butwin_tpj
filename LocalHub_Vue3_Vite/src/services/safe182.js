// 경찰청 실종아동정보 서비스 (안전Dream) 오픈API 연동
//
// 공공데이터포털 카탈로그: https://www.data.go.kr/data/3052083/openapi.do
// 활용신청 후 발급되는 esntlId(기관 ID) + authKey(인증키)가 필요합니다.
// 실제 요청/응답 필드명은 활용신청 승인 후 내려주는 "실종아동정보서비스 활용가이드" PDF를
// 기준으로 아래 normalizeMissingPerson()을 다시 확인/수정해야 합니다.
// (이 파일은 카탈로그에 공개된 정보만으로 구조를 잡았고, 실제 호출 검증은 하지 못했습니다.)
//
// 주의: 정부 공공API 다수가 브라우저 직접 호출 시 CORS를 막아둡니다.
// 막히면 Netlify Functions 같은 가벼운 프록시 함수를 하나 만들어 그 안에서 호출하세요.

const SAFE182_BASE_URL = 'https://www.safe182.go.kr/api/lcm/findChildList.do'

export function hasSafe182Key() {
  return Boolean(import.meta.env.VITE_SAFE182_ESNTL_ID && import.meta.env.VITE_SAFE182_AUTH_KEY)
}

function normalizeMissingPerson(raw) {
  return {
    id: raw.msspsnIdntfccd || raw.id || crypto.randomUUID?.() || String(Math.random()),
    name: raw.nm || raw.name || '이름 비공개',
    category: raw.writngTrgetDscd === '010' ? '실종아동' : raw.writngTrgetDscd === '070' ? '치매어르신' : '지적장애 등',
    gender: raw.sexdstnDscd === '1' ? '남' : raw.sexdstnDscd === '2' ? '여' : '-',
    age: raw.ageNow || raw.age || '-',
    location: raw.occrAdres || raw.location || '위치 정보 없음',
    date: raw.occrde || raw.date || '',
    photoUrl: raw.tknphotoFile || '',
  }
}

/**
 * 실종아동등 정보를 가져옵니다. 키가 없거나 호출이 실패하면 null을 반환하니
 * 호출부에서 샘플 데이터로 대체하세요.
 */
export async function fetchMissingPersons({ rowSize = 8 } = {}) {
  if (!hasSafe182Key()) return null

  const esntlId = import.meta.env.VITE_SAFE182_ESNTL_ID
  const authKey = import.meta.env.VITE_SAFE182_AUTH_KEY

  try {
    const response = await fetch(SAFE182_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ esntlId, authKey, rowSize: String(rowSize) }),
    })
    if (!response.ok) throw new Error(`safe182 API 오류 (${response.status})`)

    const data = await response.json()
    const items = data?.list || data?.data || []
    if (!Array.isArray(items) || !items.length) return []

    return items.map(normalizeMissingPerson)
  } catch (error) {
    console.warn('[safe182.js] 실종아동정보를 불러오지 못했습니다. 샘플 데이터로 대체합니다.', error)
    return null
  }
}
