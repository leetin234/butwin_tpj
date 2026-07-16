<script setup>
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import PasswordModal from '../components/PasswordModal.vue'
import { usePosts } from '../stores/usePosts.js'
import { useRegion } from '../stores/useRegion.js'
import { getRegionNameFull } from '../data/regionNames.js'

const MAX_FILE_SIZE = 8 * 1024 * 1024
const MAX_IMAGE_SIDE = 1600
const TARGET_DATA_URL_SIZE = 1_350_000

const { t, locale } = useI18n()
const { state: regionState } = useRegion()
const regionFull = computed(() => getRegionNameFull(locale.value, regionState.current))
const route = useRoute()
const router = useRouter()
const { getPost, createPost, updatePost, verifyPassword } = usePosts()
const editingId = computed(() => (route.name === 'post-edit' ? String(route.params.id) : ''))
const originalPost = computed(() => (editingId.value ? getPost(editingId.value) : null))
const authorized = ref(!editingId.value)
const passwordError = ref('')
const message = ref('')
const imageMessage = ref('')
const imageData = ref('')
const fileInput = ref(null)
const isProcessingImage = ref(false)
const isDragging = ref(false)
const form = reactive({ title: '', content: '', password: '' })

const imageCopy = computed(() => {
  const copies = {
    ko: {
      label: '사진 첨부',
      optional: '선택 사항 · 게시글당 1장',
      drop: '사진을 끌어놓거나 클릭해서 선택하세요',
      rule: 'JPG, PNG, WEBP, GIF · 최대 8MB · 저장 전 자동 압축',
      change: '사진 변경',
      remove: '사진 삭제',
      invalid: '이미지 파일만 첨부할 수 있습니다.',
      tooLarge: '파일 크기는 8MB 이하여야 합니다.',
      failed: '사진을 처리하지 못했습니다. 다른 이미지를 선택해 주세요.',
      processing: '사진을 최적화하고 있습니다…',
      preview: '첨부 사진 미리보기',
    },
    en: {
      label: 'Attach photo', optional: 'Optional · one image per post',
      drop: 'Drop an image here or click to choose', rule: 'JPG, PNG, WEBP, GIF · max 8MB · automatically compressed',
      change: 'Change photo', remove: 'Remove photo', invalid: 'Only image files can be attached.',
      tooLarge: 'The file must be 8MB or smaller.', failed: 'The image could not be processed. Try another file.',
      processing: 'Optimizing image…', preview: 'Attached image preview',
    },
    ja: {
      label: '写真を添付', optional: '任意・1投稿につき1枚', drop: '画像をドロップするかクリックして選択',
      rule: 'JPG、PNG、WEBP、GIF・最大8MB・保存前に自動圧縮', change: '写真を変更', remove: '写真を削除',
      invalid: '画像ファイルのみ添付できます。', tooLarge: 'ファイルは8MB以下にしてください。',
      failed: '画像を処理できませんでした。別の画像を選択してください。', processing: '画像を最適化しています…', preview: '添付画像プレビュー',
    },
    zh: {
      label: '添加图片', optional: '可选 · 每篇帖子1张', drop: '拖放图片或点击选择',
      rule: 'JPG、PNG、WEBP、GIF · 最大8MB · 保存前自动压缩', change: '更换图片', remove: '删除图片',
      invalid: '只能上传图片文件。', tooLarge: '文件大小不得超过8MB。', failed: '无法处理图片，请选择其他图片。',
      processing: '正在优化图片…', preview: '附件图片预览',
    },
    ru: {
      label: 'Прикрепить фото', optional: 'Необязательно · 1 изображение', drop: 'Перетащите изображение или нажмите для выбора',
      rule: 'JPG, PNG, WEBP, GIF · до 8 МБ · автоматическое сжатие', change: 'Заменить фото', remove: 'Удалить фото',
      invalid: 'Можно прикреплять только изображения.', tooLarge: 'Размер файла не должен превышать 8 МБ.',
      failed: 'Не удалось обработать изображение. Выберите другой файл.', processing: 'Оптимизация изображения…', preview: 'Предпросмотр изображения',
    },
    vi: {
      label: 'Đính kèm ảnh', optional: 'Không bắt buộc · 1 ảnh mỗi bài', drop: 'Kéo thả ảnh hoặc nhấp để chọn',
      rule: 'JPG, PNG, WEBP, GIF · tối đa 8MB · tự động nén', change: 'Đổi ảnh', remove: 'Xóa ảnh',
      invalid: 'Chỉ có thể đính kèm tệp ảnh.', tooLarge: 'Tệp phải nhỏ hơn hoặc bằng 8MB.',
      failed: 'Không thể xử lý ảnh. Vui lòng chọn ảnh khác.', processing: 'Đang tối ưu ảnh…', preview: 'Xem trước ảnh đính kèm',
    },
  }
  return copies[locale.value] || copies.ko
})

function authorize(password) {
  if (!originalPost.value || !verifyPassword(editingId.value, password)) {
    passwordError.value = t('postForm.authorizeError')
    return
  }
  authorized.value = true
  passwordError.value = ''
  form.title = originalPost.value.title
  form.content = originalPost.value.content
  form.password = originalPost.value.password
  imageData.value = originalPost.value.image || ''
}

function openFilePicker() {
  if (!isProcessingImage.value) fileInput.value?.click()
}

function readImageElement(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('image-load-failed'))
    }
    image.src = url
  })
}

function canvasToDataUrl(canvas, quality) {
  return canvas.toDataURL('image/jpeg', quality)
}

async function optimizeImage(file) {
  const source = await readImageElement(file)
  const longest = Math.max(source.naturalWidth, source.naturalHeight)
  const scale = Math.min(1, MAX_IMAGE_SIDE / longest)
  let width = Math.max(1, Math.round(source.naturalWidth * scale))
  let height = Math.max(1, Math.round(source.naturalHeight * scale))

  const render = (targetWidth, targetHeight, quality) => {
    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight
    const context = canvas.getContext('2d')
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, targetWidth, targetHeight)
    context.drawImage(source, 0, 0, targetWidth, targetHeight)
    return canvasToDataUrl(canvas, quality)
  }

  let quality = 0.84
  let result = render(width, height, quality)
  while (result.length > TARGET_DATA_URL_SIZE && quality > 0.56) {
    quality -= 0.08
    result = render(width, height, quality)
  }
  if (result.length > TARGET_DATA_URL_SIZE) {
    width = Math.max(1, Math.round(width * 0.72))
    height = Math.max(1, Math.round(height * 0.72))
    result = render(width, height, 0.68)
  }
  return result
}

async function processFile(file) {
  imageMessage.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) {
    imageMessage.value = imageCopy.value.invalid
    return
  }
  if (file.size > MAX_FILE_SIZE) {
    imageMessage.value = imageCopy.value.tooLarge
    return
  }

  isProcessingImage.value = true
  try {
    imageData.value = await optimizeImage(file)
  } catch {
    imageMessage.value = imageCopy.value.failed
  } finally {
    isProcessingImage.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

function handleFileChange(event) {
  processFile(event.target.files?.[0])
}

function handleDrop(event) {
  isDragging.value = false
  processFile(event.dataTransfer?.files?.[0])
}

function removeImage() {
  imageData.value = ''
  imageMessage.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

function save() {
  message.value = ''
  if (isProcessingImage.value) return (imageMessage.value = imageCopy.value.processing)
  if (form.title.trim().length < 2) return (message.value = t('postForm.messageTitle'))
  if (form.content.trim().length < 5) return (message.value = t('postForm.messageContent'))
  if (form.password.length < 4) return (message.value = t('postForm.messagePassword'))

  const payload = {
    title: form.title.trim(),
    content: form.content.trim(),
    password: form.password,
    image: imageData.value || null,
  }
  try {
    const saved = editingId.value ? updatePost(editingId.value, payload) : createPost(payload)
    if (saved) router.replace({ name: 'post-detail', params: { id: saved.id } })
  } catch (error) {
    message.value = error?.name === 'QuotaExceededError'
      ? '브라우저 저장공간이 부족합니다. 더 작은 사진을 사용하거나 기존 게시글의 사진을 삭제해 주세요.'
      : '게시글 저장 중 오류가 발생했습니다.'
  }
}
</script>

<template>
  <main class="lh-shell">
    <template v-if="!editingId || originalPost">
      <div class="lh-breadcrumb">
        {{ editingId ? t('postForm.breadEdit', { region: regionFull }) : t('postForm.breadCreate', { region: regionFull }) }}
      </div>
      <div class="lh-page-head">
        <div>
          <span class="panel-kicker">{{ editingId ? $t('postForm.kickerEdit') : $t('postForm.kickerCreate') }}</span>
          <h1>{{ editingId ? $t('postForm.pageEdit') : $t('postForm.pageCreate') }}</h1>
          <p>{{ $t('postForm.description') }}</p>
        </div>
      </div>

      <form v-if="authorized" class="lh-form" @submit.prevent="save">
        <div class="lh-field">
          <label for="post-title">{{ $t('postForm.titleLabel') }}</label>
          <input id="post-title" v-model="form.title" maxlength="80" required :placeholder="$t('postForm.placeholderTitle')" />
        </div>
        <div class="lh-field">
          <label for="post-content">{{ $t('postForm.contentLabel') }}</label>
          <textarea id="post-content" v-model="form.content" maxlength="3000" required :placeholder="$t('postForm.placeholderContent')"></textarea>
        </div>

        <div class="lh-field post-image-field">
          <div class="post-image-label-row">
            <label>{{ imageCopy.label }}</label>
            <span>{{ imageCopy.optional }}</span>
          </div>
          <input
            ref="fileInput"
            class="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            @change="handleFileChange"
          />

          <div v-if="imageData" class="post-image-preview">
            <img :src="imageData" :alt="imageCopy.preview" />
            <div class="post-image-preview-actions">
              <button type="button" class="lh-btn line sm" @click="openFilePicker">{{ imageCopy.change }}</button>
              <button type="button" class="lh-btn danger sm" @click="removeImage">{{ imageCopy.remove }}</button>
            </div>
          </div>

          <button
            v-else
            type="button"
            class="post-image-dropzone"
            :class="{ dragging: isDragging, processing: isProcessingImage }"
            :disabled="isProcessingImage"
            @click="openFilePicker"
            @dragenter.prevent="isDragging = true"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <span class="post-image-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect x="3" y="4" width="18" height="16" rx="3" />
                <circle cx="9" cy="10" r="2" />
                <path d="m5 18 4.5-4.5 3.2 3.2 2.3-2.3L19 18" />
              </svg>
            </span>
            <strong>{{ isProcessingImage ? imageCopy.processing : imageCopy.drop }}</strong>
            <small>{{ imageCopy.rule }}</small>
          </button>
          <p v-if="imageMessage" class="form-message image-message">{{ imageMessage }}</p>
        </div>

        <div class="lh-field-row">
          <div class="lh-field no-margin">
            <label for="post-password">{{ $t('postForm.passwordLabel') }}</label>
            <input id="post-password" v-model="form.password" type="password" minlength="4" required :placeholder="$t('postForm.placeholderPassword')" />
          </div>
          <p class="lh-help">{{ $t('postForm.help') }}</p>
        </div>
        <p v-if="message" class="form-message">{{ message }}</p>
        <div class="lh-form-actions">
          <button type="button" class="lh-btn line" @click="router.back()">{{ $t('postForm.cancel') }}</button>
          <button class="lh-btn primary" :disabled="isProcessingImage">{{ editingId ? $t('postForm.update') : $t('postForm.save') }}</button>
        </div>
      </form>
    </template>
    <div v-else class="not-found-card">
      <h1>{{ $t('postForm.editNotFound') }}</h1>
      <button class="lh-btn primary" @click="router.replace({ name: 'board' })">{{ $t('postForm.editBack') }}</button>
    </div>

    <PasswordModal
      :open="Boolean(editingId) && !authorized && Boolean(originalPost)"
      :title="$t('passwordModal.editTitle')"
      :error="passwordError"
      @close="router.back()"
      @confirm="authorize"
    />
  </main>
</template>
