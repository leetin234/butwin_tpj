<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PasswordModal from '../components/PasswordModal.vue'
import { usePosts } from '../stores/usePosts.js'
import { useRegion } from '../stores/useRegion.js'
import { getRegionNameFull } from '../data/regionNames.js'

const route = useRoute()
const router = useRouter()
const { getPost, increaseViews, verifyPassword, deletePost, isBookmarked, toggleBookmark, addComment } = usePosts()
const { t, locale } = useI18n()
const { state: regionState } = useRegion()
const regionFull = computed(() => getRegionNameFull(locale.value, regionState.current))
const post = computed(() => getPost(String(route.params.id)))
const modalOpen = ref(false)
const passwordError = ref('')
const commentText = ref('')
const commentError = ref('')

onMounted(() => {
  if (post.value) increaseViews(post.value.id)
})

function formatFullDate(value) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).format(new Date(value))
}

function confirmDelete(password) {
  if (!post.value) return
  if (!verifyPassword(post.value.id, password)) {
    passwordError.value = t('postForm.authorizeError')
    return
  }
  deletePost(post.value.id)
  router.replace({ name: 'board', query: { deleted: '1' } })
}

function formatRelative(value) {
  const diffMs = Date.now() - new Date(value).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return t('relative.justNow')
  if (minutes < 60) return t('relative.minutesAgo', { count: minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('relative.hoursAgo', { count: hours })
  const days = Math.floor(hours / 24)
  if (days === 1) return t('relative.yesterday')
  if (days < 7) return t('relative.daysAgo', { count: days })
  return new Intl.DateTimeFormat(locale.value, { month: '2-digit', day: '2-digit' }).format(new Date(value))
}

function submitComment() {
  commentError.value = ''
  if (!post.value) return
  if (commentText.value.trim().length < 2) {
    commentError.value = t('postDetail.commentError')
    return
  }
  addComment(post.value.id, { content: commentText.value.trim() })
  commentText.value = ''
}
</script>

<template>
  <main class="lh-shell">
    <template v-if="post">
      <div class="lh-breadcrumb">{{ t('postDetail.breadcrumb', { region: regionFull }) }}</div>
      <article class="lh-detail">
        <header class="lh-detail-head">
          <div class="detail-title-row">
            <h1>{{ post.title }}</h1>
            <button class="bookmark-button" :class="{ active: isBookmarked(post.id) }" @click="toggleBookmark(post.id)">
              {{ isBookmarked(post.id) ? $t('postDetail.bookmarkSaved') : $t('postDetail.bookmark') }}
            </button>
          </div>
          <div class="lh-meta">
            <span>{{ $t('postDetail.date') }} {{ formatFullDate(post.createdAt) }}</span>
            <span v-if="post.updatedAt">{{ $t('postDetail.updated') }} {{ formatFullDate(post.updatedAt) }}</span>
            <span>{{ $t('postDetail.views') }} {{ post.views || 0 }}</span>
            <span>{{ $t('postDetail.anonymous') }}</span>
          </div>
        </header>
        <figure v-if="post.image" class="lh-detail-image">
          <img :src="post.image" :alt="post.title" />
        </figure>
        <div class="lh-detail-body">{{ post.content }}</div>
      <section class="lh-comments">
        <div class="lh-comment-head">
          <h2>{{ $t('postDetail.comments') }}</h2>
          <span>{{ post.comments?.length || 0 }} {{ $t('postDetail.commentsLabel') }}</span>
        </div>
        <div v-if="post.comments && post.comments.length" class="lh-comments-list">
          <article v-for="comment in post.comments" :key="comment.id" class="lh-comment">
            <div class="lh-comment-meta">
              <strong>{{ comment.author }}</strong>
              <small>{{ formatRelative(comment.createdAt) }}</small>
            </div>
            <p>{{ comment.content }}</p>
          </article>
        </div>
        <div v-else class="lh-comment-empty">{{ $t('postDetail.commentEmpty') }}</div>

        <div class="lh-comment-form">
          <label for="comment-text" class="sr-only">{{ $t('postDetail.commentPlaceholder') }}</label>
          <textarea
            id="comment-text"
            v-model="commentText"
            rows="4"
            :placeholder="$t('postDetail.commentPlaceholder')"
          ></textarea>
          <p v-if="commentError" class="form-message">{{ commentError }}</p>
          <button class="lh-btn primary" type="button" @click="submitComment">{{ $t('postDetail.commentSubmit') }}</button>
        </div>
      </section>
      </article>
      <div class="lh-detail-actions">
        <button class="lh-btn line" @click="router.push({ name: 'board' })">{{ $t('postDetail.list') }}</button>
        <div class="right">
          <button class="lh-btn line" @click="router.push({ name: 'post-edit', params: { id: post.id } })">{{ $t('postDetail.edit') }}</button>
          <button class="lh-btn danger" @click="modalOpen = true">{{ $t('postDetail.delete') }}</button>
        </div>
      </div>
    </template>
    <div v-else class="not-found-card">
      <h1>{{ $t('postDetail.notFound') }}</h1>
      <button class="lh-btn primary" @click="router.replace({ name: 'board' })">{{ $t('postDetail.backToBoard') }}</button>
    </div>

    <PasswordModal
      :open="modalOpen"
      :title="$t('passwordModal.deleteTitle')"
      :error="passwordError"
      @close="modalOpen = false; passwordError = ''"
      @confirm="confirmDelete"
    />
  </main>
</template>
