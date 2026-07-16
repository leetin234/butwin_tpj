// 지역 선택 UI/문구에서 쓰는 지역명의 언어별 표기.
// full: "OO·OO" 형태(게시판/홈/푸터 등에서 사용), short: 도시명만(지도/챗봇/Finder 등에서 사용)

export const REGION_NAMES_FULL = {
  ko: { seoul: '서울', daejeon: '대전·충청', gumi: '구미·경북', gwangju: '광주·전라', busan: '부산' },
  en: { seoul: 'Seoul', daejeon: 'Daejeon·Chungcheong', gumi: 'Gumi·Gyeongbuk', gwangju: 'Gwangju·Jeolla', busan: 'Busan' },
  ja: { seoul: 'ソウル', daejeon: '大田・忠清', gumi: '亀尾・慶北', gwangju: '光州・全羅', busan: '釜山' },
  zh: { seoul: '首尔', daejeon: '大田·忠清', gumi: '龟尾·庆北', gwangju: '光州·全罗', busan: '釜山' },
  ru: { seoul: 'Сеул', daejeon: 'Дэчон·Чхунчхон', gumi: 'Куми·Кёнбук', gwangju: 'Кванджу·Чолла', busan: 'Пусан' },
  vi: { seoul: 'Seoul', daejeon: 'Daejeon·Chungcheong', gumi: 'Gumi·Gyeongbuk', gwangju: 'Gwangju·Jeolla', busan: 'Busan' },
}

export const REGION_NAMES_SHORT = {
  ko: { seoul: '서울', daejeon: '대전', gumi: '구미', gwangju: '광주', busan: '부산' },
  en: { seoul: 'Seoul', daejeon: 'Daejeon', gumi: 'Gumi', gwangju: 'Gwangju', busan: 'Busan' },
  ja: { seoul: 'ソウル', daejeon: '大田', gumi: '亀尾', gwangju: '光州', busan: '釜山' },
  zh: { seoul: '首尔', daejeon: '大田', gumi: '龟尾', gwangju: '光州', busan: '釜山' },
  ru: { seoul: 'Сеул', daejeon: 'Дэчон', gumi: 'Куми', gwangju: 'Кванджу', busan: 'Пусан' },
  vi: { seoul: 'Seoul', daejeon: 'Daejeon', gumi: 'Gumi', gwangju: 'Gwangju', busan: 'Busan' },
}

export function getRegionNameFull(locale, key) {
  return (REGION_NAMES_FULL[locale] || REGION_NAMES_FULL.ko)[key] || key
}

export function getRegionNameShort(locale, key) {
  return (REGION_NAMES_SHORT[locale] || REGION_NAMES_SHORT.ko)[key] || key
}

// 헤더의 "DAEJEON · CHUNGCHEONG COMMUNITY" 뱃지처럼 언어와 무관하게 항상 영문 대문자로 쓰는 표기
export function getRegionBadge(key) {
  return REGION_NAMES_SHORT.en[key]?.toUpperCase() || key.toUpperCase()
}
