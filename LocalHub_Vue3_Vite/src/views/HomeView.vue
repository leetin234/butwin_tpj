<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePosts } from '../stores/usePosts.js'
import { useSpots } from '../stores/useSpots.js'
import { useRegion } from '../stores/useRegion.js'
import { useI18n } from 'vue-i18n'
import { getRegionNameFull, getRegionNameShort } from '../data/regionNames.js'
import CategoryAlbum from '../components/CategoryAlbum.vue'
import categories from '../../public/data/categories.json'

const router = useRouter()
const { sortedPosts } = usePosts()
const { state: spotState, featuredSpots } = useSpots()
const { state: regionState } = useRegion()
const { t, locale } = useI18n()
const regionFull = computed(() => getRegionNameFull(locale.value, regionState.current))
const regionShort = computed(() => getRegionNameShort(locale.value, regionState.current))
const recentPosts = computed(() => sortedPosts.value.slice(0, 5))
const recentSeeAllLabel = computed(() => t('home.recentSeeAll').replace(/\s*[→↗]\s*$/, ''))

const heroIndex = ref(0)
let heroTimer = null

const heroSlides = computed(() => {
  const preferredIndexes = [7, 3, 0, 5, 2]
  const preferred = preferredIndexes
    .map((index) => spotState.spots[index])
    .filter((spot) => spot?.img)

  if (preferred.length >= 3) return preferred
  return spotState.spots.filter((spot) => spot?.img).slice(0, 5)
})

const activeHero = computed(() => heroSlides.value[heroIndex.value] || null)

function goToHero(index) {
  const length = heroSlides.value.length
  if (!length) return
  heroIndex.value = (index + length) % length
  restartHeroTimer()
}

function nextHero() {
  const length = heroSlides.value.length
  if (!length) return
  heroIndex.value = (heroIndex.value + 1) % length
}

function restartHeroTimer() {
  if (heroTimer) window.clearInterval(heroTimer)
  if (heroSlides.value.length > 1) {
    heroTimer = window.setInterval(nextHero, 4500)
  }
}

watch(heroSlides, () => {
  if (heroIndex.value >= heroSlides.value.length) heroIndex.value = 0
  restartHeroTimer()
})

onMounted(restartHeroTimer)
onBeforeUnmount(() => {
  if (heroTimer) window.clearInterval(heroTimer)
})

function formatDate(value) {
  const date = new Date(value)
  return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}
</script>

<template>
  <main class="lh-shell home-shell">
    <section class="lh-hero">
      <span class="guide-badge">{{ $t('home.guide') }}</span>
      <div class="lh-hero-copy">
        <div class="lh-hero-kicker">{{ t('home.heroKicker', { region: regionShort.toUpperCase() }) }}</div>
        <h1 style="white-space: pre-line">{{ t('home.heroTitle', { region: regionShort }) }}</h1>
        <p>{{ $t('home.heroDescription') }}</p>
        <div class="lh-hero-actions">
          <button class="lh-btn primary" @click="router.push({ name: 'board' })">{{ $t('home.boardButton') }}</button>
          <button class="lh-btn white" @click="router.push({ name: 'map' })">{{ $t('home.mapButton') }}</button>
        </div>
      </div>

      <div class="lh-hero-img" aria-live="polite">
        <Transition name="hero-fade" mode="out-in">
          <img
            v-if="activeHero"
            :key="activeHero.id || activeHero.img"
            :src="activeHero.img"
            :alt="`${activeHero.title} 관광지 이미지`"
            referrerpolicy="no-referrer"
          />
        </Transition>

        <div v-if="heroSlides.length > 1" class="hero-carousel-controls" aria-label="메인 이미지 선택">
          <button class="hero-arrow" aria-label="이전 이미지" @click="goToHero(heroIndex - 1)">‹</button>
          <div class="hero-dots">
            <button
              v-for="(slide, index) in heroSlides"
              :key="slide.id || slide.img"
              :class="['hero-dot', { active: index === heroIndex }]"
              :aria-label="`${index + 1}번째 이미지 보기`"
              :aria-current="index === heroIndex ? 'true' : undefined"
              @click="goToHero(index)"
            ></button>
          </div>
          <button class="hero-arrow" aria-label="다음 이미지" @click="goToHero(heroIndex + 1)">›</button>
        </div>
      </div>
    </section>

    <div class="lh-home-grid">
      <section class="lh-panel recent-editorial">
        <div class="lh-panel-head recent-editorial-head">
          <div class="recent-heading-copy">
            <div class="recent-eyebrow">
              <span class="panel-kicker">{{ $t('home.localPosts') }}</span>
              <span class="recent-post-count">{{ String(recentPosts.length).padStart(2, '0') }} POSTS</span>
            </div>
            <h2>{{ $t('home.recentTitle') }}</h2>
          </div>
          <button class="recent-see-all" @click="router.push({ name: 'board' })">
            <span>{{ recentSeeAllLabel }}</span><span aria-hidden="true">↗</span>
          </button>
        </div>
        <div class="lh-recent-list">
          <button
            v-for="(post, index) in recentPosts"
            :key="post.id"
            class="lh-recent-item"
            :class="{ 'is-featured': index === 0 }"
            @click="router.push({ name: 'post-detail', params: { id: post.id } })"
          >
            <span class="lh-recent-num">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="recent-copy">
              <span v-if="index === 0" class="recent-entry-label">LATEST ENTRY</span>
              <span class="lh-recent-title">{{ post.title }}</span>
              <span class="lh-recent-preview">{{ post.content }}</span>
            </span>
            <span class="recent-side">
              <time class="recent-date" :datetime="post.createdAt">{{ formatDate(post.createdAt) }}</time>
              <span class="recent-row-arrow" aria-hidden="true">↗</span>
            </span>
          </button>
        </div>
      </section>

      <section class="lh-panel">
        <div class="lh-panel-head">
          <div><span class="panel-kicker">{{ $t('home.publicData') }}</span><h2>{{ $t('home.spotTitle') }}</h2></div>
          <button @click="router.push({ name: 'map' })">{{ $t('home.mapButton') }}</button>
        </div>
        <div class="lh-spot-grid">
          <button
            v-for="spot in featuredSpots.slice(0, 4)"
            :key="spot.id"
            class="lh-spot-card"
            @click="router.push({ name: 'map', query: { spot: spot.id } })"
          >
            <img :src="spot.img" :alt="spot.title" referrerpolicy="no-referrer" />
            <strong>{{ spot.title }}</strong>
          </button>
        </div>
      </section>
    </div>

    <section class="feature-section">
      <div class="feature-heading">
        <span class="panel-kicker">{{ $t('home.mustDoKicker') }}</span>
        <h2 class="theme-title">{{ t('home.mustDo', { region: regionShort }) }}</h2>
      </div>
    </section>

    <template v-if="regionState.current === 'daejeon'">
      <CategoryAlbum title="문화" :items="categories.culture" />
      <CategoryAlbum title="체육" :items="categories.sports" />
      <CategoryAlbum title="미식" :items="categories.food" />
    </template>
    <section class="home-cta">
      <div>
        <span class="panel-kicker light">{{ $t('home.anonymousCommunity') }}</span>
        <h2>{{ t('home.communityTitle', { region: regionShort }) }}</h2>
      </div>
      <button class="lh-btn white" @click="router.push({ name: 'post-write' })">{{ $t('home.communityButton') }}</button>
    </section>
  </main>
</template>
