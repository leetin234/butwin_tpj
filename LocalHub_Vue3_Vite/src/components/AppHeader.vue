<script setup>
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useRegion } from '../stores/useRegion.js'
import { getRegionNameFull } from '../data/regionNames.js'

const route = useRoute()
const router = useRouter()
const { locale, t } = useI18n()
const { state: regionState, setRegion, REGIONS } = useRegion()

function onRegionChange(event) {
  setRegion(event.target.value)
  if (route.name !== 'home') router.push({ name: 'home' })
}

const links = [
  { name: 'home', key: 'nav.home' },
  { name: 'board', key: 'nav.board' },
  { name: 'map', key: 'nav.map' },
  { name: 'finder', key: 'nav.finder' },
]

const languages = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'zh', label: '中文' },
  { value: 'ru', label: 'Русский' },
  { value: 'vi', label: 'Tiếng Việt' },
]

function changeLanguage(event) {
  locale.value = event.target.value
  localStorage.setItem('locale', locale.value)
}
</script>

<template>
  <header class="lh-header">
    <div class="lh-header-inner">
      <button class="lh-logo" type="button" @click="router.push({ name: 'home' })">
        Local<span>Hub</span>
        <small>{{ t('header.tagline') }}</small>
      </button>
      <nav class="main-nav" :aria-label="t('header.menuAria')">
        <RouterLink
          v-for="link in links"
          :key="link.name"
          :to="{ name: link.name }"
          :class="{ active: route.name === link.name || (link.name === 'board' && String(route.name).startsWith('post')) }"
        >
          {{ t(link.key) }}
        </RouterLink>
      </nav>
      <div class="header-actions">
        <div class="header-control">
          <label class="header-control-label" for="region-select">{{ t('header.region') }}</label>
          <select
            id="region-select"
            class="header-select"
            :value="regionState.current"
            aria-label="지역 선택"
            @change="onRegionChange"
          >
            <option v-for="r in REGIONS" :key="r.key" :value="r.key">{{ getRegionNameFull(locale, r.key) }}</option>
          </select>
        </div>
        <div class="header-control">
          <label class="header-control-label" for="language-select">{{ t('header.language') }}</label>
          <select id="language-select" class="header-select" :value="locale" @change="changeLanguage">
            <option v-for="lang in languages" :key="lang.value" :value="lang.value">
              {{ lang.label }}
            </option>
          </select>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.lh-header-inner {
  gap: 24px;
}
.main-nav a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--control-height);
  padding: 0 15px;
  border-radius: var(--radius-control);
  color: var(--ink-soft);
  font-family: inherit;
  font-size: 13px;
  font-weight: 750;
  line-height: 1;
  letter-spacing: -.02em;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}
.header-control {
  display: flex;
  align-items: center;
  gap: 8px;
}
.header-control-label {
  color: var(--ink-soft);
  font-family: inherit;
  font-size: 13px;
  font-weight: 750;
  line-height: 1;
  letter-spacing: -.02em;
  white-space: nowrap;
}
.header-select {
  width: 132px;
  height: var(--control-height);
  padding: 0 36px 0 14px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-control);
  background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6'%3E%3Cpath fill='%234c4b52' d='M0 0l5 6 5-6H0z'/%3E%3C/svg%3E") no-repeat right 13px center;
  background-size: 10px 6px;
  color: var(--ink-soft);
  font-family: inherit;
  font-size: 13px;
  font-weight: 750;
  line-height: 1;
  letter-spacing: -.02em;
  appearance: none;
  cursor: pointer;
  transition: background-color var(--motion-fast), border-color var(--motion-fast), box-shadow var(--motion-fast);
}
.header-select:hover {
  border-color: var(--ink-soft);
  background-color: var(--surface-subtle);
}
.header-select:focus {
  outline: none;
  border-color: var(--region-color);
  box-shadow: 0 0 0 3px var(--region-tint);
}
.header-select option {
  color: var(--ink);
}
@media (max-width: 900px) {
  .lh-header-inner {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 9px 16px;
    padding: 10px 0;
  }
  .header-actions {
    justify-self: end;
    gap: 8px;
  }
  .header-control-label {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  .main-nav {
    grid-column: 1 / -1;
    grid-row: 2;
    width: 100%;
    margin-left: 0;
  }
  .main-nav a {
    flex: 1;
    height: 38px;
    padding: 0 12px;
  }
  .header-select {
    width: 124px;
    height: 38px;
    font-size: 12px;
  }
}
@media (max-width: 640px) {
  .lh-header-inner {
    gap: 8px 12px;
  }
  .header-select {
    width: 100px;
    padding-left: 11px;
    padding-right: 28px;
    background-position: right 10px center;
  }
  .header-actions {
    gap: 6px;
  }
}
</style>
