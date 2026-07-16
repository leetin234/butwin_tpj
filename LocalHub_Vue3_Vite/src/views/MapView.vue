<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useSpots } from '../stores/useSpots.js'
import { useRegion } from '../stores/useRegion.js'
import { getRegionNameShort } from '../data/regionNames.js'

const route = useRoute()
const { t, locale } = useI18n()
const { state: regionState } = useRegion()
const regionShort = computed(() => getRegionNameShort(locale.value, regionState.current))
const { state, loadSpots } = useSpots()
const mapElement = ref(null)
const selectedSpot = ref(null)
const brokenImages = reactive(new Set())
let map = null
let markerLayer = null
const markers = new Map()

function markBroken(id) {
  brokenImages.add(id)
}

function makePopup(spot) {
  const root = document.createElement('div')
  root.className = 'map-popup'
  const title = document.createElement('strong')
  title.textContent = spot.title
  const address = document.createElement('p')
  address.textContent = spot.addr
  root.append(title, address)
  return root
}

async function drawMap() {
  if (!mapElement.value || !state.spots.length) return
  await nextTick()
  const center = state.region?.center || [36.3504, 127.3845]
  if (!map) {
    map = L.map(mapElement.value, { scrollWheelZoom: true }).setView(center, 11)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)
    markerLayer = L.layerGroup().addTo(map)
  } else {
    map.setView(center, 11)
  }

  markerLayer.clearLayers()
  markers.clear()
  state.spots.forEach((spot) => {
    const marker = L.circleMarker([Number(spot.lat), Number(spot.lng)], {
      radius: 8,
      color: '#ffffff',
      weight: 3,
      fillColor: '#3c53ac',
      fillOpacity: 1,
    })
      .bindPopup(makePopup(spot))
      .on('click', () => { selectedSpot.value = spot })
      .addTo(markerLayer)
    markers.set(spot.id, marker)
  })

  const requested = String(route.query.spot || '')
  if (requested && markers.has(requested)) {
    const spot = state.spots.find((item) => item.id === requested)
    selectedSpot.value = spot || null
    if (spot) {
      map.setView([spot.lat, spot.lng], 14)
      markers.get(requested).openPopup()
    }
  }
  setTimeout(() => map?.invalidateSize(), 50)
}

function focusSpot(spot) {
  selectedSpot.value = spot
  map?.setView([spot.lat, spot.lng], 14)
  markers.get(spot.id)?.openPopup()
}

onMounted(async () => {
  await loadSpots()
  drawMap()
})
watch(() => [state.region?.key, state.spots.length], drawMap)
onBeforeUnmount(() => {
  map?.remove()
  map = null
})
</script>

<template>
  <main class="lh-shell map-shell">
    <div class="lh-breadcrumb">{{ $t('map.breadcrumb') }}</div>
    <div class="lh-page-head map-head">
      <div>
        <span class="panel-kicker">{{ $t('map.leafletMap') }}</span>
        <h1>{{ t('map.title', { region: regionShort }) }}</h1>
        <p>{{ $t('map.description') }}</p>
      </div>
      <span class="map-count">{{ state.spots.length }} {{ $t('map.places') }}</span>
    </div>

    <div v-if="state.error" class="lh-empty">{{ state.error }}</div>
    <div v-else class="map-layout-page">
      <section class="map-panel">
        <div ref="mapElement" class="leaflet-map"></div>
      </section>
      <aside class="spot-list-panel">
        <button
          v-for="spot in state.spots"
          :key="spot.id"
          class="map-spot-item"
          :class="{ active: selectedSpot?.id === spot.id }"
          @click="focusSpot(spot)"
        >
          <span class="spot-thumb">
            <img
              v-if="spot.img && !brokenImages.has(spot.id)"
              :src="spot.img"
              :alt="spot.title"
              loading="lazy"
              referrerpolicy="no-referrer"
              @error="markBroken(spot.id)"
            />
            <span v-else class="spot-thumb-fallback">📍</span>
          </span>
          <span><strong>{{ spot.title }}</strong><small>{{ spot.addr }}</small></span>
        </button>
      </aside>
    </div>

    <article v-if="selectedSpot" class="selected-spot-card">
      <span class="selected-spot-thumb">
        <img
          v-if="selectedSpot.img && !brokenImages.has(selectedSpot.id)"
          :src="selectedSpot.img"
          :alt="selectedSpot.title"
          referrerpolicy="no-referrer"
          @error="markBroken(selectedSpot.id)"
        />
        <span v-else class="spot-thumb-fallback large">📍</span>
      </span>
      <div><span class="panel-kicker">{{ $t('map.selectedPlace') }}</span><h2>{{ selectedSpot.title }}</h2><p>{{ selectedSpot.addr }}</p></div>
    </article>
  </main>
</template>
