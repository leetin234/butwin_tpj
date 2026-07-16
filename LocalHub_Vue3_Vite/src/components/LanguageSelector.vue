<script setup>
import { useI18n } from 'vue-i18n'

const { locale, t } = useI18n()
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
  <div class="language-selector">
    <label for="language-select">{{ t('header.language') }}</label>
    <select id="language-select" :value="locale" @change="changeLanguage">
      <option v-for="lang in languages" :key="lang.value" :value="lang.value">
        {{ lang.label }}
      </option>
    </select>
  </div>
</template>
