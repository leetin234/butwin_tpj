// 국가교통정보센터(ITS, its.go.kr) 실시간 도로 CCTV 오픈API 연동
//
// 문서: https://www.its.go.kr/opendata  (회원가입 후 마이페이지 > 인증키 발급)
// 요청 예시(공식 개발가이드 샘플 기준):
//   http://openapi.its.go.kr/api/NCCTVInfo?key=발급키&ReqType=2
//     &MinX=127.10&MaxX=128.89&MinY=34.10&MaxY=39.10&type=ex
//   - type=ex  : 고속도로
//   - type=its : 국도
//
// 주의:
// 1) 이 API는 XML을 기본으로 응답하는 구버전 방식이라 브라우저에서 CORS로 막힐 수 있습니다.
//    막힐 경우 Netlify Functions 같은 간단한 서버리스 프록시를 하나 두고 그 안에서 fetch해야 합니다.
// 2) 실제 필드명은 발급받은 계정으로 호출해본 뒤 아래 normalizeCctvItem()에서 확인/수정하세요.
//    (공식 매뉴얼 PDF의 응답 스키마를 기준으로 삼되, 여기서는 실호출 검증을 하지 못했습니다.)

const ITS_BASE_URL = 'https://openapi.its.go.kr/api/NCCTVInfo'

export function hasItsKey() {
  return Boolean(import.meta.env.VITE_ITS_API_KEY)
}

function normalizeCctvItem(raw) {
  return {
    id: raw.cctvid || raw.id || `${raw.coordx}-${raw.coordy}`,
    name: raw.cctvname || raw.name || '이름 미상 CCTV',
    lat: Number(raw.coordy ?? raw.lat),
    lng: Number(raw.coordx ?? raw.lng),
    streamUrl: raw.cctvurl || raw.url || '',
    roadType: raw.type || raw.roadType || '',
  }
}

/**
 * 지정한 권역(bbox)의 실시간 CCTV 목록을 가져옵니다.
 * 키가 없거나 호출이 실패하면 null을 반환하니, 호출부에서 샘플 데이터로 대체하세요.
 * @param {{minX:number,maxX:number,minY:number,maxY:number}} bbox 조회할 권역 좌표 범위
 */
export async function fetchCctvList(bbox) {
  if (!hasItsKey() || !bbox) return null

  const key = import.meta.env.VITE_ITS_API_KEY

  try {
    const url = `${ITS_BASE_URL}?key=${encodeURIComponent(key)}&ReqType=2&MinX=${bbox.minX}&MaxX=${bbox.maxX}&MinY=${bbox.minY}&MaxY=${bbox.maxY}&type=its`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`ITS API 오류 (${response.status})`)

    const data = await response.json()
    const items = data?.response?.data || data?.body?.items?.item || data?.data || []
    if (!Array.isArray(items) || !items.length) return []

    return items.map(normalizeCctvItem).filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng))
  } catch (error) {
    console.warn('[its.js] CCTV 목록을 불러오지 못했습니다. 샘플 데이터로 대체합니다.', error)
    return null
  }
}
