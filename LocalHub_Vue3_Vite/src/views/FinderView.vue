<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { fetchCctvList, hasItsKey } from '../services/its.js'
import { fetchMissingPersons, hasSafe182Key } from '../services/safe182.js'
import {
  REGION_BBOX,
  REGION_CENTER,
  getSampleAlerts,
  getSampleCctvSpots,
  getSampleMissingPersons,
} from '../data/finderSampleData.js'
import { useRegion } from '../stores/useRegion.js'
import { useI18n } from 'vue-i18n'
import { getRegionNameShort } from '../data/regionNames.js'

const { state: regionState } = useRegion()
const { t, locale } = useI18n()
const regionShort = computed(() => getRegionNameShort(locale.value, regionState.current))

const mapElement = ref(null)
let map = null
let markerLayer = null

const cctvActive = ref(false)
const cctvSpots = ref([])
const usingSampleCctv = ref(true)
const selectedCctv = ref(null)
const liveClock = ref('')
let clockTimer = null

const alerts = ref(getSampleAlerts(regionState.current))

const missingPersons = ref([])
const usingSampleMissing = ref(true)

const showAll = ref(false)
const visibleMissingPersons = computed(() =>
  showAll.value ? missingPersons.value : missingPersons.value.slice(0, 3),
)

function buildMarkers() {
  if (!markerLayer) return
  markerLayer.clearLayers()
  if (!cctvActive.value) return

  cctvSpots.value.forEach((spot) => {
    const icon = L.divIcon({
      className: 'ep-cctv-marker',
      html: '<span class="ep-cctv-dot"></span><span class="ep-cctv-badge material-symbols-outlined">videocam</span>',
      iconSize: [40, 40],
      iconAnchor: [20, 34],
    })
    L.marker([spot.lat, spot.lng], { icon })
      .on('click', () => openCctv(spot))
      .addTo(markerLayer)
  })
}

function toggleCctvLayer() {
  cctvActive.value = !cctvActive.value
  buildMarkers()
  if (!cctvActive.value) closeCctv()
}

function openCctv(spot) {
  selectedCctv.value = spot
  if (clockTimer) clearInterval(clockTimer)
  clockTimer = setInterval(() => {
    liveClock.value = new Date().toISOString().replace('T', ' ').substring(0, 19)
  }, 1000)
}

function closeCctv() {
  selectedCctv.value = null
  if (clockTimer) clearInterval(clockTimer)
}

function locateMe() {
  if (!map || !navigator.geolocation) return
  navigator.geolocation.getCurrentPosition((position) => {
    map.setView([position.coords.latitude, position.coords.longitude], 14)
  })
}

async function loadCctv() {
  const bbox = REGION_BBOX[regionState.current]
  const remote = await fetchCctvList(bbox)
  if (remote && remote.length) {
    cctvSpots.value = remote
    usingSampleCctv.value = false
  } else {
    cctvSpots.value = getSampleCctvSpots(regionState.current)
    usingSampleCctv.value = true
  }
  buildMarkers()
}

async function loadMissingPersons() {
  const remote = await fetchMissingPersons()
  if (remote && remote.length) {
    missingPersons.value = remote
    usingSampleMissing.value = false
  } else {
    missingPersons.value = getSampleMissingPersons(regionState.current)
    usingSampleMissing.value = true
  }
}

async function refreshForRegion() {
  alerts.value = getSampleAlerts(regionState.current)
  closeCctv()
  map?.setView(REGION_CENTER[regionState.current] || REGION_CENTER.daejeon, 12)
  await Promise.all([loadCctv(), loadMissingPersons()])
}

onMounted(async () => {
  await nextTick()
  map = L.map(mapElement.value, { scrollWheelZoom: true, zoomControl: false }).setView(
    REGION_CENTER[regionState.current] || REGION_CENTER.daejeon,
    12,
  )
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map)
  markerLayer = L.layerGroup().addTo(map)
  setTimeout(() => map?.invalidateSize(), 50)

  await Promise.all([loadCctv(), loadMissingPersons()])
})

watch(() => regionState.current, refreshForRegion)

onBeforeUnmount(() => {
  if (clockTimer) clearInterval(clockTimer)
  map?.remove()
  map = null
})
</script>

<template>
  <main class="ep-finder">

    <section class="ep-map-wrap">
      <div ref="mapElement" class="ep-map"></div>

      <div class="ep-map-controls">
        <button class="ep-map-btn" :class="{ active: cctvActive }" type="button" @click="toggleCctvLayer">
          <span class="material-symbols-outlined">videocam</span>
          <span class="label">{{ $t('finder.cctvLive') }}</span>
        </button>
        <div class="ep-map-zoom">
          <button type="button" @click="map?.zoomIn()" :aria-label="$t('finder.zoomIn')"><span class="material-symbols-outlined">add</span></button>
          <button type="button" @click="map?.zoomOut()" :aria-label="$t('finder.zoomOut')"><span class="material-symbols-outlined">remove</span></button>
        </div>
      </div>

      <transition name="ep-fade">
        <div v-if="selectedCctv" class="ep-cctv-overlay">
          <div class="ep-cctv-overlay-head">
            <span class="ep-live-chip"><span class="dot"></span>{{ $t('finder.liveBadge') }}</span>
            <h3>{{ selectedCctv.name }}</h3>
            <button type="button" :aria-label="$t('finder.close')" @click="closeCctv">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <div class="ep-cctv-feed">
            <span class="material-symbols-outlined">videocam</span>
            <p>{{ usingSampleCctv ? $t('finder.cctvSampleNotice') : $t('finder.cctvLiveNotice') }}</p>
            <span class="ep-cctv-time">{{ liveClock }}</span>
          </div>
        </div>
      </transition>
    </section>

    <section class="ep-panel">
      <div class="ep-panel-grid">
        <section class="ep-alerts" aria-labelledby="finder-alerts-title">
          <div class="ep-section-head ep-section-head--lined">
            <div class="left">
              <span class="material-symbols-outlined warn" aria-hidden="true">warning</span>
              <h2 id="finder-alerts-title">{{ t('finder.alertsTitle', { region: regionShort }) }}</h2>
            </div>
          </div>

          <div class="ep-alert-list">
            <article v-for="alert in alerts" :key="alert.id" class="ep-alert-card" :class="alert.tone">
              <div class="ep-alert-top">
                <span class="ep-alert-tag">{{ alert.tag }}</span>
                <span class="ep-alert-time">{{ alert.time }}</span>
              </div>
              <h3>{{ alert.title }}</h3>
              <p>{{ alert.desc }}</p>
            </article>
          </div>
        </section>

        <section class="ep-missing" aria-labelledby="finder-missing-title">
          <div class="ep-section-head ep-section-head--lined">
            <div class="left">
              <span class="material-symbols-outlined" aria-hidden="true">person_search</span>
              <h2 id="finder-missing-title">{{ $t('finder.missingTitle') }}</h2>
            </div>
            <a class="ep-safe-link" href="https://www.safe182.go.kr" target="_blank" rel="noopener">
              {{ $t('finder.safeDreamLink') }} <span class="material-symbols-outlined">chevron_right</span>
            </a>
          </div>

          <div class="ep-missing-grid" :class="{ 'is-expanded': showAll }">
            <article v-for="person in visibleMissingPersons" :key="person.id" class="ep-missing-card">
              <div class="ep-missing-photo">
                <img
                  v-if="person.photoUrl"
                  :src="person.photoUrl"
                  :alt="`${person.name} 사진`"
                  @error="(e) => e.currentTarget.src = 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80'"
                />
                <span v-else class="material-symbols-outlined">person</span>
                <span class="ep-missing-badge">{{ person.category }}</span>
                <span v-if="usingSampleMissing" class="ep-sample-badge">{{ $t('finder.sampleBadge') }}</span>
              </div>
              <div class="ep-missing-body">
                <h3>{{ person.name }} ({{ person.gender }}, {{ person.age }}{{ $t('finder.ageSuffix') }})</h3>
                <div class="ep-missing-meta"><span class="material-symbols-outlined">location_on</span>{{ person.location }}</div>
                <div class="ep-missing-meta"><span class="material-symbols-outlined">calendar_today</span>{{ person.date }}</div>
              </div>
            </article>

            <button
              v-if="!showAll && missingPersons.length > 3"
              class="ep-missing-more"
              type="button"
              @click="showAll = true"
            >
              <span class="material-symbols-outlined">arrow_forward</span>
              <strong>{{ $t('finder.viewAll', { count: missingPersons.length }) }}</strong>
            </button>

            <button v-else-if="showAll" class="ep-missing-collapse" type="button" @click="showAll = false">
              <span class="material-symbols-outlined">unfold_less</span>
              접기
            </button>
          </div>
        </section>
      </div>
    </section>
  </main>
</template>

<style scoped>
.ep-finder {
  --ep-surface: var(--bg);
  --ep-surface-container-lowest: var(--surface);
  --ep-surface-container-low: var(--surface-subtle);
  --ep-surface-container: var(--surface-muted);
  --ep-on-surface: var(--ink);
  --ep-on-surface-variant: var(--muted);
  --ep-outline-variant: var(--line);
  --ep-primary: var(--region-color);
  --ep-secondary: var(--region-dark);
  --ep-error: var(--danger);
  --ep-error-container: var(--danger-tint);
  --ep-on-error-container: var(--danger);

  font-family: var(--sans);
  color: var(--ep-on-surface);
  background: var(--ep-surface);
}

.ep-finder .material-symbols-outlined {
  font-family: 'Material Symbols Outlined';
  font-weight: normal;
  font-style: normal;
  line-height: 1;
  vertical-align: middle;
}

.ep-map-wrap { position: relative; width: 100%; height: 60vh; min-height: 420px; background: var(--ep-surface-container); }
.ep-map { position: absolute; inset: 0; z-index: 1; }

.ep-map-controls { position: absolute; top: 16px; right: 16px; z-index: 500; display: flex; flex-direction: column; gap: 8px; }
.ep-map-btn {
  display: flex; align-items: center; gap: 8px; background: #fff; color: var(--ep-on-surface);
  padding: 12px; border: 1px solid var(--line); border-radius: var(--radius-control); box-shadow: 0 6px 18px rgba(23,24,27,.1); font-weight: 700; font-size: 13px;
  transition: background .2s, color .2s;
}
.ep-map-btn .material-symbols-outlined { color: var(--ep-primary); }
.ep-map-btn.active { background: var(--ep-primary); color: #fff; }
.ep-map-btn.active .material-symbols-outlined { color: #fff; }
.ep-map-btn.icon-only { justify-content: center; width: 44px; height: 44px; padding: 0; }
.ep-map-zoom { display: flex; flex-direction: column; border: 1px solid var(--line); border-radius: var(--radius-control); overflow: hidden; box-shadow: 0 6px 18px rgba(23,24,27,.1); }
.ep-map-zoom button { background: #fff; width: 44px; height: 40px; display: grid; place-items: center; border-bottom: 1px solid var(--ep-outline-variant); }
.ep-map-zoom button:last-child { border-bottom: 0; }

:deep(.ep-cctv-marker) { position: relative; }
:deep(.ep-cctv-dot) {
  position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 12px; height: 12px; border-radius: 999px; background: var(--ep-error);
  box-shadow: 0 0 0 0 rgba(186,26,26,.7); animation: ep-cctv-pulse 2s infinite;
}
:deep(.ep-cctv-badge) {
  position: absolute; top: 0; left: 50%; transform: translateX(-50%);
  width: 30px; height: 30px; border-radius: 999px; background: #fff; color: var(--ep-error);
  display: grid; place-items: center; box-shadow: 0 2px 8px rgba(0,0,0,.18); font-size: 16px;
}
@keyframes ep-cctv-pulse {
  0% { box-shadow: 0 0 0 0 rgba(186,26,26,.7); }
  70% { box-shadow: 0 0 0 10px rgba(186,26,26,0); }
  100% { box-shadow: 0 0 0 0 rgba(186,26,26,0); }
}

.ep-cctv-overlay {
  position: absolute; z-index: 600; left: 16px; bottom: 16px; width: min(340px, calc(100% - 32px));
  background: rgba(255,255,255,.94); backdrop-filter: blur(10px); border-radius: var(--radius-card); overflow: hidden;
  box-shadow: var(--shadow-overlay); border: 1px solid var(--ep-outline-variant);
}
.ep-cctv-overlay-head { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-bottom: 1px solid var(--ep-outline-variant); }
.ep-cctv-overlay-head h3 { flex: 1; font-size: 14px; font-weight: 700; }
.ep-cctv-overlay-head button { color: var(--ep-on-surface-variant); }
.ep-live-chip { display: inline-flex; align-items: center; gap: 5px; background: var(--ep-error-container); color: var(--ep-on-error-container); font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 999px; }
.ep-live-chip .dot { width: 6px; height: 6px; border-radius: 999px; background: var(--ep-error); }
.ep-cctv-feed { position: relative; height: 190px; background: #1c2333; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: rgba(255,255,255,.75); }
.ep-cctv-feed .material-symbols-outlined { font-size: 32px; }
.ep-cctv-feed p { font-size: 12px; text-align: center; padding: 0 16px; }
.ep-cctv-time { position: absolute; right: 10px; bottom: 8px; font-size: 11px; font-family: monospace; color: rgba(255,255,255,.7); }

.ep-fade-enter-active, .ep-fade-leave-active { transition: opacity .25s, transform .25s; }
.ep-fade-enter-from, .ep-fade-leave-to { opacity: 0; transform: translateY(10px); }

.ep-panel {
  padding: 42px var(--page-gutter) 88px;
  background: #fbf9fc;
  border-top: 1px solid rgba(68, 61, 81, .08);
}

.ep-panel-grid {
  width: min(100%, var(--layout-max));
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(250px, .78fr) minmax(0, 1.72fr);
  gap: clamp(28px, 3.2vw, 46px);
  align-items: start;
}

.ep-section-head {
  min-height: 42px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.ep-section-head--lined {
  padding-bottom: 14px;
  margin-bottom: 18px;
  border-bottom: 1px solid #d9d6de;
}

.ep-section-head .left {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
}

.ep-section-head .material-symbols-outlined {
  color: #2d78d5;
  font-size: 22px;
}

.ep-section-head .warn { color: #d94b53; }

.ep-section-head h2 {
  margin: 0;
  font-size: clamp(18px, 1.55vw, 23px);
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -.025em;
}

.ep-safe-link {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  color: #2377d8;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
  transition: opacity .2s, transform .2s;
}

.ep-safe-link:hover { opacity: .75; transform: translateX(2px); }
.ep-safe-link .material-symbols-outlined { font-size: 16px; }

.ep-alert-list {
  display: grid;
  gap: 14px;
}

.ep-alert-card {
  min-height: 134px;
  padding: 18px 19px;
  border: 1px solid #dcd8e1;
  border-radius: 8px;
  background: rgba(255,255,255,.86);
  box-shadow: 0 1px 2px rgba(33, 28, 42, .03);
}

.ep-alert-card.error {
  background: #ffd9d8;
  border-color: #efb3b5;
}

.ep-alert-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 13px;
}

.ep-alert-tag {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 4px 9px;
  border-radius: 999px;
  background: #d92831;
  color: #fff;
  font-size: 10.5px;
  font-weight: 800;
}

.ep-alert-card.secondary .ep-alert-tag { background: #14284c; }
.ep-alert-time { color: #6f6b75; font-size: 10.5px; font-weight: 700; }

.ep-alert-card h3 {
  margin: 0 0 9px;
  font-size: 18px;
  line-height: 1.25;
  font-weight: 800;
  letter-spacing: -.02em;
}

.ep-alert-card p {
  margin: 0;
  color: #67636d;
  font-size: 12px;
  line-height: 1.65;
  word-break: keep-all;
}

.ep-missing-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr)) minmax(112px, .82fr);
  gap: 16px;
  align-items: stretch;
}

.ep-missing-grid.is-expanded {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.ep-missing-card {
  min-width: 0;
  overflow: hidden;
  border: 1px solid #d9d6df;
  border-radius: 7px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(31, 26, 40, .04);
  transition: transform .2s, box-shadow .2s;
}

.ep-missing-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(32, 27, 42, .1);
}

.ep-missing-photo {
  position: relative;
  aspect-ratio: 1 / 1.12;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: #e9e7eb;
  color: var(--ep-on-surface-variant);
}

.ep-missing-photo img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 22%;
}

.ep-missing-photo .material-symbols-outlined { font-size: 40px; }

.ep-missing-badge,
.ep-sample-badge {
  position: absolute;
  top: 8px;
  min-height: 22px;
  display: inline-flex;
  align-items: center;
  padding: 4px 7px;
  border-radius: 4px;
  color: #fff;
  font-size: 9px;
  font-weight: 800;
  line-height: 1;
}

.ep-missing-badge { left: 8px; background: rgba(20, 24, 29, .74); }
.ep-sample-badge { right: 8px; background: #d3292f; }

.ep-missing-body { padding: 13px 12px 14px; }

.ep-missing-body h3 {
  margin: 0 0 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: -.02em;
}

.ep-missing-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  margin-top: 7px;
  color: #77727b;
  font-size: 10.5px;
  line-height: 1.25;
}

.ep-missing-meta .material-symbols-outlined {
  flex: 0 0 auto;
  color: #78737d;
  font-size: 14px;
}

.ep-missing-more,
.ep-missing-collapse {
  min-height: 100%;
  border: 1px solid #d9d6df;
  border-radius: 7px;
  background: rgba(255,255,255,.65);
  color: #2377d8;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 18px 12px;
  text-align: center;
  transition: background .2s, color .2s, transform .2s;
}

.ep-missing-more:hover,
.ep-missing-collapse:hover {
  background: #eef5ff;
  color: #155aa9;
  transform: translateY(-2px);
}

.ep-missing-more .material-symbols-outlined,
.ep-missing-collapse .material-symbols-outlined {
  font-size: 28px;
}

.ep-missing-more strong,
.ep-missing-collapse {
  font-size: 11px;
  font-weight: 800;
}

@media (max-width: 1100px) {
  .ep-panel-grid { grid-template-columns: 1fr; }
  .ep-alert-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 760px) {
  .ep-panel { padding-top: 30px; }
  .ep-alert-list { grid-template-columns: 1fr; }
  .ep-missing-grid,
  .ep-missing-grid.is-expanded {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .ep-missing-more,
  .ep-missing-collapse { min-height: 180px; }
}

@media (max-width: 480px) {
  .ep-section-head { align-items: flex-start; }
  .ep-safe-link { font-size: 11px; }
  .ep-missing-grid,
  .ep-missing-grid.is-expanded { grid-template-columns: 1fr 1fr; gap: 10px; }
  .ep-missing-body h3 { font-size: 12px; }
}
</style>
