import { computed, reactive } from 'vue'
import { useRegion } from './useRegion.js'

const STORAGE_KEY = 'localhub_daejeon_posts_v1'
const BOOKMARK_KEY = 'localhub_daejeon_bookmarks_v1'

const spotImageMap = {
  // 대전·충청
  '한밭수목원': 'https://tong.visitkorea.or.kr/cms/resource_photo/22/3514122_image2_1.jpg',
  '장태산자연휴양림': 'https://tong.visitkorea.or.kr/cms/resource/42/3569842_image2_1.jpg',
  '대청댐': 'https://tong.visitkorea.or.kr/cms/resource_photo/65/3403365_image2_1.jpg',
  '대전시민천문대': 'https://tong.visitkorea.or.kr/cms/resource/95/4065395_image2_1.jpg',
  '대전오월드': 'https://tong.visitkorea.or.kr/cms/resource/97/3513197_image2_1.jpg',
  // 서울
  '여의도한강공원': 'http://tong.visitkorea.or.kr/cms/resource/89/3544389_image2_1.jpg',
  '경복궁': 'https://tong.visitkorea.or.kr/cms/resource/98/3487598_image2_1.jpg',
  '광장시장': 'http://tong.visitkorea.or.kr/cms/resource/81/2668981_image2_1.jpg',
  '남산서울타워': 'http://tong.visitkorea.or.kr/cms/resource/56/3539656_image2_1.jpg',
  '익선동': 'https://tong.visitkorea.or.kr/cms/resource/54/3497254_image2_1.jpg',
  // 구미·경북
  '금오산': 'https://tong.visitkorea.or.kr/cms/resource/01/3566301_image2_1.jpg',
  '구미보': 'https://tong.visitkorea.or.kr/cms/resource/98/4067798_image2_1.jpg',
  '구미새마을운동테마공원': 'http://tong.visitkorea.or.kr/cms/resource/80/3349180_image2_1.jpg',
  '금오랜드': 'https://tong.visitkorea.or.kr/cms/resource/08/3348808_image2_1.jpg',
  '낙동강체육공원': 'https://tong.visitkorea.or.kr/cms/resource/71/4067671_image2_1.jpg',
  // 광주·전라
  '국립아시아문화전당': 'http://tong.visitkorea.or.kr/cms/resource/59/3083359_image2_1.jpg',
  '양림동': 'http://tong.visitkorea.or.kr/cms/resource/60/3351460_image2_1.jpg',
  '무등산': 'http://tong.visitkorea.or.kr/cms/resource/23/3029123_image2_1.jpg',
  '광주송정시장': 'http://tong.visitkorea.or.kr/cms/resource/89/3367489_image2_1.jpg',
  '5·18기념공원': 'http://tong.visitkorea.or.kr/cms/resource/81/1587681_image2_1.jpg',
  // 부산
  '해운대해수욕장': 'https://tong.visitkorea.or.kr/cms/resource/34/3090534_image2_1.JPG',
  '감천문화마을': 'https://tong.visitkorea.or.kr/cms/resource/91/3365491_image2_1.jpg',
  '광안리': 'http://tong.visitkorea.or.kr/cms/resource/42/3071042_image2_1.JPG',
  '자갈치시장': 'http://tong.visitkorea.or.kr/cms/resource/13/2941313_image2_1.bmp',
  '태종대': 'https://tong.visitkorea.or.kr/cms/resource/42/4017042_image2_1.jpg',
}

function findSpotImage(title) {
  for (const key of Object.keys(spotImageMap)) {
    if (title.includes(key)) return spotImageMap[key]
  }
  return null
}

const SEED_ROWS_BY_REGION = {
  daejeon: [
    ['한밭수목원 저녁 산책 팁', '해가 지기 전 서원과 동원을 함께 걸으면 좋습니다. 주말에는 주차장이 혼잡해 대중교통 이용을 추천합니다.'],
    ['장태산자연휴양림 준비물', '메타세쿼이아 숲길은 그늘이 많지만 여름에는 물과 벌레 기피제를 챙기는 편이 좋습니다.'],
    ['대청댐 드라이브 후 들를 곳', '대청댐 전망대 주변 산책 후 대덕구 방향으로 이동하면 강변 풍경을 이어서 보기 좋았습니다.'],
    ['대전시민천문대 예약 확인', '프로그램 운영 시간과 예약 여부가 달라질 수 있어 방문 전에 공식 안내를 확인하는 것이 좋습니다.'],
    ['아이와 대전오월드 다녀온 후기', '오전 일찍 입장하니 비교적 여유로웠습니다. 야외 이동이 많아 편한 신발을 추천합니다.'],
  ],
  seoul: [
    ['여의도한강공원 벚꽃 산책 팁', '저녁에는 자전거도로가 붐비니 산책로 위주로 걷는 걸 추천합니다. 돗자리는 필수예요.'],
    ['경복궁 야간관람 후기', '야간개장 시간에는 조명이 예뻐서 사진 찍기 좋았습니다. 사전 예매는 서두르는 게 좋아요.'],
    ['광장시장 먹거리 추천', '마약김밥과 빈대떡 줄이 꽤 긴 편이라 평일 낮 시간대 방문을 추천드려요.'],
    ['남산서울타워 전망 포인트', '케이블카보다 산책로로 올라가면 중간중간 전망 포인트가 많아서 좋았습니다.'],
    ['익선동 한옥거리 카페 투어', '골목이 좁아서 주말엔 사람이 많아요. 평일 오전에 가면 여유롭게 둘러볼 수 있습니다.'],
  ],
  gumi: [
    ['금오산 등산로 후기', '케이블카 타고 올라가서 정상까지 걷는 코스가 초보자에게도 무난했습니다.'],
    ['구미보 자전거길 라이딩', '낙동강 자전거길이 잘 정비되어 있어서 초보자도 편하게 라이딩하기 좋았어요.'],
    ['구미새마을운동테마공원 방문기', '전시관 관람 후 야외 공원까지 둘러보면 두 시간 정도 소요됩니다.'],
    ['금오랜드 아이와 다녀온 후기', '평일 오전에 가니 놀이기구 대기줄이 짧아서 아이와 여유롭게 즐겼습니다.'],
    ['낙동강체육공원 야경 명소', '해질 무렵 강변 산책로를 따라 걸으면 야경이 특히 예쁩니다.'],
  ],
  gwangju: [
    ['국립아시아문화전당 전시 관람 팁', '지하 전시 공간이 넓어서 반나절은 잡고 가는 게 좋습니다. 무료 전시도 꽤 많아요.'],
    ['양림동 역사문화마을 산책 코스', '골목 곳곳에 근대 건축물이 남아 있어서 천천히 걸으며 사진 찍기 좋았습니다.'],
    ['무등산 등반 준비물', '증심사 코스로 오르면 초보자도 무난하지만, 물과 등산화는 꼭 챙기세요.'],
    ['광주송정시장 먹거리 투어', '떡갈비 골목이 유명해서 저녁 시간에는 대기가 있는 편입니다.'],
    ['5·18기념공원 방문 후기', '역사관을 먼저 둘러본 뒤 공원을 산책하면 의미가 더 깊게 다가옵니다.'],
  ],
  busan: [
    ['해운대해수욕장 저녁 산책', '노을 시간대에 산책하면 특히 예쁘고, 주변 카페들도 뷰가 좋습니다.'],
    ['감천문화마을 포토스팟', '골목이 가파른 편이라 편한 신발을 추천드리고, 오전 일찍 가면 한적합니다.'],
    ['광안리 야경 명소', '광안대교 조명이 켜지는 시간에 맞춰 방문하면 야경이 정말 좋습니다.'],
    ['자갈치시장 먹거리 추천', '회센터 2층에서 바로 초장집에 자리 잡고 먹는 코스를 추천합니다.'],
    ['태종대 드라이브 코스', '다누비열차 타고 한 바퀴 돌면 전체 코스를 편하게 둘러볼 수 있어요.'],
  ],
}

function seedPostsForRegion(region) {
  const now = Date.now()
  const rows = SEED_ROWS_BY_REGION[region] || []
  return rows.map((row, index) => ({
    id: `seed-${region}-${index + 1}`,
    region,
    title: row[0],
    content: row[1],
    password: '1234',
    createdAt: new Date(now - (index + 1) * 86400000).toISOString(),
    updatedAt: null,
    views: 12 + index * 7,
    image: findSpotImage(row[0]),
    comments: [],
  }))
}

function seedPosts() {
  return Object.keys(SEED_ROWS_BY_REGION).flatMap((region) => seedPostsForRegion(region))
}

function readJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null')
    return value ?? fallback
  } catch {
    return fallback
  }
}

function enrichPostImage(post) {
  if (!post.image) {
    post.image = findSpotImage(post.title)
  }
  post.comments = post.comments || []
  return post
}

// 이전 버전(대전 시드만 있던 상태)에서 저장된 브라우저는 새로 추가된 지역 시드 글이
// 없으므로, 저장된 글 목록에 없는 지역의 시드만 보충해서 합쳐준다.
const persistedPosts = readJson(STORAGE_KEY, null)
let initialPosts
let needsPersist = false
if (persistedPosts) {
  initialPosts = persistedPosts.map(enrichPostImage)
  const existingRegions = new Set(initialPosts.map((post) => post.region))
  Object.keys(SEED_ROWS_BY_REGION).forEach((region) => {
    if (!existingRegions.has(region)) {
      initialPosts.push(...seedPostsForRegion(region))
      needsPersist = true
    }
  })
} else {
  initialPosts = seedPosts()
  needsPersist = true
}
if (needsPersist) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialPosts))
}

const state = reactive({
  posts: initialPosts,
  bookmarks: readJson(BOOKMARK_KEY, []),
})

function persistPosts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.posts))
}

function persistBookmarks() {
  localStorage.setItem(BOOKMARK_KEY, JSON.stringify(state.bookmarks))
}

export function usePosts() {
  const { state: regionState } = useRegion()

  // 게시판은 지역별로 분리되어, 현재 선택된 지역의 글만 노출/등록됩니다.
  const sortedPosts = computed(() =>
    state.posts
      .filter((post) => post.region === regionState.current)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  )

  function getPost(id) {
    return state.posts.find((post) => post.id === id) || null
  }

  function createPost({ title, content, password, image = null }) {
    const post = {
      id: crypto.randomUUID?.() || `post-${Date.now()}`,
      region: regionState.current,
      title,
      content,
      password,
      createdAt: new Date().toISOString(),
      updatedAt: null,
      views: 0,
      image,
      comments: [],
    }
    state.posts.push(post)
    persistPosts()
    return post
  }

  function updatePost(id, { title, content, password, image = null }) {
    const post = getPost(id)
    if (!post) return null
    post.title = title
    post.content = content
    post.password = password
    post.image = image
    post.updatedAt = new Date().toISOString()
    persistPosts()
    return post
  }

  function deletePost(id) {
    const index = state.posts.findIndex((post) => post.id === id)
    if (index < 0) return false
    state.posts.splice(index, 1)
    state.bookmarks = state.bookmarks.filter((bookmarkId) => bookmarkId !== id)
    persistPosts()
    persistBookmarks()
    return true
  }

  function verifyPassword(id, password) {
    const post = getPost(id)
    return Boolean(post && post.password === password)
  }

  function increaseViews(id) {
    const post = getPost(id)
    if (!post) return
    post.views = (post.views || 0) + 1
    persistPosts()
  }

  function isBookmarked(id) {
    return state.bookmarks.includes(id)
  }

  function toggleBookmark(id) {
    if (isBookmarked(id)) {
      state.bookmarks = state.bookmarks.filter((bookmarkId) => bookmarkId !== id)
    } else {
      state.bookmarks.push(id)
    }
    persistBookmarks()
  }

  function addComment(id, { author = '익명', content }) {
    const post = getPost(id)
    if (!post) return null
    const comment = {
      id: crypto.randomUUID?.() || `comment-${Date.now()}`,
      author,
      content,
      createdAt: new Date().toISOString(),
    }
    post.comments = post.comments || []
    post.comments.push(comment)
    persistPosts()
    return comment
  }

  return {
    state,
    sortedPosts,
    getPost,
    createPost,
    updatePost,
    deletePost,
    verifyPassword,
    increaseViews,
    isBookmarked,
    toggleBookmark,
    addComment,
  }
}
