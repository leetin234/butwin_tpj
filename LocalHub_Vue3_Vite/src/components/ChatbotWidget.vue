<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePosts } from '../stores/usePosts.js'
import { useSpots } from '../stores/useSpots.js'
import { useRegion } from '../stores/useRegion.js'
import { getRegionNameShort } from '../data/regionNames.js'
import { askOpenAI, hasOpenAIKey } from '../services/openai.js'

const { t, locale } = useI18n()
const { sortedPosts } = usePosts()
const { state: spotState } = useSpots()
const { state: regionState } = useRegion()
const regionShort = computed(() => getRegionNameShort(locale.value, regionState.current))
const open = ref(false)
const input = ref('')
const loading = ref(false)
const body = ref(null)
const messages = ref([
  { role: 'bot', text: t('chatbot.welcome', { region: regionShort.value }) },
])

const suggestions = computed(() => [
  t('chatbot.suggestion.walk'),
  t('chatbot.suggestion.family'),
  t('chatbot.suggestion.parking'),
  t('chatbot.suggestion.daecheong'),
])
const modeLabel = computed(() => (hasOpenAIKey() ? t('chatbot.modeOpenAI') : t('chatbot.modeLocalSearch')))

watch(
  messages,
  async () => {
    await nextTick()
    if (body.value) body.value.scrollTop = body.value.scrollHeight
  },
  { deep: true },
)

function localAnswer(question) {
  const q = question.toLowerCase()
  const cleaned = q.replace(/게시글|검색|찾아줘|알려줘|에서|관한|관련/g, ' ').trim()

  if (q.includes('게시글') || q.includes('검색')) {
    const matches = sortedPosts.value
      .filter((post) => `${post.title} ${post.content}`.toLowerCase().includes(cleaned))
      .slice(0, 4)

    if (matches.length) {
      return t('chatbot.response.foundPosts', {
        results: matches.map((post, index) => `${index + 1}. ${post.title}`).join('\n'),
      })
    }

    return t('chatbot.response.noPosts')
  }

  const exact = spotState.spots.find((spot) => q.includes(spot.title.toLowerCase()))
  if (exact) {
    return t('chatbot.response.spotInfo', {
      title: exact.title,
      addr: exact.addr,
    })
  }

  let matches = spotState.spots.slice(0, 3)
  if (/산책|자연|숲|공원/.test(q)) {
    matches = spotState.spots.filter((spot) => /공원|수목원|산|댐|호수|숲|길/.test(spot.title)).slice(0, 4)
  } else if (/아이|가족|체험/.test(q)) {
    matches = spotState.spots.filter((spot) => /오월드|솔로몬|천문대|수목원|공원/.test(spot.title)).slice(0, 4)
  }

  if (/추천|관광|여행|갈 곳/.test(q)) {
    return t('chatbot.response.spotsSummary', {
      region: regionShort.value,
      list: matches.map((spot, index) => `${index + 1}. ${spot.title} — ${spot.addr}`).join('\n'),
    })
  }

  if (/축제|일정/.test(q)) {
    return t('chatbot.response.noFestival')
  }

  return t('chatbot.response.askQuestion', { region: regionShort.value })
}

async function send(question = input.value) {
  const trimmed = question.trim()
  if (!trimmed || loading.value) return
  messages.value.push({ role: 'user', text: trimmed })
  input.value = ''
  loading.value = true
  const placeholder = { role: 'bot', text: t('chatbot.status.pending') }
  messages.value.push(placeholder)

  try {
    placeholder.text = hasOpenAIKey()
      ? await askOpenAI({ question: trimmed, spots: spotState.spots, posts: sortedPosts.value })
      : localAnswer(trimmed)
  } catch (error) {
    placeholder.text = `${localAnswer(trimmed)}\n\n${t('chatbot.status.failover')}`
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <button v-if="!open" class="lh-chat-fab" type="button" :aria-label="t('chatbot.openLabel')" @click="open = true">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M20 15a4 4 0 0 1-4 4H9l-5 3v-7a4 4 0 0 1-1-2.6V7a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4z" />
      <path d="M8 10h.01M12 10h.01M16 10h.01" />
    </svg>
    <small>{{ t('chatbot.label') }}</small>
  </button>

  <section v-else class="lh-chat" :aria-label="t('chatbot.ariaLabel')">
    <header class="lh-chat-head">
      <div>
        <strong>{{ t('chatbot.title') }}</strong>
        <span>{{ modeLabel }}</span>
      </div>
      <button class="lh-chat-close" type="button" :aria-label="t('chatbot.closeLabel')" @click="open = false">×</button>
    </header>
    <div ref="body" class="lh-chat-body">
      <div v-for="(message, index) in messages" :key="index" class="lh-msg" :class="message.role">
        {{ message.text }}
      </div>
      <div class="lh-chat-suggestions">
        <button v-for="suggestion in suggestions" :key="suggestion" type="button" @click="send(suggestion)">
          {{ suggestion }}
        </button>
      </div>
    </div>
    <form class="lh-chat-input" @submit.prevent="send()">
      <input v-model.trim="input" :placeholder="t('chatbot.inputPlaceholder')" :aria-label="t('chatbot.inputAriaLabel')" />
      <button :disabled="loading">{{ t('chatbot.sendButton') }}</button>
    </form>
  </section>
</template>
