import { reactive, readonly } from 'vue'

export const REGIONS = [
  { key: 'seoul', name: '서울' },
  { key: 'daejeon', name: '대전·충청' },
  { key: 'gumi', name: '구미·경북' },
  { key: 'gwangju', name: '광주·전라' },
  { key: 'busan', name: '부산' },
]

const STORAGE_KEY = 'lh_region'
const DEFAULT_REGION = 'daejeon'

function readStoredRegion() {
  const stored = localStorage.getItem(STORAGE_KEY)
  return REGIONS.some((r) => r.key === stored) ? stored : DEFAULT_REGION
}

const state = reactive({
  current: readStoredRegion(),
})

export function useRegion() {
  function setRegion(key) {
    if (!REGIONS.some((r) => r.key === key) || key === state.current) return
    state.current = key
    localStorage.setItem(STORAGE_KEY, key)
  }

  return {
    state: readonly(state),
    setRegion,
    REGIONS,
  }
}
