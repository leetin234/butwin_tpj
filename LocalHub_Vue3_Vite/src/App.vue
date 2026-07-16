<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterView } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import ChatbotWidget from './components/ChatbotWidget.vue'
import IntroMap from './components/IntroMap.vue'
import { useSpots } from './stores/useSpots.js'
import { useRegion } from './stores/useRegion.js'
import { useI18n } from 'vue-i18n'
import { getRegionNameFull } from './data/regionNames.js'

const { loadSpots } = useSpots()
onMounted(loadSpots)

const { state: regionState } = useRegion()
const { t, locale } = useI18n()
const regionFull = computed(() => getRegionNameFull(locale.value, regionState.current))

const INTRO_KEY = 'lh_intro_seen'

function isReloadNavigation() {
  if (typeof window === 'undefined') return false

  const [navigationEntry] = window.performance.getEntriesByType('navigation')
  if (navigationEntry && 'type' in navigationEntry) {
    return navigationEntry.type === 'reload'
  }

  return window.performance.navigation?.type === 1
}

const showIntro = ref(isReloadNavigation() || sessionStorage.getItem(INTRO_KEY) !== '1')

function closeIntro() {
  sessionStorage.setItem(INTRO_KEY, '1')
  showIntro.value = false
}
</script>

<template>
  <div class="lh-app">
    <IntroMap v-if="showIntro" @done="closeIntro" />
    <AppHeader />
    <RouterView />
    <ChatbotWidget />
    <footer class="site-footer">
      <div class="footer-inner">
        <div>
          <div class="lh-logo footer-logo">Local<span>Hub</span></div>
          <p>{{ t('footer.description', { region: regionFull }) }}</p>
        </div>
        <div class="footer-meta">
          <span>{{ $t('footer.meta1') }}</span>
          <span>{{ $t('footer.meta2') }}</span>
        </div>
      </div>
    </footer>
  </div>
</template>
