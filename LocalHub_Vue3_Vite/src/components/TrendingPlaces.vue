<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePosts } from '../stores/usePosts.js'
import { useRegion } from '../stores/useRegion.js'

const { t, locale } = useI18n()
const { sortedPosts, state } = usePosts()
const { state: regionState } = useRegion()

const PLACE_SEEDS_BY_REGION = {
  daejeon: [
    { title: '한밭수목원', category: '자연 · 산책', keywords: ['한밭수목원', '수목원'], baseMentions: 18, baseViews: 146, baseChange: 24 },
    { title: '대청호 드라이브', category: '드라이브 · 전망', keywords: ['대청호', '대청댐'], baseMentions: 15, baseViews: 128, baseChange: 19 },
    { title: '빵지 순례 코스', category: '미식 · 베이커리', keywords: ['빵지', '성심당', '베이커리', '빵'], baseMentions: 14, baseViews: 119, baseChange: 17 },
    { title: '대전 0시 축제', category: '축제 · 야간관광', keywords: ['0시 축제', '영시 축제', '중앙로 축제'], baseMentions: 12, baseViews: 108, baseChange: 15 },
    { title: '대전예술의전당', category: '공연 · 문화', keywords: ['대전예술의전당', '예술의전당', '공연'], baseMentions: 10, baseViews: 94, baseChange: 12 },
  ],
  seoul: [
    { title: '여의도한강공원', category: '자연 · 산책', keywords: ['여의도', '한강공원'], baseMentions: 18, baseViews: 146, baseChange: 24 },
    { title: '경복궁', category: '역사 · 야간관람', keywords: ['경복궁'], baseMentions: 15, baseViews: 128, baseChange: 19 },
    { title: '광장시장 먹거리', category: '미식 · 전통시장', keywords: ['광장시장', '마약김밥', '빈대떡'], baseMentions: 14, baseViews: 119, baseChange: 17 },
    { title: '남산서울타워', category: '전망 · 야경', keywords: ['남산서울타워', '남산'], baseMentions: 12, baseViews: 108, baseChange: 15 },
    { title: '익선동 한옥거리', category: '카페 · 골목', keywords: ['익선동'], baseMentions: 10, baseViews: 94, baseChange: 12 },
  ],
  gumi: [
    { title: '금오산', category: '등산 · 자연', keywords: ['금오산'], baseMentions: 18, baseViews: 146, baseChange: 24 },
    { title: '구미보 자전거길', category: '드라이브 · 라이딩', keywords: ['구미보', '낙동강 자전거길'], baseMentions: 15, baseViews: 128, baseChange: 19 },
    { title: '구미새마을운동테마공원', category: '전시 · 공원', keywords: ['새마을운동테마공원'], baseMentions: 14, baseViews: 119, baseChange: 17 },
    { title: '금오랜드', category: '가족 · 놀이공원', keywords: ['금오랜드'], baseMentions: 12, baseViews: 108, baseChange: 15 },
    { title: '낙동강체육공원', category: '야경 · 산책', keywords: ['낙동강체육공원'], baseMentions: 10, baseViews: 94, baseChange: 12 },
  ],
  gwangju: [
    { title: '국립아시아문화전당', category: '전시 · 문화', keywords: ['아시아문화전당'], baseMentions: 18, baseViews: 146, baseChange: 24 },
    { title: '양림동 역사문화마을', category: '역사 · 산책', keywords: ['양림동'], baseMentions: 15, baseViews: 128, baseChange: 19 },
    { title: '무등산', category: '등산 · 자연', keywords: ['무등산'], baseMentions: 14, baseViews: 119, baseChange: 17 },
    { title: '광주송정시장', category: '미식 · 전통시장', keywords: ['송정시장', '떡갈비'], baseMentions: 12, baseViews: 108, baseChange: 15 },
    { title: '5·18기념공원', category: '역사 · 공원', keywords: ['5·18기념공원', '5.18기념공원'], baseMentions: 10, baseViews: 94, baseChange: 12 },
  ],
  busan: [
    { title: '해운대해수욕장', category: '자연 · 산책', keywords: ['해운대'], baseMentions: 18, baseViews: 146, baseChange: 24 },
    { title: '감천문화마을', category: '포토스팟 · 골목', keywords: ['감천문화마을'], baseMentions: 15, baseViews: 128, baseChange: 19 },
    { title: '광안리 야경', category: '전망 · 야경', keywords: ['광안리', '광안대교'], baseMentions: 14, baseViews: 119, baseChange: 17 },
    { title: '자갈치시장', category: '미식 · 전통시장', keywords: ['자갈치시장'], baseMentions: 12, baseViews: 108, baseChange: 15 },
    { title: '태종대', category: '드라이브 · 전망', keywords: ['태종대'], baseMentions: 10, baseViews: 94, baseChange: 12 },
  ],
}

const placeSeeds = computed(() => PLACE_SEEDS_BY_REGION[regionState.current] || PLACE_SEEDS_BY_REGION.daejeon)

const rankedPlaces = computed(() => {
  const scored = placeSeeds.value.map((place) => {
    let localMentions = 0
    let localViews = 0
    let localBookmarks = 0

    sortedPosts.value.forEach((post) => {
      const text = `${post.title ?? ''} ${post.content ?? ''}`.toLowerCase()
      const matched = place.keywords.some((keyword) => text.includes(keyword.toLowerCase()))

      if (matched) {
        localMentions += 1
        localViews += Number(post.views || 0)
        if (state.bookmarks.includes(post.id)) localBookmarks += 1
      }
    })

    const mentions = place.baseMentions + localMentions
    const views = place.baseViews + localViews
    const change = place.baseChange + localMentions * 3 + localBookmarks * 2
    const score = mentions * 3 + views * 0.22 + change * 2

    return { ...place, mentions, views, change, score }
  })

  scored.sort((a, b) => b.score - a.score)
  const maxScore = scored[0]?.score || 1

  return scored.map((place, index) => ({
    ...place,
    rank: index + 1,
    strength: Math.max(42, Math.round((place.score / maxScore) * 100)),
  }))
})
</script>

<template>
  <section class="trending-panel" aria-labelledby="trending-title">
    <div class="trending-head">
      <div>
          <span class="trending-kicker">{{ $t('trending.kicker') }}</span>
          <h2 id="trending-title">{{ $t('trending.title') }}</h2>
          <p>{{ $t('trending.description') }}</p>
        </div>

        <div class="trending-live" :aria-label="$t('trending.liveAria')">
          <span class="live-pulse"></span>
          {{ $t('trending.liveBadge') }}
        </div>
      </div>

      <div class="trending-grid">
        <article
          v-for="(place, index) in rankedPlaces"
          :key="place.title"
          class="trending-card"
          :class="{ leader: place.rank === 1 }"
        >
          <div class="trending-card-top">
            <span class="trend-rank">{{ String(place.rank).padStart(2, '0') }}</span>
            <span class="trend-change">▲ {{ place.change }}%</span>
          </div>

        <span class="trend-category">{{ place.category }}</span>
        <h3>{{ place.title }}</h3>

        <div class="trend-metrics">
          <span>{{ $t('trending.postMentions', { count: place.mentions }) }}</span>
          <span>{{ $t('trending.views', { count: place.views.toLocaleString(locale.value) }) }}</span>
        </div>

        <div class="trend-bar" aria-hidden="true">
          <span :style="{ width: `${place.strength}%` }"></span>
        </div>
      </article>
    </div>

    <p class="trending-note">
      {{ $t('trending.note') }}
    </p>
  </section>
</template>

<style scoped>
.trending-panel {
  --ep-surface-container-lowest: #ffffff;
  --ep-surface-container: #eaedff;
  --ep-surface-container-high: #e2e7ff;
  --ep-on-surface: #131b2e;
  --ep-on-surface-variant: #434655;
  --ep-outline-variant: #c3c6d7;
  --ep-primary: #004ac6;
  --ep-secondary: #4b41e1;
  --ep-error: #ba1a1a;
  --ep-error-container: #ffdad6;
  --ep-on-error-container: #93000a;

  position: relative;
  margin-top: 40px;
  padding: clamp(28px, 4vw, 48px);
  border-radius: 2.5rem;
  overflow: hidden;
  font-family: 'Plus Jakarta Sans', 'Pretendard Variable', sans-serif;
  color: var(--ep-on-surface);
  background: rgba(255, 255, 255, .7);
  backdrop-filter: blur(12px);
  border: 1px solid var(--ep-outline-variant);
}

.trending-panel::before {
  content: '';
  position: absolute;
  top: -80px;
  right: -80px;
  width: 260px;
  height: 260px;
  border-radius: 999px;
  background: rgba(0, 74, 198, .06);
  filter: blur(50px);
  pointer-events: none;
}

.trending-head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 28px;
  margin-bottom: 40px;
}

.trending-kicker {
  display: block;
  margin-bottom: 8px;
  color: var(--ep-primary);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .2em;
  text-transform: uppercase;
}

.trending-head h2 {
  font-size: clamp(23px, 2.7vw, 32px);
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -.02em;
}

.trending-head p {
  max-width: 58ch;
  margin-top: 8px;
  color: var(--ep-on-surface-variant);
  font-size: 14px;
  line-height: 1.6;
}

.trending-live {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  border: 1px solid var(--ep-outline-variant);
  border-radius: 999px;
  background: rgba(255, 255, 255, .5);
  box-shadow: 0 1px 2px rgba(0,0,0,.04);
  color: var(--ep-on-surface);
  font-size: 12px;
  font-weight: 700;
}

.live-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--ep-error);
  box-shadow: 0 0 0 0 rgba(186, 26, 26, .7);
  animation: livePulse 2s infinite;
}

@keyframes livePulse {
  0% { transform: scale(.95); box-shadow: 0 0 0 0 rgba(186, 26, 26, .7); }
  70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(186, 26, 26, 0); }
  100% { transform: scale(.95); box-shadow: 0 0 0 0 rgba(186, 26, 26, 0); }
}

.trending-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px;
}

.trending-card {
  position: relative;
  min-width: 0;
  padding: 24px;
  border: 1px solid rgba(195, 198, 215, .4);
  border-radius: 16px;
  background: #fff;
  transition: transform .25s ease, box-shadow .25s ease;
}

.trending-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px -5px rgba(0, 74, 198, .15);
}

.trending-card.leader {
  border-color: rgba(0, 74, 198, .25);
}

.trending-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 24px;
}

.trend-rank {
  font-size: 32px;
  font-weight: 800;
  line-height: 1;
  color: rgba(0, 74, 198, .1);
}

.trend-change {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 8px;
  background: rgba(186, 26, 26, .12);
  color: var(--ep-error);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.trend-category {
  display: inline-block;
  margin-bottom: 8px;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(0, 74, 198, .1);
  color: var(--ep-primary);
  font-size: 11px;
  font-weight: 700;
}

.trending-card h3 {
  min-height: 42px;
  margin-bottom: 24px;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -.01em;
  word-break: keep-all;
}

.trend-metrics {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  color: var(--ep-on-surface-variant);
  font-size: 12px;
}

.trend-bar {
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--ep-surface-container-high);
}

.trend-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--ep-primary);
}

.trending-note {
  position: relative;
  z-index: 1;
  margin-top: 24px;
  color: var(--ep-on-surface-variant);
  opacity: .6;
  font-size: 11px;
  line-height: 1.55;
  text-align: right;
}

@media (max-width: 1040px) {
  .trending-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .trending-panel {
    margin-top: 32px;
    padding: 24px 20px;
    border-radius: 1.75rem;
  }

  .trending-head {
    align-items: flex-start;
    flex-direction: column;
    gap: 14px;
  }

  .trending-grid {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    padding-bottom: 8px;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
  }

  .trending-grid::-webkit-scrollbar {
    display: none;
  }

  .trending-card {
    flex: 0 0 min(76vw, 245px);
    scroll-snap-align: start;
  }

  .trending-note {
    text-align: left;
  }
}

@media (prefers-reduced-motion: reduce) {
  .live-pulse {
    animation: none;
  }
}

/* Board edition: a compact data desk instead of another card grid. */
.trending-panel {
  --ep-on-surface: #f2f0e8;
  --ep-on-surface-variant: rgba(242, 240, 232, .58);
  --ep-primary: #f0d44b;
  --ep-error: #ff735f;
  position: relative;
  margin-top: 0;
  padding: clamp(34px, 5vw, 68px);
  border: 0;
  border-radius: 0;
  background: #141412;
  color: var(--ep-on-surface);
  font-family: 'DM Sans', 'Pretendard Variable', sans-serif;
}

.trending-panel::before {
  top: auto;
  right: -1%;
  bottom: -18%;
  width: 360px;
  height: 360px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, .08);
  filter: none;
}

.trending-head {
  align-items: flex-end;
  margin-bottom: 46px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, .35);
}

.trending-kicker {
  margin-bottom: 13px;
  color: #f0d44b;
  font-size: 9px;
  letter-spacing: .18em;
}

.trending-head h2 {
  font-family: 'Archivo Black', 'Pretendard Variable', sans-serif;
  font-size: clamp(34px, 4.6vw, 62px);
  font-weight: 400;
  line-height: .95;
  letter-spacing: -.065em;
}

.trending-head p {
  max-width: 47ch;
  margin-top: 15px;
  color: rgba(242, 240, 232, .56);
  font-size: 12px;
}

.trending-live {
  border-color: rgba(255, 255, 255, .38);
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  color: #fff;
  font-size: 9px;
  letter-spacing: .14em;
}

.trending-grid {
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0;
  border-top: 1px solid rgba(255,255,255,.32);
  border-bottom: 1px solid rgba(255,255,255,.32);
}

.trending-card,
.trending-card.leader {
  min-height: 285px;
  padding: 23px 20px 20px;
  border: 0;
  border-right: 1px solid rgba(255,255,255,.22);
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  transition: background .35s ease, color .35s ease;
}

.trending-card:last-child { border-right: 0; }

.trending-card:hover {
  background: #f0d44b;
  color: #141412;
  box-shadow: none;
  transform: none;
}

.trending-card-top { margin-bottom: 40px; }

.trend-rank {
  color: transparent;
  font-family: 'Archivo Black', sans-serif;
  font-size: clamp(42px, 4vw, 60px);
  font-weight: 400;
  letter-spacing: -.08em;
  -webkit-text-stroke: 1px rgba(255, 255, 255, .45);
  transition: color .35s ease, -webkit-text-stroke-color .35s ease;
}

.trending-card:hover .trend-rank {
  color: #141412;
  -webkit-text-stroke-color: #141412;
}

.trend-change {
  padding: 0;
  border-radius: 0;
  background: transparent;
  color: #ff735f;
  font-size: 9px;
  letter-spacing: .06em;
}

.trending-card:hover .trend-change { color: #8a261b; }

.trend-category {
  margin-bottom: 11px;
  padding: 0;
  border-radius: 0;
  background: transparent;
  color: #f0d44b;
  font-size: 8px;
  letter-spacing: .12em;
}

.trending-card:hover .trend-category { color: #141412; }

.trending-card h3 {
  min-height: 58px;
  margin-bottom: 27px;
  color: inherit;
  font-size: 19px;
  font-weight: 700;
  line-height: 1.28;
  letter-spacing: -.035em;
}

.trend-metrics {
  color: rgba(242, 240, 232, .5);
  font-size: 8px;
  letter-spacing: .04em;
}

.trending-card:hover .trend-metrics { color: rgba(20,20,18,.64); }

.trend-bar {
  height: 2px;
  border-radius: 0;
  background: rgba(255,255,255,.18);
}

.trend-bar span { border-radius: 0; background: #f0d44b; transition: width .7s cubic-bezier(.16,1,.3,1); }
.trending-card:hover .trend-bar { background: rgba(20,20,18,.18); }
.trending-card:hover .trend-bar span { background: #141412; }

.trending-note {
  margin-top: 18px;
  color: rgba(242,240,232,.44);
  font-size: 9px;
  text-align: left;
}

@media (max-width: 1040px) {
  .trending-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .trending-card:nth-child(3) { border-right: 0; }
  .trending-card:nth-child(-n+3) { border-bottom: 1px solid rgba(255,255,255,.22); }
}

@media (max-width: 700px) {
  .trending-panel { margin-top: 0; padding: 36px 22px; border-radius: 0; }
  .trending-head { align-items: flex-start; gap: 18px; margin-bottom: 32px; }
  .trending-grid {
    display: flex;
    gap: 0;
    overflow-x: auto;
    padding-bottom: 0;
    scroll-snap-type: x mandatory;
  }
  .trending-card,
  .trending-card.leader {
    flex: 0 0 min(74vw, 245px);
    min-height: 270px;
    border-right: 1px solid rgba(255,255,255,.22);
    border-bottom: 0;
    scroll-snap-align: start;
  }
  .trending-card:nth-child(3) { border-right: 1px solid rgba(255,255,255,.22); }
}

/* Community feed: keep the data useful without turning it into a second hero. */
.trending-panel {
  --ep-on-surface: #1b1b19;
  --ep-on-surface-variant: #77756e;
  --ep-primary: var(--region-color, #3c53ac);
  --ep-error: #b95547;
  margin-top: 88px;
  padding: 40px 0 0;
  border: 0;
  border-top: 1px solid #dedbd1;
  border-radius: 0;
  background: transparent;
  color: var(--ep-on-surface);
}

.trending-panel::before { display: none; }

.trending-head {
  align-items: flex-end;
  margin-bottom: 25px;
  padding: 0;
  border: 0;
}

.trending-kicker {
  margin-bottom: 8px;
  color: var(--ep-primary);
  font-size: 9px;
  letter-spacing: .15em;
}

.trending-head h2 {
  font-family: 'DM Sans', 'Pretendard Variable', sans-serif;
  font-size: clamp(26px, 3vw, 36px);
  font-weight: 750;
  line-height: 1.2;
  letter-spacing: -.04em;
}

.trending-head p {
  max-width: 52ch;
  margin-top: 8px;
  color: var(--ep-on-surface-variant);
  font-size: 11px;
}

.trending-live {
  border-color: #dedbd1;
  border-radius: 999px;
  background: #faf9f5;
  color: var(--ep-on-surface);
  font-size: 9px;
  letter-spacing: .08em;
}

.trending-grid {
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  border: 0;
}

.trending-card,
.trending-card.leader {
  min-height: 206px;
  padding: 18px;
  border: 1px solid #e3e0d7;
  border-radius: 13px;
  background: #faf9f5;
  color: var(--ep-on-surface);
  box-shadow: none;
  transition: transform .25s ease, background .25s ease, box-shadow .25s ease;
}

.trending-card:last-child,
.trending-card:nth-child(3) { border-right: 1px solid #e3e0d7; }

.trending-card:hover {
  background: #fff;
  color: var(--ep-on-surface);
  box-shadow: 0 12px 30px rgba(20,20,18,.08);
  transform: translateY(-3px);
}

.trending-card-top { margin-bottom: 22px; }

.trend-rank {
  color: rgba(60, 83, 172, .14);
  font-family: 'DM Sans', sans-serif;
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -.06em;
  -webkit-text-stroke: 0;
}

.trending-card:hover .trend-rank {
  color: rgba(60, 83, 172, .2);
  -webkit-text-stroke: 0;
}

.trend-change {
  padding: 3px 6px;
  border-radius: 999px;
  background: #f5e6e3;
  color: var(--ep-error);
  font-size: 8px;
}

.trending-card:hover .trend-change { color: var(--ep-error); }

.trend-category {
  margin-bottom: 7px;
  padding: 0;
  background: transparent;
  color: var(--ep-primary);
  font-size: 8px;
  letter-spacing: .08em;
}

.trending-card:hover .trend-category { color: var(--ep-primary); }

.trending-card h3 {
  min-height: 45px;
  margin-bottom: 20px;
  color: var(--ep-on-surface);
  font-size: 16px;
  line-height: 1.35;
}

.trend-metrics,
.trending-card:hover .trend-metrics {
  color: var(--ep-on-surface-variant);
  font-size: 8px;
}

.trend-bar,
.trending-card:hover .trend-bar {
  height: 3px;
  border-radius: 999px;
  background: #e6e3da;
}

.trend-bar span,
.trending-card:hover .trend-bar span {
  border-radius: 999px;
  background: var(--ep-primary);
}

.trending-note {
  margin-top: 15px;
  color: var(--ep-on-surface-variant);
  font-size: 9px;
  text-align: left;
}

@media (max-width: 1040px) {
  .trending-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .trending-card:nth-child(-n+3) { border-bottom: 1px solid #e3e0d7; }
}

@media (max-width: 700px) {
  .trending-panel { margin-top: 64px; padding: 32px 0 0; }
  .trending-head { align-items: flex-start; gap: 14px; margin-bottom: 22px; }
  .trending-grid { display: flex; gap: 10px; }
  .trending-card,
  .trending-card.leader {
    flex: 0 0 min(66vw, 220px);
    min-height: 200px;
    border: 1px solid #e3e0d7;
  }
}
</style>

<style scoped>
.trending-panel {
  --ep-on-surface: var(--ink);
  --ep-on-surface-variant: var(--muted);
  --ep-primary: var(--region-color);
  --ep-error: var(--danger);
  position: relative;
  margin-top: 88px;
  padding: 40px 0 0;
  overflow: visible;
  border: 0;
  border-top: 1px solid var(--line);
  border-radius: 0;
  background: transparent;
  color: var(--ink);
  font-family: var(--sans);
}

.trending-panel::before { display: none; }

.trending-head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 28px;
  margin-bottom: 24px;
  padding: 0;
  border: 0;
}

.trending-kicker {
  display: block;
  margin-bottom: 8px;
  color: var(--region-color);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .12em;
}

.trending-head h2 {
  font-family: var(--sans);
  font-size: clamp(26px, 3vw, 36px);
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -.04em;
}

.trending-head p {
  max-width: 54ch;
  margin-top: 8px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.6;
}

.trending-live {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius-control);
  background: var(--surface);
  box-shadow: none;
  color: var(--ink-soft);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .04em;
}

.live-pulse {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--danger);
  animation: livePulse 2s infinite;
}

.trending-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  border: 0;
}

.trending-card,
.trending-card.leader {
  position: relative;
  min-width: 0;
  min-height: 206px;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface-subtle);
  color: var(--ink);
  box-shadow: none;
  transition: transform var(--motion-base) var(--ease-standard), background var(--motion-fast), border-color var(--motion-fast), box-shadow var(--motion-base);
}

.trending-card:last-child,
.trending-card:nth-child(3) { border-right: 1px solid var(--line); }

.trending-card.leader { border-color: color-mix(in srgb, var(--region-color) 32%, var(--line)); }

.trending-card:hover {
  border-color: var(--line-strong);
  background: var(--surface);
  color: var(--ink);
  box-shadow: 0 14px 32px rgba(23,24,27,.08);
  transform: translateY(-3px);
}

.trending-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 22px;
}

.trend-rank,
.trending-card:hover .trend-rank {
  color: color-mix(in srgb, var(--region-color) 18%, transparent);
  font-family: var(--sans);
  font-size: 30px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -.06em;
  -webkit-text-stroke: 0;
}

.trend-change,
.trending-card:hover .trend-change {
  display: inline-flex;
  align-items: center;
  padding: 4px 7px;
  border-radius: var(--radius-pill);
  background: var(--danger-tint);
  color: var(--danger);
  font-size: 9px;
  font-weight: 750;
  white-space: nowrap;
}

.trend-category,
.trending-card:hover .trend-category {
  display: inline-block;
  margin-bottom: 7px;
  padding: 0;
  border-radius: 0;
  background: transparent;
  color: var(--region-color);
  font-size: 9px;
  font-weight: 750;
  letter-spacing: .04em;
}

.trending-card h3 {
  min-height: 45px;
  margin-bottom: 20px;
  color: var(--ink);
  font-size: 16px;
  font-weight: 750;
  line-height: 1.35;
  letter-spacing: -.025em;
}

.trend-metrics,
.trending-card:hover .trend-metrics {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 9px;
  color: var(--muted);
  font-size: 9px;
}

.trend-bar,
.trending-card:hover .trend-bar {
  height: 3px;
  overflow: hidden;
  border-radius: var(--radius-pill);
  background: var(--surface-muted);
}

.trend-bar span,
.trending-card:hover .trend-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--region-color);
  transition: width .7s var(--ease-standard);
}

.trending-note {
  position: relative;
  z-index: 1;
  margin-top: 15px;
  color: var(--muted);
  font-size: 10px;
  line-height: 1.55;
  text-align: left;
}

@media (max-width: 1040px) {
  .trending-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (max-width: 700px) {
  .trending-panel { margin-top: 64px; padding: 32px 0 0; }
  .trending-head { align-items: flex-start; flex-direction: column; gap: 14px; margin-bottom: 22px; }
  .trending-grid { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 8px; scroll-snap-type: x mandatory; scrollbar-width: none; }
  .trending-grid::-webkit-scrollbar { display: none; }
  .trending-card,
  .trending-card.leader { flex: 0 0 min(66vw, 220px); min-height: 200px; scroll-snap-align: start; }
}

@media (prefers-reduced-motion: reduce) {
  .live-pulse { animation: none; }
}
</style>
