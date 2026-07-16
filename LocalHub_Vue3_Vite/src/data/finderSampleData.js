// Finder 탭 데모/폴백 데이터 (지역별)
// - 실제 API 키(VITE_ITS_API_KEY, VITE_SAFE182_API_KEY)가 없거나 호출이 실패하면 이 데이터로 화면을 채웁니다.
// - 실제 사람이 아닌 샘플이므로 모든 카드에 "샘플" 배지를 함께 표시합니다.

export const REGION_LABELS = {
  seoul: '서울',
  daejeon: '대전',
  gumi: '구미',
  gwangju: '광주',
  busan: '부산',
}

export const REGION_CENTER = {
  seoul: [37.5665, 126.978],
  daejeon: [36.3504, 127.3845],
  gumi: [36.1195, 128.3446],
  gwangju: [35.1595, 126.8526],
  busan: [35.1796, 129.0756],
}

// ITS CCTV 조회용 대략적인 권역 bbox (실호출 시 사용)
export const REGION_BBOX = {
  seoul: { minX: 126.76, maxX: 127.18, minY: 37.42, maxY: 37.7 },
  daejeon: { minX: 127.1, maxX: 127.55, minY: 36.15, maxY: 36.55 },
  gumi: { minX: 128.2, maxX: 128.48, minY: 36.0, maxY: 36.25 },
  gwangju: { minX: 126.72, maxX: 126.98, minY: 35.05, maxY: 35.25 },
  busan: { minX: 128.95, maxX: 129.28, minY: 35.05, maxY: 35.35 },
}

export const SAMPLE_CCTV_BY_REGION = {
  seoul: [
    { id: 'cctv-seoul-1', name: '강남역 사거리', lat: 37.4979, lng: 127.0276, roadType: '교통관제' },
    { id: 'cctv-seoul-2', name: '광화문사거리', lat: 37.5719, lng: 126.9769, roadType: '교통관제' },
    { id: 'cctv-seoul-3', name: '여의도 IC', lat: 37.5219, lng: 126.9245, roadType: '고속도로' },
  ],
  daejeon: [
    { id: 'cctv-daejeon-1', name: '둔산교차로', lat: 36.3512, lng: 127.3845, roadType: '교통관제' },
    { id: 'cctv-daejeon-2', name: '대전역 앞', lat: 36.3315, lng: 127.4348, roadType: '교통관제' },
    { id: 'cctv-daejeon-3', name: '유성온천네거리', lat: 36.3623, lng: 127.3428, roadType: '교통관제' },
    { id: 'cctv-daejeon-4', name: '유성 IC (경부고속도로)', lat: 36.3766, lng: 127.3226, roadType: '고속도로' },
  ],
  gumi: [
    { id: 'cctv-gumi-1', name: '구미역 사거리', lat: 36.1327, lng: 128.3468, roadType: '교통관제' },
    { id: 'cctv-gumi-2', name: '인동네거리', lat: 36.1058, lng: 128.4189, roadType: '교통관제' },
    { id: 'cctv-gumi-3', name: '구미 IC (경부고속도로)', lat: 36.1503, lng: 128.3196, roadType: '고속도로' },
  ],
  gwangju: [
    { id: 'cctv-gwangju-1', name: '상무지구 사거리', lat: 35.1524, lng: 126.851, roadType: '교통관제' },
    { id: 'cctv-gwangju-2', name: '광주송정역 앞', lat: 35.1379, lng: 126.7935, roadType: '교통관제' },
    { id: 'cctv-gwangju-3', name: '광주 IC (호남고속도로)', lat: 35.1799, lng: 126.8875, roadType: '고속도로' },
  ],
  busan: [
    { id: 'cctv-busan-1', name: '서면교차로', lat: 35.1579, lng: 129.0594, roadType: '교통관제' },
    { id: 'cctv-busan-2', name: '해운대해수욕장 입구', lat: 35.1587, lng: 129.1604, roadType: '교통관제' },
    { id: 'cctv-busan-3', name: '동서고가로 진입부', lat: 35.1108, lng: 129.0403, roadType: '고속도로' },
  ],
}

export function getSampleCctvSpots(regionKey) {
  return SAMPLE_CCTV_BY_REGION[regionKey] || SAMPLE_CCTV_BY_REGION.daejeon
}

export function getSampleAlerts(regionKey) {
  const name = REGION_LABELS[regionKey] || '대전'
  return [
    {
      id: 'alert-1',
      tag: '기상특보',
      tone: 'error',
      time: '10분 전',
      title: '호우주의보 발령',
      desc: `${name} 전 지역 호우주의보 발령. 하천변 산책로 출입을 자제하시고 저지대 침수에 유의하세요.`,
    },
    {
      id: 'alert-2',
      tag: '교통통제',
      tone: 'secondary',
      time: '1시간 전',
      title: '도심 일부 구간 통제',
      desc: `상수도 공사로 인하여 ${name} 시내 일부 구간이 부분 통제 중입니다. 우회도로를 이용 바랍니다.`,
    },
  ]
}

// 실종자 샘플 카드용 얼굴 이미지: randomuser.me의 익명 합성 인물 사진(placeholder 전용, 실존 인물 아님)
const SAMPLE_FACE = {
  girl: 'https://randomuser.me/api/portraits/lego/1.jpg',
  boy: 'https://randomuser.me/api/portraits/lego/2.jpg',
  women: (n) => `https://randomuser.me/api/portraits/women/${n}.jpg`,
  men: (n) => `https://randomuser.me/api/portraits/men/${n}.jpg`,
}

const SAMPLE_MISSING_BY_REGION = {
  seoul: [
    { id: 'mp-1', name: '신짱구', category: '실종아동', gender: '남', age: 5, location: '종로구 일대', date: '2024.05.23', photoUrl: 'https://i.namu.wiki/i/y9f5vOHoe4KtAVYfK4ghPWTi8umyFCDyyzFOqnJmOk1tiOwQfxMMKzKto1kO-KHcB3vfCR-PbmHVWCp_hzC75Q.webp'},
    { id: 'mp-2', name: '신형만', category: '실종자', gender: '남', age: 40, location: '종로구 일대', date: '2024.05.20', photoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS0S2UgrWZPEOvxVfFswaM3I72c8lMQO3YcSG3nVuzhKw&s=10' },
    { id: 'mp-3', name: '흰둥이', category: '실종견', gender: '남', age: 3, location: '종로구 일대', date: '2024.05.18', photoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSHZNTrRV8Ee0-dlhGHlkuNs45R3ysZ52IZ41dLl5uOrQ&s=10' },
    { id: 'mp-4', name: '해치', category: '마스코트', gender: '남', age: 18, location: '강남구 일대', date: '2024.05.24', photoUrl: 'https://i.namu.wiki/i/KnsJEt_7avH-g2r2nTlRsYXmJD-weHda-LoKNxQoqu8OPIFhiRzeu1ib3o5rl4Fa2TW604mJZZ5hO74X4Gz-cQ.svg' },
  ],
  daejeon: [
  { id: 'mp-1', name: '희동이', category: '실종아동', gender: '여', age: 8, location: '대전 서구 둔산동', date: '2024.05.24', photoUrl: 'https://i.namu.wiki/i/eFPDQAfAkURxzsDlxN09PTCsH_btwZBr5F5AxWlgW44P8T-9VIX8PoblqC6saXiYJx3o0orpyF4cI-jUV-1d9w.webp' },
  { id: 'mp-2', name: '고길동', category: '치매노인', gender: '남', age: 78, location: '대전 중구 은행동', date: '2024.05.23', photoUrl: 'https://www.doolymuseum.or.kr/html/images/sub0104_06.png' },
  { id: 'mp-3', name: '둘리', category: '원시공룡', gender: '모름', age: 43, location: '대전 동구 가양동', date: '2024.05.20', photoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRg54FoC4apJ4Sjk-28qvzhqqlZK8pRk_Q1bCj5rcTWyA&s=10' },
  { id: 'mp-4', name: '늑구', category: '탈주늑대', gender: '남', age: 2, location: '대전 중구 사정동', date: '2024.05.23', photoUrl: 'https://dimg.donga.com/wps/NEWS/IMAGE/2026/04/14/133734619.1.jpg' }
],
  gumi: [
    { id: 'mp-1', name: '피카츄', category: '실종포켓몬', gender: '남', age: 9, location: '태초마을', date: '2024.05.22', photoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSmniP3Q_kqvmwDcpnBRl5pC47hCcI45_P82R3Mr91d9w&s=10' },
    { id: 'mp-2', name: '파이리', category: '치매포켓몬', gender: '남', age: 20, location: '벽난로', date: '2024.05.21', photoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTrQ0iTEs__4yLJ2HsTFq46ZrHMDMeB0UcaGGEhX5zCeg&s=10' },
    { id: 'mp-4', name: '꼬부기', category: '실종포켓몬', gender: '여', age: 4, location: '계곡', date: '2024.05.16', photoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTLY-lwOwua0aae-mQhVcsikgm1foZ6xhG95wIItXM1cQ&s=10' },
    { id: 'mp-3', name: '마이구미', category: '납치피해자', gender: '중립', age: 35, location: '뱃속', date: '2024.05.19', photoUrl: 'https://i.namu.wiki/i/sBYy_RFS5XAHUtQCpQX28OomXAzHGUdxpZg0IljNbsfyE8uR3dHP-u1RcYwiabrLyth7ZkUUI9Xqt4v7NQ1hetqLtktATPCD8v994vLTBRdSX7gTdyxl8WD3lRmXlP4S8i_2rb3pouTrQJ2EQ4-KJA.webp' },
  ],
  gwangju: [
    { id: 'mp-1', name: '오매나', category: '실종아동', gender: '여', age: 6, location: '상무지구 일대', date: '2024.05.23', photoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQntAnVIBUiUDDo8UlIQ0c7UCOYaOQ8jwh8dp8N4tKKtA&s=10' },
    { id: 'mp-2', name: 'Sam', category: '관광객', gender: '남', age: 85, location: '광산구 일대', date: '2024.05.22', photoUrl: SAMPLE_FACE.men(77) },
    { id: 'mp-3', name: 'Ochiri', category: '관광객', gender: '남', age: 38, location: '남구 일대', date: '2024.05.19', photoUrl: SAMPLE_FACE.men(35) },
    { id: 'mp-4', name: '백순자', category: '치매어르신', gender: '여', age: 79, location: '북구 일대', date: '2024.05.16', photoUrl: SAMPLE_FACE.women(58) },
  ],
  busan: [
    { id: 'mp-1', name: '갈매기', category: '조류', gender: '남', age: 7, location: '해운대구 일대', date: '2024.05.24', photoUrl: 'https://cdn.hkbs.co.kr/news/photo/202105/630596_375834_3214.jpg' },
    { id: 'mp-2', name: '우럭', category: '어류', gender: '남', age: 80, location: '아틀란티스', date: '2024.05.22', photoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9ImHV6vwbzFgL0JA59LJiuBEoY80OLXCuEqiG6WfTOw&s=10' },
    { id: 'mp-3', name: '광어', category: '횟감', gender: '남', age: 31, location: '횟집 어항', date: '2024.05.20', photoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzRGMvhHPyfNWuNE9f70GowJsXE6JQAcmmbTkNi8B2uA&s=10' },
    { id: 'mp-4', name: '비치볼', category: '장난감', gender: '무', age: 1, location: '분실물 센터', date: '2024.05.17', photoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHTxjZv9dyPoon9vco21auqKJumOBL1SsM3Klo5H2f-w&s=10' },
  ],
}

export function getSampleMissingPersons(regionKey) {
  return SAMPLE_MISSING_BY_REGION[regionKey] || SAMPLE_MISSING_BY_REGION.daejeon
}
