<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useRegion } from '../stores/useRegion.js'

const router = useRouter()
const { setRegion } = useRegion()
const emit = defineEmits(['done'])

// 궤도 위를 도는 지역 포스터 카드. 클릭하면 해당 지역 홈으로 이동한다.
// img는 public/posters/<region>.png 를 가리킨다(BASE_URL 기준).
// ratio는 포스터 원본 세로비율(잘림 없이 프레임을 맞추기 위함).
const poster = (name) => `${import.meta.env.BASE_URL}posters/${name}.png`
const CARDS = [
  { id: 'seoul', region: 'seoul', label: '서울', img: poster('seoul'), ratio: '4 / 5' },
  { id: 'daejeon', region: 'daejeon', label: '대전·충청', img: poster('daejeon'), ratio: '2 / 3' },
  { id: 'busan', region: 'busan', label: '부산', img: poster('busan'), ratio: '2 / 3' },
  { id: 'gwangju', region: 'gwangju', label: '광주·전라', img: poster('gwangju'), ratio: '4 / 5' },
  { id: 'gumi', region: 'gumi', label: '구미·경북', img: poster('gumi'), ratio: '2 / 3' },
]

// 레퍼런스처럼 방향이 번갈아 가는 절제된 고정 기울기(카드 순서대로 적용)
const TILTS = [7, -10, 9, -8, 11]

// 등각 배치에 유기적인 느낌을 주는 랜덤 오프셋(카드별 고정 시드 → 리사이즈해도 흔들리지 않음)
const jitters = CARDS.map((_, i) => ({
  angle: (Math.random() - 0.5) * 10, // ±5deg
  radius: (Math.random() - 0.5) * 26, // ±13px
  tilt: TILTS[i % TILTS.length],
}))

let visibleTilts = CARDS.map((_, i) => jitters[i].tilt)

const placed = ref(false)
const entered = ref(false)
const leaving = ref(false)
const rippling = ref(false)
const isMobile = ref(false)
const storyVisible = ref(false)
const positions = ref(CARDS.map(() => ({ x: 0, y: 0 })))

const introScrollEl = ref(null)
const orbitEl = ref(null)
const storyEl = ref(null)
const cardInnerEls = []
function setCardInner(el, index) {
  if (el) cardInnerEls[index] = el
}

const visibleCards = computed(() => CARDS)

const rippleScale = computed(() => {
  if (typeof window === 'undefined') return 90
  return Math.ceil((Math.max(window.innerWidth, window.innerHeight) * 2.1) / 18)
})
const rippleStyle = ref({ left: '50%', top: '50%' })

// ---------- 궤도 배치 ----------
function layout() {
  const vw = window.innerWidth
  const vh = window.innerHeight
  isMobile.value = vw <= 768
  const count = visibleCards.value.length
  const base = Math.min(vw, vh)
  const radius = isMobile.value
    ? Math.max(base * 0.38, 150)
    : Math.min(Math.max(base * 0.42, 320), 430)

  visibleTilts = visibleCards.value.map((card) => jitters[CARDS.indexOf(card)].tilt)
  positions.value = visibleCards.value.map((card, index) => {
    const cardIdx = CARDS.indexOf(card)
    const theta = ((index * 360) / count - 90 + jitters[cardIdx].angle) * (Math.PI / 180)
    const r = radius + jitters[cardIdx].radius
    return { x: Math.cos(theta) * r, y: Math.sin(theta) * r }
  })
  queueTransitionFrame()
}

// ---------- 회전 루프 (rAF: 호버 감속을 부드럽게 보간) ----------
const DESKTOP_SPEED = 360 / 80 // deg/s
const MOBILE_SPEED = 360 / 50
let angle = 0
let speed = 0
let targetSpeed = 0
let rafId = null
let lastTs = 0
let reduceMotion = false
let storyObserver = null
let scrollResetTimer = null
let userRequestedStory = false
let transitionRafId = null

function resetIntroScroll() {
  if (introScrollEl.value) introScrollEl.value.scrollTop = 0
}

function markStoryIntent(event) {
  if (!event || typeof event.deltaY !== 'number' || event.deltaY > 0) {
    userRequestedStory = true
  }
}

function onIntroScroll() {
  if (!userRequestedStory && introScrollEl.value?.scrollTop) {
    resetIntroScroll()
  }
  queueTransitionFrame()
}

function updateTransitionProgress() {
  transitionRafId = null
  const scrollEl = introScrollEl.value
  if (!scrollEl) return

  const progress = Math.min(1, Math.max(0, scrollEl.scrollTop / Math.max(scrollEl.clientHeight, 1)))
  const style = scrollEl.style

  if (reduceMotion) {
    style.setProperty('--opening-scale', '1')
    style.setProperty('--opening-opacity', '1')
    style.setProperty('--opening-blur', '0px')
    style.setProperty('--opening-saturate', '1')
    style.setProperty('--story-scale', '1')
    style.setProperty('--story-lift', '0px')
    style.setProperty('--story-radius', '0px')
    style.setProperty('--story-shadow', '0')
    style.setProperty('--transition-glow', '0')
    style.setProperty('--video-shift', '0px')
    return
  }

  const eased = progress * progress * (3 - 2 * progress)
  const glow = Math.sin(progress * Math.PI)
  const maxBlur = isMobile.value ? 6 : 10

  style.setProperty('--opening-scale', String(1 - eased * 0.045))
  style.setProperty('--opening-opacity', String(1 - eased * 0.72))
  style.setProperty('--opening-blur', `${eased * maxBlur}px`)
  style.setProperty('--opening-saturate', String(1 - eased * 0.28))
  style.setProperty('--story-scale', String(0.94 + eased * 0.06))
  style.setProperty('--story-lift', `${(1 - eased) * (isMobile.value ? 28 : 50)}px`)
  style.setProperty('--story-radius', `${(1 - eased) * (isMobile.value ? 28 : 44)}px`)
  style.setProperty('--story-shadow', String((1 - eased) * 0.58))
  style.setProperty('--transition-glow', String(glow * 0.88))
  style.setProperty('--video-shift', `${(1 - eased) * (isMobile.value ? 14 : 26)}px`)
}

function queueTransitionFrame() {
  if (transitionRafId !== null) return
  transitionRafId = requestAnimationFrame(updateTransitionProgress)
}

function onIntroKeydown(event) {
  if (['ArrowDown', 'PageDown', ' '].includes(event.key)) userRequestedStory = true
}

function baseSpeed() {
  return isMobile.value ? MOBILE_SPEED : DESKTOP_SPEED
}

function tick(ts) {
  if (!lastTs) lastTs = ts
  const dt = Math.min((ts - lastTs) / 1000, 0.05)
  lastTs = ts

  speed += (targetSpeed - speed) * Math.min(1, dt * 3)
  angle = (angle + speed * dt) % 360

  if (orbitEl.value) {
    orbitEl.value.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`
  }
  cardInnerEls.forEach((el, index) => {
    if (el) el.style.transform = `rotate(${-angle + (visibleTilts[index] || 0)}deg)`
  })
  rafId = requestAnimationFrame(tick)
}

// 마우스가 궤도 영역 안에 있으면 회전을 약 45% 감속
function onPointerMove(event) {
  if (reduceMotion) return
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  const dist = Math.hypot(event.clientX - cx, event.clientY - cy)
  const orbitOuter = Math.min(Math.max(Math.min(window.innerWidth, window.innerHeight) * 0.42, 320), 430) + 140
  targetSpeed = dist < orbitOuter ? baseSpeed() * 0.55 : baseSpeed()
}

onMounted(() => {
  reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  layout()
  queueTransitionFrame()

  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual'
  }
  resetIntroScroll()
  requestAnimationFrame(resetIntroScroll)
  scrollResetTimer = window.setTimeout(resetIntroScroll, 120)
  window.addEventListener('load', resetIntroScroll, { once: true })

  window.addEventListener('resize', layout)
  window.addEventListener('mousemove', onPointerMove, { passive: true })
  window.addEventListener('keydown', onIntroKeydown)

  requestAnimationFrame(() => {
    placed.value = true
  })
  window.setTimeout(() => {
    entered.value = true
  }, 1700)

  if (!reduceMotion) {
    speed = baseSpeed()
    targetSpeed = speed
    rafId = requestAnimationFrame(tick)
  }

  storyObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return
      if (!userRequestedStory) {
        resetIntroScroll()
        return
      }
      storyVisible.value = true
    },
    { root: introScrollEl.value, threshold: 0.42 },
  )
  if (storyEl.value) storyObserver.observe(storyEl.value)
})

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
  if (transitionRafId !== null) cancelAnimationFrame(transitionRafId)
  if (scrollResetTimer) window.clearTimeout(scrollResetTimer)
  storyObserver?.disconnect()
  window.removeEventListener('load', resetIntroScroll)
  window.removeEventListener('resize', layout)
  window.removeEventListener('mousemove', onPointerMove)
  window.removeEventListener('keydown', onIntroKeydown)
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'auto'
  }
})

// ---------- 지역 선택 / 스킵 ----------
function selectRegion(regionId, event) {
  if (leaving.value) return

  const x = event?.clientX ?? window.innerWidth / 2
  const y = event?.clientY ?? window.innerHeight / 2
  rippleStyle.value = { left: `${x}px`, top: `${y}px` }

  requestAnimationFrame(() => {
    rippling.value = true
  })
  leaving.value = true

  window.setTimeout(() => {
    setRegion(regionId)
    router.push({ name: 'home' })
    emit('done')
  }, 620)
}

function skipIntro() {
  if (leaving.value) return
  leaving.value = true
  window.setTimeout(() => emit('done'), 320)
}

function scrollToStory() {
  userRequestedStory = true
  storyEl.value?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' })
}
</script>

<template>
  <div
    ref="introScrollEl"
    class="intro-overlay"
    :class="{ 'is-leaving': leaving && !rippling }"
    @scroll.passive="onIntroScroll"
    @wheel.passive="markStoryIntent"
    @touchstart.passive="markStoryIntent"
  >
    <header class="intro-header">
      <p class="intro-logo">Local<span>Hub</span></p>
      <button class="intro-skip" type="button" @click="skipIntro">바로 둘러보기 →</button>
    </header>

    <section class="intro-section intro-opening" aria-label="지역 선택 인트로">
      <div ref="orbitEl" class="intro-orbit">
        <button
          v-for="(card, index) in visibleCards"
          :key="card.id"
          type="button"
          class="orbit-card"
          :class="{ 'is-placed': placed, 'is-entered': entered }"
          :style="{
            '--tx': positions[index].x + 'px',
            '--ty': positions[index].y + 'px',
            transitionDelay: placed && !entered ? 0.4 + index * 0.1 + 's' : '0s',
          }"
          :aria-label="`${card.label} 지역으로 이동`"
          @click="selectRegion(card.region, $event)"
        >
          <span
            :ref="(el) => setCardInner(el, index)"
            class="orbit-card-inner"
            :style="{ transform: `rotate(${jitters[CARDS.indexOf(card)].tilt}deg)` }"
          >
            <span class="orbit-card-media" :style="{ aspectRatio: card.ratio }">
              <img :src="card.img" :alt="`${card.label} 포스터`" loading="eager" referrerpolicy="no-referrer" />
            </span>
          </span>
        </button>
      </div>

      <div class="intro-center" :class="{ 'is-ready': placed }">
        <h1 class="intro-title"><span>SOUTH</span><span class="indent">KOREA</span></h1>
        <p class="intro-sub">사진을 눌러 지역을 선택하세요</p>
      </div>

      <button class="intro-scroll-cue" type="button" @click="scrollToStory">
        <span>SCROLL TO DISCOVER</span>
        <span class="scroll-arrow" aria-hidden="true">↓</span>
      </button>
    </section>

    <section ref="storyEl" class="intro-section intro-story" aria-labelledby="story-title">
      <div class="story-video" aria-hidden="true">
        <iframe
          src="https://www.youtube-nocookie.com/embed/dqkfpKJw348?autoplay=1&mute=1&start=6&loop=1&playlist=dqkfpKJw348&controls=0&disablekb=1&fs=0&iv_load_policy=3&modestbranding=1&playsinline=1&rel=0"
          title="Feel the Rhythm of Korea - Gyeongju and Andong"
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerpolicy="strict-origin-when-cross-origin"
        ></iframe>
      </div>
      <div class="story-shade"></div>

      <div class="story-copy" :class="{ 'is-visible': storyVisible }">
        <p class="story-kicker">GYEONGJU · ANDONG</p>
        <h2 id="story-title"><span>Feel the rhythm</span><span>of Korea.</span></h2>
        <p class="story-description">
          천년 고도의 시간과 안동의 리듬이 만나는 곳.<br />
          오래된 골목과 강, 오늘의 움직임을 따라 경북을 새롭게 발견해 보세요.
        </p>
        <button class="story-enter" type="button" @click="selectRegion('gumi', $event)">
          경북에서 시작하기 <span aria-hidden="true">→</span>
        </button>
      </div>

      <a
        class="story-credit"
        href="https://www.youtube.com/watch?v=dqkfpKJw348"
        target="_blank"
        rel="noreferrer"
      >
        FILM BY VISITKOREA ↗
      </a>
    </section>

    <div
      class="intro-ripple"
      :class="{ 'is-active': rippling }"
      :style="{ ...rippleStyle, '--ripple-scale': rippleScale }"
    ></div>
  </div>
</template>

<style scoped>
.intro-overlay {
  --intro-bg: #161616;
  --intro-accent: #e0362b;
  --intro-fg: #f5f5f2;

  position: fixed;
  inset: 0;
  z-index: 1000;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scroll-snap-type: y mandatory;
  scrollbar-width: none;
  background: var(--intro-bg);
  color: var(--intro-fg);
  opacity: 1;
  transition: opacity 0.32s ease;
}
.intro-overlay::-webkit-scrollbar { display: none; }
.intro-overlay.is-leaving {
  opacity: 0;
  pointer-events: none;
}

.intro-section {
  position: relative;
  width: 100%;
  height: 100svh;
  min-height: 620px;
  overflow: hidden;
  scroll-snap-align: start;
  scroll-snap-stop: always;
}
.intro-opening {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--intro-bg);
  opacity: var(--opening-opacity, 1);
  filter: blur(var(--opening-blur, 0px)) saturate(var(--opening-saturate, 1));
  transform: scale(var(--opening-scale, 1));
  transform-origin: 50% 48%;
  will-change: transform, filter, opacity;
}

/* ---------- Layer 2. 궤도 ---------- */
.intro-orbit {
  position: absolute;
  left: 50%;
  top: 52%;
  width: 0;
  height: 0;
  transform: translate(-50%, -50%);
  will-change: transform;
}

.orbit-card {
  position: absolute;
  left: 0;
  top: 0;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.3);
  transition:
    transform 0.9s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.7s ease;
  z-index: 1;
}
.orbit-card.is-placed {
  opacity: 1;
  transform: translate(-50%, -50%) translate(var(--tx), var(--ty)) scale(1);
}
.orbit-card:hover { z-index: 5; }

/* 카운터 회전(이미지 수평 유지)은 rAF가 inline transform으로 제어 */
.orbit-card-inner {
  position: relative;
  display: block;
  will-change: transform;
}

.orbit-card-media {
  display: block;
  width: 176px;
  border-radius: 10px;
  overflow: hidden;
  background: #26242a;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.5);
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s ease;
}
.orbit-card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.orbit-card:hover .orbit-card-media {
  transform: scale(1.08);
  box-shadow: 0 26px 60px rgba(0, 0, 0, 0.65);
}

/* ---------- Layer 3. 헤더 ---------- */
.intro-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1020;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: max(22px, env(safe-area-inset-top)) clamp(20px, 4vw, 44px) 22px;
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.intro-logo {
  margin: 0;
  font-size: 21px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #ffffff;
}
.intro-logo span { color: var(--intro-accent); }

.intro-skip {
  padding: 9px 16px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  color: rgba(255, 255, 255, 0.85);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}
.intro-skip:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-1px);
}

/* ---------- Layer 3. 중앙 텍스트 ---------- */
.intro-center {
  position: absolute;
  left: 50%;
  top: 52%;
  z-index: 9;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
  width: min(88vw, 640px);
}
.intro-center > * {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.intro-center.is-ready > * { opacity: 1; transform: translateY(0); }
.intro-center.is-ready .intro-title { transition-delay: 0.05s; }
.intro-center.is-ready .intro-sub { transition-delay: 0.2s; }

.intro-title {
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: fit-content;
  margin-inline: auto;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: clamp(38px, 5.6vw, 68px);
  font-weight: 500;
  line-height: 1.08;
  letter-spacing: -0.015em;
  color: #ffffff;
}
.intro-title span { display: block; }
.intro-title .indent { margin-left: 1.1em; }

.intro-sub {
  margin: 20px 0 0;
  font-size: 13px;
  letter-spacing: 0.04em;
  color: rgba(246, 244, 239, 0.45);
}

.intro-scroll-cue {
  position: absolute;
  left: 50%;
  bottom: max(24px, env(safe-area-inset-bottom));
  z-index: 12;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px 10px 16px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.62);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.17em;
  transform: translateX(-50%);
  transition: color 0.2s ease, border-color 0.2s ease;
}
.intro-scroll-cue:hover {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.42);
}
.scroll-arrow {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  font-size: 13px;
  animation: scroll-nudge 1.8s ease-in-out infinite;
}
@keyframes scroll-nudge {
  0%, 100% { transform: translateY(-2px); }
  50% { transform: translateY(2px); }
}

/* ---------- 영상 스토리 ---------- */
.intro-story {
  z-index: 2;
  display: grid;
  place-items: center;
  background: #101416;
  border-radius: var(--story-radius, 44px) var(--story-radius, 44px) 0 0;
  box-shadow: 0 -34px 100px rgba(0, 0, 0, var(--story-shadow, 0.58));
  transform: translateY(var(--story-lift, 50px)) scale(var(--story-scale, 0.94));
  transform-origin: 50% 100%;
  will-change: transform, border-radius, box-shadow;
  isolation: isolate;
}
.intro-story::before {
  content: '';
  position: absolute;
  top: 0;
  left: 7%;
  right: 7%;
  z-index: 4;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.9), transparent);
  box-shadow: 0 0 24px 5px rgba(255, 244, 220, 0.28);
  opacity: var(--transition-glow, 0);
  pointer-events: none;
}
.story-video,
.story-shade {
  position: absolute;
  inset: 0;
}
.story-video {
  z-index: -3;
  overflow: hidden;
  background: #101416;
  pointer-events: none;
}
.story-video iframe {
  position: absolute;
  left: 50%;
  top: calc(50% + var(--video-shift, 26px));
  width: max(100vw, 177.78svh);
  height: max(100svh, 56.25vw);
  border: 0;
  transform: translate(-50%, -50%) scale(1.2);
  pointer-events: none;
}
.story-shade {
  z-index: -2;
  background:
    linear-gradient(180deg, rgba(4, 8, 10, 0.52) 0%, rgba(4, 8, 10, 0.12) 35%, rgba(4, 8, 10, 0.43) 100%),
    linear-gradient(90deg, rgba(4, 8, 10, 0.2), transparent 38%, rgba(4, 8, 10, 0.14));
}
.story-copy {
  width: min(92vw, 1480px);
  padding: 80px clamp(22px, 5vw, 84px) 36px;
  text-align: center;
  opacity: 0;
  transform: translateY(34px);
  transition: opacity 0.9s ease, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1);
}
.story-copy.is-visible {
  opacity: 1;
  transform: translateY(0);
}
.story-kicker {
  margin-bottom: clamp(18px, 3vh, 30px);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.19em;
  color: rgba(255, 255, 255, 0.78);
}
.story-copy h2 {
  margin: 0 auto;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: clamp(58px, 9.5vw, 148px);
  font-weight: 700;
  line-height: 0.84;
  letter-spacing: -0.065em;
  color: #f7f6f1;
  text-shadow: 0 4px 38px rgba(0, 0, 0, 0.18);
}
.story-copy h2 span { display: block; }
.story-description {
  max-width: 660px;
  margin: clamp(28px, 4vh, 44px) auto 0;
  font-size: clamp(13px, 1.05vw, 16px);
  font-weight: 400;
  line-height: 1.72;
  letter-spacing: -0.015em;
  color: rgba(255, 255, 255, 0.74);
  text-wrap: balance;
}
.story-enter {
  display: inline-flex;
  align-items: center;
  gap: 18px;
  margin-top: clamp(24px, 4vh, 38px);
  padding: 13px 18px 13px 22px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 999px;
  background: rgba(10, 12, 13, 0.22);
  backdrop-filter: blur(10px);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}
.story-enter span {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f5f4ef;
  color: #171717;
}
.story-enter:hover {
  color: #171717;
  background: #f5f4ef;
  transform: translateY(-2px);
}
.story-credit {
  position: absolute;
  left: clamp(20px, 4vw, 44px);
  bottom: max(24px, env(safe-area-inset-bottom));
  color: rgba(255, 255, 255, 0.5);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.14em;
  transition: color 0.2s ease;
}
.story-credit:hover { color: #fff; }

/* ---------- 리플 ---------- */
.intro-ripple {
  position: fixed;
  z-index: 1030;
  width: 18px;
  height: 18px;
  margin-left: -9px;
  margin-top: -9px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--intro-accent) 0%, var(--intro-bg) 70%);
  transform: scale(0);
  opacity: 0;
  pointer-events: none;
  transition: transform 0.65s cubic-bezier(0.2, 0.7, 0.2, 1), opacity 0.65s ease;
}
.intro-ripple.is-active {
  transform: scale(var(--ripple-scale));
  opacity: 1;
}

/* ---------- 반응형 ---------- */
@media (max-width: 768px) {
  .intro-section { min-height: 540px; }
  .orbit-card-media { width: 116px; border-radius: 8px; }
  .intro-title { letter-spacing: -0.02em; }
  .intro-sub { display: none; }
  .story-copy { width: 100%; padding-inline: 20px; }
  .story-copy h2 { font-size: clamp(54px, 17vw, 86px); line-height: 0.88; }
  .story-description { max-width: 34em; padding-inline: 10px; }
  .story-description br { display: none; }
  .story-credit { display: none; }
}

/* ---------- 모션 최소화 ---------- */
@media (prefers-reduced-motion: reduce) {
  .orbit-card,
  .intro-center > * {
    transition-duration: 0.01ms !important;
  }
  .scroll-arrow { animation: none; }
}
</style>
