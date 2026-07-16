<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  error: { type: String, default: '' },
})
const emit = defineEmits(['close', 'confirm'])
const password = ref('')
const input = ref(null)
const displayTitle = computed(() => props.title || t('passwordModal.title'))

watch(
  () => props.open,
  async (open) => {
    if (open) {
      password.value = ''
      await nextTick()
      input.value?.focus()
    }
  },
)

function submit() {
  emit('confirm', password.value)
}
</script>

<template>
  <div v-if="open" class="lh-modal-backdrop" @click.self="emit('close')">
    <form class="lh-modal" @submit.prevent="submit">
      <h3>{{ displayTitle }}</h3>
      <p>{{ t('passwordModal.prompt') }}</p>
      <input
        ref="input"
        v-model="password"
        type="password"
        :placeholder="t('passwordModal.placeholder')"
        autocomplete="current-password"
      />
      <div v-if="error" class="lh-error">{{ error }}</div>
      <div class="lh-modal-actions">
        <button type="button" class="lh-btn line sm" @click="emit('close')">{{ t('passwordModal.cancel') }}</button>
        <button class="lh-btn primary sm">{{ t('passwordModal.confirm') }}</button>
      </div>
    </form>
  </div>
</template>
