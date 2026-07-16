import { computed, reactive, watch } from 'vue'
import { useRegion } from './useRegion.js'

const state = reactive({
  loading: false,
  error: '',
  region: null,
  source: null,
  spots: [],
})

const cache = new Map()
const { state: regionState } = useRegion()

function applyCached(key) {
  const data = cache.get(key)
  if (!data) return
  state.region = data.region
  state.source = data.source
  state.spots = Array.isArray(data.spots) ? data.spots : []
}

async function loadSpots(regionKey) {
  const key = regionKey || regionState.current
  if (cache.has(key)) {
    applyCached(key)
    return
  }
  state.loading = true
  state.error = ''
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/${key}.json`)
    if (!response.ok) throw new Error(`관광지 JSON 로드 실패 (${response.status})`)
    const data = await response.json()
    cache.set(key, data)
    applyCached(key)
  } catch (error) {
    state.error = error instanceof Error ? error.message : '관광지 데이터를 불러오지 못했습니다.'
  } finally {
    state.loading = false
  }
}

// 지역이 바뀌면(인트로 지도 선택, 헤더 지역 전환 등) 해당 지역 데이터를 자동으로 불러온다.
watch(
  () => regionState.current,
  (key) => loadSpots(key),
)

export function useSpots() {
  return {
    state,
    loadSpots,
    featuredSpots: computed(() => state.spots.slice(0, 6)),
  }
}
