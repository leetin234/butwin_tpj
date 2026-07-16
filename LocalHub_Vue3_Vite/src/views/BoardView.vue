<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { getRegionNameFull, getRegionNameShort } from '../data/regionNames.js'
import { usePosts } from '../stores/usePosts.js'
import { useRegion } from '../stores/useRegion.js'
import { useSpots } from '../stores/useSpots.js'

const router = useRouter()
const { t, locale } = useI18n()
const { state: regionState } = useRegion()
const { sortedPosts, state: postState, isBookmarked, toggleBookmark } = usePosts()
const { state: spotState, loadSpots } = useSpots()

const regionFull = computed(() => getRegionNameFull(locale.value, regionState.current))
const regionShort = computed(() => getRegionNameShort(locale.value, regionState.current))

const search = ref('')
const selectedCategory = ref('all')
const onlyBookmarks = ref(false)
const visibleCount = ref(4)
const toast = ref('')
const likedPostIds = reactive(new Set(readLikedPosts()))

const categories = [
  { key: 'all', label: '전체 게시글', en: 'All Posts' },
  { key: 'tip', label: '여행 팁', en: 'Travel Tips' },
  { key: 'review', label: '리뷰', en: 'Reviews' },
  { key: 'question', label: '질문', en: 'Questions' },
  { key: 'event', label: '이벤트', en: 'Events' },
]

const authorProfiles = [
  { name: '여행자 A', initial: 'A', tone: '#9ebcff' },
  { name: '로컬 가이드', initial: 'L', tone: '#ffd4a3' },
  { name: '포토그래퍼', initial: 'P', tone: '#f3b6c4' },
  { name: '동네 산책러', initial: 'S', tone: '#b9dfc4' },
  { name: '주말 탐험가', initial: 'W', tone: '#d6c5f5' },
]

const trendTagsByRegion = {
  daejeon: ['성심당', '대청댐드라이브', '한밭수목원', '칼국수맛집', '엑스포공원'],
  seoul: ['한강산책', '경복궁야간', '광장시장', '익선동', '서울숲'],
  gumi: ['금오산', '낙동강라이딩', '구미보', '금리단길', '체육공원'],
  gwangju: ['무등산', '양림동', '송정시장', '국립아시아문화전당', '예향산책'],
  busan: ['해운대', '광안리야경', '감천문화마을', '자갈치시장', '태종대'],
}

const filteredPosts = computed(() => {
  const query = search.value.trim().toLowerCase()
  return sortedPosts.value.filter((post) => {
    const matchesQuery = !query || `${post.title} ${post.content}`.toLowerCase().includes(query)
    const matchesBookmark = !onlyBookmarks.value || postState.bookmarks.includes(post.id)
    const matchesCategory = selectedCategory.value === 'all' || getPostCategory(post) === selectedCategory.value
    return matchesQuery && matchesBookmark && matchesCategory
  })
})

const visiblePosts = computed(() => filteredPosts.value.slice(0, visibleCount.value))
const canLoadMore = computed(() => visiblePosts.value.length < filteredPosts.value.length)
const recommendationSpots = computed(() => spotState.spots.slice(0, 4))
const trendTags = computed(() => trendTagsByRegion[regionState.current] || recommendationSpots.value.map((spot) => spot.title).slice(0, 5))

watch([search, selectedCategory, onlyBookmarks], () => {
  visibleCount.value = 4
})

onMounted(() => loadSpots(regionState.current))

function readLikedPosts() {
  try {
    const parsed = JSON.parse(localStorage.getItem('localhub_feed_likes_v1') || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persistLikedPosts() {
  localStorage.setItem('localhub_feed_likes_v1', JSON.stringify([...likedPostIds]))
}

function getPostCategory(post) {
  const text = `${post.title} ${post.content}`
  if (/축제|행사|공연|전시|이벤트/.test(text)) return 'event'
  if (/예약|문의|어디|언제|가능|인가요|할까요|\?/.test(text)) return 'question'
  if (/후기|다녀온|방문기|느낌|좋았|추천합니다/.test(text)) return 'review'
  if (/팁|준비물|코스|추천|주차|시간|방법/.test(text)) return 'tip'
  return 'review'
}

function getAuthor(post) {
  let hash = 0
  for (const char of String(post.id)) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return authorProfiles[hash % authorProfiles.length]
}

function getLocation(post) {
  const matchingSpot = spotState.spots.find((spot) => post.title.includes(spot.title) || post.content.includes(spot.title))
  return matchingSpot?.title || regionShort.value
}

function getLikeCount(post) {
  const base = Math.max(3, Math.round(Number(post.views || 0) * 1.7))
  return base + (likedPostIds.has(post.id) ? 1 : 0)
}

function getCommentCount(post) {
  return post.comments?.length || Math.max(0, Number(post.views || 0) % 9)
}

function toggleLike(postId) {
  if (likedPostIds.has(postId)) likedPostIds.delete(postId)
  else likedPostIds.add(postId)
  persistLikedPosts()
}

function formatRelative(value) {
  const diffMs = Date.now() - new Date(value).getTime()
  const minutes = Math.max(0, Math.floor(diffMs / 60000))
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days === 1) return '어제'
  if (days < 7) return `${days}일 전`
  return new Intl.DateTimeFormat(locale.value, { month: '2-digit', day: '2-digit' }).format(new Date(value))
}

function navigateWithTransition(route) {
  if (!document.startViewTransition) return router.push(route)
  return document.startViewTransition(() => router.push(route)).finished
}

function goDetail(id) {
  navigateWithTransition({ name: 'post-detail', params: { id } })
}

function goWrite() {
  navigateWithTransition({ name: 'post-write' })
}

function goMap() {
  navigateWithTransition({ name: 'map' })
}

function applyTag(tag) {
  search.value = tag
  selectedCategory.value = 'all'
  window.scrollTo({ top: 120, behavior: 'smooth' })
}

async function sharePost(post) {
  const url = `${window.location.origin}${router.resolve({ name: 'post-detail', params: { id: post.id } }).href}`
  try {
    if (navigator.share) {
      await navigator.share({ title: post.title, text: post.content, url })
    } else {
      await navigator.clipboard.writeText(url)
      showToast('게시글 링크를 복사했습니다.')
    }
  } catch (error) {
    if (error?.name !== 'AbortError') showToast('링크 공유에 실패했습니다.')
  }
}

function showToast(message) {
  toast.value = message
  window.setTimeout(() => { toast.value = '' }, 1800)
}

function handleImageError(event) {
  event.currentTarget.closest('.sns-post-media')?.classList.add('is-fallback')
  event.currentTarget.remove()
}
</script>

<template>
  <main class="sns-board-page">
    <header class="sns-board-header">
      <div>
        <span class="sns-board-kicker">{{ regionFull }} COMMUNITY</span>
        <h1>커뮤니티 게시판</h1>
        <p>{{ regionFull }}의 여행 팁과 동네 이야기를 익명으로 나눠보세요.</p>
      </div>
      <div class="sns-board-count">
        <strong>{{ filteredPosts.length }}</strong>
        <span>개의 이야기</span>
      </div>
    </header>

    <section class="sns-board-tools" aria-label="게시판 필터와 검색">
      <nav class="sns-category-tabs" aria-label="게시글 카테고리">
        <button
          v-for="category in categories"
          :key="category.key"
          type="button"
          :class="{ active: selectedCategory === category.key }"
          @click="selectedCategory = category.key"
        >
          {{ category.label }} <small>({{ category.en }})</small>
        </button>
      </nav>

      <div class="sns-search-actions">
        <label class="sns-search-box">
          <span class="material-symbols-outlined">search</span>
          <input v-model.trim="search" type="search" placeholder="게시글 검색..." aria-label="게시글 검색" />
        </label>
        <button class="sns-bookmark-only" :class="{ active: onlyBookmarks }" type="button" @click="onlyBookmarks = !onlyBookmarks" aria-label="북마크 글만 보기">
          <span class="material-symbols-outlined">{{ onlyBookmarks ? 'bookmark' : 'bookmark_border' }}</span>
        </button>
        <button class="sns-write-button" type="button" @click="goWrite">
          <span class="material-symbols-outlined">edit</span>
          글쓰기
        </button>
      </div>
    </section>

    <div class="sns-board-layout">
      <section class="sns-feed" aria-label="게시글 피드">
        <article
          v-for="post in visiblePosts"
          :key="post.id"
          class="sns-post-card"
        >
          <header class="sns-post-author">
            <div class="sns-avatar" :style="{ background: getAuthor(post).tone }">{{ getAuthor(post).initial }}</div>
            <div class="sns-author-copy">
              <strong>{{ getAuthor(post).name }}</strong>
              <span>{{ formatRelative(post.createdAt) }} · {{ getLocation(post) }}</span>
            </div>
            <button type="button" class="sns-more-button" aria-label="게시글 더보기" @click="goDetail(post.id)">
              <span class="material-symbols-outlined">more_horiz</span>
            </button>
          </header>

          <button class="sns-post-copy" type="button" @click="goDetail(post.id)">
            <span class="sns-category-badge">{{ categories.find((item) => item.key === getPostCategory(post))?.label }}</span>
            <h2>{{ post.title }}</h2>
            <p>{{ post.content }}</p>
          </button>

          <button class="sns-post-media" :class="{ 'is-fallback': !post.image }" type="button" @click="goDetail(post.id)" :aria-label="`${post.title} 상세 보기`">
            <img v-if="post.image" :src="post.image" :alt="post.title" loading="lazy" referrerpolicy="no-referrer" @error="handleImageError" />
            <span class="sns-fallback-mark">{{ regionShort }}</span>
          </button>

          <footer class="sns-post-actions">
            <div>
              <button type="button" :class="{ active: likedPostIds.has(post.id) }" @click="toggleLike(post.id)">
                <span class="material-symbols-outlined">favorite</span>
                <b>{{ getLikeCount(post) }}</b>
              </button>
              <button type="button" @click="goDetail(post.id)">
                <span class="material-symbols-outlined">chat_bubble</span>
                <b>{{ getCommentCount(post) }}</b>
              </button>
              <button type="button" @click="sharePost(post)">
                <span class="material-symbols-outlined">share</span>
              </button>
              <span class="sns-view-count">조회 {{ post.views || 0 }}</span>
            </div>
            <button
              class="sns-save-button"
              :class="{ active: isBookmarked(post.id) }"
              type="button"
              :aria-label="t('board.bookmarkButton')"
              @click="toggleBookmark(post.id)"
            >
              <span class="material-symbols-outlined">{{ isBookmarked(post.id) ? 'bookmark' : 'bookmark_border' }}</span>
            </button>
          </footer>
        </article>

        <section v-if="!visiblePosts.length" class="sns-empty-state">
          <span class="material-symbols-outlined">search_off</span>
          <h2>{{ $t('board.empty') }}</h2>
          <p>다른 검색어나 카테고리를 선택해 보세요.</p>
          <button type="button" @click="search = ''; selectedCategory = 'all'; onlyBookmarks = false">필터 초기화</button>
        </section>

        <button v-if="canLoadMore" class="sns-load-more" type="button" @click="visibleCount += 4">
          더보기 <small>(Load More)</small>
        </button>
      </section>

      <aside class="sns-sidebar">
        <section class="sns-side-block">
          <span class="sns-side-kicker">TRENDING TOPICS</span>
          <div class="sns-topic-list">
            <button v-for="tag in trendTags" :key="tag" type="button" @click="applyTag(tag)">#{{ tag }}</button>
          </div>
        </section>

        <section class="sns-side-block">
          <div class="sns-side-heading">
            <span class="sns-side-kicker">추천 명소</span>
            <button type="button" @click="goMap">관광 지도 보기</button>
          </div>
          <div class="sns-recommend-grid">
            <button v-for="spot in recommendationSpots" :key="spot.id || spot.title" type="button" @click="goMap">
              <img :src="spot.img" :alt="spot.title" loading="lazy" referrerpolicy="no-referrer" />
              <span>{{ spot.title }}</span>
            </button>
          </div>
        </section>

        <section class="sns-side-block sns-side-write">
          <span class="material-symbols-outlined">edit_square</span>
          <div>
            <strong>당신의 동네 이야기도 들려주세요.</strong>
            <p>별도 로그인 없이 바로 작성할 수 있습니다.</p>
          </div>
          <button type="button" @click="goWrite">새 게시글 작성</button>
        </section>
      </aside>
    </div>

    <Transition name="sns-toast">
      <div v-if="toast" class="sns-toast">{{ toast }}</div>
    </Transition>
  </main>
</template>

<style scoped>
.sns-board-page {
  width: min(100%, var(--layout-max));
  margin: 0 auto;
  padding: 44px var(--page-gutter) 120px;
  color: var(--ink);
}

.sns-board-page .material-symbols-outlined {
  font-family: 'Material Symbols Outlined';
  font-size: 20px;
  font-weight: normal;
  font-style: normal;
  line-height: 1;
}

.sns-board-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 30px;
  margin-bottom: 26px;
}

.sns-board-kicker,
.sns-side-kicker {
  display: block;
  color: var(--region-color);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .13em;
  text-transform: uppercase;
}

.sns-board-header h1 {
  margin-top: 11px;
  font-size: clamp(34px, 4vw, 52px);
  line-height: 1.05;
  letter-spacing: -.045em;
}

.sns-board-header p {
  margin-top: 13px;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.7;
}

.sns-board-count {
  display: flex;
  align-items: baseline;
  gap: 7px;
  padding-bottom: 5px;
  color: var(--muted);
  white-space: nowrap;
}

.sns-board-count strong {
  color: var(--region-color);
  font-size: 26px;
}

.sns-board-count span {
  font-size: 12px;
  font-weight: 750;
}

.sns-board-tools {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 24px;
  align-items: end;
  padding-bottom: 13px;
  border-bottom: 1px solid var(--line-strong);
}

.sns-category-tabs {
  display: flex;
  gap: 25px;
  overflow-x: auto;
  scrollbar-width: none;
}
.sns-category-tabs::-webkit-scrollbar { display: none; }

.sns-category-tabs button {
  position: relative;
  flex: 0 0 auto;
  padding: 8px 0 12px;
  color: var(--ink-soft);
  font-size: 13px;
  font-weight: 750;
  white-space: nowrap;
}

.sns-category-tabs button small {
  font-size: 10px;
  font-weight: 600;
  opacity: .68;
}

.sns-category-tabs button::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: -14px;
  left: 0;
  height: 2px;
  background: var(--region-color);
  transform: scaleX(0);
  transition: transform .2s ease;
}

.sns-category-tabs button:hover,
.sns-category-tabs button.active { color: var(--region-color); }
.sns-category-tabs button.active::after { transform: scaleX(1); }

.sns-search-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sns-search-box {
  position: relative;
  display: block;
  width: min(280px, 28vw);
}

.sns-search-box span {
  position: absolute;
  top: 50%;
  left: 14px;
  color: var(--muted);
  transform: translateY(-50%);
}

.sns-search-box input {
  width: 100%;
  height: 42px;
  padding: 0 16px 0 43px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  background: var(--surface-subtle);
  outline: none;
  transition: border-color .2s, box-shadow .2s;
}

.sns-search-box input:focus {
  border-color: var(--region-color);
  box-shadow: 0 0 0 3px var(--region-tint);
}

.sns-bookmark-only,
.sns-write-button {
  height: 42px;
  border-radius: 999px;
}

.sns-bookmark-only {
  width: 42px;
  display: grid;
  place-items: center;
  border: 1px solid var(--line-strong);
  background: #fff;
  color: var(--ink-soft);
}
.sns-bookmark-only.active { border-color: var(--region-color); background: var(--region-tint); color: var(--region-color); }

.sns-write-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0 21px;
  background: var(--region-color);
  color: #fff;
  font-size: 13px;
  font-weight: 850;
  box-shadow: 0 10px 24px rgba(60, 83, 172, .18);
  transition: transform .2s ease;
}
.sns-write-button:hover { transform: translateY(-2px); }

.sns-board-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.75fr) minmax(280px, .85fr);
  gap: 30px;
  align-items: start;
  margin-top: 36px;
}

.sns-feed {
  min-width: 0;
}

.sns-post-card {
  overflow: hidden;
  margin-bottom: 26px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 5px 18px rgba(23, 24, 27, .04);
  transition: transform .2s ease, box-shadow .2s ease;
}
.sns-post-card:hover { transform: translateY(-2px); box-shadow: 0 14px 34px rgba(23, 24, 27, .08); }

.sns-post-author {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 16px 17px 11px;
}

.sns-avatar {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 50%;
  color: #24304d;
  font-size: 14px;
  font-weight: 900;
}

.sns-author-copy {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}
.sns-author-copy strong { font-size: 13px; }
.sns-author-copy span { color: var(--muted); font-size: 11px; }

.sns-more-button {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: var(--muted);
}
.sns-more-button:hover { background: var(--surface-subtle); color: var(--ink); }

.sns-post-copy {
  display: block;
  width: 100%;
  padding: 0 17px 16px;
  text-align: left;
}

.sns-category-badge {
  display: inline-block;
  margin-bottom: 8px;
  color: var(--region-color);
  font-size: 10px;
  font-weight: 850;
}

.sns-post-copy h2 {
  margin-bottom: 8px;
  font-size: clamp(20px, 2.2vw, 27px);
  line-height: 1.25;
  letter-spacing: -.035em;
}

.sns-post-copy p {
  display: -webkit-box;
  overflow: hidden;
  color: var(--ink-soft);
  font-size: 14px;
  line-height: 1.7;
  word-break: keep-all;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.sns-post-media {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: linear-gradient(135deg, var(--region-dark), var(--region-color));
}

.sns-post-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform .6s var(--ease-standard);
}
.sns-post-card:hover .sns-post-media img { transform: scale(1.025); }

.sns-fallback-mark {
  position: absolute;
  inset: 0;
  display: none;
  place-items: center;
  color: rgba(255,255,255,.86);
  font-size: clamp(34px, 8vw, 74px);
  font-weight: 950;
  letter-spacing: -.08em;
}
.sns-post-media.is-fallback .sns-fallback-mark { display: grid; }

.sns-post-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 54px;
  padding: 7px 9px;
  border-top: 1px solid var(--line);
}
.sns-post-actions > div { display: flex; align-items: center; gap: 1px; }

.sns-post-actions button {
  min-width: 42px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 0 10px;
  border-radius: 10px;
  color: var(--ink-soft);
}
.sns-post-actions button:hover { background: var(--surface-subtle); }
.sns-post-actions button.active { color: var(--red); }
.sns-post-actions button.active .material-symbols-outlined { font-variation-settings: 'FILL' 1; }
.sns-post-actions b { font-size: 11px; font-weight: 700; }
.sns-save-button.active { color: var(--region-color) !important; }
.sns-save-button.active .material-symbols-outlined { font-variation-settings: 'FILL' 1; }
.sns-view-count { margin-left: 8px; color: var(--muted); font-size: 10px; }

.sns-sidebar {
  position: sticky;
  top: 102px;
  display: flex;
  flex-direction: column;
  gap: 29px;
  padding: 24px;
  border-radius: 18px;
  background: var(--surface-subtle);
  box-shadow: 0 7px 24px rgba(23,24,27,.05);
}

.sns-side-block + .sns-side-block {
  padding-top: 27px;
  border-top: 1px solid var(--line);
}

.sns-topic-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.sns-topic-list button {
  padding: 9px 13px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: #fff;
  font-size: 11px;
  font-weight: 650;
  box-shadow: 0 2px 7px rgba(23,24,27,.03);
}
.sns-topic-list button:hover { border-color: var(--region-color); color: var(--region-color); }

.sns-side-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 15px;
}
.sns-side-heading button { color: var(--region-color); font-size: 10px; font-weight: 750; }

.sns-recommend-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 11px;
}

.sns-recommend-grid button {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 12px;
  background: var(--surface-muted);
  text-align: left;
}
.sns-recommend-grid img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s ease; }
.sns-recommend-grid button:hover img { transform: scale(1.06); }
.sns-recommend-grid button::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,.72), transparent 65%);
}
.sns-recommend-grid span {
  position: absolute;
  right: 9px;
  bottom: 9px;
  left: 9px;
  z-index: 1;
  overflow: hidden;
  color: #fff;
  font-size: 11px;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sns-side-write {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 11px;
  align-items: start;
}
.sns-side-write > span { color: var(--region-color); font-size: 27px !important; }
.sns-side-write strong { font-size: 13px; line-height: 1.45; }
.sns-side-write p { margin-top: 4px; color: var(--muted); font-size: 10px; line-height: 1.5; }
.sns-side-write button {
  grid-column: 1 / -1;
  width: 100%;
  height: 40px;
  border-radius: 10px;
  background: var(--region-color);
  color: #fff;
  font-size: 12px;
  font-weight: 850;
}

.sns-load-more {
  display: block;
  min-width: 178px;
  height: 44px;
  margin: 34px auto 0;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  background: #fff;
  font-size: 12px;
  font-weight: 800;
}
.sns-load-more:hover { border-color: var(--region-color); color: var(--region-color); }
.sns-load-more small { font-size: 9px; font-weight: 600; }

.sns-empty-state {
  padding: 80px 24px;
  border: 1px dashed var(--line-strong);
  border-radius: 18px;
  text-align: center;
}
.sns-empty-state > span { color: var(--region-color); font-size: 42px !important; }
.sns-empty-state h2 { margin-top: 13px; font-size: 21px; }
.sns-empty-state p { margin-top: 7px; color: var(--muted); font-size: 12px; }
.sns-empty-state button { margin-top: 18px; padding: 10px 17px; border-radius: 999px; background: var(--region-color); color: #fff; font-size: 11px; font-weight: 800; }

.sns-toast {
  position: fixed;
  bottom: 30px;
  left: 50%;
  z-index: 900;
  padding: 12px 18px;
  border-radius: 999px;
  background: var(--ink);
  color: #fff;
  font-size: 12px;
  font-weight: 750;
  transform: translateX(-50%);
  box-shadow: var(--shadow-overlay);
}
.sns-toast-enter-active,.sns-toast-leave-active { transition: opacity .2s, transform .2s; }
.sns-toast-enter-from,.sns-toast-leave-to { opacity: 0; transform: translate(-50%, 10px); }

@media (max-width: 980px) {
  .sns-board-tools { grid-template-columns: 1fr; }
  .sns-search-actions { justify-content: flex-end; }
  .sns-search-box { width: min(100%, 380px); flex: 1; }
  .sns-board-layout { grid-template-columns: 1fr; }
  .sns-sidebar { position: static; }
}

@media (max-width: 680px) {
  .sns-board-page { padding-top: 28px; }
  .sns-board-header { align-items: flex-start; flex-direction: column; gap: 15px; }
  .sns-board-count { display: none; }
  .sns-category-tabs { margin-right: calc(var(--page-gutter) * -1); padding-right: var(--page-gutter); }
  .sns-search-actions { align-items: stretch; flex-wrap: wrap; }
  .sns-search-box { order: 1; width: 100%; flex-basis: 100%; }
  .sns-write-button { flex: 1; justify-content: center; }
  .sns-board-layout { margin-top: 25px; }
  .sns-post-card { border-radius: 15px; }
  .sns-post-copy h2 { font-size: 21px; }
  .sns-sidebar { padding: 20px; }
}
</style>
